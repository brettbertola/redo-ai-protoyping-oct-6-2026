---
name: surface-doctor
description: Examines the Surface setup on this computer and repairs it. Use when the user types /surface-doctor, says "run the Surface doctor", says that Surface or the preview does not work, or when a command fails and the cause is not clear.
---

# Repair Surface

Read `AGENTS.md` first. You run each command. The designer does not use a terminal.

1. **Examine the computer.** Run `npm run surface -- doctor`.
   - If the command cannot run because `node` or `npm` is missing, stop. Tell the designer:
     1. Download the "LTS" installer from https://nodejs.org/en/download
     2. Open the installer and click Continue until it completes.
     3. Close this app fully and open it again.
     4. Type `/surface-doctor` again.
   - If `dependencies` is missing, run `npm install`. This can take two minutes. Then run `doctor` again.
2. **Examine the project.** Run `npm run surface -- check --no-build`. Repair each problem that it reports.
   - If the skills are not consistent, run `npm run surface -- skills sync`. Then run the check again.
   - Ask the designer only if a repair changes their design.
3. **Examine the preview.** Run `npm run surface -- dev status`.
   - If `running` is `false`, obey the `surface-start` skill.
   - If the text in the terminal of the preview shows that a package or a font is missing, run `npm install`. Then obey the `surface-start` skill again.
   - If the preview does not start after these steps, do not start it again. Tell the designer the cause in one sentence.
4. **Examine the items for publishing.** Read the checks with `needed: "sharing"` in the result of step 1: Git, the GitHub CLI and the GitHub sign-in.
   - Do not install these items now. The designer can make prototypes without them.
   - If an item is missing, tell the designer that `/surface-ship` installs it when they publish.
5. **Tell the designer the result.** Use one sentence for each item:
   - What was wrong.
   - What you repaired.
   - What remains, and the command that repairs it.
   Do not show the error text. If all items are good, tell the designer that Surface is ready. Give the address of the preview.
