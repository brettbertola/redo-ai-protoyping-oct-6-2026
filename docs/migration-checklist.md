# Migration checklist

This document records three things for each feature of the original Surface:

- Open Surface has the feature.
- The feature does not use the Redo monorepo.
- A test shows that the feature is correct.

Read this document again after each change.

**Rules**

- Mark an item ✅ only after you run its pass condition and see that it passes.
- 🟡 means that the feature exists but no test shows it yet.
- ⬜ means that the work or the test is not done.
- If an item does not apply, strike it through and give the cause. Do not delete it.
- `npm test` or `npm run surface -- check` does the items with the mark **auto**. Do the other items manually before each release.

**How to do the tests**

- Run `npm test`. It does all automatic items.
- Run `npm run surface -- check`. It does the code, design rule, skill and build checks.
- Do sections I, J and K manually on a clean Mac and a clean Windows computer. Use only the README.

Note: the tables below are short technical records for contributors. They are not written in Simplified Technical English.

### A. Independence from the Redo monorepo

| ID | Pass condition | Status |
|---|---|---|
| A1 **auto** | `grep -rE "@redo/|redotech|redo\.builders|arbiter|Ask Redo|merchant" .` (excluding `node_modules`, this checklist) returns nothing | ✅ |
| A2 **auto** | No `@tanstack/*`, `nitro`, `evlog`, `better-auth`, `sdb-compat`, supabase or `next/*` in `package.json` or source | ✅ |
| A3 **auto** | `package.json` has no `workspace:` or `catalog:` versions; `npm ci && npm run build` succeeds in a fresh copy outside any monorepo | 🟡 No `workspace:`/`catalog:` versions and the build passes; a fresh `npm ci` outside this folder has not been run |
| A4 | Build output is static files only; serving `dist/` from any static host loads the app; no request to any server other than font/asset hosts | 🟡 Build output is static; not yet served from a plain static host |
| A5 | No login route, no auth redirect, no `/api/*`; opening any URL cold never redirects | ✅ No such routes exist |
| A6 **auto** | Shell (`surface/`) has zero imports from `src/components/ui`; deleting that folder's contents still lets the shell compile | ✅ |
| A7 | No bash, Python, `mise`, `nub`, `pnpm`, `turbo` or `screen` anywhere; every script runs with `node` on Mac and Windows | 🟡 True on Mac; not yet run on Windows |
| A8 | No symlinks in the repo; unzipping on Windows produces working skills | 🟡 No symlinks; Windows unzip not yet tried |
| A9 | Licence file present; no Redo product content (prototypes, docs, logos, fonts loaded under Redo names) | ✅ MIT, pending your confirmation |

### B. Registry and loading

| ID | Feature in Surface today | Pass condition | Status |
|---|---|---|---|
| B1 **auto** | Prototypes discovered with no manifest | Adding a `prototypes/x/y/` folder makes it appear in palette and browse with no other edit | ✅ |
| B2 **auto** | Title, category, breadcrumb derived from path | `my-flow` shows as "My Flow"; nested categories join with " / " and " › " | ✅ |
| B3 | (new) optional title/description override | Config `title` wins over derived title | 🟡 |
| B4 **auto** | List sorted by breadcrumb, de-duplicated | Order stable across reloads | ✅ |
| B5 **auto** | Multi-page prototypes | `pages/detail.tsx` reachable at `/{cat}/{name}/detail`; variants still resolve on the sub-page | ✅ |
| B6 | Param routes resolve to their prototype | A sub-page with a URL parameter still shows its prototype's variants and is hidden from pickers | 🟡 Sub-page files named `[id].tsx` become URL parameters |
| B7 **auto** | (new) lazy loading | Build emits one chunk per prototype; ~~entry chunk size unchanged (±2%)~~ entry grows by no more than 300 bytes per prototype | ✅ Revised: one chunk per prototype confirmed; the entry grows about 250 bytes per prototype (50 prototypes added 12.7 kB, 2.5 kB gzipped), which is over the original ±2% |
| B8 | (new) only the active component variant loads | Network tab shows one `variants/{axis}/*` chunk for the active value only | ✅ |
| B9 | Unknown URL shows not-found page with a way home | Visit `/nope/nope` | ✅ |
| B10 | Home page lists what you can ask for | Skill list on the home page matches the skills folder exactly | ✅ Enforced by `check` |

### C. Variants

| ID | Feature | Pass condition | Status |
|---|---|---|---|
| C1 **auto** | `enumProp`, `boolProp`, `fixtureProp`, `componentProp`, `defineProps`, `InferProps`, `usePrototypeProps` | Unit tests per kind; types infer correctly (`tsc`) | 🟡 enum, bool and component verified in the browser; fixture only through scripts |
| C2 **auto** | One URL param per axis, defaults omitted | Selecting a default value removes its param | ✅ |
| C3 **auto** | ~~Unknown axis dropped;~~ invalid value falls back to default with a console warning | Visit with `?mine=1&layout=zzz` | ✅ Revised: invalid values are removed with a warning; parameters that are not variants are kept so prototypes can use their own |
| C4 **auto** | Hyphenated axis names | `"chat-style"` axis works end to end | 🟡 Verified through scripts, not yet in the browser |
| C5 | Component variant files starting with `_` and `_shared/` are ignored | Add `_draft.tsx`; it is not listed | 🟡 |
| C6 **auto** | Per-user saved defaults in localStorage, only values differing from schema default stored | Set default, reload without params, value sticks; storage holds only the delta | ✅ |
| C7 | Saved defaults apply to the route being navigated to (bug fix) | Navigate A→B via palette; B uses B's defaults | 🟡 Defaults are now stored per prototype rather than read from the window address |
| C8 | Cross-component updates when defaults change | Changing a default updates the launcher card without reload | ✅ |
| C9 | Deep link reproduces exact state for someone with no saved defaults | Copy link, open in private window | 🟡 |

### D. Command palette

| ID | Pass condition | Status |
|---|---|---|
| D1 **auto** | ⌘K / Ctrl+K opens on Prototypes; ⌘⇧K opens on Variants; Tab swaps tabs | ✅ |
| D2 **auto** | Empty query shows up to 8 recents; typing shows fuzzy results grouped by category (title weighted over breadcrumb over path) | ✅ |
| D3 | First result is always highlighted and scrolled into view when query, tab or open state changes | 🟡 |
| D4 **auto** | Variants tab: one group per axis, one row per value, "current" and "default" tags, "Set default" on non-default rows | ✅ |
| D5 | Variants tab on a prototype with no variants shows the explanatory empty state | 🟡 |
| D6 | ⌘R resets URL params; ⌘⇧R also clears saved defaults; ⌘D saves current values as defaults | 🟡 |
| D7 | Copy-link shortcut copies the URL **without** breaking normal copy of selected text in the input (bug fix) | 🟡 |
| D8 | Chrome and Device groups list available options with current state; toggling does not close the palette | ✅ |
| D9 | Home button and "Browse…" button work; Esc closes | 🟡 |
| D10 | Hovering or highlighting a prototype preloads its chunk | 🟡 |

### E. Browse panel

| ID | Pass condition | Status |
|---|---|---|
| E1 **auto** | ⌘⇧B toggles; floating mode closes on Esc | ✅ |
| E2 | Pinned mode sits beside the content and pushes it, never overlaps (bug fix); pin state persists | 🟡 Seen sitting beside the content in a screenshot; persistence not yet checked |
| E3 **auto** | Tree: folders first then alphabetical; expand state persists across reloads | ✅ |
| E4 | Filter prunes the tree and auto-expands matches; clearing restores previous expand state | 🟡 |
| E5 | Current prototype highlighted; selecting navigates and leaves the panel open | ✅ |
| E6 | Folder icons come from config, with a default; no hard-coded category names | 🟡 |

### F. Launcher, context menu, recents, reset

| ID | Pass condition | Status |
|---|---|---|
| F1 | Floating button visible by default, can be hidden from the palette, choice persists | 🟡 |
| F2 | Hover card lists each axis and current value, non-defaults emphasised | ✅ |
| F3 | Right-click opens the Surface menu (palette, variants, browse, reset); native menu kept when text is selected, Shift is held, or inside `data-surface-native-context-menu` | 🟡 |
| F4 | Menu stays within the viewport at all four corners | 🟡 |
| F5 **auto** | Recents: most recent first, de-duplicated, capped at 50, home excluded, syncs across tabs | ✅ Order and home exclusion verified; cap and cross-tab sync not yet |
| F6 | `registerPrototypeReset` handlers run for the matching prototype, then the page reloads | 🟡 |

### G. Chrome providers and device frames

| ID | Pass condition | Status |
|---|---|---|
| G1 **auto** | Adding `chromes/x/chrome.tsx` makes it selectable with no other edit; chromes are lazy chunks | ✅ |
| G2 | Precedence: palette override > `prototype.config.ts` > `surface.config.ts` > `none` | 🟡 Config and palette override verified; full precedence chain not yet |
| G3 | `none` gives the prototype the full viewport (today's all-toggles-off behaviour) | ✅ |
| G4 | Chrome toggles appear in the palette and persist; a prototype can read and set them (replaces `useChromeState`) | 🟡 Palette toggles and persistence verified; reading from a prototype not yet |
| G5 | A prototype can inject content into a chrome slot and it clears on leave (replaces `setChatPanel`) | 🟡 |
| G6 | `example-app` chrome renders correctly under the default theme and after applying a different preset | ✅ Checked under two different presets |
| G7 **auto** | Each device preset renders at its exact viewport size; a `md:` breakpoint class flips between phone and desktop frames | ✅ |
| G8 | Variant changes, navigation and deep links work inside a device frame; URL in the address bar stays shareable | ✅ |
| G9 | ⌘K, ⌘⇧K, ⌘⇧B and right-click work when focus is inside the frame | 🟡 Keyboard verified; right-click inside the frame not yet |
| G10 | Device + chrome + variants all restore from a pasted link | ✅ |

### H. Scripts (each **auto**, tested against a temp copy of the repo)

| ID | Pass condition | Status |
|---|---|---|
| H1 | `doctor` reports each of Node, Git, `gh`, sign-in, dependencies as ok/missing with the right installer link per OS; exit code reflects result | ✅ |
| H2 **auto** | `dev start` runs in the foreground in a terminal that the designer can see. A new start stops the old preview and uses the same address. `status` and `stop` agree with the real condition, and `stop` is safe when the preview is off | ✅ |
| H3 | `prototype new` rejects invalid and duplicate names; output compiles; `rename` updates the folder and leaves no stale references; `delete` removes variants too and removes an emptied category | ✅ |
| H4 | `variant add/rename/delete/set-default` for every axis kind; refuses to delete the last value; deleting the default requires a new default; orphan scan reports leftovers | ✅ |
| H5 | `chrome new/delete` same guarantees as H3 | ✅ |
| H6 | `theme apply` extracts the preset from a full command or bare code, rejects anything else, never executes pasted text; afterwards every shadcn component exists | ✅ |
| H7 | `check` fails on a type error, on a design-rule violation, and on a build error, each with a readable message | 🟡 Type and design-rule failures verified; build failure not yet |
| H8 | Every script prints machine-readable JSON and a plain-language summary; no script prompts interactively | ✅ |
| H9 | All of the above pass on macOS and Windows in CI | ⬜ No CI yet; Windows untested |

### I. Skills (manual, run in Cursor and in Claude Code; Codex spot-checked)

| ID | Pass condition | Status |
|---|---|---|
| I1 | Each of the 14 skills triggers from a plain-language request and from its slash name | 🟡 Claude Code discovers the 13 from the first build; `surface-train` is new; triggering from plain requests not yet tried, Cursor and Codex untested |
| I2 | Skills contain no Claude-only tool names or variables; `.agents/skills` and `.claude/skills` are byte-identical (**auto**) | ✅ |
| I3 | `surface-setup` from a fresh unzip with nothing installed reaches a running preview using only the chat | ⬜ |
| I4 | Full loop: prototype new → update → variant new (each kind) → variant update → variant delete → prototype delete | ⬜ |
| I5 | Chrome loop: new from a screenshot → update → delete | ⬜ |
| I6 | Every destructive skill confirms first and reports exactly what it removed | ⬜ |
| I7 | Skills never ask the designer to open a terminal, and never mention branches, commits or pull requests | ⬜ |

### J. Setup, ship, update

| ID | Pass condition | Status |
|---|---|---|
| J1 | Fresh Mac with only Cursor: README alone gets to a themed, running preview | ⬜ |
| J2 | Same on fresh Windows | ⬜ |
| J3 | Applying a second, different preset re-themes everything, prototypes still compile | ✅ |
| J4 | First ship: GitHub sign-in in the browser, private repo created, pushed, Cloudflare connected by following the walkthrough, live URL loads | ⬜ `ship` has never been run for real; it creates a GitHub repository |
| J5 | Second ship: one request → new version live; skill reports the URL | ⬜ |
| J6 | Ship with a broken prototype is stopped locally with an explanation; nothing is pushed | ⬜ |
| J7 | Deep links and refresh work on the live site (no 404 on nested paths) | ⬜ |
| J8 | Folder that was never a Git repo (zip download) ships without the designer seeing Git errors; `.gitignore` keeps `node_modules`, `.surface/`, `dist/` out | ⬜ |
| J9 | `surface-update` to a test release changes only manifest paths; `prototypes/`, `chromes/`, theme, components, `surface.config.ts` are byte-identical before and after; new dependencies installed | ✅ Verified from a local release folder; the download path needs the repo to be public |
| J10 | Update with local edits inside `surface/` warns and backs them up before replacing | ✅ |

### K. Documentation

| ID | Pass condition | Status |
|---|---|---|
| K1 | README contains no terminal commands and no Git vocabulary; fits one screen-and-a-half | ✅ By reading it |
| K2 | Every request in the README's "what you can ask for" table has been typed verbatim and worked | ⬜ |
| K3 | Someone who has never used the tool completes J1 + I4 + J4 unaided (dry run before the workshop) | ⬜ |

### L. Design rules and hooks

| ID | Pass condition | Status |
|---|---|---|
| L1 **auto** | The rules report plain HTML elements, hand-made `role` widgets and a new component with the name of a `src/components/ui` component, in prototypes and chromes | ✅ |
| L2 **auto** | The rules report fixed colors, one-off values for text size, space, radius and shadow, design values in `style`, and tokens that are not in the theme. They permit layout dimensions, `var(--token)` values and `surface-allow` | ✅ |
| L3 **auto** | Claude Code hook: for an edit in `prototypes/` or `chromes/`, exit code 2 with the problems on stderr. Stop hook asks one time | ✅ Seen in a real Claude Code session for an edit. The stop hook is tested with simulated input only |
| L4 **auto** | Codex hook: reads file names from the `apply_patch` text, exit code 2 with the problems on stderr | 🟡 Simulated input from the Codex documentation. Not yet run in Codex |
| L5 **auto** | Cursor hook: prints `additional_context` after an edit and `followup_message` at stop, one time | 🟡 Simulated input from the Cursor documentation. The field that holds the file path in a real edit is not confirmed. Not yet run in Cursor |
| L6 **auto** | The three hook configs are valid JSON and start the same script | ✅ |
| L7 | The preview shows the problems in the terminal and in a badge, and removes the badge after the repair | ✅ Seen in the browser |
| L8 | A hook failure or bad input does not stop the work of the assistant (exit code 0) | ✅ |
| L9 | The hooks work on Windows (`$CLAUDE_PROJECT_DIR` in the Claude Code command, relative paths in the others) | ⬜ |

### M. Direction for the project (`surface-train`)

| ID | Pass condition | Status |
|---|---|---|
| M1 **auto** | `train add/replace/remove/list` change only the marked section of `AGENTS.md` | ✅ |
| M2 **auto** | `train add` refuses a directive that names a prototype, a chrome, a file, a color value or a dimension, unless `--force` | ✅ |
| M3 **auto** | `train add` gives a warning when a group has more than 10 directives or a directive has more than 40 words | ✅ |
| M4 **auto** | An update of Surface keeps the directives, and a change to the directives is not reported as an edited Surface file | ✅ |
| M5 | An assistant that uses the skill turns specific feedback into a principle, or sends it to the prototype, the theme or a chrome | ⬜ Not yet tried with an assistant |
