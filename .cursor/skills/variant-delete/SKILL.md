---
name: variant-delete
description: Removes one option from a variant, or removes a full variant, from a Surface prototype. Use when the user asks you to delete or remove a variant, an option or an alternative.
---

# Delete a variant

Read `AGENTS.md` first.

1. Run `npm run surface -- variant list <category/name>`. Find out if the designer refers to one option or to the full variant. Ask if it is not clear.
2. Run the command without `--yes`. This does not delete. It shows what the command will remove.
   - One option: `npm run surface -- variant delete <prototype> <variant> <option>`
   - Full variant: `npm run surface -- variant delete <prototype> <variant>`
3. If the result tells you that the option is the default, ask the designer for the new default. Add `--new-default <option>`.
4. Tell the designer what the command will remove. Wait for a clear "yes".
5. Run the same command with `--yes`.
6. Do the instruction in `next` from the result. Correct the code in `stillMentionedIn`.
7. After you remove a full variant, remove it from the `usePrototypeProps(config)` line in `prototype.tsx`. Ask the designer which design stays on the page.
8. Run `npm run surface -- check --no-build`. Repair each problem.
9. Tell the designer: "Old links that use this option now show the default."
