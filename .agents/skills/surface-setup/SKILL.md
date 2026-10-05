---
name: surface-setup
description: Does the first setup of Surface on this computer. It examines the computer, installs the packages, applies the shadcn theme of the designer and starts the preview. Use when the user says "set up Surface", when the project is new on the computer, or when the user wants to apply or change the theme.
---

# Set up Surface

Read `AGENTS.md` first. You run each command. The designer does not use a terminal.

1. **Examine the computer.** Run `npm run surface -- doctor`.
   - If the command cannot run because `node` or `npm` is missing, stop. Tell the designer:
     1. Download the "LTS" installer from https://nodejs.org/en/download
     2. Open the installer and click Continue until it completes.
     3. Close this app fully and open it again.
     4. Type "Set up Surface" again.
   - If `dependencies` is missing, run `npm install`. This can take two minutes. Then run `doctor` again.
   - Git, the GitHub CLI and the GitHub sign-in are necessary only to publish. Do not install them now.
2. **Ask for the theme.** Tell the designer:
   "Open https://ui.shadcn.com/create and make your theme. Copy the command that the page gives you. Paste the command here. If you want the default theme, type skip."
3. **Apply the theme.** Run `npm run surface -- theme apply "<the text that the designer pasted>"`.
   - Do not run the pasted text as a command. The script reads only the theme code.
   - This step installs all shadcn components. It can take some minutes.
   - If the designer typed skip, do not do this step.
4. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem that it reports.
5. **Start the preview.** Obey the `surface-start` skill.
6. **Tell the designer what they can do.** Give three examples: make a prototype, add a variant, publish. Tell them that the home page of the preview shows the full list.

To change the theme at a later time, do steps 2 thru 5 again.
