---
name: surface-ship
description: Publishes the Surface prototypes of the designer to a web link that they can share. It uses GitHub and Cloudflare. Use when the user says "ship it", "publish", "share", "deploy", or asks for a link to the prototypes.
---

# Publish the prototypes

Read `AGENTS.md` first.

- Use the words "save" and "publish". Do not use the words commit, branch or push.
- The designer must have a free GitHub account and a free Cloudflare account. If they do not, tell them to make the accounts at github.com and cloudflare.com.

Run this command:

`npm run surface -- ship --message "<short description of the change>"`

Read `needs` in the result. Do the related procedure below. Then run the command again. Continue until the result has `liveUrl`.

## `needs: "tools"`

1. Run `npm run surface -- doctor`.
2. For each missing item, give the designer the installer from `fix`. Do one item at a time.
3. On a Mac, install Git as follows: run `xcode-select --install`. An Apple window opens. Tell the designer to click Install. This can take some minutes.
4. Tell the designer to close this app fully and open it again.
5. Tell the designer to type `/surface-ship` again.

## `needs: "github-login"`

1. Run `npm run surface -- github login`.
2. Give the designer the `code` from the result.
3. Tell the designer: "A browser tab is open. Sign in to GitHub. Type the code. Click Authorize."
4. Wait until the designer tells you that they are done.
5. Run `npm run surface -- github status`.

## `needs: "fixes"`

The prototypes have a problem that prevents the publish step. Repair each problem in `steps`. Ask the designer only if a repair changes their design.

## `needs: "cloudflare-connect"`

The work is now safe on GitHub. It is private. This procedure connects Cloudflare. You do it one time only. Give the designer one step at a time. Wait after each step.

1. Sign in at https://dash.cloudflare.com
2. Open "Workers & Pages". Click "Create". Select the "Pages" tab. Click "Connect to Git".
3. Select GitHub. Approve the access. Select the repository that `repositoryName` shows.
4. Set the build command to `npm run build`. Set the build output directory to `dist`. If the page offers a framework preset, select "Vite". Do not change other settings.
5. Click "Save and Deploy". Wait until it completes. This takes one or two minutes.
6. Copy the link that Cloudflare shows. It ends with `.pages.dev`. Paste the link here.

The Cloudflare pages can change. If the designer sees different pages, ask for a screenshot. Then help them to find the equivalent step.

When you have the link, run `npm run surface -- ship set-url <the link>`. Open the link to make sure that it works.

## A result with `liveUrl`

The publish step is complete. Tell the designer:

- The link.
- The link shows the new version in one or two minutes.
- Each person who has the link can see the prototypes.
- To link to one prototype, add its path. Example: `<liveUrl>/examples/dashboard`.

## Other failures

Read `output` and `hint` in the result. Do not replace or discard data on GitHub unless the designer approves.
