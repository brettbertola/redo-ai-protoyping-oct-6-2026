import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useLocation, useNavigate } from "react-router"
import surfaceConfig from "../../surface.config"
import type { ChromeDefinition } from "../config"
import { DEFAULT_DEVICE, findDevice, type Device } from "./devices"
import { findChrome, findPrototypeForPathname } from "./registry"
import { createStore, useStore } from "./store"
import { BARE_PARAM, CHROME_PARAM, DEVICE_PARAM } from "./variants"

interface StageOverride {
  chrome?: string
  device?: string
}

// What this person last picked per prototype, so it survives navigation.
const overrideStore = createStore<Record<string, StageOverride>>(
  "surface:stage:v1",
  {}
)
const toggleStore = createStore<Record<string, Record<string, boolean>>>(
  "surface:chrome-toggles:v1",
  {}
)
const launcherStore = createStore<boolean>("surface:launcher:v1", true)

export function useLauncherVisible(): [boolean, (visible: boolean) => void] {
  return [useStore(launcherStore), launcherStore.set]
}

export function isBareMode(search: string): boolean {
  return new URLSearchParams(search).has(BARE_PARAM)
}

export interface StageState {
  /** Path of the prototype on screen, if any. */
  prototypeKey: string | null
  chromeName: string
  configChromeName: string
  device: Device
  configDevice: Device
  bare: boolean
  setChrome: (name: string) => void
  setDevice: (id: string) => void
}

function validChrome(name: string | null | undefined): string | undefined {
  if (!name) return undefined
  if (name === "none" || findChrome(name)) return name
  return undefined
}

export function useStage(): StageState {
  const location = useLocation()
  const navigate = useNavigate()
  const overrides = useStore(overrideStore)

  const entry = findPrototypeForPathname(location.pathname)
  const prototypeKey = entry?.path ?? null
  const params = new URLSearchParams(location.search)
  const local = prototypeKey ? overrides[prototypeKey] : undefined

  const configChromeName = entry
    ? (validChrome(entry.config.chrome) ??
      validChrome(surfaceConfig.defaultChrome) ??
      "none")
    : "none"
  const configDevice = entry
    ? (findDevice(entry.config.device) ??
      findDevice(surfaceConfig.defaultDevice) ??
      DEFAULT_DEVICE)
    : DEFAULT_DEVICE

  const chromeName = entry
    ? (validChrome(params.get(CHROME_PARAM)) ??
      validChrome(local?.chrome) ??
      configChromeName)
    : "none"
  const device = entry
    ? (findDevice(params.get(DEVICE_PARAM)) ??
      findDevice(local?.device) ??
      configDevice)
    : DEFAULT_DEVICE

  function write(
    field: "chrome" | "device",
    param: string,
    value: string,
    base: string
  ) {
    if (!prototypeKey) return
    const isDefault = value === base
    overrideStore.update((current) => {
      const next = { ...current }
      const mine = { ...next[prototypeKey] }
      if (isDefault) delete mine[field]
      else mine[field] = value
      if (Object.keys(mine).length === 0) delete next[prototypeKey]
      else next[prototypeKey] = mine
      return next
    })
    const nextParams = new URLSearchParams(location.search)
    if (isDefault) nextParams.delete(param)
    else nextParams.set(param, value)
    const search = nextParams.toString()
    void navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true }
    )
  }

  return {
    prototypeKey,
    chromeName,
    configChromeName,
    device,
    configDevice,
    bare: params.has(BARE_PARAM),
    setChrome: (name) => write("chrome", CHROME_PARAM, name, configChromeName),
    setDevice: (id) => write("device", DEVICE_PARAM, id, configDevice.id),
  }
}

/** A link to exactly what is on screen, for someone with no saved choices. */
export function shareableUrl(stage: StageState): string {
  const url = new URL(window.location.href)
  url.searchParams.delete(BARE_PARAM)
  if (stage.chromeName !== stage.configChromeName) {
    url.searchParams.set(CHROME_PARAM, stage.chromeName)
  }
  if (stage.device.id !== stage.configDevice.id) {
    url.searchParams.set(DEVICE_PARAM, stage.device.id)
  }
  return url.toString()
}

const chromeCache = new Map<string, ChromeDefinition>()

export function useChromeDefinition(name: string): ChromeDefinition | null {
  const [, setLoaded] = useState(0)
  useEffect(() => {
    if (name === "none" || chromeCache.has(name)) return
    let cancelled = false
    findChrome(name)
      ?.load()
      .then((mod) => {
        chromeCache.set(name, mod.default)
        if (!cancelled) setLoaded((n) => n + 1)
      })
      .catch((error) => {
        console.error(`[surface] could not load chrome "${name}"`, error)
      })
    return () => {
      cancelled = true
    }
  }, [name])
  return chromeCache.get(name) ?? null
}

export function useChromeToggles(
  name: string,
  definition: ChromeDefinition | null
): {
  toggles: Record<string, boolean>
  setToggle: (toggle: string, value: boolean) => void
} {
  const stored = useStore(toggleStore)
  const toggles = useMemo(() => {
    const out: Record<string, boolean> = {}
    for (const [toggle, def] of Object.entries(definition?.toggles ?? {})) {
      out[toggle] = stored[name]?.[toggle] ?? def.default
    }
    return out
  }, [definition, name, stored])
  const setToggle = useCallback(
    (toggle: string, value: boolean) => {
      toggleStore.update((current) => ({
        ...current,
        [name]: { ...current[name], [toggle]: value },
      }))
    },
    [name]
  )
  return { toggles, setToggle }
}

interface ChromeContextValue {
  name: string
  toggles: Record<string, boolean>
  setToggle: (toggle: string, value: boolean) => void
  setSlot: (slot: string, node: ReactNode) => void
}

export const ChromeContext = createContext<ChromeContextValue>({
  name: "none",
  toggles: {},
  setToggle: () => {},
  setSlot: () => {},
})

/** Lets a prototype read and flip the switches of the chrome around it. */
export function useChrome(): Omit<ChromeContextValue, "setSlot"> {
  const { name, toggles, setToggle } = useContext(ChromeContext)
  return { name, toggles, setToggle }
}

/**
 * Puts content into a named area of the chrome (for example an assistant
 * panel) while this prototype is on screen. Memoise `node` if it is costly.
 */
export function useChromeSlot(slot: string, node: ReactNode) {
  const { setSlot } = useContext(ChromeContext)
  useEffect(() => {
    setSlot(slot, node)
  }, [setSlot, slot, node])
  useEffect(() => () => setSlot(slot, null), [setSlot, slot])
}
