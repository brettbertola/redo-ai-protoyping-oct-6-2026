import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ROOT, runBin, stop } from "../lib/util.mjs"

const PRESET = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/

/**
 * Pulls the preset code out of whatever was copied from the shadcn theme
 * builder. The pasted text itself is never run.
 */
export function extractPreset(text) {
  const input = String(text ?? "").trim()
  const flag = /--preset(?:=|\s+)["']?([^\s"']+)/.exec(input)
  const candidate = flag ? flag[1] : input
  return PRESET.test(candidate) ? candidate : null
}

// Re-theming leaves the previous theme's font import behind; drop any font
// the theme no longer uses so the stylesheet only loads what it needs.
function removeUnusedFontImports() {
  const file = join(ROOT, "src", "theme.css")
  if (!existsSync(file)) return
  const css = readFileSync(file, "utf8")
  const families = [...css.matchAll(/--font-[\w-]+:\s*([^;]+);/g)]
    .map((match) => match[1].toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join(" ")
  const cleaned = css.replace(
    /^@import "@fontsource(?:-variable)?\/([\w-]+)";\n/gm,
    (line, font) => (families.includes(font.replace(/-/g, "")) ? line : "")
  )
  if (cleaned !== css) writeFileSync(file, cleaned)
}

function tail(text, lines = 20) {
  return text.split("\n").slice(-lines).join("\n")
}

async function apply(args) {
  const pasted =
    args._.slice(1).join(" ") ||
    (typeof args.preset === "string" ? `--preset ${args.preset}` : "")
  const preset = extractPreset(pasted)
  if (!preset) {
    stop(
      "This text is not a theme command. Copy the command from the shadcn theme builder. Example: npx shadcn@latest apply --preset abc123",
      { received: pasted.slice(0, 200) }
    )
  }

  // Reject anything that is not a real theme-builder code before running it.
  const { isPresetCode } = await import("shadcn/preset")
  if (!isPresetCode(preset)) {
    stop(
      `"${preset}" is not a theme code. Copy the command again from https://ui.shadcn.com/create`
    )
  }

  const applied = runBin("shadcn", ["apply", "--preset", preset, "--yes"])
  if (!applied.ok) {
    stop(`I cannot apply the theme "${preset}".`, {
      output: tail(applied.stdout + "\n" + applied.stderr),
    })
  }

  // Bring in every component, rebuilt in the chosen style.
  const added = runBin("shadcn", ["add", "--all", "--overwrite", "--yes"])
  if (!added.ok) {
    stop(
      "I applied the theme. But the installation of the components failed.",
      {
        output: tail(added.stdout + "\n" + added.stderr),
      }
    )
  }

  removeUnusedFontImports()

  const uiDir = join(ROOT, "src", "components", "ui")
  const components = existsSync(uiDir) ? readdirSync(uiDir).length : 0
  return {
    summary: `I applied the theme "${preset}" and installed ${components} components.`,
    preset,
    components,
    next: "Run `npm run surface -- check`. Then start the preview again with the surface-start skill.",
  }
}

export async function run(args) {
  const action = args._[0]
  if (action === "apply") return apply(args)
  stop(
    `"${action}" is not a theme command. Use: theme apply "<the command from the theme builder>"`
  )
}
