---
name: variant-new
description: Adds a variant to a Surface prototype. It adds a new option to a variant that exists, or it makes a new variant. Use when the user asks for a variant, an alternative, an option, or a different version of a section.
---

# Add a variant

Read `AGENTS.md` first.

A **variant** is one property of a prototype that the designer can change. Example: `layout`.
An **option** is one value of a variant. Example: `cards` or `table`.

1. **Find the variants that exist.** Run `npm run surface -- variant list <category/name>`.
2. **Make the decision: new option or new variant.**
   - If a variant already controls this property, add an option to it.
   - If not, make a new variant. Select its kind:

   | Kind | Use |
   |---|---|
   | `component` | Different designs of one section. Each option is one file. |
   | `enum` | One of some named values. Example: `density` with `comfortable` and `compact`. |
   | `bool` | A property that is on or off. Example: `banner`. |
   | `fixture` | Different sample data. Example: `empty` and `full`. |
3. **Make it.** Use lowercase words with dashes.
   - New option: `npm run surface -- variant add <prototype> <variant> <option>`
   - New variant: `npm run surface -- variant add <prototype> <variant> --kind <kind> <first-option>`
   - A `bool` variant has no option name. Add `--default true` if it must start on.
4. **Make the design.** Do the instruction in `next` from the result.
   - `component`: the file `variants/<variant>/<option>.tsx` is an empty placeholder. Put the design there.
   - If you make a `component` variant from a section that exists, move that section into the file of the first option.
   - Other kinds: read the value in `prototype.tsx` with `usePrototypeProps(config)`. Make the page change with the value.
   - `fixture`: replace `() => ({})` in `prototype.config.ts` with the sample data.
5. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem.
6. **Show the result.** Give the designer the `url` from the result. Tell them that ⌘⇧K changes the variant (Ctrl+Shift+K on Windows).
