import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"
import { loadConfig } from "../lib/config-ast.mjs"
import {
  PROTOTYPES_DIR,
  describeAxes,
  findMentions,
  listChromes,
  listPrototypeIds,
  parsePrototypeId,
  pruneEmptyDirs,
  resolvePrototype,
} from "../lib/project.mjs"
import { ROOT, pascalCase, stop, titleize, walk } from "../lib/util.mjs"

function configSource({ description, chrome, device }) {
  const lines = []
  if (description) lines.push(`  description: ${JSON.stringify(description)},`)
  if (chrome) lines.push(`  chrome: ${JSON.stringify(chrome)},`)
  if (device) lines.push(`  device: ${JSON.stringify(device)},`)
  return `import { definePrototype } from "@surface"

export default definePrototype({
${lines.join("\n")}${lines.length ? "\n" : ""}  // Alternatives you can switch between with ⌘⇧K.
  variants: {},
})
`
}

function screenSource(name) {
  return `import { usePrototypeProps } from "@surface"
import config from "./prototype.config"

export default function ${pascalCase(name)}() {
  // Variant values, e.g. const { layout } = usePrototypeProps(config)
  usePrototypeProps(config)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="font-heading text-2xl font-semibold">${titleize(name)}</h1>
      <p className="text-sm text-muted-foreground">
        A new prototype. Replace this with your design.
      </p>
    </main>
  )
}
`
}

function create(args) {
  const prototype = parsePrototypeId(args._[1])
  if (existsSync(prototype.dir)) {
    stop(`The prototype ${prototype.id} already exists.`)
  }
  if (
    args.chrome &&
    args.chrome !== "none" &&
    !listChromes().includes(args.chrome)
  ) {
    stop(`The chrome "${args.chrome}" does not exist.`, {
      chromes: listChromes(),
    })
  }
  mkdirSync(prototype.dir, { recursive: true })
  writeFileSync(
    join(prototype.dir, "prototype.config.ts"),
    configSource({
      description: typeof args.description === "string" ? args.description : "",
      chrome: typeof args.chrome === "string" ? args.chrome : "",
      device: typeof args.device === "string" ? args.device : "",
    })
  )
  writeFileSync(
    join(prototype.dir, "prototype.tsx"),
    screenSource(prototype.name)
  )
  return {
    summary: `I made the prototype ${prototype.id}.`,
    id: prototype.id,
    url: prototype.url,
    files: [
      `prototypes/${prototype.id}/prototype.tsx`,
      `prototypes/${prototype.id}/prototype.config.ts`,
    ],
  }
}

function rename(args) {
  const from = resolvePrototype(args._[1])
  const to = parsePrototypeId(args._[2])
  if (existsSync(to.dir)) stop(`The prototype ${to.id} already exists.`)
  mkdirSync(dirname(to.dir), { recursive: true })
  renameSync(from.dir, to.dir)
  pruneEmptyDirs(dirname(from.dir), PROTOTYPES_DIR)

  // Links written inside the prototype point at its old address.
  let rewritten = 0
  for (const file of walk(to.dir)) {
    if (!/\.tsx?$/.test(file)) continue
    const full = join(to.dir, file)
    const before = readFileSync(full, "utf8")
    const after = before.split(from.url).join(to.url)
    if (after !== before) {
      writeFileSync(full, after)
      rewritten++
    }
  }
  return {
    summary: `I renamed ${from.id} to ${to.id}.`,
    id: to.id,
    url: to.url,
    linksUpdatedInFiles: rewritten,
    stillMentionedIn: findMentions(ROOT + "/prototypes", from.url),
  }
}

function remove(args) {
  const prototype = resolvePrototype(args._[1])
  const files = walk(prototype.dir).map(
    (f) => `prototypes/${prototype.id}/${f}`
  )
  if (!args.yes) {
    return {
      summary: `This command deletes ${prototype.id} (${files.length} files). It did not delete now. Get approval from the designer. Then run it again with --yes.`,
      confirm: true,
      id: prototype.id,
      files,
    }
  }
  rmSync(prototype.dir, { recursive: true, force: true })
  pruneEmptyDirs(dirname(prototype.dir), PROTOTYPES_DIR)
  return {
    summary: `I deleted the prototype ${prototype.id}.`,
    id: prototype.id,
    deleted: files,
  }
}

function list() {
  const prototypes = listPrototypeIds().map((id) => {
    const prototype = resolvePrototype(id)
    let axes = []
    try {
      axes = describeAxes(prototype)
    } catch {
      // A hand-edited config we cannot read still gets listed.
    }
    const text = loadTextSafe(prototype.configFile)
    return {
      id,
      url: prototype.url,
      chrome: /chrome:\s*["']([^"']+)["']/.exec(text)?.[1] ?? null,
      device: /device:\s*["']([^"']+)["']/.exec(text)?.[1] ?? null,
      variants: axes,
    }
  })
  return {
    summary: `${prototypes.length} prototype${prototypes.length === 1 ? "" : "s"}.`,
    prototypes,
    categories: [
      ...new Set(prototypes.map((p) => p.id.split("/").slice(0, -1).join("/"))),
    ],
    chromes: listChromes(),
  }
}

function loadTextSafe(file) {
  try {
    return loadConfig(file).text
  } catch {
    return ""
  }
}

export async function run(args) {
  const action = args._[0]
  if (action === "new") return create(args)
  if (action === "rename") return rename(args)
  if (action === "delete") return remove(args)
  if (action === "list" || action === undefined) return list()
  stop(
    `"${action}" is not a prototype command. Use new, rename, delete or list.`
  )
}
