// The preview server.
//
// `dev start` runs in the terminal where the assistant starts it, so the
// designer can see it. It does not go into the background by itself.
// There is only one preview for a project at a time: `dev start` stops any
// preview that is already on, then starts a new one.
import { spawn } from "node:child_process"
import { relative } from "node:path"
import {
  AREAS,
  checkDesignRules,
  formatProblems,
  resetDesignRules,
} from "../lib/design-rules.mjs"
import {
  ROOT,
  isMac,
  isWindows,
  readState,
  stop,
  writeState,
} from "../lib/util.mjs"

const FIRST_PORT = 5173
const PORT_COUNT = 30
const IDENTITY_PATH = "/__surface"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const say = (text) => console.log(`Surface: ${text}`)

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Asks one port if a Surface preview of this project is there. */
async function identify(port) {
  try {
    const response = await fetch(`http://localhost:${port}${IDENTITY_PATH}`, {
      signal: AbortSignal.timeout(700),
    })
    const info = await response.json()
    if (info?.surface !== true || info.root !== ROOT) return null
    return { pid: info.pid, port, url: `http://localhost:${port}` }
  } catch {
    return null
  }
}

/**
 * Finds every preview of this project. It asks the ports directly, so it also
 * finds a preview that an earlier session started and did not record.
 */
async function findPreviews() {
  const recorded = readState("dev", null)
  const ports = new Set(
    Array.from({ length: PORT_COUNT }, (_, index) => FIRST_PORT + index)
  )
  if (recorded?.port) ports.add(recorded.port)
  const found = await Promise.all([...ports].map(identify))
  return found.filter(Boolean)
}

async function stopPreviews() {
  const previews = await findPreviews()
  for (const preview of previews) {
    if (preview.pid === process.pid) continue
    try {
      process.kill(preview.pid)
    } catch {
      // The process is already off.
    }
  }
  // Wait until each one is off. Use force if one does not stop.
  for (const preview of previews) {
    for (let attempt = 0; attempt < 25 && isAlive(preview.pid); attempt++) {
      await sleep(200)
    }
    if (isAlive(preview.pid)) {
      try {
        process.kill(preview.pid, "SIGKILL")
      } catch {
        // The process is already off.
      }
      await sleep(300)
    }
  }
  writeState("dev", {})
  return previews
}

function candidatePorts(preferred) {
  const ports = Array.from(
    { length: PORT_COUNT },
    (_, index) => FIRST_PORT + index
  )
  return preferred
    ? [preferred, ...ports.filter((p) => p !== preferred)]
    : ports
}

function openBrowser(url) {
  const [command, args] = isMac
    ? ["open", [url]]
    : isWindows
      ? ["cmd", ["/c", "start", "", url]]
      : ["xdg-open", [url]]
  spawn(command, args, { stdio: "ignore", detached: true }).unref()
}

function designSummary(problems) {
  return problems.map((p) => `${p.file}:${p.line}:${p.message}`).join("\n")
}

// Two jobs. It lets `findPreviews` recognize this server and its project. It
// also runs the design rules when a prototype or chrome changes, then shows
// the problems in this terminal and in the preview. This works with every
// assistant, also one that has no hooks.
const surfacePlugin = {
  name: "surface-preview",
  configureServer(server) {
    let problems = checkDesignRules()
    const publish = () => {
      const next = checkDesignRules()
      if (designSummary(next) === designSummary(problems)) return
      problems = next
      server.ws.send({
        type: "custom",
        event: "surface:design",
        data: { problems },
      })
      if (problems.length === 0) {
        say("Design rules: all prototypes and chromes are good.")
      } else {
        console.log(formatProblems(problems))
      }
    }
    const onFile = (file) => {
      const path = relative(ROOT, file).split("\\").join("/")
      if (path.startsWith("src/")) resetDesignRules()
      if (
        AREAS.some((area) => path.startsWith(`${area}/`)) ||
        path.startsWith("src/")
      ) {
        publish()
      }
    }
    server.watcher.on("change", onFile)
    server.watcher.on("add", onFile)
    server.watcher.on("unlink", onFile)
    if (problems.length > 0) console.log(formatProblems(problems))

    server.middlewares.use(IDENTITY_PATH, (request, response) => {
      response.setHeader("content-type", "application/json")
      const body = request.url?.startsWith("/design")
        ? { problems }
        : { surface: true, root: ROOT, pid: process.pid }
      response.end(JSON.stringify(body))
    })
  },
}

async function start(args) {
  const previous = readState("dev", null)
  const stopped = await stopPreviews()
  if (stopped.length > 0) say("I stopped the preview that was on.")

  // Use the same address again, so a browser tab that is open stays correct.
  // Another program can have a port. Then try the subsequent port.
  const { createServer } = await import("vite")
  let server
  let port
  let lastError
  for (const candidate of candidatePorts(stopped[0]?.port ?? previous?.port)) {
    let attempt
    try {
      attempt = await createServer({
        root: ROOT,
        clearScreen: false,
        logLevel: "warn",
        server: { port: candidate, strictPort: true },
        plugins: [surfacePlugin],
      })
      await attempt.listen()
      server = attempt
      port = candidate
      break
    } catch (error) {
      lastError = error
      await attempt?.close().catch(() => {})
      if (!/already in use|EADDRINUSE/i.test(error?.message ?? "")) break
    }
  }
  if (!server) {
    stop("The preview did not start.", {
      reason: lastError?.message ?? String(lastError),
      hint: "Run `npm run surface -- doctor`.",
    })
  }
  const url = `http://localhost:${port}`
  writeState("dev", { pid: process.pid, port, url })

  let closing = false
  const close = async () => {
    if (closing) return
    closing = true
    say("The preview is off.")
    const state = readState("dev", null)
    if (state?.pid === process.pid) writeState("dev", {})
    await server.close().catch(() => {})
    process.exit(0)
  }
  process.on("SIGINT", close)
  process.on("SIGTERM", close)
  process.on("SIGHUP", close)

  say(`The preview is on. Address: ${url}`)
  say("Keep this terminal open. The preview stops when this terminal closes.")
  say("To stop the preview, type /surface-start stop in the chat of your assistant.")
  if (!args["no-open"]) openBrowser(url)

  // Stay on until something stops this process.
  await new Promise(() => {})
}

async function status(args) {
  const attempts = args.wait ? 60 : 1
  for (let attempt = 0; attempt < attempts; attempt++) {
    const [preview] = await findPreviews()
    if (preview) {
      return {
        summary: `The preview is on. Address: ${preview.url}`,
        running: true,
        url: preview.url,
        port: preview.port,
      }
    }
    if (attempt < attempts - 1) await sleep(500)
  }
  return {
    summary: "The preview is off.",
    running: false,
    ...(args.wait
      ? {
          hint: "Read the terminal where the preview started. It shows the cause.",
        }
      : {}),
  }
}

export async function run(args) {
  const action = args._[0] ?? "start"
  // "restart" is the same as "start": start always replaces the old preview.
  if (action === "start" || action === "restart") return start(args)
  if (action === "stop") {
    const stopped = await stopPreviews()
    return {
      summary:
        stopped.length > 0
          ? "I stopped the preview."
          : "The preview was already off.",
      stopped: stopped.length,
    }
  }
  if (action === "status") return status(args)
  stop(`"${action}" is not a preview command. Use start, stop or status.`)
}
