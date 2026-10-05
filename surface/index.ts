// What prototypes and chromes import from "@surface".
export {
  boolProp,
  componentProp,
  defineChrome,
  defineProps,
  definePrototype,
  defineSurface,
  enumProp,
  fixtureProp,
} from "./config"
export type {
  ChromeDefinition,
  ChromeLayoutProps,
  InferProps,
  PrototypeConfig,
  SurfaceConfig,
} from "./config"
export { usePrototypeProps } from "./lib/variants"
export { useChrome, useChromeSlot } from "./lib/stage-state"
export { registerPrototypeReset } from "./lib/prototype-reset"
