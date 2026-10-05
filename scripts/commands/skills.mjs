import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { ROOT, stop, walk } from "../lib/util.mjs"

// Skills are written once in .agents/skills and copied for assistants that
// look elsewhere. Real copies, not links, so a zip download works on Windows.
const SOURCE = join(ROOT, ".agents", "skills")
const COPIES = [
  join(ROOT, ".claude", "skills"),
  join(ROOT, ".cursor", "skills"),
]

export function skillNames() {
  if (!existsSync(SOURCE)) return []
  return readdirSync(SOURCE, { withFileTypes: true })
    .filter(
      (e) => e.isDirectory() && existsSync(join(SOURCE, e.name, "SKILL.md"))
    )
    .map((e) => e.name)
    .sort()
}

function snapshot(dir) {
  return Object.fromEntries(
    walk(dir)
      .sort()
      .map((file) => [file, readFileSync(join(dir, file), "utf8")])
  )
}

export function skillsInSync() {
  const source = JSON.stringify(snapshot(SOURCE))
  const problems = COPIES.filter(
    (copy) => JSON.stringify(snapshot(copy)) !== source
  ).map((copy) => `${copy.slice(ROOT.length + 1)} differs from .agents/skills`)
  return { ok: problems.length === 0, problems }
}

export async function run(args) {
  const action = args._[0] ?? "check"
  if (action === "sync") {
    for (const copy of COPIES) {
      rmSync(copy, { recursive: true, force: true })
      cpSync(SOURCE, copy, { recursive: true })
    }
    return {
      summary: `I copied ${skillNames().length} skills for each assistant.`,
      skills: skillNames(),
    }
  }
  if (action === "check") {
    const result = skillsInSync()
    return {
      ok: result.ok,
      summary: result.ok
        ? "The skill copies are the same."
        : "The skill copies are different. Run: npm run surface -- skills sync",
      ...result,
    }
  }
  stop(`"${action}" is not a skills command. Use sync or check.`)
}
