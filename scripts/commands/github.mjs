import { spawn } from "node:child_process"
import { mkdirSync, openSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { STATE_DIR, isMac, isWindows, run, stop } from "../lib/util.mjs"
import { checkGh, checkGhAuth } from "./doctor.mjs"

const DEVICE_URL = "https://github.com/login/device"

function account() {
  const user = run("gh", ["api", "user", "--jq", ".login"])
  return user.ok ? user.stdout : null
}

function openBrowser(url) {
  const [command, args] = isMac
    ? ["open", [url]]
    : isWindows
      ? ["cmd", ["/c", "start", "", url]]
      : ["xdg-open", [url]]
  spawn(command, args, { stdio: "ignore", detached: true }).unref()
}

// Starts GitHub's "enter this code in your browser" sign-in and leaves it
// waiting in the background, so no terminal interaction is needed.
async function login() {
  if (!checkGh())
    stop("The GitHub CLI is not installed. Run `npm run surface -- doctor`.")
  if (checkGhAuth()) {
    return {
      summary: `You are already signed in to GitHub as ${account()}.`,
      signedIn: true,
      account: account(),
    }
  }
  mkdirSync(STATE_DIR, { recursive: true })
  const logFile = join(STATE_DIR, "github-login.log")
  const log = openSync(logFile, "w")
  const child = spawn(
    "gh",
    [
      "auth",
      "login",
      "--hostname",
      "github.com",
      "--git-protocol",
      "https",
      "--web",
      "--skip-ssh-key",
    ],
    { detached: true, stdio: ["ignore", log, log], windowsHide: true }
  )
  child.unref()

  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const code = /[A-Z0-9]{4}-[A-Z0-9]{4}/.exec(
      readFileSync(logFile, "utf8")
    )?.[0]
    if (code) {
      openBrowser(DEVICE_URL)
      return {
        summary: `A browser tab is open at ${DEVICE_URL}. Sign in to GitHub. Type the code ${code}. Click Authorize.`,
        signedIn: false,
        code,
        url: DEVICE_URL,
        next: "Wait until the designer tells you that they are done. Then run `npm run surface -- github status`.",
      }
    }
  }
  stop("The GitHub sign-in did not start.", {
    output: readFileSync(logFile, "utf8").slice(-600),
  })
}

export async function run_(args) {
  const action = args._[0] ?? "status"
  if (action === "login") return login()
  if (action === "status") {
    const signedIn = checkGh() && checkGhAuth()
    return {
      summary: signedIn
        ? `You are signed in to GitHub as ${account()}.`
        : "You are not signed in to GitHub.",
      signedIn,
      account: signedIn ? account() : null,
    }
  }
  stop(`"${action}" is not a github command. Use login or status.`)
}

export { run_ as run, account }
