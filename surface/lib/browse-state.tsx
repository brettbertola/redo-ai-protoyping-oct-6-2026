import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const PIN_STORAGE_KEY = "surface:browse:pinned:v1"
const EXPAND_STORAGE_KEY = "surface:browse:expanded:v1"

interface BrowseState {
  open: boolean
  pinned: boolean
  expanded: Record<string, boolean>
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setPinned: (pinned: boolean) => void
  togglePinned: () => void
  toggleExpanded: (key: string) => void
  setExpanded: (key: string, value: boolean) => void
}

const BrowseContext = createContext<BrowseState | null>(null)

function readPinned(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(PIN_STORAGE_KEY) === "1"
}

function readExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(EXPAND_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function BrowseProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinnedState] = useState(readPinned)
  const [expanded, setExpandedState] =
    useState<Record<string, boolean>>(readExpanded)

  const setPinned = useCallback((next: boolean) => {
    setPinnedState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PIN_STORAGE_KEY, next ? "1" : "0")
    }
  }, [])

  const setExpanded = useCallback((key: string, value: boolean) => {
    setExpandedState((prev) => {
      const next = { ...prev, [key]: value }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(EXPAND_STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const value = useMemo<BrowseState>(
    () => ({
      open,
      pinned,
      expanded,
      openPanel: () => setOpen(true),
      closePanel: () => setOpen(false),
      togglePanel: () => setOpen((o) => !o),
      setPinned,
      togglePinned: () => setPinned(!pinned),
      toggleExpanded: (key) => setExpanded(key, !expanded[key]),
      setExpanded,
    }),
    [open, pinned, expanded, setPinned, setExpanded]
  )

  return (
    <BrowseContext.Provider value={value}>{children}</BrowseContext.Provider>
  )
}

export function useBrowseState(): BrowseState {
  const ctx = useContext(BrowseContext)
  if (!ctx) {
    throw new Error("useBrowseState must be used within BrowseProvider")
  }
  return ctx
}
