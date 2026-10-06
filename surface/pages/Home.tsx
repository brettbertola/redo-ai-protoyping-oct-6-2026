import { useMemo } from "react"
import { Link } from "react-router"
import surfaceConfig from "../../surface.config"
import { preloadPrototype, prototypes } from "../lib/registry"
import { SHORTCUT_GROUPS, SKILL_GROUPS } from "./requests"

export function Home() {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof prototypes>()
    for (const entry of prototypes) {
      const list = map.get(entry.category) ?? []
      list.push(entry)
      map.set(entry.category, list)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">
          {surfaceConfig.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="font-mono text-xs">⌘K</kbd> to find a prototype.
          Type a skill in the chat of your AI assistant to make or change one.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Prototypes</h2>
        {grouped.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            There are no prototypes. Type /prototype-new in the chat of your AI
            assistant.
          </p>
        ) : (
          grouped.map(([category, entries]) => (
            <div key={category} className="flex flex-col gap-1">
              <h3 className="text-xs text-muted-foreground">{category}</h3>
              <ul className="flex flex-col divide-y rounded-lg border">
                {entries.map((entry) => (
                  <li key={entry.path}>
                    <Link
                      to={entry.path}
                      onMouseEnter={() => preloadPrototype(entry.path)}
                      className="flex flex-col gap-0.5 px-4 py-3 transition hover:bg-accent"
                    >
                      <span className="text-sm font-medium">{entry.title}</span>
                      {entry.description ? (
                        <span className="text-xs text-muted-foreground">
                          {entry.description}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Keyboard shortcuts</h2>
          <p className="text-xs text-muted-foreground">
            On Windows, use Ctrl as an alternative to ⌘.
          </p>
        </div>
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <h3 className="text-xs text-muted-foreground">{group.label}</h3>
            <ul className="flex flex-col divide-y rounded-lg border">
              {group.shortcuts.map((shortcut) => (
                <li
                  key={shortcut.keys}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <kbd className="shrink-0 font-mono text-sm sm:w-44">
                    {shortcut.keys}
                  </kbd>
                  <span className="text-xs text-muted-foreground">
                    {shortcut.does}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Skills</h2>
          <p className="text-xs text-muted-foreground">
            Type a command in the chat of your AI assistant.
          </p>
        </div>
        {SKILL_GROUPS.map((group) => (
          <div key={group.prefix} className="flex flex-col gap-1">
            <h3 className="text-xs text-muted-foreground">{group.label}</h3>
            <ul className="flex flex-col divide-y rounded-lg border">
              {group.skills.map((skill) => (
                <li
                  key={skill.skill}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <code className="shrink-0 font-mono text-sm sm:w-44">
                    /{skill.skill}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {skill.does}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  )
}
