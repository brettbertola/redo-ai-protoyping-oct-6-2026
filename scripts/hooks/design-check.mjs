#!/usr/bin/env node
// One hook for all assistants. It runs the Surface design rules and gives the
// problems to the assistant in the format of that assistant.
//
//   node scripts/hooks/design-check.mjs <claude|codex|cursor> <edit|stop>
//
// edit: runs after the assistant changes a file. It examines that file.
// stop: runs when the assistant thinks the work is complete. It examines all
//       prototypes and chromes.
//
// A hook must not stop the work of the designer because of its own failure.
// Thus each unexpected error ends with exit code 0.
import { spawnSync } from "node:child_process"
import { existsSync, realpathSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import {
  AREAS,
  checkDesignRules,
  checkFile,
  formatProblems,
} from "../lib/design-rules.mjs"
import { ROOT } from "../lib/util.mjs"

const [harness = "claude", event = "edit"] = process.argv.slice(2)
const REAL_ROOT = realpathSync(ROOT)
const HOOK = "scripts/hooks/design-check.mjs"
const DELEGATED = "SURFACE_HOOK_DELEGATED"

function readInput() {
  return new Promise((done) => {
    if (process.stdin.isTTY) return done({})
    let text = ""
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk) => (text += chunk))
    process.stdin.on("end", () => {
      try {
        done(JSON.parse(text))
      } catch {
        done({})
      }
    })
    // Do not wait for input that does not come.
    setTimeout(() => done({}), 3000).unref()
  })
}

/**
 * Finds the Surface folder that contains a path. An assistant can do its work
 * in a worktree: a second folder of the project, which can be in this folder.
 * Thus the nearest folder is the correct one.
 */
function surfaceRootOf(path) {
  let dir = path
  for (let depth = 0; depth < 60; depth++) {
    if (existsSync(join(dir, HOOK))) {
      try {
        return realpathSync(dir)
      } catch {
        return dir
      }
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
  return null
}

/**
 * Changes a path from the hook input into its Surface folder and
 * "prototypes/..." or "chromes/...".
 */
function locate(value, cwd) {
  if (typeof value !== "string" || value.length > 500 || value.includes("\n")) {
    return null
  }
  let full = isAbsolute(value) ? value : resolve(cwd || ROOT, value)
  try {
    // An assistant can give a path through a link to the project folder.
    full = realpathSync(full)
  } catch {
    // The file does not exist. Use the path as it is.
  }
  const root = surfaceRootOf(dirname(full))
  if (!root) return null
  let path = relative(root, full).split("\\").join("/")
  if (path.startsWith("..")) {
    path = relative(REAL_ROOT, full).split("\\").join("/")
  }
  return AREAS.some((area) => path.startsWith(`${area}/`))
    ? { root, path }
    : null
}

/**
 * Gives the work to the hook of a different Surface folder. The design rules
 * of a folder read only that folder, so its own hook must examine it.
 */
function delegate(root, input) {
  const result = spawnSync(
    process.execPath,
    [join(root, HOOK), harness, event],
    {
      input: JSON.stringify(input),
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, [DELEGATED]: "1" },
    }
  )
  // Pass on problems only. Ignore a failure of the other hook.
  if (result.status === 2) {
    process.stderr.write(result.stderr ?? "")
    process.exit(2)
  }
  if (result.status === 0 && result.stdout?.trim()) {
    process.stdout.write(result.stdout)
    process.exit(0)
  }
}

/**
 * Finds the files that the assistant changed. Each assistant puts the path in
 * a different field, so this looks at every text value in the input.
 */
function editedFiles(input) {
  const cwd = typeof input.cwd === "string" ? input.cwd : ROOT
  const found = new Set()
  const elsewhere = new Set()
  const add = (located) => {
    if (!located) return
    if (located.root === REAL_ROOT) found.add(located.path)
    else elsewhere.add(located.root)
  }
  const visit = (value, depth) => {
    if (depth > 6 || value == null) return
    if (typeof value === "string") {
      add(locate(value, cwd))
      // Codex gives a patch. The file names are in its header lines.
      for (const match of value.matchAll(
        /^\*\*\* (?:Add|Update) File: (.+)$/gm
      )) {
        add(locate(match[1].trim(), cwd))
      }
      return
    }
    if (typeof value !== "object") return
    for (const child of Object.values(value)) visit(child, depth + 1)
  }
  // The result of the tool can quote old text. Do not look there.
  const { tool_response, tool_output, ...rest } = input
  void tool_response
  void tool_output
  visit(rest, 0)
  return { files: [...found], elsewhere: [...elsewhere] }
}

function report(message, input) {
  if (harness === "cursor") {
    // Cursor reads JSON. An edit hook adds context for the assistant. A stop
    // hook sends a follow-up message, which Cursor limits to prevent a loop.
    const payload =
      event === "stop"
        ? { followup_message: message }
        : { additional_context: message }
    console.log(JSON.stringify(payload))
    process.exit(0)
  }
  // Claude Code and Codex: exit code 2 gives the text on stderr to the
  // assistant. For a stop hook, it also tells the assistant to continue.
  void input
  console.error(message)
  process.exit(2)
}

try {
  const input = await readInput()

  if (event === "stop") {
    // Ask one time only. If the assistant already continued because of this
    // hook, let it stop. `ship` examines the rules again before it publishes.
    const alreadyAsked =
      input.stop_hook_active === true || Number(input.loop_count ?? 0) > 0
    if (alreadyAsked) process.exit(0)
    // The assistant can be in a worktree while this hook is in the main folder.
    const cwd = typeof input.cwd === "string" ? input.cwd : process.cwd()
    const root = surfaceRootOf(cwd)
    if (root && root !== REAL_ROOT && !process.env[DELEGATED]) {
      delegate(root, input)
      process.exit(0)
    }
    const problems = checkDesignRules()
    if (problems.length > 0) report(formatProblems(problems), input)
    process.exit(0)
  }

  const { files, elsewhere } = editedFiles(input)
  if (!process.env[DELEGATED]) {
    for (const root of elsewhere) delegate(root, input)
  }
  const problems = files.flatMap(checkFile)
  if (problems.length > 0) report(formatProblems(problems), input)
  process.exit(0)
} catch {
  process.exit(0)
}
