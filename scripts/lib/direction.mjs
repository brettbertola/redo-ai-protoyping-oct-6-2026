// The "Direction for this project" section of AGENTS.md. The designer owns
// this section. An update of Surface replaces the other parts of AGENTS.md
// and keeps this section.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ROOT, stop } from "./util.mjs"

export const AGENTS_FILE = join(ROOT, "AGENTS.md")
export const START = "<!-- surface-train:start -->"
export const END = "<!-- surface-train:end -->"
export const GROUPS = {
  design: { heading: "Design", prefix: "D" },
  build: { heading: "Build", prefix: "B" },
}
const EMPTY = "_No directives._"

/** The text between the two marks, or null if the marks are missing. */
export function readBlock(text) {
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start === -1 || end === -1 || end < start) return null
  return text.slice(start + START.length, end)
}

export function writeBlock(text, block) {
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  return text.slice(0, start + START.length) + block + text.slice(end)
}

/** Removes the designer's section, to compare the other parts of the file. */
export function withoutBlock(text) {
  return readBlock(text) === null ? text : writeBlock(text, "\n")
}

export function parseDirectives(block) {
  const directives = { design: [], build: [] }
  let group = null
  for (const line of (block ?? "").split("\n")) {
    const heading = /^###\s+(.+)$/.exec(line)?.[1]?.trim()
    if (heading) {
      group =
        Object.keys(GROUPS).find((key) => GROUPS[key].heading === heading) ??
        null
      continue
    }
    const item = /^-\s+(.+)$/.exec(line)?.[1]?.trim()
    if (group && item) directives[group].push(item)
  }
  return directives
}

export function formatBlock(directives) {
  const parts = Object.entries(GROUPS).map(([key, { heading }]) => {
    const items = directives[key]
    const body = items.length ? items.map((d) => `- ${d}`).join("\n") : EMPTY
    return `### ${heading}\n\n${body}`
  })
  return `\n${parts.join("\n\n")}\n`
}

export function loadDirectives() {
  if (!existsSync(AGENTS_FILE)) stop("The file AGENTS.md is missing.")
  const text = readFileSync(AGENTS_FILE, "utf8")
  const block = readBlock(text)
  if (block === null) {
    stop(
      'AGENTS.md has no "Direction for this project" section. Run `npm run surface -- update` to get it back.'
    )
  }
  return { text, directives: parseDirectives(block) }
}

export function saveDirectives(text, directives) {
  writeFileSync(AGENTS_FILE, writeBlock(text, formatBlock(directives)))
}
