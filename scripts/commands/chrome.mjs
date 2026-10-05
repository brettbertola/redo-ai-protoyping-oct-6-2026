import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { CHROMES_DIR, PROTOTYPES_DIR, listChromes } from "../lib/project.mjs"
import { ROOT, assertName, stop, titleize, walk } from "../lib/util.mjs"

function chromeSource(name) {
  return `import { defineChrome } from "@surface"

// The frame around a prototype: navigation, headers, side panels.
export default defineChrome({
  label: ${JSON.stringify(titleize(name))},
  // Switches that show up in the ⌘K menu, e.g.
  //   sidebarCollapsed: { label: "Collapsed sidebar", default: false },
  toggles: {},
  Layout({ children }) {
    return (
      <div className="flex h-dvh w-full flex-col bg-background text-foreground">
        <header className="flex h-12 shrink-0 items-center border-b px-4 text-sm font-medium">
          ${titleize(name)}
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    )
  },
})
`
}

function usedBy(name) {
  const users = []
  const pattern = new RegExp(`chrome:\\s*["']${name}["']`)
  for (const file of walk(PROTOTYPES_DIR)) {
    if (!file.endsWith("prototype.config.ts")) continue
    if (pattern.test(readFileSync(join(PROTOTYPES_DIR, file), "utf8"))) {
      users.push(file.replace(/\/prototype\.config\.ts$/, ""))
    }
  }
  const surfaceConfig = readFileSync(join(ROOT, "surface.config.ts"), "utf8")
  const isDefault = new RegExp(`defaultChrome:\\s*["']${name}["']`).test(
    surfaceConfig
  )
  return { users, isDefault }
}

export async function run(args) {
  const action = args._[0]
  if (action === "list" || action === undefined) {
    const chromes = listChromes()
    return {
      summary: `${chromes.length} chrome${chromes.length === 1 ? "" : "s"}.`,
      chromes: chromes.map((name) => ({ name, ...usedBy(name) })),
    }
  }

  const name = assertName(args._[1], "chrome name")
  if (name === "none")
    stop(`You cannot use the name "none". It means no chrome.`)
  const dir = join(CHROMES_DIR, name)

  if (action === "new") {
    if (existsSync(dir)) stop(`A chrome called "${name}" already exists.`)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "chrome.tsx"), chromeSource(name))
    return {
      summary: `I made the chrome ${name}.`,
      name,
      files: [`chromes/${name}/chrome.tsx`],
      use: `Set chrome: "${name}" in a prototype.config.ts, or defaultChrome in surface.config.ts.`,
    }
  }

  if (action === "delete") {
    if (!existsSync(dir))
      stop(`The chrome "${name}" does not exist.`, { chromes: listChromes() })
    const usage = usedBy(name)
    const files = walk(dir).map((f) => `chromes/${name}/${f}`)
    if (!args.yes) {
      return {
        summary: `This command deletes the chrome ${name} (${files.length} files). It did not delete now. Get approval from the designer. Then run it again with --yes.`,
        confirm: true,
        name,
        files,
        ...usage,
      }
    }
    rmSync(dir, { recursive: true, force: true })
    return {
      summary: `I deleted the chrome ${name}.`,
      name,
      deleted: files,
      // These now fall back to the project default until they are edited.
      prototypesStillPointingAtIt: usage.users,
      wasProjectDefault: usage.isDefault,
    }
  }

  stop(`"${action}" is not a chrome command. Use new, delete or list.`)
}
