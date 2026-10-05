import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router/dom"
import "@/theme.css"
import "./surface.css"
import { Providers } from "@/providers"
import surfaceConfig from "../surface.config"
import { router } from "./router"

document.title = surfaceConfig.name

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>
)
