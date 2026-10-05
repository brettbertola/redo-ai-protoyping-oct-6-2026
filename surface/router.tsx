import { createBrowserRouter, type RouteObject } from "react-router"
import { prototypes } from "./lib/registry"
import { Shell } from "./Shell"

// One lazy route per prototype (and per sub-page), so opening the app only
// downloads the prototype being looked at.
function prototypeRoutes(): RouteObject[] {
  const routes: RouteObject[] = []
  for (const entry of prototypes) {
    const load = entry.load
    if (load) {
      routes.push({
        path: entry.path,
        lazy: async () => ({ Component: (await load()).default }),
      })
    }
    for (const page of entry.pages) {
      routes.push({
        path: `${entry.path}/${page.segment}`,
        lazy: async () => ({ Component: (await page.load()).default }),
      })
    }
  }
  return routes
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Shell,
    // Nothing shows while the first prototype loads.
    HydrateFallback: () => null,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("./pages/Home")).Home }),
      },
      ...prototypeRoutes(),
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("./pages/NotFound")).NotFound,
        }),
      },
    ],
  },
])
