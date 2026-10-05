---
name: chrome-delete
description: Deletes a Surface chrome. Use when the user asks you to delete or remove a chrome, an app shell or a navigation frame.
---

# Delete a chrome

Read `AGENTS.md` first.

1. Run `npm run surface -- chrome delete <name>`. This command does not delete. It shows the files and the prototypes that use the chrome.
2. Tell the designer what the command will remove and which prototypes use the chrome. Wait for a clear "yes".
3. Run the same command with `--yes`.
4. For each prototype in `prototypesStillPointingAtIt`, change or remove its `chrome:` line.
5. If `wasProjectDefault` is `true`, change `defaultChrome` in `surface.config.ts`. Use `"none"` or a chrome that the designer selects.
6. Run `npm run surface -- check --no-build`. Repair each problem.
