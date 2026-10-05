import { existsSync } from "node:fs"
import { basename, join } from "node:path"
import {
  ROOT,
  mainRoot,
  readJson,
  run,
  slugify,
  stop,
  writeJson,
} from "../lib/util.mjs"
import { run as check } from "./check.mjs"
import { checkGh, checkGhAuth, checkGit } from "./doctor.mjs"
import { account } from "./github.mjs"

const git = (...args) => run("git", args)

function ensureRepository() {
  if (existsSync(join(ROOT, ".git"))) return false
  const init = git("init", "--initial-branch", "main")
  if (!init.ok)
    stop("Git cannot start in this folder.", {
      output: init.stderr,
    })
  return true
}

// Commits need an author; borrow the GitHub account when none is set up.
function ensureIdentity() {
  if (git("config", "user.email").stdout && git("config", "user.name").stdout)
    return
  const user = run("gh", [
    "api",
    "user",
    "--jq",
    '[.login, (.id|tostring), (.name // .login)] | join("\\t")',
  ])
  if (!user.ok)
    stop("I cannot read the GitHub account.", { output: user.stderr })
  const [login, id, name] = user.stdout.split("\t")
  git("config", "user.name", name)
  git("config", "user.email", `${id}+${login}@users.noreply.github.com`)
}

function remoteUrl() {
  const remote = git("remote", "get-url", "origin")
  return remote.ok ? remote.stdout : null
}

function repoWebUrl() {
  const view = run("gh", [
    "repo",
    "view",
    "--json",
    "url,nameWithOwner,isPrivate",
  ])
  return view.ok ? JSON.parse(view.stdout) : null
}

export async function run_(args) {
  // A worktree does not have its own link. The main folder keeps the link,
  // and only the main folder publishes.
  const main = mainRoot()
  const stateFile = join(main, ".surface", "ship.json")
  const state = readJson(stateFile, {})

  if (args._[0] === "set-url") {
    const url = String(args._[1] ?? "")
    if (!/^https:\/\/[\w.-]+\//.test(url + "/"))
      stop("Give the full link. It starts with https://")
    writeJson(stateFile, { ...state, liveUrl: url.replace(/\/+$/, "") })
    return {
      summary: `I saved the link. Your prototypes are at ${url}`,
      liveUrl: url,
    }
  }

  if (args._[0] === "status") {
    return {
      summary: state.liveUrl
        ? `The prototypes are published at ${state.liveUrl}`
        : "The prototypes are not published.",
      liveUrl: state.liveUrl ?? null,
      repository: remoteUrl(),
    }
  }

  if (main !== ROOT) {
    stop(
      "I did not publish. This folder is a worktree: a second copy of the project. Only the main folder publishes.",
      {
        needs: "main-folder",
        mainFolder: main,
        liveUrl: state.liveUrl ?? null,
        hint: "Put the changes of this worktree into the main folder. Then run the command in the main folder.",
      }
    )
  }

  if (!checkGit() || !checkGh()) {
    stop(
      "Git and the GitHub CLI are necessary to publish. Run `npm run surface -- doctor` to get the installers.",
      { needs: "tools" }
    )
  }
  if (!checkGhAuth()) {
    stop(
      "You are not signed in to GitHub. Run `npm run surface -- github login`.",
      { needs: "github-login" }
    )
  }

  // Never publish something that will fail to build where nobody can see it.
  const checked = await check({ _: [] })
  if (!checked.ok) {
    return {
      ok: false,
      summary: `I did not publish. ${checked.summary}`,
      needs: "fixes",
      steps: checked.steps,
    }
  }

  const fresh = ensureRepository()
  ensureIdentity()
  run("gh", ["auth", "setup-git"])

  git("add", "--all")
  const hasChanges = !git("diff", "--cached", "--quiet").ok
  const message =
    typeof args.message === "string" ? args.message : "Update prototypes"
  if (hasChanges) {
    const commit = git("commit", "--message", message)
    if (!commit.ok)
      stop("I cannot save this version.", {
        output: commit.stderr || commit.stdout,
      })
  }

  let created = false
  if (!remoteUrl()) {
    const name =
      slugify(typeof args.name === "string" ? args.name : basename(ROOT)) ||
      "surface-prototypes"
    const visibility = args.public ? "--public" : "--private"
    const create = run("gh", [
      "repo",
      "create",
      name,
      visibility,
      "--source",
      ".",
      "--remote",
      "origin",
      "--push",
    ])
    if (!create.ok) {
      stop(`I cannot make the GitHub repository "${name}".`, {
        output: create.stderr,
        hint: "If the name is not available, run the command again with --name <different-name>.",
      })
    }
    created = true
  } else {
    const push = git("push", "--set-upstream", "origin", "HEAD")
    if (!push.ok) {
      stop("The upload to GitHub failed.", {
        output: push.stderr,
        hint: "GitHub can have changes that this computer does not have. Get approval from the designer before you replace them.",
      })
    }
  }

  const repo = repoWebUrl()
  const base = {
    repository: repo?.url ?? remoteUrl(),
    repositoryName: repo?.nameWithOwner ?? null,
    private: repo?.isPrivate ?? null,
    account: account(),
    uploaded: hasChanges || created || fresh,
  }

  if (!state.liveUrl) {
    return {
      ...base,
      summary:
        "The upload to GitHub is complete. One step remains: connect Cloudflare. Cloudflare makes the link.",
      needs: "cloudflare-connect",
      cloudflare: {
        project: repo?.nameWithOwner?.split("/")[1] ?? null,
        buildCommand: "npm run build",
        outputDirectory: "dist",
        afterwards:
          "npm run surface -- ship set-url <the link Cloudflare shows>",
      },
    }
  }
  return {
    ...base,
    summary: hasChanges
      ? `The upload is complete. Cloudflare publishes it now. The new version is at ${state.liveUrl} in one or two minutes.`
      : `There are no changes to publish. The prototypes are at ${state.liveUrl}`,
    liveUrl: state.liveUrl,
  }
}

export { run_ as run }
