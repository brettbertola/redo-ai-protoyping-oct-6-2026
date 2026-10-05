import { GROUPS, loadDirectives, saveDirectives } from "../lib/direction.mjs"
import { listChromes, listPrototypeIds } from "../lib/project.mjs"
import { stop } from "../lib/util.mjs"

// More directives than this in one group is a sign that some are too specific.
const GROUP_LIMIT = 10
const WORD_LIMIT = 40

function withIds(directives) {
  return Object.fromEntries(
    Object.entries(GROUPS).map(([key, { prefix }]) => [
      key,
      directives[key].map((text, index) => ({
        id: `${prefix}${index + 1}`,
        text,
      })),
    ])
  )
}

function locate(directives, id) {
  const match = /^([DB])(\d+)$/i.exec(String(id ?? ""))
  const group = Object.keys(GROUPS).find(
    (key) => GROUPS[key].prefix === match?.[1]?.toUpperCase()
  )
  const index = Number(match?.[2]) - 1
  if (!group || !directives[group][index]) {
    stop(`There is no directive "${id}".`, { directives: withIds(directives) })
  }
  return { group, index }
}

/** Finds the signs of a directive that applies to one prototype only. */
function tooSpecific(text) {
  const lower = text.toLowerCase()
  const reasons = []
  if (/\b(prototypes|chromes)\//.test(lower) || /\.tsx?\b/.test(lower)) {
    reasons.push("It names a file or a folder.")
  }
  for (const id of listPrototypeIds()) {
    const name = id.split("/").pop()
    if (
      lower.includes(id) ||
      new RegExp(`\\bthe ${name.replace(/-/g, "[ -]")} prototype\\b`).test(
        lower
      )
    ) {
      reasons.push(`It names the prototype "${id}".`)
    }
  }
  for (const chrome of listChromes()) {
    if (
      new RegExp(`\\bthe ${chrome.replace(/-/g, "[ -]")} chrome\\b`).test(lower)
    ) {
      reasons.push(`It names the chrome "${chrome}".`)
    }
  }
  if (/#[0-9a-f]{3,8}\b|\b\d+(\.\d+)?\s?(px|rem|em|pt)\b/.test(lower)) {
    reasons.push(
      "It gives a specific color or dimension. That is a property of the theme."
    )
  }
  return reasons
}

function clean(text) {
  const value = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
  if (!value) stop("Give the text of the directive.")
  if (value.includes("<!--"))
    stop("A directive cannot contain an HTML comment.")
  return value
}

function validate(text, args) {
  const reasons = tooSpecific(text)
  if (reasons.length > 0 && !args.force) {
    stop("This directive is too specific. I did not add it.", {
      reasons,
      hint: "Write the principle that applies to all prototypes. If the change is for one prototype only, change that prototype. Use --force only if the designer makes this decision.",
    })
  }
  const warnings = []
  const words = text.split(" ").length
  if (words > WORD_LIMIT) {
    warnings.push(
      `The directive has ${words} words. Make it shorter than ${WORD_LIMIT} words.`
    )
  }
  return warnings
}

export async function run(args) {
  const action = args._[0] ?? "list"
  const { text, directives } = loadDirectives()

  if (action === "list") {
    const total = directives.design.length + directives.build.length
    return {
      summary: `The project has ${total} directive${total === 1 ? "" : "s"}.`,
      directives: withIds(directives),
      limitForEachGroup: GROUP_LIMIT,
    }
  }

  if (action === "add") {
    const group = args.group
    if (!GROUPS[group]) {
      stop("Give the group with --group design or --group build.", {
        groups: {
          design: "the appearance and the behavior of the screens",
          build: "the method that the assistant uses to make the screens",
        },
      })
    }
    const directive = clean(args._.slice(1).join(" "))
    if (
      directives[group].some((d) => d.toLowerCase() === directive.toLowerCase())
    ) {
      stop("This directive is already in the list.")
    }
    const warnings = validate(directive, args)
    directives[group].push(directive)
    if (directives[group].length > GROUP_LIMIT) {
      warnings.push(
        `The ${group} group now has ${directives[group].length} directives. The limit is ${GROUP_LIMIT}. Merge or remove directives.`
      )
    }
    saveDirectives(text, directives)
    return {
      summary: `I added the directive ${GROUPS[group].prefix}${directives[group].length}.`,
      directives: withIds(directives),
      ...(warnings.length ? { warnings } : {}),
    }
  }

  if (action === "replace") {
    const { group, index } = locate(directives, args._[1])
    const directive = clean(args._.slice(2).join(" "))
    const warnings = validate(directive, args)
    directives[group][index] = directive
    saveDirectives(text, directives)
    return {
      summary: `I changed the directive ${String(args._[1]).toUpperCase()}.`,
      directives: withIds(directives),
      ...(warnings.length ? { warnings } : {}),
    }
  }

  if (action === "remove") {
    const { group, index } = locate(directives, args._[1])
    const [removed] = directives[group].splice(index, 1)
    saveDirectives(text, directives)
    return {
      summary: `I removed the directive ${String(args._[1]).toUpperCase()}.`,
      removed,
      directives: withIds(directives),
    }
  }

  stop(`"${action}" is not a train command. Use list, add, replace or remove.`)
}
