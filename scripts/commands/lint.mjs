import {
  checkDesignRules,
  checkFile,
  formatProblems,
} from "../lib/design-rules.mjs"

/** Runs the design rules on the given files, or on all prototypes and chromes. */
export async function run(args) {
  const problems =
    args._.length > 0 ? args._.flatMap(checkFile) : checkDesignRules()
  return {
    ok: problems.length === 0,
    summary:
      problems.length === 0
        ? "The design rules found no problems."
        : `The design rules found ${problems.length} problem${problems.length === 1 ? "" : "s"}.`,
    problems,
    ...(problems.length ? { text: formatProblems(problems) } : {}),
  }
}
