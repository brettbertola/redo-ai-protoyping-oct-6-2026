import { Link, useLocation } from "react-router"

export function NotFound() {
  const location = useLocation()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="font-heading text-2xl">This page does not exist</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        There is no prototype at{" "}
        <code className="font-mono text-xs">{location.pathname}</code>. It is
        possible that someone renamed or deleted it.
      </p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Go to all prototypes
      </Link>
    </main>
  )
}
