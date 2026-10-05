import { useEffect, useState } from "react"
import { TriangleAlert, X } from "lucide-react"

interface Problem {
  file: string
  line: number
  rule: string
  message: string
}

// Shows the design rule problems that the preview found. It is only in the
// local preview, not in the published site. The designer sees it also when
// the assistant did not see or repair a problem.
export function DesignProblems() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const hot = import.meta.hot
    if (!hot) return
    let cancelled = false
    fetch("/__surface/design")
      .then((response) => response.json())
      .then((body: { problems?: Problem[] }) => {
        if (!cancelled && Array.isArray(body.problems)) {
          setProblems(body.problems)
        }
      })
      .catch(() => {
        // A preview that a different command started has no design rules.
      })
    const onUpdate = (data: { problems: Problem[] }) =>
      setProblems(data.problems)
    hot.on("surface:design", onUpdate)
    return () => {
      cancelled = true
      hot.off("surface:design", onUpdate)
    }
  }, [])

  if (problems.length === 0) return null

  const label = `${problems.length} design rule problem${problems.length === 1 ? "" : "s"}`

  return (
    <div
      data-surface-design-problems
      className="fixed bottom-6 left-6 z-50 flex max-w-md flex-col gap-2"
    >
      {open ? (
        <div className="flex max-h-80 flex-col gap-3 overflow-auto rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                Tell your AI assistant: “Repair the design rule problems.”
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="flex flex-col gap-2 text-xs">
            {problems.map((problem) => (
              <li
                key={`${problem.file}:${problem.line}:${problem.message}`}
                className="flex flex-col gap-0.5"
              >
                <span className="font-mono text-muted-foreground">
                  {problem.file}:{problem.line}
                </span>
                <span>{problem.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-fit items-center gap-2 rounded-full border border-destructive/40 bg-popover px-3 py-2 text-xs font-medium text-popover-foreground shadow-lg"
      >
        <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
        {label}
      </button>
    </div>
  )
}
