import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useLocation, useNavigate } from "react-router"
import Fuse from "fuse.js"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import surfaceConfig from "../../surface.config"
import { useBrowseState } from "../lib/browse-state"
import { DEVICES } from "../lib/devices"
import { useRecents } from "../lib/recents"
import {
  chromes,
  findPrototypeForPathname,
  preloadPrototype,
  prototypes,
  type PrototypeEntry,
} from "../lib/registry"
import {
  shareableUrl,
  useChromeDefinition,
  useChromeToggles,
  useLauncherVisible,
  type StageState,
} from "../lib/stage-state"
import {
  clearLocalDefaults,
  hasLocalDefaults,
  setLocalDefault,
  setLocalDefaults,
} from "../lib/variant-defaults"
import {
  buildVariantSearch,
  currentValueFor,
  resolveEffectiveDefaults,
  resolveSchemaDefaults,
  searchToRecord,
  useLocalDefaultsVersion,
  valueLabel,
  type PropDef,
} from "../lib/variants"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"

const RECENTS_LIMIT = 8

export type PaletteTab = "prototypes" | "variants"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: PaletteTab
  stage: StageState
}

interface VariantRow {
  axis: string
  value: string | boolean
  valueKey: string
  label: string
  isCurrent: boolean
  isDefault: boolean
}

interface StageCommand {
  id: string
  group: "Chrome" | "Device" | "Surface"
  label: string
  detail: string
  keywords: string
  action: () => void
}

function titleize(name: string): string {
  return name
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

function axisRows(
  axis: string,
  def: PropDef,
  current: unknown,
  effectiveDefault: string | boolean
): VariantRow[] {
  const currentKey = String(currentValueFor(def, current, effectiveDefault))

  const rows: VariantRow[] = []
  const make = (value: string | boolean) => {
    const key = String(value)
    rows.push({
      axis,
      value,
      valueKey: key,
      label: `${axis} = ${key}`,
      isCurrent: key === currentKey,
      isDefault: key === String(effectiveDefault),
    })
  }
  if (def.kind === "bool") {
    make(true)
    make(false)
  } else if (def.kind === "enum") {
    for (const v of def.values) make(v)
  } else {
    for (const k of def.keys) make(k)
  }
  return rows
}

export function CommandPalette({
  open,
  onOpenChange,
  initialTab = "prototypes",
  stage,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const browse = useBrowseState()
  const recents = useRecents()
  const [launcherVisible, setLauncherVisible] = useLauncherVisible()
  const chromeDefinition = useChromeDefinition(stage.chromeName)
  const { toggles, setToggle } = useChromeToggles(
    stage.chromeName,
    chromeDefinition
  )
  const localDefaultsVersion = useLocalDefaultsVersion()
  const currentSearch = useMemo(
    () => searchToRecord(location.search),
    [location.search]
  )
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<PaletteTab>(initialTab)
  const [selected, setSelected] = useState("")
  const [tabSync, setTabSync] = useState({ open, initialTab })
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  if (open !== tabSync.open || initialTab !== tabSync.initialTab) {
    setTabSync({ open, initialTab })
    if (open) setTab(initialTab)
  }
  if (!open && query !== "") setQuery("")

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open, tab])

  const activePrototype = useMemo(
    () => findPrototypeForPathname(location.pathname),
    [location.pathname]
  )
  const prototypeKey = activePrototype?.path ?? ""

  const effectiveDefaults = useMemo(() => {
    void localDefaultsVersion
    if (!activePrototype?.props) return {}
    return resolveEffectiveDefaults(activePrototype.props, prototypeKey)
  }, [activePrototype, prototypeKey, localDefaultsVersion])

  const schemaDefaults = useMemo(() => {
    if (!activePrototype?.props) return {}
    return resolveSchemaDefaults(activePrototype.props)
  }, [activePrototype])

  const pathHasLocalDefaults = useMemo(() => {
    void localDefaultsVersion
    return hasLocalDefaults(prototypeKey)
  }, [prototypeKey, localDefaultsVersion])

  const protoFuse = useMemo(
    () =>
      new Fuse(prototypes, {
        keys: [
          { name: "title", weight: 2 },
          { name: "breadcrumb", weight: 1 },
          { name: "path", weight: 0.5 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    []
  )

  const recentEntries = useMemo<PrototypeEntry[]>(() => {
    const byPath = new Map(prototypes.map((p) => [p.path, p]))
    const out: PrototypeEntry[] = []
    for (const r of recents) {
      const entry = byPath.get(r.path)
      if (entry) out.push(entry)
      if (out.length >= RECENTS_LIMIT) break
    }
    return out
  }, [recents])

  const protoSearchResults = useMemo<PrototypeEntry[]>(
    () => (query.trim() ? protoFuse.search(query).map((r) => r.item) : []),
    [protoFuse, query]
  )

  const protoGrouped = useMemo<[string, PrototypeEntry[]][]>(() => {
    if (!query.trim()) {
      return recentEntries.length > 0 ? [["Recent", recentEntries]] : []
    }
    const map = new Map<string, PrototypeEntry[]>()
    for (const entry of protoSearchResults) {
      const list = map.get(entry.category) ?? []
      list.push(entry)
      map.set(entry.category, list)
    }
    return Array.from(map.entries())
  }, [query, recentEntries, protoSearchResults])

  const variantRows = useMemo<VariantRow[]>(() => {
    const schema = activePrototype?.props
    if (!schema) return []
    const rows: VariantRow[] = []
    for (const [axis, def] of Object.entries(schema)) {
      rows.push(
        ...axisRows(
          axis,
          def,
          currentSearch[axis],
          effectiveDefaults[axis] ?? def.default
        )
      )
    }
    return rows
  }, [activePrototype, currentSearch, effectiveDefaults])

  const variantFuse = useMemo(
    () =>
      new Fuse(variantRows, {
        keys: [
          { name: "axis", weight: 1 },
          { name: "label", weight: 2 },
          { name: "valueKey", weight: 2 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [variantRows]
  )

  const variantResults = useMemo<VariantRow[]>(() => {
    if (!query.trim()) return variantRows
    return variantFuse.search(query).map((r) => r.item)
  }, [variantFuse, variantRows, query])

  const variantGrouped = useMemo(() => {
    const map = new Map<string, VariantRow[]>()
    for (const row of variantResults) {
      const list = map.get(row.axis) ?? []
      list.push(row)
      map.set(row.axis, list)
    }
    return Array.from(map.entries())
  }, [variantResults])

  const stageCommands = useMemo<StageCommand[]>(() => {
    const commands: StageCommand[] = []
    const tags = (current: boolean, isDefault: boolean) =>
      [current ? "current" : "", isDefault ? "default" : ""]
        .filter(Boolean)
        .join(" · ")
    if (stage.prototypeKey) {
      for (const name of ["none", ...chromes.map((c) => c.name)]) {
        commands.push({
          id: `chrome-${name}`,
          group: "Chrome",
          label: name === "none" ? "No chrome" : titleize(name),
          detail: tags(
            name === stage.chromeName,
            name === stage.configChromeName
          ),
          keywords: `chrome frame shell navigation ${name}`,
          action: () => stage.setChrome(name),
        })
      }
      for (const [toggle, def] of Object.entries(
        chromeDefinition?.toggles ?? {}
      )) {
        commands.push({
          id: `toggle-${toggle}`,
          group: "Chrome",
          label: `Toggle ${def.label.toLowerCase()}`,
          detail: toggles[toggle] ? "on" : "off",
          keywords: `chrome toggle ${toggle}`,
          action: () => setToggle(toggle, !toggles[toggle]),
        })
      }
      for (const device of DEVICES) {
        commands.push({
          id: `device-${device.id}`,
          group: "Device",
          label: device.label,
          detail: [
            device.width ? `${device.width} × ${device.height}` : "",
            tags(
              device.id === stage.device.id,
              device.id === stage.configDevice.id
            ),
          ]
            .filter(Boolean)
            .join(" · "),
          keywords: `device preview screen mobile responsive ${device.kind} ${device.id}`,
          action: () => stage.setDevice(device.id),
        })
      }
    }
    commands.push({
      id: "launcher",
      group: "Surface",
      label: "Toggle floating search button",
      detail: launcherVisible ? "on" : "off",
      keywords: "launcher fab search button floating hide show",
      action: () => setLauncherVisible(!launcherVisible),
    })
    return commands
  }, [
    stage,
    chromeDefinition,
    toggles,
    setToggle,
    launcherVisible,
    setLauncherVisible,
  ])

  const stageFuse = useMemo(
    () =>
      new Fuse(stageCommands, {
        keys: [
          { name: "label", weight: 2 },
          { name: "group", weight: 1 },
          { name: "keywords", weight: 2 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [stageCommands]
  )

  const stageGrouped = useMemo(() => {
    const results = query.trim()
      ? stageFuse.search(query).map((r) => r.item)
      : stageCommands
    const map = new Map<string, StageCommand[]>()
    for (const command of results) {
      const list = map.get(command.group) ?? []
      list.push(command)
      map.set(command.group, list)
    }
    return Array.from(map.entries())
  }, [stageCommands, stageFuse, query])

  // Keep cmdk's highlight and scroll position pinned to the first result.
  const firstItemValue = useMemo(() => {
    if (tab === "prototypes") {
      const firstProto = protoGrouped[0]?.[1]?.[0]
      if (firstProto) return firstProto.path
      const firstStage = stageGrouped[0]?.[1]?.[0]
      return firstStage ? `stage-${firstStage.id}` : ""
    }
    const firstAxis = variantGrouped[0]
    const firstRow = firstAxis?.[1]?.[0]
    return firstRow ? `${firstAxis[0]}-${firstRow.valueKey}` : ""
  }, [tab, protoGrouped, stageGrouped, variantGrouped])

  const selectionDeps = `${open}:${query}:${tab}:${firstItemValue}`
  const [prevSelectionDeps, setPrevSelectionDeps] = useState(selectionDeps)
  if (selectionDeps !== prevSelectionDeps) {
    setPrevSelectionDeps(selectionDeps)
    if (open) setSelected(firstItemValue)
  }

  useLayoutEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: 0 })
  }, [open, query, tab, firstItemValue])

  useEffect(() => {
    if (open && selected.startsWith("/")) preloadPrototype(selected)
  }, [open, selected])

  const goToVariants = useCallback(
    (
      values: Record<string, string | boolean>,
      defaults?: Record<string, string | boolean>
    ) => {
      if (!activePrototype?.props) return
      void navigate({
        pathname: location.pathname,
        search: buildVariantSearch(
          activePrototype.props,
          prototypeKey,
          values,
          location.search,
          defaults
        ),
      })
    },
    [
      activePrototype,
      prototypeKey,
      location.pathname,
      location.search,
      navigate,
    ]
  )

  const currentValues = useCallback(() => {
    const values: Record<string, string | boolean> = {}
    for (const [axis, def] of Object.entries(activePrototype?.props ?? {})) {
      values[axis] = currentValueFor(
        def,
        currentSearch[axis],
        effectiveDefaults[axis] ?? def.default
      )
    }
    return values
  }, [activePrototype, currentSearch, effectiveDefaults])

  const saveCurrentAsDefaults = useCallback(() => {
    if (!activePrototype?.props) return
    const values = currentValues()
    setLocalDefaults(prototypeKey, values, schemaDefaults)
    goToVariants(values, values)
  }, [
    activePrototype,
    currentValues,
    goToVariants,
    prototypeKey,
    schemaDefaults,
  ])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault()
        setTab((t) => (t === "prototypes" ? "variants" : "prototypes"))
        return
      }
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key === "r") {
        if (!activePrototype?.props) return
        e.preventDefault()
        if (e.shiftKey) clearLocalDefaults(prototypeKey)
        goToVariants({})
        return
      }
      if (key === "d") {
        if (!activePrototype?.props || tab !== "variants") return
        e.preventDefault()
        saveCurrentAsDefaults()
        return
      }
      if (key === "c") {
        // Leave ordinary copying alone when some text is selected.
        const input = inputRef.current
        const hasInputSelection =
          input !== null && input.selectionStart !== input.selectionEnd
        if (hasInputSelection || window.getSelection()?.toString()) return
        e.preventDefault()
        void navigator.clipboard?.writeText(shareableUrl(stage))
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    open,
    activePrototype,
    prototypeKey,
    goToVariants,
    tab,
    saveCurrentAsDefaults,
    stage,
  ])

  function setAxisAsDefault(row: VariantRow) {
    if (!activePrototype?.props) return
    setLocalDefault(
      prototypeKey,
      row.axis,
      row.value,
      schemaDefaults,
      effectiveDefaults
    )
    // Only values spelled out in the address are kept; an axis that was
    // following its default follows the new one.
    const explicit: Record<string, string | boolean> = {}
    for (const [axis, value] of Object.entries(currentValues())) {
      if (currentSearch[axis] !== undefined) explicit[axis] = value
    }
    goToVariants(explicit, { ...effectiveDefaults, [row.axis]: row.value })
  }

  function applyVariant(row: VariantRow) {
    if (!activePrototype?.props) return
    goToVariants({ ...currentValues(), [row.axis]: row.value })
    setQuery("")
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[20%] left-[50%] z-50 flex w-full max-w-lg translate-x-[-50%] flex-col overflow-hidden rounded-lg border bg-popover shadow-2xl shadow-foreground/20 duration-150 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          style={{ maxHeight: "min(70vh, 560px)" }}
        >
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <div className="flex items-center gap-1 border-b px-3 py-2 text-xs">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onOpenChange(false)
                void navigate("/")
              }}
              className="mr-1 font-heading text-base leading-none font-normal tracking-normal text-foreground/85 transition hover:text-foreground"
              title="Surface home"
            >
              {surfaceConfig.name}
            </button>
            <span aria-hidden className="mr-1 h-4 w-px bg-border" />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setTab("prototypes")}
              className={`rounded-md px-2 py-1 ${tab === "prototypes" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Prototypes
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setTab("variants")}
              className={`rounded-md px-2 py-1 ${tab === "variants" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Variants
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onOpenChange(false)
                browse.openPanel()
              }}
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
              title="Open browse panel (⌘⇧B)"
            >
              Browse…
            </button>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              tab to switch
            </span>
          </div>
          <Command
            shouldFilter={false}
            value={selected}
            onValueChange={setSelected}
            className="flex-1 overflow-hidden"
          >
            <CommandInput
              ref={inputRef}
              placeholder={
                tab === "prototypes" ? "Search prototypes…" : "Search variants…"
              }
              value={query}
              onValueChange={setQuery}
            />
            <CommandList ref={listRef} className="max-h-none flex-1">
              {tab === "prototypes" ? (
                <>
                  <CommandEmpty>
                    {query.trim()
                      ? "No prototypes found."
                      : "No recent prototypes. Open Browse (⌘⇧B) to explore."}
                  </CommandEmpty>
                  {protoGrouped.map(([category, items]) => (
                    <CommandGroup key={category} heading={category}>
                      {items.map((entry) => (
                        <CommandItem
                          key={entry.path}
                          value={entry.path}
                          onSelect={() => {
                            onOpenChange(false)
                            void navigate(entry.path)
                          }}
                        >
                          <span>{entry.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {entry.path}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                  {stageGrouped.map(([group, commands]) => (
                    <CommandGroup key={group} heading={group}>
                      {commands.map((command) => (
                        <CommandItem
                          key={command.id}
                          value={`stage-${command.id}`}
                          onSelect={() => command.action()}
                        >
                          <span>{command.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {command.detail}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </>
              ) : !activePrototype?.props ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {activePrototype
                    ? "This prototype has no variants. Tell your AI assistant to add one."
                    : "Open a prototype to see its variants."}
                </div>
              ) : (
                <>
                  <CommandEmpty>No variants match.</CommandEmpty>
                  {variantGrouped.map(([axis, rows]) => (
                    <CommandGroup key={axis} heading={axis}>
                      {rows.map((row) => (
                        <CommandItem
                          key={`${axis}:${row.valueKey}`}
                          value={`${axis}-${row.valueKey}`}
                          onSelect={() => applyVariant(row)}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span>
                              {valueLabel(
                                activePrototype.props![row.axis],
                                row.value
                              )}
                            </span>
                            {!row.isDefault ? (
                              <button
                                type="button"
                                tabIndex={-1}
                                title={`Set ${row.valueKey} as default for ${axis}`}
                                className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setAxisAsDefault(row)
                                }}
                                onPointerDown={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                }}
                              >
                                Set default
                              </button>
                            ) : null}
                          </span>
                          <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                            {row.isCurrent && <span>current</span>}
                            {row.isDefault && <span>default</span>}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </>
              )}
            </CommandList>
            {tab === "variants" && activePrototype?.props ? (
              <div className="flex flex-wrap items-center gap-3 border-t px-3 py-2 font-mono text-[10px] text-muted-foreground">
                <span>
                  <kbd>⌘D</kbd> Set as default
                </span>
                <span>
                  <kbd>⌘R</kbd> Reset
                </span>
                {pathHasLocalDefaults ? (
                  <span>
                    <kbd>⌘⇧R</kbd> Clear my defaults
                  </span>
                ) : null}
                <span>
                  <kbd>⌘C</kbd> Copy link
                </span>
              </div>
            ) : null}
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
