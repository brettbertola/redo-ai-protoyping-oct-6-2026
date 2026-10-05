import { Bell, Home, LayoutGrid, Search, Settings, Users } from "lucide-react"
import { defineChrome } from "@surface"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// An example chrome. It uses the shadcn Sidebar components without changes.
// Tell your AI assistant to change it, or to make a new chrome for your product.
const NAV = [
  { label: "Home", icon: Home, active: true },
  { label: "Projects", icon: LayoutGrid },
  { label: "People", icon: Users },
  { label: "Settings", icon: Settings },
]

export default defineChrome({
  label: "Example app",
  description: "Sidebar and top bar",
  toggles: {
    sidebarCollapsed: { label: "Collapsed sidebar", default: false },
    assistant: { label: "Assistant panel", default: false },
  },
  Layout({ children, toggles, setToggle, slots }) {
    return (
      <SidebarProvider
        open={!toggles.sidebarCollapsed}
        onOpenChange={(open) => setToggle("sidebarCollapsed", !open)}
        className="h-dvh"
      >
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                    A
                  </span>
                  <span className="font-heading font-semibold">Acme</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={item.active}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-w-0 overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex h-8 max-w-sm flex-1 items-center gap-2 rounded-md border bg-muted/40 px-2 text-sm text-muted-foreground">
              <Search className="size-4" />
              <span>Search</span>
            </div>
            <div className="ml-auto flex items-center gap-3 text-muted-foreground">
              <Bell className="size-4" />
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                JD
              </span>
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-auto">{children}</div>
            {toggles.assistant ? (
              <aside className="hidden w-80 shrink-0 flex-col border-l lg:flex">
                {slots.assistant ?? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Assistant panel
                  </div>
                )}
              </aside>
            ) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  },
})
