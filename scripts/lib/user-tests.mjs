// Personas, tasks and runs of the user tests.
//
// A user test puts an AI assistant in the role of a user. The assistant gets
// a persona and a task, then operates a prototype in a real browser. The
// scripts own the state of the run: the patience, the findings and the report.
import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { ROOT, assertName, readJson, stop, writeJson } from "./util.mjs"

export const TESTS_DIR = join(ROOT, "user-tests")
export const PERSONAS_DIR = join(TESTS_DIR, "personas")
export const TASKS_DIR = join(TESTS_DIR, "tasks")
export const RUNS_DIR = join(TESTS_DIR, "runs")

/**
 * The behavior of a persona. Each trait comes from usability research.
 * `ask` is the question for the designer. Each option says how the user acts.
 */
export const TRAITS = {
  search: {
    ask: "On a new page, where does this person start?",
    options: {
      "search-first":
        "You look for a search field first. You type what you want.",
      "browse-first":
        "You read the navigation and the links first. You use a search field only when you are stuck.",
      mixed: "You use the first thing that gets your attention.",
    },
  },
  reading: {
    ask: "How much does this person read on the screen?",
    options: {
      reads: "You read labels, descriptions and help text before you act.",
      scans: "You read headings and bold text. You do not read paragraphs.",
      glances:
        "You see only large text, icons and buttons. You do not read body text, help text or descriptions.",
    },
  },
  exploration: {
    ask: "When there is more than one option, what does this person do?",
    options: {
      "breadth-first": "You look at all options on the page before you click.",
      "depth-first":
        "You click the first option that can be correct. You do not compare.",
      linear: "You go from top to bottom and from left to right.",
    },
  },
  scent: {
    ask: "How sure must this person be before a click?",
    options: {
      low: "You click each thing that is a little related to your goal.",
      high: "You click only a thing that clearly agrees with your goal. An unclear label stops you.",
    },
  },
  effort: {
    ask: "How much effort does this person use to understand a screen?",
    options: {
      high: "You read tooltips, help text and instructions.",
      low: "You ignore each text that is longer than one sentence.",
    },
  },
  recovery: {
    ask: "What does this person do when a step fails?",
    options: {
      retries: "You do the same step again, possibly with a small change.",
      backtracks: "You go back and use a different path.",
      abandons: "After one failure, you leave that path or you stop.",
    },
  },
  persistence: {
    ask: "How long does this person continue?",
    options: {
      high: "You try many different approaches before you stop.",
      medium: "You try some approaches. Then you become frustrated.",
      low: "You expect that each step is correct the first time. If not, you stop quickly.",
    },
  },
}

export const FINDING_TYPES = {
  confusion: "You do not understand what something means or does.",
  jargon: "A label uses a word that the user does not know.",
  "missing-affordance": "You cannot find a control that you expect.",
  "misleading-ui": "Something looks like it does one thing but does another.",
  "dead-end": "An action had no result, or the result did not help.",
}

export const SEVERITIES = {
  critical: "The user cannot continue.",
  warning: "The user is slower or frustrated.",
  suggestion: "A small irritation.",
}

export const DIFFICULTIES = ["easy", "moderate", "hard"]

// The same sizes as surface/lib/devices.ts. A user test has no window to
// fill, so "responsive" is a desktop screen.
export const VIEWPORTS = {
  responsive: { width: 1440, height: 900 },
  phone: { width: 390, height: 844 },
  "phone-small": { width: 375, height: 667 },
  tablet: { width: 820, height: 1180 },
  "tablet-landscape": { width: 1180, height: 820 },
  desktop: { width: 1440, height: 900 },
}
export const MIN_PATIENCE = 3
export const MAX_PATIENCE = 80

function names(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -5))
    .sort()
}

export const listPersonas = () => names(PERSONAS_DIR)
export const listTasks = () => names(TASKS_DIR)
export const personaFile = (name) => join(PERSONAS_DIR, `${name}.json`)
export const taskFile = (name) => join(TASKS_DIR, `${name}.json`)

export function loadPersona(name) {
  const persona = readJson(personaFile(assertName(name, "persona name")))
  if (!persona) {
    stop(`The persona "${name}" does not exist.`, { personas: listPersonas() })
  }
  return persona
}

export function loadTask(name) {
  const task = readJson(taskFile(assertName(name, "task name")))
  if (!task) stop(`The task "${name}" does not exist.`, { tasks: listTasks() })
  return task
}

function text(value) {
  return typeof value === "string" ? value.trim() : ""
}

/** Makes a persona from command flags. Stops with all problems at one time. */
export function buildPersona(name, args) {
  const problems = []
  const backstory = text(args.backstory)
  if (!backstory)
    problems.push(`--backstory "<two or three sentences in the first person>"`)
  const traits = {}
  for (const [trait, { options }] of Object.entries(TRAITS)) {
    const value = text(args[trait])
    if (value in options) traits[trait] = value
    else problems.push(`--${trait} ${Object.keys(options).join(" | ")}`)
  }
  const patience = Number(args.patience)
  if (
    !Number.isInteger(patience) ||
    patience < MIN_PATIENCE ||
    patience > MAX_PATIENCE
  ) {
    problems.push(
      `--patience <a whole number from ${MIN_PATIENCE} thru ${MAX_PATIENCE}>`
    )
  }
  if (problems.length > 0) {
    stop("The persona is not complete. Give these flags.", {
      missing: problems,
    })
  }
  return { name, backstory, traits, patience }
}

/** "a; b" → ["a", "b"] */
function list(value) {
  return text(value)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Makes a task from command flags. `prototype` is { id, url } of a prototype
 * that exists. `pages` are the page names of that prototype.
 */
export function buildTask(name, args, prototype, pages) {
  const problems = []
  const goal = text(args.goal)
  if (!goal)
    problems.push(`--goal "<the task, in the words that you tell a user>"`)
  const signal = text(args.signal)
  if (!signal)
    problems.push(`--signal "<what the screen shows when the task is done>"`)
  const difficulty = text(args.difficulty) || "moderate"
  if (!DIFFICULTIES.includes(difficulty))
    problems.push(`--difficulty ${DIFFICULTIES.join(" | ")}`)
  const page = (flag) => {
    const value = text(args[flag]).replace(/^\/+|\/+$/g, "")
    if (value && !pages.includes(value)) {
      problems.push(
        `--${flag} <one of: ${pages.join(", ") || "this prototype has no pages"}>`
      )
    }
    return value || null
  }
  const startPage = page("start-page")
  const endPage = page("end-page")
  if (problems.length > 0) {
    stop("The task is not complete. Give these flags.", { missing: problems })
  }
  return {
    name,
    goal,
    prototype: prototype.id,
    startPage,
    variants: text(args.variants).replace(/^\?/, "") || null,
    success: { endPage, interactions: list(args.interactions), signal },
    difficulty,
  }
}

export function savePersona(persona) {
  writeJson(personaFile(persona.name), persona)
}

export function saveTask(task) {
  writeJson(taskFile(task.name), task)
}

export function patienceMessage(remaining, budget) {
  const ratio = budget > 0 ? remaining / budget : 0
  if (remaining <= 0) {
    return "Your patience is 0. Stop now. Run `test end --outcome abandoned`. Say where you are, what you wanted and what frustrated you."
  }
  if (ratio <= 0.15) {
    return "Frustration: high. You are almost at your limit. If the next click or two do not help, you stop."
  }
  if (ratio <= 0.3) {
    return "Frustration: moderate. This takes longer than you expected. You look for a shortcut. You are almost prepared to stop."
  }
  if (ratio <= 0.7) {
    return "You are focused. You do not explore things that are not related to your goal."
  }
  return "You are calm."
}

/** The instructions for the assistant that is the user. It has no hints. */
export function briefing(persona, task, device) {
  const traits = Object.entries(persona.traits)
    .map(
      ([trait, value]) =>
        `- ${trait} (${value}): ${TRAITS[trait]?.options[value] ?? value}`
    )
    .join("\n")
  const types = Object.entries(FINDING_TYPES)
    .map(([type, meaning]) => `- ${type}: ${meaning}`)
    .join("\n")
  const severities = Object.entries(SEVERITIES)
    .map(([severity, meaning]) => `- ${severity}: ${meaning}`)
    .join("\n")
  return `# Play the part of a user in a usability test

A designer wants to find where a design is not clear. You help with a role-play: you play the part of one user who tries the design on a ${device} screen. Act as this user acts, and speak as this user speaks. This user is not here to help the designer. This user has limited patience. If the task is too hard, this user stops.

## Who you are

${persona.backstory}

Your behavior:
${traits}

## Your goal

${task.goal}

## How you operate the screen

Each command starts with \`npm run surface -- test\`. Each command gives a new screenshot and a list of the controls that you can see.

| Command | Function | Patience |
|---|---|---|
| \`look\` | Gives the screenshot and the controls again | 0 |
| \`click <ref> --says "<comment>"\` | Clicks a control | 1 |
| \`type <ref> "<text>" --says "<comment>"\` | Types into a field. Add \`--submit\` to press Enter | 1 |
| \`select <ref> "<option>" --says "<comment>"\` | Selects an option in a list | 1 |
| \`key <Enter, Escape, Tab> --says "<comment>"\` | Presses one key | 1 |
| \`back --says "<comment>"\` | Goes back one page | 1 |
| \`scroll down\` or \`scroll up\` | Moves the page | 0 |
| \`hover <ref>\` | Puts the pointer on a control | 0 |
| \`finding --type <type> --severity <severity> --description "<text>"\` | Records a usability problem | 0 |
| \`end --outcome completed\` or \`abandoned\` \`--confidence high\`, \`medium\` or \`low\` \`--summary "<text>"\` | Ends the test | 0 |

## Rules

1. Open the screenshot file after each command. The screenshot is what you see. Use the list of controls only to get the \`ref\` of a control that you saw in the screenshot.
2. With each action, put in \`--says\` the comment that this user says aloud at that moment. A real participant in a usability test speaks while they use the product. Write one or two short sentences in the words of the user: what they see, and what they expect from the action. Example: "I want to pay. The large button at the bottom says Pay, so I press it." The designer reads these comments in the report.
3. Obey your behavior. If your reading is "glances", you do not read body text. If your persistence is "low", you stop quickly.
4. You know only what the screen shows. Do not read the files of the project. Do not use knowledge about how web pages are made. Do not type an address.
5. When you are confused, or a label is not clear, or an action has no result, record a finding immediately. Do not wait until the end.
6. Each result contains \`patience\` and \`mood\`. Let the mood change how you act.
7. If you see something that looks like a control but it is not in the list, you cannot use it. Record a finding.
8. When the user believes that the task is done, or when you stop, run \`end\`. In \`--summary\`, say what you did or where you stopped, and what you expected to see.

## Types of finding

${types}

## Severity

${severities}
`
}

const SEVERITY_ORDER = Object.keys(SEVERITIES)

export function sortFindings(findings) {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  )
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]
  )
}

const OUTCOME_LABELS = {
  completed: "The user completed the task",
  abandoned: "The user stopped",
  "timed-out": "The test stopped because there was no action",
  stopped: "The test was stopped before the end",
}

/**
 * The prototype of a run with its variants and options below it, as lines of
 * a tree. Each variant has a number and each option has a letter, the same
 * labels that the test skills show. `used` marks the option of this run.
 * A run from before `axes` was recorded shows only the options it used.
 */
export function variantTree(run) {
  const query = new URLSearchParams(run.variants ?? "")
  const axes =
    run.axes ??
    [...query.keys()].map((axis) => ({
      axis,
      values: [query.get(axis)],
      default: null,
    }))
  const lines = [{ text: run.task.prototype, kind: "prototype" }]
  if (axes.length === 0) {
    lines.push({
      text: run.axes ? "└ No variants" : "└ Default options",
      kind: "option",
    })
    return lines
  }
  axes.forEach((axis, index) => {
    const lastAxis = index === axes.length - 1
    const used = query.get(axis.axis) ?? String(axis.default)
    lines.push({
      text: `${lastAxis ? "└" : "├"} ${index + 1}. ${axis.axis}`,
      kind: "variant",
    })
    axis.values.forEach((value, at) => {
      const lastValue = at === axis.values.length - 1
      const letter = String.fromCharCode(97 + (at % 26))
      const isUsed = String(value) === used
      lines.push({
        text: `${lastAxis ? " " : "│"}  ${lastValue ? "└" : "├"} ${letter}. ${value}${String(value) === String(axis.default) ? " (default)" : ""}${isUsed ? " ✓" : ""}`,
        kind: "option",
        used: isUsed,
      })
    })
  })
  return lines
}

/** The page that the designer reads after a run. It needs no other file. */
// Reports of older runs have the comment of the user in `why`.
const comment = (action) => action.says ?? action.why ?? ""

export function reportHtml(run) {
  const findings = sortFindings(run.findings)
  const used = run.patienceBudget - run.patienceRemaining
  const facts = [
    ["Persona", run.persona.name],
    ["Task", run.task.name],
    ["Device", run.device],
    ["Actions", run.actions.filter((action) => action.cost > 0).length],
    ["Patience used", `${used} of ${run.patienceBudget}`],
    ["Findings", findings.length],
    ...(run.task.success.endPage
      ? [["Reached the end page", run.reachedEndPage ? "Yes" : "No"]]
      : []),
    ...(run.confidence ? [["Confidence of the user", run.confidence]] : []),
  ]
  const shot = (path, label) =>
    path
      ? `<a href="${escapeHtml(path)}"><img src="${escapeHtml(path)}" alt="${escapeHtml(label)}" loading="lazy"></a>`
      : ""
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>User test: ${escapeHtml(run.task.name)} as ${escapeHtml(run.persona.name)}</title>
<style>
  :root { color-scheme: light dark; --line: color-mix(in srgb, currentColor 15%, transparent); --soft: color-mix(in srgb, currentColor 60%, transparent); }
  body { font: 15px/1.5 system-ui, sans-serif; margin: 0 auto; max-width: 860px; padding: 32px 16px 80px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 40px 0 12px; }
  p { margin: 0 0 12px; }
  .soft { color: var(--soft); }
  .facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
  .facts div { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; }
  .facts dt { color: var(--soft); font-size: 12px; }
  .facts dd { margin: 0; font-weight: 600; }
  .tree { border: 1px solid var(--line); border-radius: 8px; font: 14px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace; margin: 20px 0; overflow-x: auto; padding: 10px 12px; white-space: pre; }
  .tree .label { color: var(--soft); display: block; font: 12px/1.5 system-ui, sans-serif; }
  .tree .option { color: var(--soft); }
  .tree .prototype, .tree .used { color: inherit; font-weight: 600; }
  .item { border: 1px solid var(--line); border-radius: 8px; display: grid; gap: 12px; grid-template-columns: 1fr 200px; margin: 0 0 12px; padding: 12px; }
  .item img { border: 1px solid var(--line); border-radius: 6px; display: block; max-height: 260px; max-width: 100%; }
  .tag { border: 1px solid var(--line); border-radius: 999px; display: inline-block; font-size: 12px; font-weight: 600; padding: 0 8px; }
  .critical { background: #b42318; border-color: #b42318; color: #fff; }
  .warning { background: #b54708; border-color: #b54708; color: #fff; }
  blockquote { border-left: 3px solid var(--line); margin: 6px 0 0; padding: 0 0 0 12px; }
  @media (max-width: 600px) { .item { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<p class="soft">User test · ${escapeHtml(run.startedAt.slice(0, 16).replace("T", " "))}</p>
<h1>${escapeHtml(OUTCOME_LABELS[run.outcome] ?? run.outcome)}</h1>
<p><strong>Goal:</strong> ${escapeHtml(run.task.goal)}</p>
${run.summary ? `<blockquote>${escapeHtml(run.summary)}</blockquote>` : ""}
<div class="tree"><span class="label">Prototype and variants</span>${variantTree(
    run
  )
    .map(
      (line) =>
        `<span class="${line.kind}${line.used ? " used" : ""}">${escapeHtml(line.text)}</span>`
    )
    .join("\n")}</div>
<dl class="facts">
${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("\n")}
</dl>

<h2>Findings</h2>
${
  findings.length === 0
    ? `<p class="soft">The user recorded no findings.</p>`
    : findings
        .map(
          (finding) => `<div class="item">
  <div><span class="tag ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span> <span class="tag">${escapeHtml(finding.type)}</span> <span class="soft">step ${finding.step}</span>
  <p>${escapeHtml(finding.description)}</p></div>
  ${shot(finding.screenshot, `Screen at step ${finding.step}`)}
</div>`
        )
        .join("\n")
}

<h2>What the persona is</h2>
<p>${escapeHtml(run.persona.backstory)}</p>
<p class="soft">${Object.entries(run.persona.traits)
    .map(([trait, value]) => `${escapeHtml(trait)}: ${escapeHtml(value)}`)
    .join(" · ")}</p>

<h2>What the user did</h2>
${run.actions
  .map(
    (action) => `<div class="item">
  <div><strong>${action.step}. ${escapeHtml(action.label)}</strong> <span class="soft">${escapeHtml(action.page)}${action.cost > 0 ? ` · patience ${action.patienceRemaining}` : ""}${action.changed === false ? " · the screen did not change" : ""}</span>
  ${comment(action) ? `<blockquote>${escapeHtml(comment(action))}</blockquote>` : ""}</div>
  ${shot(action.screenshot, `Screen after step ${action.step}`)}
</div>`
  )
  .join("\n")}

<h2>What success is</h2>
<p>${escapeHtml(run.task.success.signal)}</p>
${run.task.success.interactions.length ? `<p class="soft">Controls that the user must use: ${escapeHtml(run.task.success.interactions.join("; "))}</p>` : ""}
</body>
</html>
`
}
