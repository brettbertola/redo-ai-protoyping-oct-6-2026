import { boolProp, componentProp, definePrototype, enumProp } from "@surface"

export default definePrototype({
  description: "A sample dashboard showing each kind of variant.",
  chrome: "example-app",
  variants: {
    // One file per value in variants/layout/.
    layout: componentProp<{ dense: boolean }>({ default: "cards" }),
    density: enumProp(["comfortable", "compact"], { default: "comfortable" }),
    banner: boolProp({ default: true }),
  },
})
