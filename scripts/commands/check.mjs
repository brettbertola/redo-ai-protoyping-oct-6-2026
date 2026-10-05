import { readFileSync } from "node:fs"
import { join } from "node:path"
import { checkDesignRules } from "../lib/design-rules.mjs"
import { ROOT, runBin } from "../lib/util.mjs"
import { skillsInSync, skillNames } from "./skills.mjs"

function tail(text, lines = 40) {
  return text.split("\n").filter(Boolean).slice(-lines).join("\n")
}

/** Everything that must be true before prototypes are shared. */
export async function run(args) {
  const steps = []

  const types = runBin("typescript", ["-b", "--pretty", "false"])
  steps.push({
    id: "code",
    label: "The code has no errors",
    ok: types.ok,
    ...(types.ok ? {} : { problems: tail(types.stdout || types.stderr) }),
  })

  const design = checkDesignRules()
  steps.push({
    id: "design-rules",
    label: "The prototypes obey the design rules",
    ok: design.length === 0,
    ...(design.length ? { problems: design } : {}),
  })

  const sync = skillsInSync()
  const requests = readFileSync(
    join(ROOT, "surface", "pages", "requests.ts"),
    "utf8"
  )
  const listed = [...requests.matchAll(/skill:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .sort()
  const skills = skillNames()
  const homeMatches = JSON.stringify(listed) === JSON.stringify(skills)
  steps.push({
    id: "skills",
    label: "The skills are consistent",
    ok: sync.ok && homeMatches,
    ...(sync.ok
      ? {}
      : { problems: sync.problems, fix: "npm run surface -- skills sync" }),
    ...(homeMatches ? {} : { homePageList: listed, skillsFolder: skills }),
  })

  if (!args["no-build"] && types.ok) {
    const build = runBin("vite", ["build"])
    steps.push({
      id: "build",
      label: "The publish build is successful",
      ok: build.ok,
      ...(build.ok ? {} : { problems: tail(build.stderr || build.stdout) }),
    })
  }

  const failed = steps.filter((step) => !step.ok)
  return {
    ok: failed.length === 0,
    summary:
      failed.length === 0
        ? "All checks are good."
        : `${failed.length} check(s) failed. Repair these: ${failed.map((step) => step.label).join("; ")}.`,
    steps,
  }
}
