---
name: prototype-new
description: Makes a new Surface prototype. Use when the user asks you to make, create, start or add a prototype, screen, page, flow or mock-up.
---

# Make a new prototype

Read `AGENTS.md` first.

1. **Find the necessary data.** You must know the function of the screen and its location as `category/name`.
   - Run `npm run surface -- prototype list` to see the categories and the chromes.
   - Use lowercase words with dashes. Example: `checkout/payment-form`.
   - Select the category and the name. Tell the designer your selection. Ask only if the request is not clear.
2. **Make the prototype.** Run `npm run surface -- prototype new <category/name> --description "<one sentence>"`.
   - Add `--chrome <name>` to put the prototype in a chrome.
   - Add `--device phone`, `--device tablet` or `--device desktop` if the screen is for that device.
3. **Make the design** in `prototypes/<category/name>/prototype.tsx`. Obey the design rules in `AGENTS.md`.
   - Put parts and sample data in files adjacent to that file.
   - For a flow with more than one screen, add each screen as `pages/<page-name>.tsx`. Its address is `/<category>/<name>/<page-name>`.
4. **Prepare for variants.** If the designer gave alternatives, make that section a component. Then tell the designer that `/variant-new` adds a variant.
5. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem.
6. **Show the result.** Make sure that the preview is on (`surface-start` skill). Give the designer the full address of the new prototype.
