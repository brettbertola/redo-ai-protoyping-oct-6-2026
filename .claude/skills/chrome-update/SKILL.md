---
name: chrome-update
description: Changes a Surface chrome that exists, or changes the chrome that a prototype uses. A chrome is the navigation and frame around a prototype. Use when the user asks you to edit the chrome, the navigation, the sidebar or the header, or to use a different chrome.
---

# Change a chrome

Read `AGENTS.md` first.

1. Run `npm run surface -- chrome list`. It shows each chrome and the prototypes that use it.
2. Read `chromes/<name>/chrome.tsx`. Then make the change.
3. A change to a chrome changes each prototype that uses it. If the change is large, tell the designer before you make it.
4. To change which chrome a prototype uses, edit `chrome:` in its `prototype.config.ts`. To change the default, edit `defaultChrome` in `surface.config.ts`. The value `"none"` gives no chrome.
5. Run `npm run surface -- check --no-build`. Repair each problem.
6. Give the designer the address of a prototype that uses the chrome. Examine the phone size also (⌘K, then "Phone").
