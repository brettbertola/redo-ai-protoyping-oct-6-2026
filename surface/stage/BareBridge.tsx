import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { resetPrototype } from "../lib/prototype-reset"
import { shouldUseNativeContextMenu } from "../components/PrototypeContextMenu"
import { postToParent, readFrameMessage } from "./messages"

// Runs inside a device frame in place of the launcher: keeps the shell's
// address in step and hands shortcuts and right-clicks up to it.
export function BareBridge() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    postToParent({
      type: "surface:location",
      pathname: location.pathname,
      search: location.search,
    })
  }, [location.pathname, location.search])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = readFrameMessage(event)
      if (message?.type === "surface:navigate") {
        void navigate(message.to, { replace: true })
      } else if (message?.type === "surface:reset") {
        resetPrototype(window.location.pathname)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (event.shiftKey && key === "b") {
        event.preventDefault()
        postToParent({ type: "surface:command", command: "browse" })
      } else if (key === "k") {
        event.preventDefault()
        postToParent({
          type: "surface:command",
          command: event.shiftKey ? "variants" : "palette",
        })
      }
    }
    const onContextMenu = (event: MouseEvent) => {
      if (shouldUseNativeContextMenu(event)) return
      event.preventDefault()
      postToParent({
        type: "surface:contextmenu",
        x: event.clientX,
        y: event.clientY,
      })
    }
    window.addEventListener("message", onMessage)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("contextmenu", onContextMenu, true)
    return () => {
      window.removeEventListener("message", onMessage)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("contextmenu", onContextMenu, true)
    }
  }, [navigate])

  return null
}
