---
name: surface-start
description: Starts or stops the Surface preview and gives the designer the address. Use when the user says "start Surface", "run Surface", "open the preview", "stop Surface", or "the preview does not load". Use it also before you make or change a prototype in a new session.
---

# Start the preview

Read `AGENTS.md` first.

The preview is the web page that shows the prototypes. It is on only while its command runs in a terminal.

## Start

1. Start this command in a terminal that the designer can see:

   `npm run surface -- dev start`

   - The command does not stop. It runs until the preview stops.
   - Start it as a background terminal task. Do not wait for it to end.
   - Do not hide it. The designer must be able to see the terminal.
   - Start it one time only. The command stops an old preview before it starts a new one.
2. Run `npm run surface -- dev status --wait`. This command waits until the preview is on.
3. Give the designer the address from `url`. Tell them that a browser tab is open.
4. Tell the designer: "Keep the terminal open. The preview stops when the terminal closes."

## Stop

Run `npm run surface -- dev stop`. Tell the designer that the preview is off.

## If the preview does not load

1. Run `npm run surface -- dev status`.
2. If `running` is `false`, do the Start procedure again.
3. If the Start procedure fails, read the text in the terminal. Then obey the `surface-doctor` skill.
4. If `dependencies` is missing, run `npm install`. Then do the Start procedure again.
5. Tell the designer the cause in one sentence. Do not show them the error text.
