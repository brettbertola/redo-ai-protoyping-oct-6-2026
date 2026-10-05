import { defineSurface } from "@surface/config"

// Project-wide settings. Ask your AI assistant to change these for you.
export default defineSurface({
  name: "Surface",
  // Used by any prototype that does not choose its own.
  defaultChrome: "none",
  defaultDevice: "responsive",
  // Icons for top-level folders in the browse panel, e.g.
  //   import { Megaphone } from "lucide-react"
  //   categoryIcons: { marketing: Megaphone },
  categoryIcons: {},
})
