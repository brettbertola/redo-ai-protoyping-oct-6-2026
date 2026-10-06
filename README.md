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
3. Download Surface: [open-surface ZIP file](https://github.com/de6eling/open-surface/archive/refs/heads/main.zip).
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

Type a slash command. Then write what you want in your own words. The text after each command is an example. The home page of the preview shows the same commands.

### Surface

| You type | Result |
|---|---|
| `/surface-setup` | The assistant installs the necessary items and applies your theme |
| `/surface-doctor` | The assistant finds and repairs problems with your setup |
| `/surface-start` | The preview starts and opens in your browser |
| `/surface-train` always show an empty state for a list | The assistant obeys this rule in all future prototypes |
| `/surface-ship` | The assistant publishes your prototypes to a link |
| `/surface-update` | You get the latest version of Surface |
| `/surface-develop` add a watch size to the devices | The assistant changes how Surface works for all prototypes |

### Prototypes

| You type | Result |
|---|---|
| `/prototype-new` a settings page with a profile form | A new prototype shows in the preview |
| `/prototype-update` settings: put the form in two columns | The assistant changes the prototype |
| `/prototype-update` show the checkout prototype on a phone | The prototype shows in a phone frame |
| `/prototype-animate` order: make the scoop fall onto the cone | The prototype gets an animation |
| `/prototype-delete` the test prototype | The assistant asks for approval, then deletes it |

### Variants

| You type | Result |
|---|---|
| `/variant-new` a header with a search bar | You get an alternative that you can select |
| `/variant-update` make the compact layout the default | A different option shows first |
| `/variant-animate` order: compare a drop and a bounce for the scoop | You get animations that you can select and compare |
| `/variant-delete` the old header option | The assistant asks for approval, then deletes it |

### Chromes

| You type | Result |
|---|---|
| `/chrome-new` that looks like our app (add a screenshot) | The navigation of your product shows around your prototypes |
| `/chrome-update` put the search field in the header | The assistant changes the chrome |
| `/chrome-delete` the old admin chrome | The assistant asks for approval, then deletes it |

### User tests

| You type | Result |
|---|---|
| `/test-new` the checkout prototype as a shop owner with no time | A simulated user tries the prototype. You get a report with the problems |
| `/test-persona-new` a careful accountant who reads each label | You get a simulated user for your user tests |
| `/test-task-new` checkout: pay for the order | You get a goal that a simulated user tries to complete |

## Controls in the preview

These keys work in each prototype:

| Keys | Function |
|---|---|
| ⌘K | Find a prototype. Select a chrome. Select a device size. |
| ⌘⇧K | Select a variant of the current prototype. |
| ⌘⇧B | See all prototypes in a panel. |
| Right-click | Open the Surface menu. |
| ⇧ Right-click | Open the menu of the browser. |

These keys work in the command palette (⌘K):

| Keys | Function |
|---|---|
| Tab | Go between the prototypes and the variants. |
| ⌘D | Save the current options as your defaults. |
| ⌘C | Copy the link to the screen that you see. |
| Esc | Close the command palette. |

On Windows, use Ctrl as an alternative to ⌘. The address bar always contains a link to the screen that you see. The home page of the preview shows the same keys.

## Test a prototype with a simulated user

Type `/test-new` and say which prototype to test. Example:

> /test-new the checkout prototype as a shop owner with no time

- The assistant operates the prototype as that user. It clicks, types and reads as the persona does.
- The user has limited patience. If the design is not clear, the user stops.
- At the end, a report opens in your browser. It shows each step, each screenshot and each problem that the user found.
- A simulated user is not a real user. Use the report to find clear problems early. Then do tests with real persons.

The first user test can download a browser. This takes one or two minutes.

## Share your prototypes

Type `/surface-ship`.

- The first time takes approximately 15 minutes. You make a free [GitHub](https://github.com) account and a free [Cloudflare](https://cloudflare.com) account. The assistant tells you each step.
- After the first time, `/surface-ship` takes one or two minutes.
- Each person who has the link can see the prototypes. Do not put real customer data in a prototype.

## If there is a problem

If the preview does not load, type `/surface-start`.

For other problems, type this command in the chat:

> /surface-doctor

The assistant examines your setup and repairs it. You can also tell the assistant what you see.

---

For contributors: [AGENTS.md](AGENTS.md) describes the project. [docs/migration-checklist.md](docs/migration-checklist.md) is the test plan. License: MIT.
