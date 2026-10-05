export interface Device {
  id: string
  label: string
  /** Viewport size in CSS pixels; null means "use the whole window". */
  width: number | null
  height: number | null
  kind: "none" | "phone" | "tablet" | "desktop"
}

export const DEVICES: Device[] = [
  {
    id: "responsive",
    label: "Full window",
    width: null,
    height: null,
    kind: "none",
  },
  { id: "phone", label: "Phone", width: 390, height: 844, kind: "phone" },
  {
    id: "phone-small",
    label: "Small phone",
    width: 375,
    height: 667,
    kind: "phone",
  },
  { id: "tablet", label: "Tablet", width: 820, height: 1180, kind: "tablet" },
  {
    id: "tablet-landscape",
    label: "Tablet, landscape",
    width: 1180,
    height: 820,
    kind: "tablet",
  },
  {
    id: "desktop",
    label: "Desktop",
    width: 1440,
    height: 900,
    kind: "desktop",
  },
]

export const DEFAULT_DEVICE = DEVICES[0]

export function findDevice(id: string | null | undefined): Device | undefined {
  return DEVICES.find((device) => device.id === id)
}
