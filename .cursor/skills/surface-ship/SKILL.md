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
2. In the menu on the left, find the group "Build". Click "Compute". A list opens below it. Click "Workers & Pages".
3. Click the blue button "Create application". It is at the top right.
4. In the box "Make something new", click "Continue with GitHub". If GitHub asks for access, approve it.
5. Select the repository that `repositoryName` shows. Click "Next".
6. The screen "Set up your application" shows. Do not change the settings. The build command is `npm run build`, and the deploy command is `npx wrangler deploy`. Click the blue button "Deploy".
7. Wait until it completes. This takes one or two minutes.
8. Copy the link that Cloudflare shows. It ends with `.workers.dev`. Paste the link here.

Do not tell the designer to click "Continue to Pages", to select a "Pages" tab or to set an output directory. That is the old procedure.

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
