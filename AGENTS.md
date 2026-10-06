# Surface: instructions for AI assistants

Surface is a tool to make interactive UI prototypes. The person that you help is a **designer**. Designers use this project to make prototypes quickly.

## Language

Write all text for the designer, and all documents in this project, in Simplified Technical English (ASD-STE100):

- Write short sentences. Use a maximum of 20 words in an instruction.
- Give one instruction in each sentence. Use the imperative: "Click Install."
- Use the active voice and the simple present tense.
- Use one word for one thing. Use the words in the table below. Do not use synonyms.
- Do not use contractions, idioms or humor.

| Word | Meaning |
|---|---|
| prototype | One interactive screen or flow that the designer makes |
| variant | One property of a prototype that the designer can change. Example: `layout` |
| option | One value of a variant. Example: `cards` |
| chrome | The frame of the product (navigation, header) around a prototype |
| device | The screen size of the preview. Example: phone |
| preview | The web page that shows the prototypes on this computer |
| theme | The colors, fonts and component style of the designer |
| publish | Put the prototypes on the web so that other persons can see them |

Do not use these words with the designer: branch, commit, push, pull request, build, dependency, server, port. Say "preview", not "server".

## Rules for your work with the designer

1. You run each command. Do not ask the designer to type a command.
2. If the designer must install something, give a download link. Tell them where to click.
3. After each change, make sure that the preview is on. Then give the designer the address of the change.
4. Before you delete something, tell the designer what you will delete. Wait for a clear "yes".
5. When a request agrees with a skill in `.agents/skills/`, obey that skill.
6. When a command fails, tell the designer the cause in one sentence. Do not show the error text.
7. When you tell the designer what to type, give the slash command of the skill. Example: `/variant-new`. Do not give a phrase such as "Add a variant".

## The preview

- The preview is on only while `npm run surface -- dev start` runs in a terminal.
- Start that command in a terminal that the designer can see. It does not stop until the preview stops. Do not wait for it to end.
- There is only one preview at a time. The command stops the old preview before it starts a new one. Thus it is always safe to run it again.
- `npm run surface -- dev status --wait` waits until the preview is on. Then it gives the address.
- `npm run surface -- dev stop` stops the preview.
- Do not start the preview with a different command, such as `npm run dev` or `npx vite`.

## Commands

All commands use one script. Each command prints JSON, but not `dev start`, which prints text. Give the designer the `summary`. Use the other fields for your subsequent steps.

```
npm run surface -- doctor                      shows what is installed and what is missing
npm run surface -- dev start|stop|status       controls the preview
npm run surface -- theme apply "<pasted theme command>"
npm run surface -- prototype list|new|rename|delete
npm run surface -- variant list|add|rename|set-default|delete
npm run surface -- chrome list|new|delete
npm run surface -- lint [files]                runs the design rules
npm run surface -- check [--no-build]          run this after each change
npm run surface -- ship | github login|status  publishes the prototypes
npm run surface -- train list|add|replace|remove   controls the direction for this project
npm run surface -- update [--dry-run]
```

Use these scripts to make, rename and delete items. Do not do these tasks manually. A delete command deletes only when you add `--yes`.

## Locations

| Folder | Contents | Can you edit it? |
|---|---|---|
| `prototypes/<category>/<name>/` | One prototype | Yes |
| `chromes/<name>/chrome.tsx` | One chrome | Yes |
| `src/components/` | Shared components of the designer | Yes |
| `surface.config.ts` | Project name, default chrome, default device | Yes |
| `src/components/ui/` | shadcn components | **No.** A theme change replaces them |
| `src/theme.css` | Colors, fonts, radius | Only with `theme apply` |
| `surface/`, `scripts/`, `.agents/`, `.claude/`, `.cursor/`, `.codex/` | Surface | **No.** An update replaces them |

## A prototype

```
prototypes/checkout/payment-form/
  prototype.config.ts          description, chrome, device, variants
  prototype.tsx                the screen (default export)
  pages/receipt.tsx            optional screen at /checkout/payment-form/receipt
  variants/layout/cards.tsx    one file for each option of a "component" variant
```

- The preview finds the prototype automatically. Its address is `/checkout/payment-form`. There is no list to update.
- In `pages/` and `variants/`, the preview ignores files and folders that start with `_`. Use them for shared parts.

```ts
// prototype.config.ts. Keep this file small. The preview loads it for each prototype.
import { boolProp, componentProp, definePrototype, enumProp } from "@surface"

export default definePrototype({
  description: "Payment step of checkout",
  chrome: "example-app",        // a folder in chromes/, or "none"
  device: "phone",              // responsive | phone | phone-small | tablet | tablet-landscape | desktop
  variants: {
    layout: componentProp<{ dense: boolean }>({ default: "cards" }),
    density: enumProp(["comfortable", "compact"], { default: "comfortable" }),
    banner: boolProp({ default: true }),
  },
})
```

```tsx
// prototype.tsx
import { usePrototypeProps } from "@surface"
import config from "./prototype.config"

export default function PaymentForm() {
  const { layout: Layout, density, banner } = usePrototypeProps(config)
  return <Layout dense={density === "compact"} />
}
```

- The address contains the variants: `?layout=table&banner=false`. The address does not contain default values.
- Thus a link always shows the same screen to each person.
- To link between screens, use `<Link>` from `react-router`. Add `useLocation().search` to the link to keep the variants.
- `registerPrototypeReset({ id, pathPrefix, reset })` from `@surface` erases the saved state of a prototype when the designer selects "Reset prototype".

## A chrome

```tsx
import { defineChrome } from "@surface"

export default defineChrome({
  label: "Acme admin",
  toggles: { sidebarCollapsed: { label: "Collapsed sidebar", default: false } },
  Layout({ children, toggles, slots }) {
    return <div className="flex h-dvh">…<div className="min-w-0 flex-1 overflow-auto">{children}</div></div>
  },
})
```

In a prototype, `useChrome()` reads and sets the toggles. `useChromeSlot("assistant", <Panel />)` fills a slot. See `chromes/example-app/chrome.tsx`.

## Design rules

There are two aims. Use the components that exist. Use the tokens of the theme.

**Components**

1. Import components from `@/components/ui/*`. All shadcn components are installed.
2. Do not use these HTML elements in a prototype or a chrome: `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<label>`, `<hr>`, `<dialog>`, `<progress>`, `<details>`, `<kbd>`. Use the related component.
3. Do not make a dialog, tabs, a switch, a menu or a tooltip manually with `role="…"`. Use the related component.
4. Do not make a new component with the name of a component that exists (`Button`, `Card`, `Badge`).
5. Read the file of a component in `src/components/ui/` before you use it. Its props change with the theme.
6. If no component does the task, make one in `src/components/` from the components that exist.

**Tokens**

7. Use theme colors only: `bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `text-muted-foreground`, `border`, `bg-accent`, `bg-sidebar`. Do not use `bg-blue-500`, `text-white`, hex values or `rgb()` values.
8. Use the scale for text size, space, radius and shadow: `text-sm`, `p-4`, `gap-2`, `rounded-lg`, `shadow-md`. Do not use one-off values such as `text-[13px]`, `p-[7px]` or `rounded-[10px]`.
9. Do not set colors, text sizes or space in a `style` attribute.
10. Do not make a new token (`--brand`). Use the tokens in `src/theme.css`.
11. A one-off dimension for layout is permitted: `w-[372px]`, `max-w-[60ch]`.

**Other rules**

12. The code must have no type errors.
13. For space between items, use `gap-*` and padding on a flex or grid parent. Do not use margins.
14. Use `font-heading` for headings. Use sentence case for labels.
15. Make the design for the device. A phone prototype is 390 px wide. A design in a chrome must be correct on a narrow screen.
16. A prototype has no back end. Use sample data in files adjacent to the prototype. Do not use real customer data. Each person who has a published link can see the data.

For a necessary exception to rules 1 thru 11, put `surface-allow` in a comment on that line.

### How the project applies rules 1 thru 11

One script, `scripts/lib/design-rules.mjs`, contains the rules. Four things use it:

| Where | When | Result |
|---|---|---|
| Hook: `scripts/hooks/design-check.mjs` | After you edit a file, and when you end your turn | You get the list of problems. Repair them. |
| The preview | When a prototype or chrome changes | The terminal and the preview show the problems. |
| `npm run surface -- lint [files]` | When you run it | JSON with the problems. |
| `npm run surface -- check` and `ship` | Before the prototypes are published | The publish step stops if there is a problem. |

The hook configs are `.claude/settings.json`, `.codex/hooks.json` and `.cursor/hooks.json`. They all start the same script. If your assistant does not have hooks, run `npm run surface -- lint` after each edit.

## Direction for this project

The designer owns this section. It contains the design direction and the build direction for all prototypes in this project. Obey these directives in each prototype and each chrome.

Do not edit this section directly. Use the `surface-train` skill and `npm run surface -- train`. An update of Surface keeps this section.

<!-- surface-train:start -->
### Design

_No directives._

### Build

_No directives._
<!-- surface-train:end -->

## After each change

1. Run `npm run surface -- check --no-build`. Repair each problem.
2. Make sure that the preview is on. Use the `surface-start` skill.
3. Give the designer the address of the change.
