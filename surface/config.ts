// Everything a prototype.config.ts, chrome.tsx or surface.config.ts needs.
// Config files are loaded up front for every prototype, so this module must
// stay free of runtime React and heavy imports.
import type { ComponentType, ReactNode } from "react"

export interface EnumPropDef<V extends string = string> {
  kind: "enum"
  values: readonly V[]
  default: V
}

export interface BoolPropDef {
  kind: "bool"
  default: boolean
}

export interface FixturePropDef<T = unknown> {
  kind: "fixture"
  fixtures: Record<string, () => T>
  keys: string[]
  default: string
}

// `keys` and `loaders` are filled in by the registry from the files in
// variants/<axis>/, so adding a file is all it takes to add a value.
export interface ComponentPropDef<P = object> {
  kind: "component"
  keys: string[]
  loaders: Record<string, () => Promise<{ default: ComponentType<P> }>>
  default: string
}

export type PropDef =
  | EnumPropDef
  | BoolPropDef
  | FixturePropDef<unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ComponentPropDef<any>

export type PropSchema = Record<string, PropDef>

export function enumProp<const V extends readonly string[]>(
  values: V,
  opts: { default: V[number] }
): EnumPropDef<V[number]> {
  return { kind: "enum", values, default: opts.default }
}

export function boolProp(opts: { default: boolean }): BoolPropDef {
  return { kind: "bool", default: opts.default }
}

export function fixtureProp<T>(
  fixtures: Record<string, () => T>,
  opts: { default: string }
): FixturePropDef<T> {
  return {
    kind: "fixture",
    fixtures,
    keys: Object.keys(fixtures),
    default: opts.default,
  }
}

export function componentProp<P = object>(opts?: {
  default?: string
}): ComponentPropDef<P> {
  return {
    kind: "component",
    keys: [],
    loaders: {},
    default: opts?.default ?? "",
  }
}

export function defineProps<S extends PropSchema>(schema: S): S {
  return schema
}

type ResolvedValueFor<D extends PropDef> =
  D extends EnumPropDef<infer V>
    ? V
    : D extends BoolPropDef
      ? boolean
      : D extends FixturePropDef<infer T>
        ? T
        : D extends ComponentPropDef<infer P>
          ? ComponentType<P>
          : never

export type InferProps<S extends PropSchema> = {
  [K in keyof S]: ResolvedValueFor<S[K]>
}

export interface PrototypeConfig<S extends PropSchema = PropSchema> {
  title?: string
  description?: string
  /** Name of a folder in chromes/, or "none". */
  chrome?: string
  /** A device id from surface/lib/devices.ts, e.g. "phone". */
  device?: string
  variants: S
}

export function definePrototype<S extends PropSchema>(
  config: Partial<PrototypeConfig<S>> & { variants?: S }
): PrototypeConfig<S> {
  return { ...config, variants: config.variants ?? ({} as S) }
}

export interface ChromeToggleDef {
  label: string
  default: boolean
}

export interface ChromeLayoutProps {
  children: ReactNode
  toggles: Record<string, boolean>
  setToggle: (name: string, value: boolean) => void
  /** Content a prototype injected with useChromeSlot(name, node). */
  slots: Record<string, ReactNode>
}

export interface ChromeDefinition {
  label: string
  description?: string
  toggles?: Record<string, ChromeToggleDef>
  Layout: ComponentType<ChromeLayoutProps>
}

export function defineChrome(chrome: ChromeDefinition): ChromeDefinition {
  return chrome
}

export interface SurfaceConfig {
  name: string
  /** Chrome used when a prototype does not pick one. */
  defaultChrome: string
  /** Device used when a prototype does not pick one. */
  defaultDevice: string
  /** Lucide icon per top-level category folder, shown in the browse panel. */
  categoryIcons?: Record<string, ComponentType<{ className?: string }>>
}

export function defineSurface(config: Partial<SurfaceConfig>): SurfaceConfig {
  return {
    name: config.name ?? "Surface",
    defaultChrome: config.defaultChrome ?? "none",
    defaultDevice: config.defaultDevice ?? "responsive",
    categoryIcons: config.categoryIcons,
  }
}
