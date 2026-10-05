import {
  cpSync,
  readFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import {
  ROOT,
  STATE_DIR,
  npmCommand,
  readJson,
  run,
  stop,
  writeJson,
} from "../lib/util.mjs"
import { AGENTS_FILE, readBlock, writeBlock } from "../lib/direction.mjs"
import { MANIFEST, hashFile } from "./manifest.mjs"

async function download(source, into) {
  const url = `https://codeload.github.com/${source}/tar.gz/refs/heads/main`
  const response = await fetch(url)
  if (!response.ok)
    stop(`The download of the latest Surface failed (${response.status}).`, {
      url,
    })
  const archive = join(into, "surface.tar.gz")
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()))
  // tar ships with macOS, Linux and Windows 10 or later.
  const extracted = run("tar", ["-xzf", archive, "-C", into])
  if (!extracted.ok)
    stop("The download is damaged. Try again.", { output: extracted.stderr })
  const folder = readdirSync(into).find((name) =>
    statSync(join(into, name)).isDirectory()
  )
  return join(into, folder)
}

function mergePackageJson(next) {
  const file = join(ROOT, "package.json")
  const mine = readJson(file)
  const theirs = readJson(join(next, "package.json"))
  const added = []
  for (const section of ["dependencies", "devDependencies", "scripts"]) {
    for (const [name, value] of Object.entries(theirs[section] ?? {})) {
      if (mine[section]?.[name] === value) continue
      // Packages the designer's theme installed stay; Surface's own win.
      mine[section] = { ...mine[section], [name]: value }
      added.push(`${section}: ${name}`)
    }
  }
  mine.version = theirs.version
  writeJson(file, mine)
  return added
}

export async function run_(args) {
  const current = readJson(MANIFEST)
  if (!current)
    stop(
      "The file surface/manifest.json is missing. This copy cannot do an update."
    )

  const work = mkdtempSync(join(tmpdir(), "surface-update-"))
  try {
    const next =
      typeof args.from === "string"
        ? args.from
        : await download(current.source, work)
    const incoming = readJson(join(next, "surface", "manifest.json"))
    if (!incoming) stop("The download is not Surface.")

    if (incoming.version === current.version && !args.force) {
      return {
        summary: `Surface is already at the latest version (${current.version}).`,
        version: current.version,
        updated: false,
      }
    }

    // Files the designer (or their assistant) changed inside Surface's area.
    const edited = Object.entries(current.files ?? {})
      .filter(
        ([file, hash]) =>
          existsSync(join(ROOT, file)) && hashFile(join(ROOT, file)) !== hash
      )
      .map(([file]) => file)

    if (args["dry-run"]) {
      return {
        summary: `Surface ${incoming.version} is available (you have ${current.version}).`,
        updated: false,
        from: current.version,
        to: incoming.version,
        editedFilesThatWouldBeReplaced: edited,
      }
    }

    const backup = join(
      STATE_DIR,
      "backup",
      new Date().toISOString().replace(/[:.]/g, "-")
    )
    for (const file of edited) {
      mkdirSync(dirname(join(backup, file)), { recursive: true })
      cpSync(join(ROOT, file), join(backup, file))
    }

    // Keep the direction that the designer wrote in AGENTS.md.
    const direction = existsSync(AGENTS_FILE)
      ? readBlock(readFileSync(AGENTS_FILE, "utf8"))
      : null

    for (const path of new Set([...(current.owned ?? []), ...incoming.owned])) {
      rmSync(join(ROOT, path), { recursive: true, force: true })
    }
    for (const path of incoming.owned) {
      if (!existsSync(join(next, path))) continue
      mkdirSync(dirname(join(ROOT, path)), { recursive: true })
      cpSync(join(next, path), join(ROOT, path), { recursive: true })
    }
    if (direction !== null && existsSync(AGENTS_FILE)) {
      const updated = readFileSync(AGENTS_FILE, "utf8")
      if (readBlock(updated) !== null) {
        writeFileSync(AGENTS_FILE, writeBlock(updated, direction))
      }
    }
    const packageChanges = mergePackageJson(next)

    const install = args["no-install"]
      ? { ok: true }
      : run(npmCommand, ["install", "--no-audit", "--no-fund"])
    return {
      ok: install.ok,
      summary: install.ok
        ? `I updated Surface from ${current.version} to ${incoming.version}. I did not change your prototypes, chromes or theme.`
        : `I updated the Surface files to ${incoming.version}. But the package installation failed. Run \`npm install\`.`,
      updated: true,
      from: current.version,
      to: incoming.version,
      packageChanges,
      ...(edited.length
        ? {
            warning: `The update replaced ${edited.length} Surface file(s) that someone changed on this computer. Copies are in ${backup.slice(ROOT.length + 1)}.`,
            replacedEditedFiles: edited,
          }
        : {}),
      next: "Start the preview again. Use the surface-start skill.",
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

export { run_ as run }
