---
name: chrome-new
description: Makes a chrome for Surface prototypes. A chrome is the frame of the product (navigation, header, side panels) around a prototype. Use when the user asks for a chrome, an app shell, navigation, a sidebar or a header for the prototypes, or wants the prototypes to look like the product.
---

# Make a chrome

Read `AGENTS.md` first. You make a chrome one time. Many prototypes can use it.

1. **Get the appearance.** Ask the designer for one or two screenshots of the product, or for a description. You must know the items in the navigation, their position, and the contents of the header.
2. **Make the chrome.** Run `npm run surface -- chrome new <name>`. Use lowercase words with dashes. Example: `acme-admin`.
3. **Make the design** in `chromes/<name>/chrome.tsx`. Use `chromes/example-app/chrome.tsx` as an example.
   - Use the shadcn components from `@/components/ui/` without changes. For a sidebar, use `Sidebar`, `SidebarProvider` and `SidebarMenuButton` from `@/components/ui/sidebar`. Do not make these parts with plain HTML.
   - `Layout` gets `children`. `children` is the prototype.
   - Give the prototype an area that fills the remaining space and can scroll.
   - On a narrow screen, hide the side navigation or make it small. Then the phone preview is correct.
   - Add `toggles` for conditions that a designer wants to change from the ⌘K menu. Example: a collapsed sidebar.
   - Use `slots` for an area that a prototype can fill. Example: an assistant panel.
   - Obey the design rules in `AGENTS.md`. Use theme colors only.
4. **Use the chrome.** Ask the designer: "Is this chrome for all prototypes or for some?"
   - All: set `defaultChrome` in `surface.config.ts`.
   - Some: set `chrome: "<name>"` in each `prototype.config.ts`.
5. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem.
6. **Show the result.** Give the designer the address of a prototype that uses the chrome. Tell them that ⌘K shows the chromes, the toggles and the device sizes.
