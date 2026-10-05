import { existsSync } from "node:fs"
import { join } from "node:path"
import { ROOT, isMac, isWindows, run } from "../lib/util.mjs"

const MIN_NODE = 20

const INSTALL = {
  node: "https://nodejs.org/en/download",
  git: isWindows
    ? "https://git-scm.com/download/win"
    : isMac
      ? "run `xcode-select --install`. An Apple window opens. Click Install"
      : "https://git-scm.com/downloads",
  gh: isWindows
    ? "https://github.com/cli/cli/releases/latest (download the .msi file and open it)"
    : isMac
      ? "https://github.com/cli/cli/releases/latest (download the macOS .pkg file and open it)"
      : "https://github.com/cli/cli#installation",
}

export function checkGit() {
  const git = run("git", ["--version"])
  // On a Mac without the developer tools, `git` exists but only prints a
  // prompt to install them.
  return git.ok && /git version/.test(git.stdout)
}

export function checkGh() {
  return run("gh", ["--version"]).ok
}

export function checkGhAuth() {
  return run("gh", ["auth", "status", "--hostname", "github.com"]).ok
}

export async function run_() {
  const nodeMajor = Number(process.versions.node.split(".")[0])
  const hasGit = checkGit()
  const hasGh = checkGh()
  const checks = [
    {
      id: "node",
      label: "Node.js",
      ok: nodeMajor >= MIN_NODE,
      needed: "always",
      detail: `v${process.versions.node}`,
      fix: `Install the LTS version from ${INSTALL.node}. Then close this app and open it again.`,
    },
    {
      id: "dependencies",
      label: "Surface packages",
      ok: existsSync(join(ROOT, "node_modules", "vite")),
      needed: "always",
      fix: "Run `npm install` in the project folder.",
    },
    {
      id: "git",
      label: "Git",
      ok: hasGit,
      needed: "sharing",
      fix: `Install Git: ${INSTALL.git}. Then close this app and open it again.`,
    },
    {
      id: "gh",
      label: "GitHub CLI",
      ok: hasGh,
      needed: "sharing",
      fix: `Install the GitHub CLI: ${INSTALL.gh}. Then close this app and open it again.`,
    },
    {
      id: "github-login",
      label: "GitHub sign-in",
      ok: hasGh && checkGhAuth(),
      needed: "sharing",
      fix: "Run `npm run surface -- github login`. Then do the steps in the browser.",
    },
  ]
  const missing = checks.filter((check) => !check.ok)
  const blocking = missing.filter((check) => check.needed === "always")
  return {
    ok: blocking.length === 0,
    summary:
      missing.length === 0
        ? "All items that Surface uses are installed."
        : blocking.length > 0
          ? `Surface cannot start. Missing: ${blocking.map((c) => c.label).join(", ")}.`
          : `You can make prototypes now. To publish, install: ${missing.map((c) => c.label).join(", ")}.`,
    readyToPrototype: blocking.length === 0,
    readyToShip: missing.length === 0,
    platform: process.platform,
    checks: checks.map(({ fix, ...check }) =>
      check.ok ? check : { ...check, fix }
    ),
  }
}

export { run_ as run }
