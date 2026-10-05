interface PrototypeResetRegistration {
  id: string
  pathPrefix: string
  reset: () => void
}

const registrations = new Map<string, PrototypeResetRegistration>()

function normalizePath(path: string): string {
  if (!path || path === "/") return "/"
  return path.replace(/\/+$/, "") || "/"
}

function pathMatches(pathname: string, pathPrefix: string): boolean {
  const path = normalizePath(pathname)
  const prefix = normalizePath(pathPrefix)
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function registerPrototypeReset(
  registration: PrototypeResetRegistration
): void {
  registrations.set(registration.id, registration)
}

export function resetPrototype(pathname: string): void {
  for (const registration of registrations.values()) {
    if (pathMatches(pathname, registration.pathPrefix)) {
      registration.reset()
    }
  }

  if (typeof window !== "undefined") {
    window.location.reload()
  }
}
