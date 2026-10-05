---
name: prototype-update
description: Changes a Surface prototype that exists. Use when the user asks you to edit, change, adjust, rename or move a prototype or one of its pages, or to change its chrome or device.
---

# Change a prototype

Read `AGENTS.md` first.

1. **Find the prototype.** Run `npm run surface -- prototype list`. If more than one prototype agrees with the request, ask the designer which one.
2. **Read the files.** Read `prototype.config.ts`, `prototype.tsx` and the files adjacent to them. Include `variants/` and `pages/`.
3. **Make the change.** Obey the design rules in `AGENTS.md`.
   - If the request is not clear, give two or three specific alternatives. Let the designer select one.
   - To rename or move the prototype, run `npm run surface -- prototype rename <current> <new-category/new-name>`. Then correct each link in `stillMentionedIn`.
   - To change the chrome or the device, edit `chrome:` or `device:` in `prototype.config.ts`.
   - To add, rename or remove a variant, use the variant skills.
4. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem.
5. **Show the result.** Make sure that the preview is on. Give the designer the address.
