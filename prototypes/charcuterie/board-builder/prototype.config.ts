import type { ReactNode } from "react"
import { componentProp, definePrototype } from "@surface"

export default definePrototype({
  description: "Build a custom charcuterie board with selected ingredients.",
  // Alternatives you can switch between with ⌘⇧K.
  variants: {
    experience: componentProp<{ guided: ReactNode }>({ default: "guided" }),
  },
})
