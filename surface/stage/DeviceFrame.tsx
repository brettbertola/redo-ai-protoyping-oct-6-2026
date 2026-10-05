import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import type { Device } from "../lib/devices"
import { BARE_PARAM, DEVICE_PARAM } from "../lib/variants"
import { readFrameMessage, type FrameMessage } from "./messages"

const PADDING = 32
const BEZEL: Record<Device["kind"], number> = {
  none: 0,
  phone: 12,
  tablet: 14,
  desktop: 0,
}
const RADIUS: Record<Device["kind"], number> = {
  none: 0,
  phone: 48,
  tablet: 28,
  desktop: 10,
}

/** The address the framed prototype should be at, for a shell address. */
function frameTarget(pathname: string, search: string): string {
  const params = new URLSearchParams(search)
  params.delete(DEVICE_PARAM)
  params.set(BARE_PARAM, "1")
  return `${pathname}?${params.toString()}`
}

function withoutShellParams(search: string): string {
  const params = new URLSearchParams(search)
  params.delete(DEVICE_PARAM)
  params.delete(BARE_PARAM)
  return params.toString()
}

// Renders the prototype in an iframe sized to the device, so breakpoints and
// media queries behave exactly as they would on that screen.
export function DeviceFrame({ device }: { device: Device }) {
  const location = useLocation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)
  const [initialSrc] = useState(() =>
    frameTarget(location.pathname, location.search)
  )
  const frameLocation = useRef({
    pathname: location.pathname,
    search: withoutShellParams(location.search),
  })

  const width = device.width ?? 0
  const height = device.height ?? 0
  const bezel = BEZEL[device.kind]

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const availableWidth = container.clientWidth - PADDING * 2
      const availableHeight = container.clientHeight - PADDING * 2
      setScale(
        Math.min(
          1,
          availableWidth / (width + bezel * 2),
          availableHeight / (height + bezel * 2)
        )
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [width, height, bezel])

  // The framed prototype moved (a link was clicked inside it): follow it.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readFrameMessage(event)
      if (message?.type !== "surface:location") return
      const search = withoutShellParams(message.search)
      frameLocation.current = { pathname: message.pathname, search }
      if (
        message.pathname === location.pathname &&
        search === withoutShellParams(location.search)
      ) {
        return
      }
      const params = new URLSearchParams(search)
      const deviceParam = new URLSearchParams(location.search).get(DEVICE_PARAM)
      if (deviceParam) params.set(DEVICE_PARAM, deviceParam)
      const next = params.toString()
      void navigate(
        { pathname: message.pathname, search: next ? `?${next}` : "" },
        { replace: true }
      )
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [location.pathname, location.search, navigate])

  // The shell moved (palette, browse panel): take the framed prototype along.
  useEffect(() => {
    const search = withoutShellParams(location.search)
    if (
      frameLocation.current.pathname === location.pathname &&
      frameLocation.current.search === search
    ) {
      return
    }
    frameLocation.current = { pathname: location.pathname, search }
    const message: FrameMessage = {
      type: "surface:navigate",
      to: frameTarget(location.pathname, location.search),
    }
    iframeRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin
    )
  }, [location.pathname, location.search])

  return (
    <div
      ref={containerRef}
      data-surface-device={device.id}
      className="flex h-dvh w-full items-center justify-center overflow-hidden bg-muted"
    >
      <div
        style={{
          width: (width + bezel * 2) * scale,
          height: (height + bezel * 2) * scale,
        }}
      >
        <div
          className="origin-top-left bg-foreground shadow-2xl"
          style={{
            width: width + bezel * 2,
            height: height + bezel * 2,
            padding: bezel,
            borderRadius: RADIUS[device.kind],
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            ref={iframeRef}
            src={initialSrc}
            title={`${device.label} preview`}
            width={width}
            height={height}
            className="block border-0 bg-background"
            style={{ borderRadius: Math.max(RADIUS[device.kind] - bezel, 0) }}
          />
        </div>
      </div>
    </div>
  )
}
