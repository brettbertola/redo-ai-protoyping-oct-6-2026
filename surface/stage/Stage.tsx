import { Suspense } from "react"
import { Outlet } from "react-router"
import { useStage } from "../lib/stage-state"
import { ChromeHost } from "./ChromeHost"
import { DeviceFrame } from "./DeviceFrame"

// Device, then chrome, then the prototype.
export function Stage() {
  const stage = useStage()
  if (!stage.bare && stage.device.width !== null) {
    return <DeviceFrame device={stage.device} />
  }
  return (
    <ChromeHost name={stage.chromeName}>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </ChromeHost>
  )
}
