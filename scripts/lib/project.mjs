import { existsSync, readFileSync, readdirSync, rmdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { ROOT, assertName, stop, walk } from "./util.mjs"
import { loadConfig } from "./config-ast.mjs"

export const PROTOTYPES_DIR = join(ROOT, "prototypes")
export const CHROMES_DIR = join(ROOT, "chromes")
const CONFIG = "prototype.config.ts"

/** Every prototype as "category/name" (categories may be nested). */
export function listPrototypeIds() {
  return walk(PROTOTYPES_DIR)
    .filter((file) => file.endsWith(`/${CONFIG}`))
    .map((file) => file.slice(0, -CONFIG.length - 1))
    .sort()
}

export function listChromes() {
  if (!existsSync(CHROMES_DIR)) return []
  return readdirSync(CHROMES_DIR, { withFileTypes: true })
    .filter(
      (e) =>
        e.isDirectory() && existsSync(join(CHROMES_DIR, e.name, "chrome.tsx"))
    )
    .map((e) => e.name)
    .sort()
}

/** Checks "category/name" and returns its parts. */
export function parsePrototypeId(id) {
  const segments = String(id ?? "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
  if (segments.length < 2) {
    stop(
      `"${id}" must have a category and a name. Example: "checkout/payment-form".`
    )
  }
  for (const segment of segments) assertName(segment, "folder name")
  if (["pages", "variants"].includes(segments[segments.length - 1])) {
    stop(
      `You cannot use the name "${segments[segments.length - 1]}" for a prototype.`
    )
  }
  return {
    id: segments.join("/"),
    dir: join(PROTOTYPES_DIR, ...segments),
    url: `/${segments.join("/")}`,
    name: segments[segments.length - 1],
  }
}

/** Finds an existing prototype by "category/name" or by an unambiguous name. */
export function resolvePrototype(input) {
  const wanted = String(input ?? "").replace(/^\/+|\/+$/g, "")
  const ids = listPrototypeIds()
  const matches = ids.includes(wanted)
    ? [wanted]
    : ids.filter((id) => id.split("/").pop() === wanted)
  if (matches.length === 0) {
    stop(`The prototype "${input}" does not exist.`, { prototypes: ids })
  }
  if (matches.length > 1) {
    stop(
      `More than one prototype has the name "${input}". Give the category also.`,
      {
        matches,
      }
    )
  }
  const prototype = parsePrototypeId(matches[0])
  return { ...prototype, configFile: join(prototype.dir, CONFIG) }
}

export function describeAxes(prototype) {
  const config = loadConfig(prototype.configFile)
  return config.axes.map((axis) => {
    const values =
      axis.kind === "component"
        ? componentValues(prototype, axis.name)
        : axis.values
    return {
      axis: axis.name,
      kind: axis.kind,
      values,
      default:
        axis.default ??
        (axis.kind === "component" ? (values[0] ?? null) : null),
    }
  })
}

export function componentDir(prototype, axis) {
  return join(prototype.dir, "variants", axis)
}

export function componentValues(prototype, axis) {
  const dir = componentDir(prototype, axis)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx") && !file.startsWith("_"))
    .map((file) => file.slice(0, -4))
    .sort()
}

/** Removes folders left empty, walking up but never past `stopAt`. */
export function pruneEmptyDirs(dir, stopAt) {
  let current = dir
  while (current.startsWith(stopAt) && current !== stopAt) {
    if (!existsSync(current) || readdirSync(current).length > 0) break
    rmdirSync(current)
    current = dirname(current)
  }
}

/** Places where a renamed or deleted name is still mentioned in quotes. */
export function findMentions(dir, name) {
  const mentions = []
  const pattern = new RegExp(
    `["'\`]${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`
  )
  for (const file of walk(dir)) {
    if (!/\.(tsx?|css)$/.test(file)) continue
    const lines = readFileSyncSafe(join(dir, file)).split("\n")
    lines.forEach((line, index) => {
      if (pattern.test(line)) mentions.push(`${file}:${index + 1}`)
    })
  }
  return mentions
}

function readFileSyncSafe(file) {
  try {
    return readFileSync(file, "utf8")
  } catch {
    return ""
  }
}
