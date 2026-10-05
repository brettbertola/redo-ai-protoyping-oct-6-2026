---
name: variant-update
description: Changes a variant of a Surface prototype. It edits the design of an option, renames an option, or changes the default option. Use when the user asks you to edit or rename a variant, or to make an option the default.
---

# Change a variant

Read `AGENTS.md` first.

1. Run `npm run surface -- variant list <category/name>`. It shows the variants, the options and the defaults.
2. Do the task that the designer gave:

   | Task | Procedure |
   |---|---|
   | Edit the design of an option | For a `component` variant, edit `prototypes/<prototype>/variants/<variant>/<option>.tsx`. For other kinds, edit the related code in `prototype.tsx`. |
   | Rename an option | Run `npm run surface -- variant rename <prototype> <variant> <old> <new>`. Then correct the code in `stillMentionedIn`. |
   | Change the default | Run `npm run surface -- variant set-default <prototype> <variant> <option>`. For a `bool` variant, use `true` or `false`. |
3. Run `npm run surface -- check --no-build`. Repair each problem.
4. Give the designer the address. Tell them which option shows first.

Note: the "Set default" button in the preview changes the default only in the browser of that person. This skill changes the default for all persons.
