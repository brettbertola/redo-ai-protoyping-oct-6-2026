import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { Search } from "lucide-react"
import { useBrowseState } from "../lib/browse-state"
import { resetPrototype } from "../lib/prototype-reset"
import { recordVisit } from "../lib/recents"
import { findPrototypeForPathname } from "../lib/registry"
import { useLauncherVisible, useStage } from "../lib/stage-state"
import {
  cleanVariantSearch,
  currentValueFor,
  resolveEffectiveDefaults,
  searchToRecord,
  useLocalDefaultsVersion,
  valueLabel,
} from "../lib/variants"
import { readFrameMessage, type FrameMessage } from "../stage/messages"
import { CommandPalette, type PaletteTab } from "./CommandPalette"
import {
  PrototypeContextMenu,
  shouldUseNativeContextMenu,
  type PrototypeContextMenuState,
} from "./PrototypeContextMenu"

function deviceIframe(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>(
    "[data-surface-device] iframe"
  )
}

export function Launcher() {
  const [open, setOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<PaletteTab>("prototypes")
  const [contextMenu, setContextMenu] =
    useState<PrototypeContextMenuState | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const browse = useBrowseState()
  const stage = useStage()
  const [launcherVisible] = useLauncherVisible()
  const localDefaultsVersion = useLocalDefaultsVersion()

  const openPalette = useCallback((tab: PaletteTab) => {
    setInitialTab(tab)
    setOpen(true)
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const activePrototype = useMemo(
    () => findPrototypeForPathname(location.pathname),
    [location.pathname]
  )
  const activeSchema = activePrototype?.props
  const prototypeKey = activePrototype?.path

  useEffect(() => {
    if (prototypeKey) recordVisit(prototypeKey)
  }, [prototypeKey])

  // Keep the address tidy: drop variant values that are invalid or default.
  useEffect(() => {
    if (!activeSchema || !prototypeKey) return
    const cleaned = cleanVariantSearch(
      activeSchema,
      prototypeKey,
      location.search
    )
    if (!cleaned.changed) return
    void navigate(
      { pathname: location.pathname, search: cleaned.search },
      { replace: true }
    )
  }, [
    activeSchema,
    prototypeKey,
    location.pathname,
    location.search,
    navigate,
    localDefaultsVersion,
  ])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === "b") {
        e.preventDefault()
        browse.togglePanel()
        return
      }
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault()
        openPalette(e.shiftKey ? "variants" : "prototypes")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [browse, openPalette])

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      if (shouldUseNativeContextMenu(event)) {
        setContextMenu(null)
        return
      }
      event.preventDefault()
      event.stopPropagation()
      setContextMenu({ x: event.clientX, y: event.clientY })
    }
    window.addEventListener("contextmenu", onContextMenu, true)
    return () => window.removeEventListener("contextmenu", onContextMenu, true)
  }, [])

  // Shortcuts and right-clicks that happened inside a device frame.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readFrameMessage(event)
      if (!message) return
      if (message.type === "surface:command") {
        if (message.command === "browse") browse.togglePanel()
        else
          openPalette(
            message.command === "variants" ? "variants" : "prototypes"
          )
      } else if (message.type === "surface:contextmenu") {
        const iframe = deviceIframe()
        if (!iframe) return
        const rect = iframe.getBoundingClientRect()
        const scale = iframe.offsetWidth ? rect.width / iframe.offsetWidth : 1
        setContextMenu({
          x: rect.left + message.x * scale,
          y: rect.top + message.y * scale,
        })
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [browse, openPalette])

  const onResetPrototype = useCallback(() => {
    const iframe = deviceIframe()
    if (iframe?.contentWindow) {
      const message: FrameMessage = { type: "surface:reset" }
      iframe.contentWindow.postMessage(message, window.location.origin)
      return
    }
    resetPrototype(location.pathname)
  }, [location.pathname])

  const axisStates = useMemo(() => {
    if (!activeSchema || !prototypeKey) return []
    void localDefaultsVersion
    const search = searchToRecord(location.search)
    const defaults = resolveEffectiveDefaults(activeSchema, prototypeKey)
    return Object.entries(activeSchema).map(([axis, def]) => {
      const current = currentValueFor(def, search[axis], defaults[axis])
      return {
        axis,
        def,
        current,
        isDefault: String(current) === String(defaults[axis]),
      }
    })
  }, [activeSchema, prototypeKey, location.search, localDefaultsVersion])

  return (
    <>
      {launcherVisible ? (
        <div className="group fixed right-6 bottom-6 z-50">
          <button
            type="button"
            onClick={() => openPalette("prototypes")}
            aria-label="Open command palette"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 transition hover:scale-105 hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <Search className="h-5 w-5" />
          </button>
          <div
            data-surface-launcher-card
            className="pointer-events-none absolute right-0 bottom-full mb-3 min-w-44 rounded-lg border bg-popover p-3 text-popover-foreground opacity-0 shadow-md transition group-hover:opacity-100"
          >
            {axisStates.length === 0 ? (
              <div className="flex items-center gap-2 text-xs">
                <span>Search</span>
                <kbd className="font-mono text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between text-[10px] tracking-wide text-muted-foreground">
                  <span>Variants</span>
                  <kbd className="font-mono">⌘⇧K</kbd>
                </div>
                <ul className="flex flex-col gap-1 text-xs">
                  {axisStates.map((s) => (
                    <li
                      key={s.axis}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-muted-foreground">{s.axis}</span>
                      <span
                        className={
                          s.isDefault ? "text-muted-foreground" : "font-medium"
                        }
                      >
                        {valueLabel(s.def, s.current)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      ) : null}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        initialTab={initialTab}
        stage={stage}
      />
      <PrototypeContextMenu
        state={contextMenu}
        onClose={closeContextMenu}
        onCommandMenu={() => openPalette("prototypes")}
        onVariants={() => openPalette("variants")}
        onBrowse={() => browse.openPanel()}
        onResetPrototype={onResetPrototype}
      />
    </>
  )
}
