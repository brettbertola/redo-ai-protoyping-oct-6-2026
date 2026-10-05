import type { ComponentType } from "react"
import type { ChromeDefinition, PropSchema, PrototypeConfig } from "../config"

// Only the small config files load up front. Screens, sub-pages and
// component variants are separate chunks fetched when first opened.
const configModules = import.meta.glob<{ default: PrototypeConfig }>(
  "/prototypes/**/prototype.config.ts",
  { eager: true }
)
const screenLoaders = import.meta.glob<{ default: ComponentType }>(
  "/prototypes/**/prototype.tsx"
)
const pageLoaders = import.meta.glob<{ default: ComponentType }>(
  "/prototypes/**/pages/*.tsx"
)
const variantLoaders = import.meta.glob<{ default: ComponentType }>(
  "/prototypes/**/variants/*/*.tsx"
)
const chromeLoaders = import.meta.glob<{ default: ChromeDefinition }>(
  "/chromes/*/chrome.tsx"
)

type Loader = () => Promise<{ default: ComponentType }>

export interface PrototypePage {
  /** Route segment: "detail", or ":id" for a [id].tsx file. */
  segment: string
  load: Loader
}

export interface PrototypeEntry {
  path: string
  segments: string[]
  category: string
  title: string
  breadcrumb: string
  description?: string
  config: PrototypeConfig
  props?: PropSchema
  load?: Loader
  pages: PrototypePage[]
}

function titleize(segment: string): string {
  return segment
    .split("-")
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ")
}

export function segmentLabel(segment: string): string {
  return titleize(segment)
}

export function normalizePrototypePath(path: string): string {
  if (!path || path === "/") return "/"
  return path.replace(/\/+$/, "") || "/"
}

function fileStem(file: string): string {
  return (file.split("/").pop() ?? file).replace(/\.[^.]+$/, "")
}

function hydrateComponentAxes(dir: string, schema: PropSchema) {
  for (const [axis, def] of Object.entries(schema)) {
    if (def.kind !== "component") continue
    const prefix = `${dir}/variants/${axis}/`
    const loaders: Record<string, Loader> = {}
    for (const [file, load] of Object.entries(variantLoaders)) {
      if (!file.startsWith(prefix)) continue
      const key = fileStem(file)
      if (key.startsWith("_")) continue
      loaders[key] = load
    }
    def.loaders = loaders
    def.keys = Object.keys(loaders).sort()
    if (!def.keys.includes(def.default)) {
      if (def.default) {
        console.warn(
          `[surface] ${dir}: default "${def.default}" for "${axis}" has no file in variants/${axis}/`
        )
      }
      def.default = def.keys[0] ?? ""
    }
  }
}

function buildEntries(): PrototypeEntry[] {
  const entries: PrototypeEntry[] = []
  for (const [file, mod] of Object.entries(configModules)) {
    const dir = file.replace(/\/prototype\.config\.ts$/, "")
    const path = dir.replace(/^\/prototypes/, "")
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) continue
    const config = mod.default
    if (!config) {
      console.warn(`[surface] ${file} has no default export; skipping`)
      continue
    }
    const schema = config.variants ?? {}
    hydrateComponentAxes(dir, schema)

    const pagePrefix = `${dir}/pages/`
    const pages: PrototypePage[] = []
    for (const [pageFile, load] of Object.entries(pageLoaders)) {
      if (!pageFile.startsWith(pagePrefix)) continue
      const stem = fileStem(pageFile)
      if (stem.startsWith("_")) continue
      const param = /^\[(.+)\]$/.exec(stem)
      pages.push({ segment: param ? `:${param[1]}` : stem, load })
    }

    const labels = segments.map(segmentLabel)
    const title = config.title ?? labels[labels.length - 1]
    entries.push({
      path,
      segments,
      category: labels.slice(0, -1).join(" / ") || "General",
      title,
      breadcrumb: [...labels.slice(0, -1), title].join(" › "),
      description: config.description,
      config,
      props: Object.keys(schema).length > 0 ? schema : undefined,
      load: screenLoaders[`${dir}/prototype.tsx`],
      pages,
    })
  }
  entries.sort((a, b) => a.breadcrumb.localeCompare(b.breadcrumb))
  return entries
}

export const prototypes: PrototypeEntry[] = buildEntries()

const byPath = new Map(prototypes.map((entry) => [entry.path, entry]))

/** The prototype that owns a URL, including its sub-pages. */
export function findPrototypeForPathname(
  pathname: string
): PrototypeEntry | undefined {
  const normalized = normalizePrototypePath(pathname)
  const exact = byPath.get(normalized)
  if (exact) return exact
  const parent = normalized.slice(0, normalized.lastIndexOf("/"))
  const owner = byPath.get(parent)
  if (owner && owner.pages.length > 0) return owner
  return undefined
}

/** Where variant defaults are stored: always the prototype, not the sub-page. */
export function prototypeKeyForPathname(pathname: string): string {
  return (
    findPrototypeForPathname(pathname)?.path ?? normalizePrototypePath(pathname)
  )
}

const preloaded = new Set<string>()

export function preloadPrototype(path: string) {
  if (preloaded.has(path)) return
  preloaded.add(path)
  void byPath
    .get(path)
    ?.load?.()
    .catch(() => preloaded.delete(path))
}

export interface ChromeEntry {
  name: string
  load: () => Promise<{ default: ChromeDefinition }>
}

export const chromes: ChromeEntry[] = Object.entries(chromeLoaders)
  .map(([file, load]) => ({
    name: file.replace(/^\/chromes\//, "").replace(/\/chrome\.tsx$/, ""),
    load,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function findChrome(name: string): ChromeEntry | undefined {
  return chromes.find((chrome) => chrome.name === name)
}
