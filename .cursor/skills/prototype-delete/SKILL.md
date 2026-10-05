---
name: prototype-delete
description: Deletes a Surface prototype and all its files. Use when the user asks you to delete or remove a prototype.
---

# Delete a prototype

Read `AGENTS.md` first.

1. Run `npm run surface -- prototype list`. Find the one prototype that the designer refers to. Ask if you are not sure.
2. Run `npm run surface -- prototype delete <category/name>`. This command does not delete. It shows the files.
3. Tell the designer what the command will remove: the prototype, its pages and its variants.
4. Tell the designer that you cannot get the files back, unless a published copy exists.
5. Wait for a clear "yes".
6. Run the same command with `--yes`.
7. Tell the designer what is gone. Use the `deleted` list.
8. If a different prototype has a link to this one, tell the designer. Offer to correct the link.
