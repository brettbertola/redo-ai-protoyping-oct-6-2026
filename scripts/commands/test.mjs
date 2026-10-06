// User tests. An AI assistant gets a persona and a task. Then it operates a
// prototype in a browser as that user and records usability findings.
//
//   test persona list|show|new|delete
//   test task list|show|new|delete
//   test start --persona <name> --task <name>
//   test look|click|type|select|key|back|scroll|hover|finding|end
//   test status|stop|runs
import { spawn } from "node:child_process"
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describeAxes, resolvePrototype } from "../lib/project.mjs"
import {
  FINDING_TYPES,
  RUNS_DIR,
  SEVERITIES,
  TRAITS,
  VIEWPORTS,
  briefing,
  buildPersona,
  buildTask,
  listPersonas,
  listTasks,
  loadPersona,
  loadTask,
  personaFile,
  savePersona,
  saveTask,
  taskFile,
} from "../lib/user-tests.mjs"
import {
  ROOT,
  assertName,
  isMac,
  isWindows,
  readJson,
  readState,
  stop,
  writeJson,
  writeState,
} from "../lib/util.mjs"
import { run as dev } from "./dev.mjs"

const BROWSER = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "lib",
  "test-browser.mjs"
)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** The page names of a prototype, as the preview finds them. */
function pagesOf(prototype) {
  const dir = join(prototype.dir, "pages")
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx") && !file.startsWith("_"))
    .map((file) => file.slice(0, -4))
    .sort()
}

function checkVariants(prototype, query) {
  if (!query) return
  const axes = describeAxes(prototype)
  const known = axes.map((axis) => axis.axis)
  const unknown = [...new URLSearchParams(query).keys()].filter(
    (name) => !known.includes(name)
  )
  if (unknown.length > 0) {
    stop(
      `The prototype ${prototype.id} has no variant with the name "${unknown[0]}".`,
      { variants: axes }
    )
  }
}

function deleteItem(what, name, file, args) {
  if (!existsSync(file)) stop(`The ${what} "${name}" does not exist.`)
  const shown = file
    .slice(ROOT.length + 1)
    .split("\\")
    .join("/")
  if (!args.yes) {
    return {
      summary: `This command deletes the ${what} ${name}. It did not delete now. Get approval from the designer. Then run it again with --yes.`,
      confirm: true,
      name,
      files: [shown],
    }
  }
  rmSync(file)
  return { summary: `I deleted the ${what} ${name}.`, name, deleted: [shown] }
}

function persona(args) {
  const action = args._[1] ?? "list"
  if (action === "list") {
    const personas = listPersonas().map((name) => {
      const { backstory, traits, patience } = loadPersona(name)
      return { name, backstory, traits, patience }
    })
    return { summary: `${count(personas.length, "persona")}.`, personas }
  }
  const name = assertName(args._[2], "persona name")
  if (action === "show") return { summary: name, persona: loadPersona(name) }
  if (action === "new") {
    if (existsSync(personaFile(name)) && !args.replace) {
      stop(
        `A persona called "${name}" already exists. Add --replace to change it.`
      )
    }
    const made = buildPersona(name, args)
    savePersona(made)
    return {
      summary: `I made the persona ${name}.`,
      persona: made,
      files: [`user-tests/personas/${name}.json`],
    }
  }
  if (action === "delete")
    return deleteItem("persona", name, personaFile(name), args)
  stop(`"${action}" is not a persona command. Use list, show, new or delete.`)
}

function task(args) {
  const action = args._[1] ?? "list"
  if (action === "list") {
    const tasks = listTasks().map((name) => {
      const { goal, prototype, difficulty } = loadTask(name)
      return { name, goal, prototype, difficulty }
    })
    return { summary: `${count(tasks.length, "task")}.`, tasks }
  }
  const name = assertName(args._[2], "task name")
  if (action === "show") return { summary: name, task: loadTask(name) }
  if (action === "new") {
    if (existsSync(taskFile(name)) && !args.replace) {
      stop(
        `A task called "${name}" already exists. Add --replace to change it.`
      )
    }
    if (typeof args.prototype !== "string") {
      stop("Add --prototype <category/name>. A task is for one prototype.")
    }
    const prototype = resolvePrototype(args.prototype)
    const made = buildTask(name, args, prototype, pagesOf(prototype))
    checkVariants(prototype, made.variants)
    saveTask(made)
    return {
      summary: `I made the task ${name} for the prototype ${prototype.id}.`,
      task: made,
      files: [`user-tests/tasks/${name}.json`],
    }
  }
  if (action === "delete") return deleteItem("task", name, taskFile(name), args)
  stop(`"${action}" is not a task command. Use list, show, new or delete.`)
}

function deviceOf(prototype) {
  const read = (file, key) =>
    new RegExp(`${key}:\\s*["']([\\w-]+)["']`).exec(
      readFileSync(file, "utf8")
    )?.[1]
  const device =
    read(prototype.configFile, "device") ??
    read(join(ROOT, "surface.config.ts"), "defaultDevice")
  return device in VIEWPORTS ? device : "responsive"
}

function session() {
  const state = readState("test", null)
  return state?.pid && isAlive(state.pid) ? state : null
}

async function send(action, payload = {}) {
  const state = session()
  if (!state || state.status !== "ready") {
    stop(
      "No user test is on. Start one: npm run surface -- test start --persona <name> --task <name>"
    )
  }
  try {
    const response = await fetch(`http://127.0.0.1:${state.port}/`, {
      method: "POST",
      headers: { "x-surface-token": state.token },
      body: JSON.stringify({ action, ...payload }),
      signal: AbortSignal.timeout(60_000),
    })
    return await response.json()
  } catch {
    stop(
      "The browser of the user test did not answer. Run `npm run surface -- test stop`. Then start the test again."
    )
  }
}

async function start(args) {
  if (session()) {
    stop(
      "A user test is already on. There is only one at a time. End it with `test end`, or stop it with `test stop`."
    )
  }
  if (typeof args.persona !== "string" || typeof args.task !== "string") {
    stop("Add --persona <name> and --task <name>.", {
      personas: listPersonas(),
      tasks: listTasks(),
    })
  }
  const who = loadPersona(args.persona)
  const what = loadTask(args.task)
  const prototype = resolvePrototype(what.prototype)
  const variants =
    typeof args.variants === "string"
      ? args.variants.replace(/^\?/, "")
      : what.variants
  checkVariants(prototype, variants)
  const device =
    typeof args.device === "string" ? args.device : deviceOf(prototype)
  if (!(device in VIEWPORTS)) {
    stop(
      `"${device}" is not a device. Use one of: ${Object.keys(VIEWPORTS).join(", ")}.`
    )
  }

  const preview = await dev({ _: ["status"] })
  if (!preview.running) {
    stop(
      "The preview is off. A user test uses the preview. Start it with the surface-start skill. Then run this command again."
    )
  }
  const path = `${prototype.url}${what.startPage ? `/${what.startPage}` : ""}`
  const address = `${preview.url}${path}${variants ? `?${variants}` : ""}`

  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, "")
  const id = `${stamp.replace("T", "-")}-${what.name}-${who.name}`
  const runDir = join(RUNS_DIR, id)
  mkdirSync(runDir, { recursive: true })
  writeJson(join(runDir, "run.json"), {
    id,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    outcome: null,
    persona: who,
    task: what,
    variants: variants || null,
    axes: describeAxes(prototype),
    device,
    viewport: VIEWPORTS[device],
    address,
    startUrl: `${address}${variants ? "&" : "?"}_bare`,
    show: Boolean(args.show),
    patienceBudget: who.patience,
    patienceRemaining: who.patience,
    actions: [],
    findings: [],
    visited: [],
  })

  writeState("test", {})
  const log = openSync(join(runDir, "browser.log"), "a")
  const child = spawn(process.execPath, [BROWSER, runDir], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", log, log],
    windowsHide: true,
  })
  child.unref()
  closeSync(log)

  let state = null
  for (let attempt = 0; attempt < 150; attempt++) {
    await sleep(200)
    state = readState("test", null)
    if (state?.status) break
    if (!isAlive(child.pid)) break
  }
  if (state?.status !== "ready") {
    writeState("test", {})
    if (isAlive(child.pid)) child.kill()
    rmSync(runDir, { recursive: true, force: true })
    if (state?.status === "no-browser") {
      stop("There is no browser for the user test on this computer.", {
        fix: "Run `npx playwright install chromium`. This downloads a browser. Then run this command again.",
      })
    }
    stop("The browser of the user test did not start.", {
      reason: state?.reason ?? "The browser gave no answer.",
      hint: "Make sure that the prototype opens in the preview. Then run this command again.",
    })
  }
  return {
    summary: `The user test is on: ${what.name} as ${who.name}, on a ${device} screen. Give the briefing to the participant.`,
    run: id,
    persona: who.name,
    task: what.name,
    prototype: prototype.id,
    address,
    device,
    briefing: briefing(who, what, device),
    ...state.first,
  }
}

function openFile(file) {
  const [command, commandArgs] = isMac
    ? ["open", [file]]
    : isWindows
      ? ["cmd", ["/c", "start", "", file]]
      : ["xdg-open", [file]]
  spawn(command, commandArgs, { stdio: "ignore", detached: true }).unref()
}

function runs() {
  if (!existsSync(RUNS_DIR)) return { summary: "0 runs.", runs: [] }
  const list = readdirSync(RUNS_DIR)
    .map((id) => readJson(join(RUNS_DIR, id, "run.json")))
    .filter((run) => run?.finishedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((run) => ({
      run: run.id,
      persona: run.persona.name,
      task: run.task.name,
      prototype: run.task.prototype,
      variants: run.variants,
      outcome: run.outcome,
      findings: run.findings.length,
      report: `user-tests/runs/${run.id}/report.html`,
    }))
  return { summary: `${count(list.length, "run")}.`, runs: list }
}

export async function run(args) {
  const action = args._[0]
  // `--why` is the old name of `--says`.
  const spoken = args.says ?? args.why
  const says = typeof spoken === "string" ? spoken : undefined
  switch (action) {
    case "persona":
      return persona(args)
    case "task":
      return task(args)
    case "start":
      return start(args)
    case "runs":
      return runs()
    case "options":
      return {
        summary: "These are the permitted values.",
        traits: TRAITS,
        findingTypes: FINDING_TYPES,
        severities: SEVERITIES,
        devices: Object.keys(VIEWPORTS),
      }
    case "status": {
      if (!session()) return { summary: "No user test is on.", running: false }
      return send("status")
    }
    case "stop": {
      if (!session()) {
        writeState("test", {})
        return { summary: "No user test was on.", stopped: false }
      }
      const result = await send("stop")
      return { ...result, stopped: true }
    }
    case "look":
      return send("look")
    case "click":
    case "hover":
      return send(action, { ref: args._[1], says })
    case "type":
      return send("type", {
        ref: args._[1],
        text: args._.slice(2).join(" "),
        submit: Boolean(args.submit),
        says,
      })
    case "select":
      return send("select", {
        ref: args._[1],
        option: args._.slice(2).join(" "),
        says,
      })
    case "key":
      return send("key", { key: args._[1], says })
    case "back":
      return send("back", { says })
    case "scroll":
      return send("scroll", { direction: args._[1] })
    case "finding":
      return send("finding", {
        type: args.type,
        severity: args.severity,
        description: args.description,
      })
    case "end": {
      const result = await send("end", {
        outcome: args.outcome,
        summary: args.summary,
        confidence: args.confidence,
      })
      if (result.ok && !args["no-open"]) openFile(result.reportFile)
      return result
    }
    default:
      stop(
        `"${action ?? ""}" is not a test command. Use persona, task, start, look, click, type, select, key, back, scroll, hover, finding, end, status, stop, runs or options.`
      )
  }
}
