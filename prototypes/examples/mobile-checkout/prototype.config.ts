import { definePrototype, enumProp } from "@surface"

export default definePrototype({
  description: "A two-page mobile flow, shown in a phone frame.",
  device: "phone",
  variants: {
    button: enumProp(["sticky", "inline"], { default: "sticky" }),
  },
})
