import { useSyncExternalStore } from "react"

// A small JSON value in localStorage that React can subscribe to. Changes
// reach other tabs and device-frame iframes through the storage event.
export interface Store<T> {
  get: () => T
  set: (next: T) => void
  update: (fn: (current: T) => T) => void
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(key: string, fallback: T): Store<T> {
  const listeners = new Set<() => void>()
  let cachedRaw: string | null | undefined
  let cached: T = fallback

  function read(): T {
    let raw: string | null
    try {
      raw = window.localStorage.getItem(key)
    } catch {
      return cached
    }
    if (raw === cachedRaw) return cached
    cachedRaw = raw
    try {
      cached = raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      cached = fallback
    }
    return cached
  }

  function emit() {
    for (const listener of listeners) listener()
  }

  function set(next: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Storage can be full or blocked; the preview still works without it.
      cachedRaw = undefined
      cached = next
    }
    emit()
  }

  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) emit()
  })

  return {
    get: read,
    set,
    update: (fn) => set(fn(read())),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}
