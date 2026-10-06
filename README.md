# Surface

Surface is a tool to make interactive prototypes. You tell an AI assistant what you want. The assistant makes it.

- You can compare different versions of a design.
- You can see a design in the frame of your product, and on a phone.
- You can share a design with a link.

You do not write code. You do not use a terminal.

## Before you start

Install these two items:

1. **An AI coding app.** Use [Cursor](https://cursor.com), [Claude Code](https://claude.com/claude-code) or Codex.
2. **Node.js.** Download the "LTS" installer from [nodejs.org](https://nodejs.org/en/download). Open it and click Continue until it completes.

## Set up Surface

This procedure takes approximately 10 minutes.

1. Open the [shadcn theme builder](https://ui.shadcn.com/create). Make a theme that looks like your product.
2. Copy the command that the theme builder gives you.
3. On this page, click the green **Code** button. Then click **Download ZIP**.
4. Open the ZIP file. Move the folder to a location that you can find again.
5. Open the folder in your AI app (**File → Open Folder**).
6. Type this command in the chat:

   > /surface-setup

7. When the assistant asks for the theme, paste the command from step 2.

Surface opens in your browser when the setup is complete.

## Start Surface

Do this each time that you open the project:

1. Type this command in the chat:

   > /surface-start

2. The assistant starts the preview in a terminal panel. The preview opens in your browser.
3. Keep the terminal panel open. The preview stops when the terminal panel closes.

To stop the preview, type `/surface-start stop`. If the preview does not load, type `/surface-start` again. This is always safe.

## Commands

Type a slash command. Then write what you want in your own words. These are examples. The home page of the preview shows all commands.

| You type | Result |
|---|---|
| `/prototype-new` a settings page with a profile form | A new prototype shows in the preview |
| `/prototype-update` settings: put the form in two columns | The assistant changes the prototype |
| `/variant-new` a header with a search bar | You get an alternative that you can select |
| `/variant-update` make the compact layout the default | A different option shows first |
| `/variant-delete` the old header option | The assistant deletes the variant |
| `/chrome-new` that looks like our app (add a screenshot) | The navigation of your product shows around your prototypes |
| `/prototype-update` show the checkout prototype on a phone | The prototype shows in a phone frame |
| `/surface-train` always show an empty state for a list | The assistant obeys this rule in all future prototypes |
| `/prototype-delete` the test prototype | The assistant asks for approval, then deletes it |
| `/surface-ship` | The assistant publishes your prototypes to a link |
| `/surface-update` | You get the latest version of Surface |

## Controls in the preview

| Keys | Function |
|---|---|
| ⌘K | Find a prototype. Select a chrome. Select a device size. |
| ⌘⇧K | Select a variant of the current prototype. |
| ⌘⇧B | See all prototypes. |
| Right-click | Open the same menu. |

On Windows, use Ctrl as an alternative to ⌘. The address bar always contains a link to the screen that you see.

## Share your prototypes

Type `/surface-ship`.

- The first time takes approximately 15 minutes. You make a free [GitHub](https://github.com) account and a free [Cloudflare](https://cloudflare.com) account. The assistant tells you each step.
- After the first time, `/surface-ship` takes one or two minutes.
- Each person who has the link can see the prototypes. Do not put real customer data in a prototype.

## If there is a problem

If the preview does not load, type `/surface-start`.

For other problems, tell the assistant what you see. Ask it to run the Surface doctor. The assistant examines your setup and repairs it.

---

For contributors: [AGENTS.md](AGENTS.md) describes the project. [docs/migration-checklist.md](docs/migration-checklist.md) is the test plan. License: MIT.
