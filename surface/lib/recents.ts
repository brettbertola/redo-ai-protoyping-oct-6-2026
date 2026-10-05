import { useEffect, useState } from "react"

const STORAGE_KEY = "surface:recents:v1"
const MAX_ENTRIES = 50

interface RecentEntry {
  path: string
  visitedAt: number
}

function readStorage(): RecentEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as RecentEntry).path === "string" &&
        typeof (e as RecentEntry).visitedAt === "number"
    )
  } catch {
    return []
  }
}

function writeStorage(entries: RecentEntry[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Local storage quota is optional for recent navigation.
  }
}

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function recordVisit(path: string) {
  if (!path || path === "/") return
  const existing = readStorage().filter((e) => e.path !== path)
  const next = [{ path, visitedAt: Date.now() }, ...existing].slice(
    0,
    MAX_ENTRIES
  )
  writeStorage(next)
  emit()
}

export function useRecents(): RecentEntry[] {
  const [entries, setEntries] = useState<RecentEntry[]>(() => readStorage())
  useEffect(() => {
    const listener = () => setEntries(readStorage())
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) listener()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", onStorage)
    }
  }, [])
  return entries
}
