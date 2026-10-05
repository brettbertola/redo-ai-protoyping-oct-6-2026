// Messages between the shell and the prototype inside a device frame.
export type FrameMessage =
  | { type: "surface:location"; pathname: string; search: string }
  | { type: "surface:navigate"; to: string }
  | { type: "surface:command"; command: "palette" | "variants" | "browse" }
  | { type: "surface:contextmenu"; x: number; y: number }
  | { type: "surface:reset" }

export function readFrameMessage(event: MessageEvent): FrameMessage | null {
  if (event.origin !== window.location.origin) return null
  const data = event.data as { type?: unknown } | null
  if (!data || typeof data.type !== "string") return null
  if (!data.type.startsWith("surface:")) return null
  return data as FrameMessage
}

export function postToParent(message: FrameMessage) {
  if (window.parent === window) return
  window.parent.postMessage(message, window.location.origin)
}
