import { usePrototypeProps } from "@surface"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import config from "./prototype.config"

export default function Dashboard() {
  const { layout: Layout, density, banner } = usePrototypeProps(config)
  const dense = density === "compact"

  return (
    <main
      className={`mx-auto flex w-full max-w-5xl flex-col ${dense ? "gap-4 p-4" : "gap-6 p-8"}`}
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Everything your team is working on this quarter.
          </p>
        </div>
        <Button>New project</Button>
      </header>
      {banner ? (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          Press <Kbd>⌘⇧K</Kbd> to switch variants
          of this page.
        </div>
      ) : null}
      <Layout dense={dense} />
    </main>
  )
}
