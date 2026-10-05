// The shell's own command-list pieces, built straight on cmdk so that
// re-theming or regenerating src/components/ui can never break the palette.
import { Command as Cmdk } from "cmdk"
import { Search } from "lucide-react"
import type { ComponentProps } from "react"

export function Command({
  className = "",
  ...props
}: ComponentProps<typeof Cmdk>) {
  return (
    <Cmdk
      className={`flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground ${className}`}
      {...props}
    />
  )
}

export function CommandInput({
  className = "",
  ...props
}: ComponentProps<typeof Cmdk.Input>) {
  return (
    <div className="flex items-center gap-2 border-b px-3">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Cmdk.Input
        className={`flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground ${className}`}
        {...props}
      />
    </div>
  )
}

export function CommandList({
  className = "",
  ...props
}: ComponentProps<typeof Cmdk.List>) {
  return (
    <Cmdk.List
      className={`overflow-x-hidden overflow-y-auto ${className}`}
      {...props}
    />
  )
}

export function CommandEmpty(props: ComponentProps<typeof Cmdk.Empty>) {
  return (
    <Cmdk.Empty
      className="py-6 text-center text-sm text-muted-foreground"
      {...props}
    />
  )
}

export function CommandGroup({
  className = "",
  ...props
}: ComponentProps<typeof Cmdk.Group>) {
  return (
    <Cmdk.Group
      className={`overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground ${className}`}
      {...props}
    />
  )
}

export function CommandItem({
  className = "",
  ...props
}: ComponentProps<typeof Cmdk.Item>) {
  return (
    <Cmdk.Item
      className={`relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground ${className}`}
      {...props}
    />
  )
}
