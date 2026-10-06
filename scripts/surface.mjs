#!/usr/bin/env node
// Entry point for every Surface script: `npm run surface -- <command> ...`.
// Each command prints one JSON object describing what happened, so an AI
// assistant can read the result without parsing prose.
import { fail, finish, parseArgs } from "./lib/util.mjs"

const COMMANDS = {
  doctor: () => import("./commands/doctor.mjs"),
  dev: () => import("./commands/dev.mjs"),
  theme: () => import("./commands/theme.mjs"),
  prototype: () => import("./commands/prototype.mjs"),
  variant: () => import("./commands/variant.mjs"),
  chrome: () => import("./commands/chrome.mjs"),
  check: () => import("./commands/check.mjs"),
  lint: () => import("./commands/lint.mjs"),
  train: () => import("./commands/train.mjs"),
  test: () => import("./commands/test.mjs"),
  github: () => import("./commands/github.mjs"),
  ship: () => import("./commands/ship.mjs"),
  update: () => import("./commands/update.mjs"),
  skills: () => import("./commands/skills.mjs"),
  manifest: () => import("./commands/manifest.mjs"),
}

const [name, ...rest] = process.argv.slice(2)
if (!name || !(name in COMMANDS)) {
  fail(`"${name ?? ""}" is not a Surface command.`, {
    commands: Object.keys(COMMANDS),
  })
}

try {
  const command = await COMMANDS[name]()
  finish(await command.run(parseArgs(rest)))
} catch (error) {
  if (error?.surface) fail(error.message, error.details)
  fail(error?.message ?? String(error))
}
