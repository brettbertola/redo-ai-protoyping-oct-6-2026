const STORAGE_KEY = "surface:variant-defaults:v1"

export type LocalDefaultMap = Record<string, string | boolean>
type Store = Record<string, LocalDefaultMap>

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeLocalVariantDefaults(
  listener: () => void
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }
    const out: Store = {}
    for (const [path, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue
      const map: LocalDefaultMap = {}
      for (const [axis, axisValue] of Object.entries(value)) {
        if (typeof axisValue === "string" || typeof axisValue === "boolean") {
          map[axis] = axisValue
        }
      }
      if (Object.keys(map).length > 0) out[path] = map
    }
    return out
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Local storage quota is optional for prototype defaults.
  }
  emit()
}

export function getLocalDefaults(pathname: string): LocalDefaultMap {
  if (!pathname) return {}
  return readStore()[pathname] ?? {}
}

export function setLocalDefaults(
  pathname: string,
  values: LocalDefaultMap,
  schemaDefaults: LocalDefaultMap
) {
  if (!pathname) return
  const next: LocalDefaultMap = {}
  for (const [axis, value] of Object.entries(values)) {
    if (String(value) === String(schemaDefaults[axis])) continue
    next[axis] = value
  }
  const store = readStore()
  if (Object.keys(next).length === 0) {
    delete store[pathname]
  } else {
    store[pathname] = next
  }
  writeStore(store)
}

export function setLocalDefault(
  pathname: string,
  axis: string,
  value: string | boolean,
  schemaDefaults: LocalDefaultMap,
  currentEffective: LocalDefaultMap
) {
  setLocalDefaults(
    pathname,
    { ...currentEffective, [axis]: value },
    schemaDefaults
  )
}
