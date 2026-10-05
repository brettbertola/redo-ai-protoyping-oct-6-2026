import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
export const STATE_DIR = join(ROOT, ".surface")
export const isWindows = process.platform === "win32"
export const isMac = process.platform === "darwin"

export function finish(result) {
  console.log(JSON.stringify({ ok: true, ...result }, null, 2))
  process.exit(result?.ok === false ? 1 : 0)
}

export function fail(summary, details = {}) {
  console.log(JSON.stringify({ ok: false, summary, ...details }, null, 2))
  process.exit(1)
}

/** Stops the command with a message the assistant can relay as is. */
export function stop(message, details) {
  const error = new Error(message)
  error.surface = true
  error.details = details
  throw error
}

/** `a b --flag --key value` → { _: ["a", "b"], flag: true, key: "value" } */
export function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("--")) {
      args._.push(arg)
      continue
    }
    const [key, inline] = arg.slice(2).split(/=(.*)/s)
    if (inline !== undefined) args[key] = inline
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) {
      args[key] = argv[++i]
    } else args[key] = true
  }
  return args
}

/** Runs a program without a shell. Never throws; check `.ok`. */
export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    // .cmd shims on Windows (npm, npx) need a shell to start.
    shell: isWindows && /\.(cmd|bat)$/i.test(command),
    ...options,
  })
  return {
    ok: result.status === 0,
    code: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    missing: result.error?.code === "ENOENT",
  }
}

/**
 * An assistant can do its work in a Git worktree: a second folder of the same
 * project. This gives the main folder. In the main folder, it gives ROOT.
 */
export function mainRoot() {
  const result = run("git", [
    "rev-parse",
    "--path-format=absolute",
    "--git-dir",
    "--git-common-dir",
  ])
  if (!result.ok) return ROOT
  const [gitDir, commonDir] = result.stdout.split(/\r?\n/)
  if (!commonDir || resolve(gitDir) === resolve(commonDir)) return ROOT
  return dirname(resolve(commonDir))
}

export const npmCommand = isWindows ? "npm.cmd" : "npm"

/** Runs a tool installed in node_modules through Node, so it works on any OS. */
export function runBin(pkg, args = [], options = {}) {
  const pkgDir = join(ROOT, "node_modules", pkg)
  const meta = readJson(join(pkgDir, "package.json"))
  if (!meta) {
    return {
      ok: false,
      code: 1,
      stdout: "",
      stderr: `${pkg} is not installed`,
      missing: true,
    }
  }
  const bin =
    typeof meta.bin === "string" ? meta.bin : Object.values(meta.bin ?? {})[0]
  return run(process.execPath, [join(pkgDir, bin), ...args], options)
}

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch {
    return fallback
  }
}

export function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n")
}

export function readState(name, fallback = {}) {
  return readJson(join(STATE_DIR, `${name}.json`), fallback)
}

export function writeState(name, value) {
  writeJson(join(STATE_DIR, `${name}.json`), value)
}

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** "Checkout Flow" → "checkout-flow" */
export function slugify(text) {
  return String(text)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function assertName(value, what) {
  if (typeof value !== "string" || !NAME_PATTERN.test(value)) {
    stop(
      `"${value}" is not a permitted ${what}. Use lowercase letters, numbers and dashes. Example: "${slugify(value ?? "") || "my-name"}".`
    )
  }
  return value
}

/** Every file under a folder, as paths relative to it, using "/". */
export function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, base, out)
    else
      out.push(
        full
          .slice(base.length + 1)
          .split("\\")
          .join("/")
      )
  }
  return out
}

export function titleize(name) {
  return name
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export function pascalCase(name) {
  return name
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join("")
}
