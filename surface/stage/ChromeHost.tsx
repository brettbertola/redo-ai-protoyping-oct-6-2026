import { useCallback, useMemo, useState, type ReactNode } from "react"
import {
  ChromeContext,
  useChromeDefinition,
  useChromeToggles,
} from "../lib/stage-state"

// Wraps the prototype in the chosen chrome. "none" hands the prototype the
// whole viewport.
export function ChromeHost({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  const definition = useChromeDefinition(name)
  const { toggles, setToggle } = useChromeToggles(name, definition)
  const [slots, setSlots] = useState<Record<string, ReactNode>>({})

  const setSlot = useCallback((slot: string, node: ReactNode) => {
    setSlots((current) =>
      current[slot] === node ? current : { ...current, [slot]: node }
    )
  }, [])

  const context = useMemo(
    () => ({ name, toggles, setToggle, setSlot }),
    [name, toggles, setToggle, setSlot]
  )

  let body: ReactNode
  if (name === "none") {
    body = <div className="flex min-h-dvh flex-col">{children}</div>
  } else if (!definition) {
    body = null
  } else {
    const Layout = definition.Layout
    body = (
      <Layout toggles={toggles} setToggle={setToggle} slots={slots}>
        {children}
      </Layout>
    )
  }

  return <ChromeContext.Provider value={context}>{body}</ChromeContext.Provider>
}
