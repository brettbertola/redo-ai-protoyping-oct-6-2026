import { useEffect, useRef } from "react"

export interface PrototypeContextMenuState {
  x: number
  y: number
}

interface PrototypeContextMenuProps {
  state: PrototypeContextMenuState | null
  onClose: () => void
  onCommandMenu: () => void
  onVariants: () => void
  onBrowse: () => void
  onResetPrototype: () => void
}

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { left: number; top: number } {
  const pad = 8
  const maxLeft = window.innerWidth - width - pad
  const maxTop = window.innerHeight - height - pad
  return {
    left: Math.max(pad, Math.min(x, maxLeft)),
    top: Math.max(pad, Math.min(y, maxTop)),
  }
}

export function PrototypeContextMenu({
  state,
  onClose,
  onCommandMenu,
  onVariants,
  onBrowse,
  onResetPrototype,
}: PrototypeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown, true)
    }
  }, [state, onClose])

  useEffect(() => {
    if (!state || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const { left, top } = clampPosition(
      state.x,
      state.y,
      rect.width,
      rect.height
    )
    menuRef.current.style.left = `${left}px`
    menuRef.current.style.top = `${top}px`
  }, [state])

  if (!state) return null

  const run = (action: () => void) => {
    onClose()
    action()
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Surface"
      className="fixed z-[100] min-w-52 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-foreground/15"
      style={{ left: state.x, top: state.y }}
    >
      <MenuItem
        label="Command menu"
        shortcut="⌘K"
        onSelect={() => run(onCommandMenu)}
      />
      <MenuItem
        label="Variants"
        shortcut="⌘⇧K"
        onSelect={() => run(onVariants)}
      />
      <MenuItem label="Browse" shortcut="⌘⇧B" onSelect={() => run(onBrowse)} />
      <div className="my-1 h-px bg-border" role="separator" />
      <MenuItem
        label="Reset prototype"
        onSelect={() => run(onResetPrototype)}
      />
      <div className="my-1 h-px bg-border" role="separator" />
      <div
        role="menuitem"
        aria-disabled="true"
        className="flex w-full cursor-default items-center justify-between gap-6 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground"
        title="Hold Shift and right-click for the browser Inspect menu"
      >
        <span>Inspect element</span>
        <span className="font-mono text-[10px]">⇧-click</span>
      </div>
    </div>
  )
}

function MenuItem({
  label,
  shortcut,
  onSelect,
}: {
  label: string
  shortcut?: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center justify-between gap-6 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
      onClick={onSelect}
    >
      <span>{label}</span>
      {shortcut ? (
        <span className="font-mono text-[10px] text-muted-foreground">
          {shortcut}
        </span>
      ) : null}
    </button>
  )
}

const heldModifiers = {
  shift: false,
}

let modifierListenersBound = false

function bindModifierListeners() {
  if (typeof window === "undefined" || modifierListenersBound) return
  modifierListenersBound = true

  const setFromKey = (event: KeyboardEvent, pressed: boolean) => {
    if (
      event.key === "Shift" ||
      event.code === "ShiftLeft" ||
      event.code === "ShiftRight"
    ) {
      heldModifiers.shift = pressed
    }
  }

  window.addEventListener("keydown", (e) => setFromKey(e, true), true)
  window.addEventListener("keyup", (e) => setFromKey(e, false), true)
  window.addEventListener("blur", () => {
    heldModifiers.shift = false
  })
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      heldModifiers.shift = false
    }
  })
}

export function shouldUseNativeContextMenu(event?: MouseEvent): boolean {
  bindModifierListeners()
  if (typeof window === "undefined") return true

  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) return true

  if (event?.shiftKey || heldModifiers.shift) return true

  const target = event?.target
  if (
    target instanceof Element &&
    target.closest("[data-surface-native-context-menu]")
  ) {
    return true
  }

  return false
}
