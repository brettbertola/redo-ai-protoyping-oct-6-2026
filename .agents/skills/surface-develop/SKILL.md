---
name: surface-develop
description: Changes Surface itself. This includes the preview, the controls, the variant system, the chrome system, the scripts, the design rules, the hooks and the skills. Use when the user wants to change how Surface works for all prototypes, such as how variants work, how a chrome loads, what the command palette shows, a new device, a new command or a new skill. Do not use it for a change to one prototype or one chrome of the designer.
---

# Change Surface

Read `AGENTS.md` first. Then read `system-map.md` in this folder. It shows the files, the tests and the documents of each area.

`AGENTS.md` tells you not to edit `surface/`, `scripts/`, `.agents/`, `.claude/`, `.cursor/` and `.codex/`. This skill is the exception. It applies only while you do this procedure.

## 1. Make sure that the change is a change to Surface

A change to Surface is the last alternative. First, find out if a different skill does the task.

| The person wants | Use |
|---|---|
| A change to one prototype, one page or one option | `prototype-update`, `variant-update` |
| A change to one chrome in `chromes/` (its navigation, its header, its toggles) | `chrome-update` |
| A rule for all future prototypes | `surface-train` |
| Different colors, fonts or component style | `surface-setup` (it applies a theme) |
| A different project name, default chrome, default device or folder icon | Edit `surface.config.ts` |
| A new shared component | Make it in `src/components/` |
| A change to how Surface works for all prototypes | This skill |

"Change the chrome" has two meanings. A chrome in `chromes/` belongs to the designer: use `chrome-update`. How Surface finds, loads and controls a chrome belongs to Surface: use this skill.

## 2. Find out who gets the change

Ask this question if the answer is not clear: "Is this change for all persons who use Surface, or only for this project?"

- **Only for this project.** An update of Surface replaces the files that you change. The update keeps copies in `.surface/backup/`. Tell the person this before you start. Wait for approval. Do not run `manifest build`. Then the update can find the changed files and keep the copies.
- **For all persons who use Surface.** This folder is the source of Surface. Do steps 3 thru 8. Then do section "Release".

## 3. Make a plan before you edit

1. Find the area of the change in `system-map.md`. Read each file in the row of that area.
2. Read the tests of that area. They show the behavior that must not change.
3. Write the list of all places that the change touches. Use section "One change, many places" below.
4. If the change breaks a prototype that exists, or a link that a person shared, tell the person. Wait for approval.

## 4. Obey the rules of the system

These rules keep Surface fast and safe. A test or a check does not find each of them. Thus you must examine them.

**The interface for prototypes**

1. `surface/index.ts` is the interface that prototypes and chromes import from `@surface`. Do not remove or rename an item in it. Add items.
2. If you must break the interface, change each prototype and chrome in this project in the same change. Tell the person that other projects break at their next update.
3. `surface/config.ts` loads for each prototype when the preview opens. Do not import React code or a large package in it. Import types only.

**Loading**

4. Only `prototype.config.ts` files load at the start. A screen, a page, an option of a "component" variant and a chrome each load when they are necessary. Keep each `import.meta.glob` in `surface/lib/registry.ts` lazy, but not the one for the configs.
5. The preview finds prototypes and chromes from their folders. Do not add a list that a person must update.
6. In `pages/` and `variants/`, ignore files and folders that start with `_`.

**The address**

7. The address contains the full state of the screen. A link must show the same screen to each person.
8. The address does not contain default values. Keep this in `cleanVariantSearch` and `buildVariantSearch`.
9. Surface owns the parameters `_chrome`, `_device` and `_bare`. Start each new parameter of Surface with `_`. Add it as a constant in `surface/lib/variants.ts`.
10. Do not remove a parameter that is not a variant. A prototype can use its own parameters.

**Saved state**

11. Saved state is in the local storage of the browser. Each key has the form `surface:<name>:v1`. Use `createStore` in `surface/lib/store.ts` for a new key.
12. If you change the shape of a saved value, increase the number in the key. Old values must not cause an error.
13. Saved state changes only what one person sees. It must not change what a shared link shows to a person who has no saved state.

**The device frame**

14. A device frame is an `<iframe>` that shows the same address with `_bare`. In that mode, `Shell.tsx` shows only the chrome and the prototype.
15. The frame and the shell communicate only with the messages in `surface/stage/messages.ts`. For a new message, add it to the `FrameMessage` type. Then handle it in `BareBridge.tsx` and in `DeviceFrame.tsx`.
16. Each control of Surface must work when the focus is in the frame: the keys, the right-click menu and the navigation.

**The controls of Surface**

17. Code in `surface/` must not import from `src/components/ui/`. A theme change replaces that folder. Use the parts in `surface/components/command.tsx` or a Radix primitive.
18. Use the theme tokens for color in the controls. Then the controls agree with each theme.
19. Some code is only for the preview on this computer. Example: `DesignProblems.tsx`. It must do nothing in a published site.

**The scripts**

20. Each script runs with `node` only, on Mac and on Windows. Do not use a shell command, bash or a symbolic link. Use `run` and `runBin` from `scripts/lib/util.mjs`.
21. Each command prints one JSON object with `ok` and `summary`. Only `dev start` prints text. Write the `summary` for the designer, in Simplified Technical English.
22. For an error that you expect, call `stop("<message>")`. The message goes to the designer.
23. A command does not ask a question in the terminal. A command that deletes needs `--yes`.
24. To change a `prototype.config.ts` from a script, use `scripts/lib/config-ast.mjs`. Do not use text replacement.
25. Do not run text that a person pasted. See `theme.mjs` for the pattern.
26. Put shared values in one location. Example: the design rules are only in `scripts/lib/design-rules.mjs`.

**Documents and skills**

27. Write each skill in `.agents/skills/`. Do not edit `.claude/skills/` or `.cursor/skills/`. They are copies.
28. A skill must not name a tool of only one assistant.
29. Write `AGENTS.md`, `README.md`, each skill and each `summary` in Simplified Technical English. Use the words in the table in `AGENTS.md`.
30. Do not edit the "Direction for this project" section of `AGENTS.md`, or the two marks around it. The designer owns it.
31. `README.md` has no terminal commands.

## One change, many places

Most changes touch more than one area. Examine each line that applies.

| If you change | Change these also |
|---|---|
| A variant kind or how variants resolve | `surface/config.ts`, `surface/lib/variants.ts`, `surface/lib/registry.ts`, the palette and the launcher, `scripts/commands/variant.mjs`, `scripts/lib/config-ast.mjs`, `scripts/lib/project.mjs`, `scripts/lib/user-tests.mjs`, the `variant-*` skills, the example prototypes |
| The chrome system (toggles, slots, precedence) | `surface/config.ts`, `surface/lib/stage-state.tsx`, `surface/stage/ChromeHost.tsx`, the palette, `scripts/commands/chrome.mjs`, the `chrome-*` skills, `chromes/example-app/chrome.tsx` |
| The devices | `surface/lib/devices.ts`, `surface/stage/DeviceFrame.tsx`, the device list in `AGENTS.md`, the viewports in `scripts/lib/user-tests.mjs` |
| The interface in `surface/index.ts` | The examples in `AGENTS.md`, each skill that shows that code, each prototype and chrome in the project |
| A design rule | `scripts/lib/design-rules.mjs` only for the code. Then the "Design rules" section of `AGENTS.md` |
| A command or its options | `scripts/surface.mjs` (the `COMMANDS` list), the "Commands" section of `AGENTS.md`, each skill that runs the command |
| A skill (new, renamed or deleted) | `surface/pages/requests.ts`, the table in `README.md`, then `npm run surface -- skills sync` |
| A new file or folder of Surface at the top level | The `OWNED` list in `scripts/commands/manifest.mjs`. If it is not in the list, an update does not deliver it |
| A package | `package.json`. An update adds the packages of Surface to the project of the designer. Do not add a package if the installed ones can do the task |
| A hook | `scripts/hooks/design-check.mjs` and the three configs: `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json` |

The example prototypes in `prototypes/examples/` are also test data. The tests in `tests/shell.spec.ts` open them. If you change them, change the tests.

## 5. Make the change

1. Make the smallest change that does the task.
2. Write a comment only where the cause is not clear from the code. The comments in `surface/` and `scripts/` use plain English.
3. After you edit a skill, run `npm run surface -- skills sync`.

## 6. Add a test

1. Each feature has an ID in `docs/migration-checklist.md`. Example: `C2`. Each test name starts with the IDs that it shows.
2. For a new feature, add a row with a new ID and a pass condition. Then add a test with that ID.
3. For a changed feature, change the pass condition and the test in the same change.
4. Put a test of a script in `tests/scripts.test.mjs`. It runs the real commands on a temporary copy of the project.
5. Put a test of the preview in `tests/shell.spec.ts`. It uses a browser.
6. Mark a row ✅ only after you see the test pass.

## 7. Run the checks

Run these commands in this sequence. Repair each problem before the subsequent command.

1. `npm run surface -- check --no-build`
2. `npm run test:scripts`
3. `npm run test:shell`. It starts its own temporary preview at a different address. It does not stop the preview of the person.
4. `npm run surface -- check`. It also makes the files for publishing.

If a test fails that you did not expect, the change broke a rule. Do not change the test to make it pass. Find the cause.

## 8. Examine the result in the preview

1. Make sure that the preview is on. Use the `surface-start` skill.
2. Open a prototype that shows the change. Examine it with no chrome, in a chrome, and in a phone frame.
3. Copy the address. Open it in a private window. The screen must be the same.
4. Give the person the address. Tell them what you changed and what you did not examine.

## Release

Do this section only in the source of Surface, and only when the person asks for a release.

1. Increase `version` in `package.json`. An update does nothing if the version is the same.
2. Run `npm run surface -- manifest build`. It records each file of Surface in `surface/manifest.json`.
3. Run `npm test`.
4. Do the manual rows of `docs/migration-checklist.md` that the change touches.
