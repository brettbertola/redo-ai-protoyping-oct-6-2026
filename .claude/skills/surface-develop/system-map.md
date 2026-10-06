# Map of Surface

This document shows where each part of Surface is. The `surface-develop` skill uses it. The test IDs refer to `docs/migration-checklist.md`.

## The three layers

| Layer | Folder | What it is |
|---|---|---|
| The preview | `surface/` | A React app. It finds the prototypes and the chromes, and it shows them with the controls of Surface. |
| The scripts | `scripts/` | Node scripts. They make, rename and delete items, start the preview, run the checks and publish. |
| The instructions | `AGENTS.md`, `.agents/skills/` | The text that tells an AI assistant how to use the first two layers. |

A feature is complete only when the three layers agree.

## How a screen gets to the browser

1. `surface/main.tsx` starts the app. `surface/router.tsx` makes one route for each prototype and each page.
2. `surface/lib/registry.ts` finds the files with `import.meta.glob`. It loads each `prototype.config.ts` at the start. It loads the other files when they are necessary.
3. `surface/Shell.tsx` shows the stage and the controls. With `_bare` in the address, it shows only the stage.
4. `surface/stage/Stage.tsx` puts the layers in this sequence: device, then chrome, then prototype.
5. With a device, `DeviceFrame.tsx` shows an `<iframe>` of the same address with `_bare`. `BareBridge.tsx` runs in the frame and sends messages to the shell.
6. In the prototype, `usePrototypeProps(config)` reads the address and the saved defaults. It gives the value of each variant.

## Areas

| Area | Files in the preview | Files in the scripts | Tests | Skills and documents |
|---|---|---|---|---|
| Interface for prototypes | `surface/index.ts`, `surface/config.ts` | None | C1 | `AGENTS.md` (sections "A prototype", "A chrome") |
| Finding and loading | `surface/lib/registry.ts`, `surface/router.tsx`, `surface/lib/prototype-tree.ts` | `scripts/lib/project.mjs`, `scripts/commands/prototype.mjs` | B1 thru B10, H3 | `prototype-*` skills |
| Variants | `surface/config.ts`, `surface/lib/variants.ts`, `surface/lib/variant-defaults.ts` | `scripts/commands/variant.mjs`, `scripts/lib/config-ast.mjs`, `scripts/lib/project.mjs` | C1 thru C9, D4, H4 | `variant-*` skills |
| Chrome system | `surface/lib/stage-state.tsx`, `surface/stage/ChromeHost.tsx` | `scripts/commands/chrome.mjs` | G1 thru G6, H5 | `chrome-*` skills, `chromes/example-app/chrome.tsx` |
| Devices and the frame | `surface/lib/devices.ts`, `surface/stage/DeviceFrame.tsx`, `surface/stage/BareBridge.tsx`, `surface/stage/messages.ts` | None | G7 thru G10 | `AGENTS.md` (device list) |
| Command palette | `surface/components/CommandPalette.tsx`, `surface/components/command.tsx`, `surface/lib/recents.ts` | None | D1 thru D10, F5 | `README.md` (section "Controls in the preview") |
| Browse panel | `surface/components/BrowsePanel.tsx`, `surface/lib/browse-state.tsx` | None | E1 thru E6 | None |
| Launcher, menu, reset | `surface/components/Launcher.tsx`, `surface/components/PrototypeContextMenu.tsx`, `surface/lib/prototype-reset.ts` | None | F1 thru F6 | None |
| Home page | `surface/pages/Home.tsx`, `surface/pages/requests.ts`, `surface/pages/NotFound.tsx` | `scripts/commands/check.mjs` (it compares the list with the skills folder) | B9, B10 | None |
| Saved state | `surface/lib/store.ts` and each file that has a `surface:…:v1` key | None | C6, E3, G4 | None |
| The preview command | `surface/components/DesignProblems.tsx` | `scripts/commands/dev.mjs` | H2, W1 thru W3, L7 | `surface-start` skill |
| Design rules and hooks | `surface/components/DesignProblems.tsx` | `scripts/lib/design-rules.mjs`, `scripts/hooks/design-check.mjs`, `scripts/commands/lint.mjs`, the three hook configs | L1 thru L9, H7 | `AGENTS.md` (section "Design rules") |
| Direction for the project | None | `scripts/lib/direction.mjs`, `scripts/commands/train.mjs` | M1 thru M5 | `surface-train` skill |
| User tests | None | `scripts/commands/test.mjs`, `scripts/lib/test-browser.mjs`, `scripts/lib/user-tests.mjs` | N1 thru N8 | `test-*` skills |
| Setup and theme | None | `scripts/commands/doctor.mjs`, `scripts/commands/theme.mjs` | H1, H6 | `surface-setup`, `surface-doctor` skills |
| Publish | None | `scripts/commands/ship.mjs`, `scripts/commands/github.mjs`, `scripts/commands/check.mjs` | J4 thru J8, H7 | `surface-ship` skill |
| Update and release | `surface/manifest.json` | `scripts/commands/update.mjs`, `scripts/commands/manifest.mjs` | J9, J10, M4 | `surface-update` skill |
| Skills | `surface/pages/requests.ts` | `scripts/commands/skills.mjs` | I1 thru I7 | `README.md` (section "Commands") |

## Parameters and keys that Surface owns

| Item | Where it is defined | Function |
|---|---|---|
| `_chrome` | `surface/lib/variants.ts` | The chrome that the person selected for this link |
| `_device` | `surface/lib/variants.ts` | The device that the person selected for this link |
| `_bare` | `surface/lib/variants.ts` | Shows the screen without the controls. The device frame and the user tests use it |
| `surface:variant-defaults:v1` | `surface/lib/variant-defaults.ts` | The saved defaults of each prototype. Only values that are different from the config |
| `surface:stage:v1` | `surface/lib/stage-state.tsx` | The chrome and the device that the person selected for each prototype |
| `surface:chrome-toggles:v1` | `surface/lib/stage-state.tsx` | The toggles of each chrome |
| `surface:launcher:v1` | `surface/lib/stage-state.tsx` | Shows or hides the launcher |
| `surface:browse:pinned:v1`, `surface:browse:expanded:v1` | `surface/lib/browse-state.tsx` | The condition of the browse panel |
| `surface:recents:v1` | `surface/lib/recents.ts` | The prototypes that the person opened most recently |
| `surface:*` messages | `surface/stage/messages.ts` | Messages between the device frame and the shell |
| `/__surface` | `scripts/commands/dev.mjs` | An address of the preview on this computer. It identifies the preview and gives the design rule problems |

## Who owns a file

- The `OWNED` list in `scripts/commands/manifest.mjs` contains each file and folder of Surface. An update replaces them.
- All other files belong to the designer: `prototypes/`, `chromes/`, `src/`, `surface.config.ts`, `components.json`, `user-tests/`. An update does not change them.
- `package.json` is shared. An update adds the packages and the scripts of Surface, and it keeps the others.
- `AGENTS.md` belongs to Surface, but not its "Direction for this project" section.
- `.surface/` contains the state of this computer and the backup copies. It is not published.

## Scripts: the parts that you use again

| Function | File | Use |
|---|---|---|
| `stop(message, details)` | `scripts/lib/util.mjs` | Ends a command with a message for the designer |
| `run`, `runBin` | `scripts/lib/util.mjs` | Run a program with no shell. They do not throw. Read `.ok` |
| `readState`, `writeState` | `scripts/lib/util.mjs` | Read and write a small file in `.surface/` |
| `assertName`, `slugify`, `titleize` | `scripts/lib/util.mjs` | Make and examine the names of items |
| `mainRoot` | `scripts/lib/util.mjs` | Gives the main folder when the assistant works in a second folder of the project |
| `resolvePrototype`, `describeAxes` | `scripts/lib/project.mjs` | Find a prototype and read its variants |
| `config-ast.mjs` | `scripts/lib/` | Reads and edits the `variants` block of a `prototype.config.ts` |

A command is a file in `scripts/commands/` that exports `run(args)`. It returns an object with `summary`. Add its name to `COMMANDS` in `scripts/surface.mjs`.
