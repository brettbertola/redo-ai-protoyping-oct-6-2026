import { lazy, useEffect, useState, type ComponentType } from "react"
import { useLocation } from "react-router"
import type { InferProps, PropDef, PropSchema } from "../config"
import { prototypeKeyForPathname } from "./registry"
import {
  getLocalDefaults,
  subscribeLocalVariantDefaults,
  type LocalDefaultMap,
} from "./variant-defaults"

export type {
  BoolPropDef,
  ComponentPropDef,
  EnumPropDef,
  FixturePropDef,
  InferProps,
  PropDef,
  PropSchema,
} from "../config"

/** URL parameters the shell owns; never treated as variant axes. */
export const CHROME_PARAM = "_chrome"
export const DEVICE_PARAM = "_device"
export const BARE_PARAM = "_bare"

export function coerceBool(raw: unknown): boolean | undefined {
  if (raw === true || raw === "true") return true
  if (raw === false || raw === "false") return false
  return undefined
}

function isValidForDef(def: PropDef, value: string | boolean): boolean {
  if (def.kind === "bool") return typeof value === "boolean"
  if (typeof value !== "string") return false
  if (def.kind === "enum") return def.values.includes(value)
  return def.keys.includes(value)
}

export function resolveSchemaDefaults(schema: PropSchema): LocalDefaultMap {
  const out: LocalDefaultMap = {}
  for (const [axis, def] of Object.entries(schema)) {
    out[axis] = def.default
  }
  return out
}

/** Schema defaults overlaid with the defaults this person saved locally. */
export function resolveEffectiveDefaults(
  schema: PropSchema,
  prototypeKey?: string | null
): LocalDefaultMap {
  const out = resolveSchemaDefaults(schema)
  if (!prototypeKey) return out
  const local = getLocalDefaults(prototypeKey)
  for (const [axis, value] of Object.entries(local)) {
    const def = schema[axis]
    if (!def) continue
    if (!isValidForDef(def, value)) continue
    out[axis] = value
  }
  return out
}

export function searchToRecord(search: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(search))
}

/**
 * Removes variant parameters that are invalid or equal to the default, so a
 * URL only ever carries what differs. Parameters that are not variant axes are
 * left alone; a prototype may use its own.
 */
export function cleanVariantSearch(
  schema: PropSchema,
  prototypeKey: string,
  search: string
): { search: string; changed: boolean } {
  const defaults = resolveEffectiveDefaults(schema, prototypeKey)
  const params = new URLSearchParams(search)
  let changed = false
  for (const [axis, def] of Object.entries(schema)) {
    const raw = params.get(axis)
    if (raw === null) continue
    const value = def.kind === "bool" ? coerceBool(raw) : raw
    if (value === undefined || !isValidForDef(def, value)) {
      console.warn(
        `[variants] unknown value for ${axis}: ${raw}; using default`
      )
      params.delete(axis)
      changed = true
    } else if (value === defaults[axis]) {
      params.delete(axis)
      changed = true
    }
  }
  const next = params.toString()
  return { search: next ? `?${next}` : "", changed }
}

/** Builds the search string for a set of variant values, omitting defaults. */
export function buildVariantSearch(
  schema: PropSchema,
  prototypeKey: string,
  values: Record<string, string | boolean>,
  currentSearch: string,
  defaultsOverride?: LocalDefaultMap
): string {
  const defaults =
    defaultsOverride ?? resolveEffectiveDefaults(schema, prototypeKey)
  const params = new URLSearchParams(currentSearch)
  for (const axis of Object.keys(schema)) {
    const value = values[axis]
    if (value === undefined || String(value) === String(defaults[axis])) {
      params.delete(axis)
    } else {
      params.set(axis, String(value))
    }
  }
  const next = params.toString()
  return next ? `?${next}` : ""
}

export function currentValueFor(
  def: PropDef,
  raw: unknown,
  fallbackDefault: string | boolean = def.default
): string | boolean {
  if (def.kind === "bool") {
    const b = coerceBool(raw)
    if (b !== undefined) return b
    return typeof fallbackDefault === "boolean" ? fallbackDefault : def.default
  }
  if (typeof raw === "string" && isValidForDef(def, raw)) return raw
  return fallbackDefault
}

export function valueLabel(def: PropDef, value: unknown): string {
  if (def.kind === "bool") return value ? "true" : "false"
  return String(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>
type AnyLoader = () => Promise<{ default: AnyComponent }>
const lazyComponents = new Map<AnyLoader, AnyComponent>()

function Missing() {
  return null
}

function lazyFor(loader: AnyLoader | undefined): AnyComponent {
  if (!loader) return Missing
  let component = lazyComponents.get(loader)
  if (!component) {
    component = lazy(loader)
    lazyComponents.set(loader, component)
  }
  return component
}

export function resolvePropValue(
  def: PropDef,
  raw: unknown,
  fallbackDefault: string | boolean = def.default
): unknown {
  const value = currentValueFor(def, raw, fallbackDefault)
  if (def.kind === "fixture") return def.fixtures[String(value)]?.()
  if (def.kind === "component") {
    return lazyFor(def.loaders[String(value)] as AnyLoader | undefined)
  }
  return value
}

export function useLocalDefaultsVersion(): number {
  const [version, setVersion] = useState(0)
  useEffect(
    () => subscribeLocalVariantDefaults(() => setVersion((n) => n + 1)),
    []
  )
  return version
}

/**
 * Reads the active variant values for the current prototype.
 *
 *   const { density, hero: Hero } = usePrototypeProps(config)
 */
export function usePrototypeProps<S extends PropSchema>(
  config: { variants: S } | S
): InferProps<S> {
  const schema = (
    "variants" in config && !("kind" in (config.variants as object))
      ? config.variants
      : config
  ) as S
  const location = useLocation()
  useLocalDefaultsVersion()
  const search = searchToRecord(location.search)
  const defaults = resolveEffectiveDefaults(
    schema,
    prototypeKeyForPathname(location.pathname)
  )
  const resolved: Record<string, unknown> = {}
  for (const [axis, def] of Object.entries(schema)) {
    resolved[axis] = resolvePropValue(def, search[axis], defaults[axis])
  }
  return resolved as InferProps<S>
}
