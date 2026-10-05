// The design rules for prototypes and chromes. There are two aims:
//   1. Use the components in src/components/ui. Do not make new ones.
//   2. Use the tokens of the theme. Do not use one-off values.
//
// The hooks, the preview and `npm run surface -- check` all use this file, so
// each assistant gets the same rules.
//
// To permit a necessary exception, put `surface-allow` in a comment on the line.
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { ROOT, walk } from "./util.mjs"

export const AREAS = ["prototypes", "chromes"]
const UI_DIR = join(ROOT, "src", "components", "ui")

// An HTML element, and the component file that replaces it.
const ELEMENTS = {
  button: ["button", "Button"],
  input: ["input", "Input (or Checkbox, RadioGroup, Switch, Slider)"],
  select: ["select", "Select"],
  textarea: ["textarea", "Textarea"],
  table: ["table", "Table"],
  label: ["label", "Label"],
  hr: ["separator", "Separator"],
  dialog: ["dialog", "Dialog"],
  progress: ["progress", "Progress"],
  details: ["accordion", "Accordion or Collapsible"],
  kbd: ["kbd", "Kbd"],
}

// An ARIA role that shows a hand-made component, and the file that replaces it.
const ROLES = {
  dialog: ["dialog", "Dialog"],
  alertdialog: ["alert-dialog", "AlertDialog"],
  tablist: ["tabs", "Tabs"],
  tab: ["tabs", "Tabs"],
  switch: ["switch", "Switch"],
  checkbox: ["checkbox", "Checkbox"],
  radio: ["radio-group", "RadioGroup"],
  radiogroup: ["radio-group", "RadioGroup"],
  menu: ["dropdown-menu", "DropdownMenu"],
  tooltip: ["tooltip", "Tooltip"],
  combobox: ["combobox", "Combobox"],
  slider: ["slider", "Slider"],
  progressbar: ["progress", "Progress"],
  separator: ["separator", "Separator"],
  alert: ["alert", "Alert"],
}

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
const COLOR_UTILITIES =
  "bg|text|border|ring|fill|stroke|from|via|to|outline|divide|shadow|decoration|accent|caret|placeholder"
const FIXED_COLOR_CLASS = new RegExp(
  `\\b(?:${COLOR_UTILITIES})-(?:(?:${PALETTE})-\\d{2,3}|white|black)\\b`
)
const COLOR_VALUE =
  /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b(?![\w-])|\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(/

// Utilities that must use the scale of the theme. Size and position utilities
// (w-, h-, max-w-, top-, grid-cols-) are not in this list: a layout can need a
// specific dimension.
const TOKEN_UTILITIES =
  "text|p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|rounded(?:-[a-z]{1,2})?|leading|tracking|font|shadow|bg|border|ring|fill|stroke|from|via|to|outline|opacity|z|duration"
const ARBITRARY_VALUES = new RegExp(
  `(?<=^|[\\s"'\`:!])-?(${TOKEN_UTILITIES})-\\[([^\\]]+)\\]`,
  "g"
)

const STYLE_PROPERTIES =
  /\b(color|background|backgroundColor|borderColor|fontSize|fontFamily|fontWeight|lineHeight|letterSpacing|padding\w*|margin\w*|gap|borderRadius|boxShadow)\s*:\s*(["'`]?)([^,}]+)/

// Tokens that Tailwind makes from the theme.
const BUILT_IN_TOKEN =
  /^--(?:tw-|color-|radius-|font-|text-|spacing|container-|breakpoint-|shadow-|ease-|animate-|leading-|tracking-|blur-|default-)/

let cache = null

/** Reads the components and the tokens that the project has. */
function projectFacts() {
  if (cache) return cache
  const components = new Map()
  const tokens = new Set()
  const collectTokens = (text) => {
    for (const match of text.matchAll(/--[a-zA-Z][\w-]*/g)) tokens.add(match[0])
  }
  if (existsSync(UI_DIR)) {
    for (const file of readdirSync(UI_DIR)) {
      if (!file.endsWith(".tsx")) continue
      const text = readFileSync(join(UI_DIR, file), "utf8")
      collectTokens(text)
      const stem = file.slice(0, -4)
      for (const block of text.matchAll(/export\s*\{([^}]*)\}/g)) {
        for (const raw of block[1].split(",")) {
          const name = raw
            .trim()
            .split(/\s+as\s+/)
            .pop()
          if (/^[A-Z]\w*$/.test(name ?? "")) components.set(name, stem)
        }
      }
      for (const match of text.matchAll(
        /export\s+(?:function|const)\s+([A-Z]\w*)/g
      )) {
        components.set(match[1], stem)
      }
    }
  }
  for (const file of [
    join(ROOT, "src", "theme.css"),
    join(ROOT, "node_modules", "shadcn", "dist", "tailwind.css"),
  ]) {
    if (existsSync(file)) collectTokens(readFileSync(file, "utf8"))
  }
  cache = { components, tokens, files: new Set(readdirSync(UI_DIR)) }
  return cache
}

/** Forgets the components and tokens, for when the theme changes. */
export function resetDesignRules() {
  cache = null
}

function hasUi(stem) {
  return projectFacts().files.has(`${stem}.tsx`)
}

function tokenIsKnown(token) {
  return BUILT_IN_TOKEN.test(token) || projectFacts().tokens.has(token)
}

/**
 * Examines the text of one file.
 * `relativePath` uses "/" and starts with "prototypes/" or "chromes/".
 */
export function checkText(relativePath, text) {
  const problems = []
  const lines = text.split("\n")
  const { components } = projectFacts()
  let inStyle = false

  lines.forEach((line, index) => {
    const add = (rule, message) => {
      const same = (p) => p.line === index + 1 && p.message === message
      if (!problems.some(same)) {
        problems.push({ file: relativePath, line: index + 1, rule, message })
      }
    }

    const startsStyle = /style=\{\{/.test(line)
    const styleLine = inStyle || startsStyle
    if (startsStyle) inStyle = true
    if (inStyle && /\}\}/.test(line)) inStyle = false

    if (line.includes("surface-allow")) return
    if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) return

    // 1. Use the components.
    for (const match of line.matchAll(/<([a-z]+)(?=[\s>/])/g)) {
      const mapped = ELEMENTS[match[1]]
      if (mapped && hasUi(mapped[0])) {
        add(
          "use-components",
          `This line uses <${match[1]}>. Use ${mapped[1]} from @/components/ui/${mapped[0]}.`
        )
      }
    }
    const role = /\brole=["'{]+([a-z]+)/.exec(line)?.[1]
    if (role && ROLES[role] && hasUi(ROLES[role][0])) {
      add(
        "use-components",
        `This line makes a ${role} manually. Use ${ROLES[role][1]} from @/components/ui/${ROLES[role][0]}.`
      )
    }
    const defined =
      /^\s*(?:export\s+)?(?:default\s+)?(?:function|const|class)\s+([A-Z]\w*)\b/.exec(
        line
      )?.[1]
    if (defined && components.has(defined)) {
      add(
        "no-new-components",
        `The component ${defined} already exists. Import it from @/components/ui/${components.get(defined)}. Do not make a new one.`
      )
    }

    // 2. Use the tokens of the theme.
    if (FIXED_COLOR_CLASS.test(line)) {
      add(
        "theme-colors",
        "This line uses a fixed color. Use a theme color: bg-background, text-foreground, bg-primary, text-muted-foreground, border, bg-card, bg-accent."
      )
    }
    if (COLOR_VALUE.test(line)) {
      add(
        "theme-colors",
        "This line uses a color value. Use a theme color. Example: the class bg-primary, or var(--primary)."
      )
    }
    for (const arbitrary of line.matchAll(ARBITRARY_VALUES)) {
      if (arbitrary[2].includes("var(--")) continue
      add(
        "theme-tokens",
        `This line uses the one-off value ${arbitrary[1]}-[${arbitrary[2]}]. Use a value from the scale. Examples: text-sm, p-4, gap-2, rounded-lg, shadow-md.`
      )
    }
    if (styleLine) {
      const style = STYLE_PROPERTIES.exec(line)
      if (
        style &&
        !style[3].includes("var(--") &&
        /^["'`\d]/.test(style[2] + style[3])
      ) {
        add(
          "theme-tokens",
          `This line sets ${style[1]} in a style attribute. Use a class from the theme. Examples: text-sm, p-4, rounded-lg, text-muted-foreground.`
        )
      }
    }
    for (const match of line.matchAll(/--[a-zA-Z][\w-]*/g)) {
      const before = line[match.index - 1] ?? " "
      // "--yes" in a command or "x--y" in a name is not a token.
      if (!/["'`(\s[{;]/.test(before)) continue
      const after = line.slice(match.index + match[0].length)
      if (!/^["'`]?\s*[:)\],]/.test(after)) continue
      if (!tokenIsKnown(match[0])) {
        add(
          "theme-tokens",
          `The token ${match[0]} is not in the theme. Use a token from src/theme.css. Do not make a new token.`
        )
      }
    }
  })
  return problems
}

/** Examines one file on the disk. It ignores files that the rules do not cover. */
export function checkFile(relativePath) {
  const path = relativePath.split("\\").join("/")
  if (!AREAS.some((area) => path.startsWith(`${area}/`))) return []
  if (!/\.(tsx?|css)$/.test(path)) return []
  const full = join(ROOT, path)
  if (!existsSync(full)) return []
  return checkText(path, readFileSync(full, "utf8"))
}

/** Examines all prototypes and chromes. */
export function checkDesignRules() {
  const problems = []
  for (const area of AREAS) {
    for (const file of walk(join(ROOT, area))) {
      problems.push(...checkFile(`${area}/${file}`))
    }
  }
  return problems
}

/** The text that a hook gives to the assistant. */
export function formatProblems(problems) {
  if (problems.length === 0) return ""
  return [
    `Surface design rules: ${problems.length} problem${problems.length === 1 ? "" : "s"}. Repair ${problems.length === 1 ? "it" : "them"} now.`,
    ...problems.map((p) => `- ${p.file}:${p.line} [${p.rule}] ${p.message}`),
    "Read the component file in src/components/ui before you use it.",
    "For a necessary exception, put surface-allow in a comment on that line.",
  ].join("\n")
}
