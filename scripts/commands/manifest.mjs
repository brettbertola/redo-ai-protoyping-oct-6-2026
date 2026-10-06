import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { withoutBlock } from "../lib/direction.mjs"
import { ROOT, readJson, stop, walk, writeJson } from "../lib/util.mjs"

export const MANIFEST = join(ROOT, "surface", "manifest.json")

// Everything listed here belongs to Surface and is replaced by an update.
// Anything not listed (prototypes/, chromes/, src/, surface.config.ts,
// components.json) belongs to the designer and is never touched.
export const OWNED = [
  "surface",
  "scripts",
  "tests",
  "docs",
  ".agents/skills",
  ".claude/skills",
  ".cursor/skills",
  ".claude/settings.json",
  ".cursor/hooks.json",
  ".codex/hooks.json",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "LICENSE",
  "index.html",
  "public/favicon.svg",
  "vite.config.ts",
  "playwright.config.ts",
  "eslint.config.js",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
]

export function ownedFiles(root) {
  const files = []
  for (const path of OWNED) {
    const full = join(root, path)
    if (!existsSync(full)) continue
    if (statSync(full).isDirectory()) {
      files.push(...walk(full).map((file) => `${path}/${file}`))
    } else files.push(path)
  }
  return files.filter((file) => file !== "surface/manifest.json").sort()
}

export function hashFile(file) {
  // Line endings differ between Windows and Mac checkouts; ignore them.
  // The designer owns one section of AGENTS.md. A change there is not an
  // edit of a Surface file.
  const text = withoutBlock(readFileSync(file, "utf8").replace(/\r\n/g, "\n"))
  return createHash("sha256").update(text).digest("hex").slice(0, 16)
}

export async function run(args) {
  const action = args._[0] ?? "show"
  const current = readJson(MANIFEST, {})
  if (action === "build") {
    const version = readJson(join(ROOT, "package.json")).version
    const files = Object.fromEntries(
      ownedFiles(ROOT).map((file) => [file, hashFile(join(ROOT, file))])
    )
    writeJson(MANIFEST, {
      version,
      source: current.source ?? "OWNER/open-surface",
      owned: OWNED,
      files,
    })
    return {
      summary: `I recorded ${Object.keys(files).length} Surface files for version ${version}.`,
      version,
    }
  }
  if (action === "show") {
    return {
      summary: `Surface ${current.version ?? "unknown"}, from ${current.source ?? "unknown"}.`,
      version: current.version ?? null,
      source: current.source ?? null,
    }
  }
  stop(`"${action}" is not a manifest command. Use build or show.`)
}
