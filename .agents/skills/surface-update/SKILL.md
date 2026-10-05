---
name: surface-update
description: Updates Surface (the preview, the scripts and the skills) to the latest version. It does not change the prototypes, the chromes or the theme of the designer. Use when the user says "update Surface" or asks for the latest version.
---

# Update Surface

Read `AGENTS.md` first.

1. Run `npm run surface -- update --dry-run`. It shows the current version, the new version, and the Surface files that someone changed on this computer.
2. If Surface is already at the latest version, tell the designer. Stop here.
3. If `editedFilesThatWouldBeReplaced` has items, tell the designer that the update replaces those files. Tell them that the update keeps copies in `.surface/backup/`. Wait for approval.
4. Run `npm run surface -- update`. It replaces only the files of Surface. It does not change `prototypes/`, `chromes/`, `src/` or `surface.config.ts`.
5. Start the preview again (`surface-start` skill).
6. Run `npm run surface -- check --no-build`. Repair each problem.
7. Tell the designer the old version and the new version. Give them the address of the preview.
