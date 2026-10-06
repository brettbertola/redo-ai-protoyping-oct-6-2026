// The browser of one user test. `test start` starts this file as a separate
// process. It stays on between commands, so the page keeps its condition.
// Each `test <action>` command sends one request to it.
//
// This process owns the run: it counts the patience, records each action and
// each finding, and writes the report when the test ends.
import { randomBytes } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { join, relative } from "node:path"
import { chromium } from "@playwright/test"
import {
  FINDING_TYPES,
  SEVERITIES,
  patienceMessage,
  reportHtml,
} from "./user-tests.mjs"
import { ROOT, readJson, readState, writeJson, writeState } from "./util.mjs"

const BARE_PARAM = "_bare"
const REF_ATTRIBUTE = "data-surface-test-ref"
const IDLE_LIMIT = 20 * 60 * 1000
const KEYS = [
  "Enter",
  "Escape",
  "Tab",
  "Backspace",
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]

const runDir = process.argv[2]
const runFile = join(runDir, "run.json")
const run = readJson(runFile)
const token = randomBytes(12).toString("hex")
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let browser
let page
let lastShot = null
let shotCount = 0
let lastScreenshot = null
let idleTimer
let ended = false

/** Thrown for a problem that the assistant can correct. It has no cost. */
class Refusal extends Error {}

const save = () => writeJson(runFile, run)

function publicPage() {
  const url = new URL(page.url())
  url.searchParams.delete(BARE_PARAM)
  return url.pathname + url.search
}

// Runs in the page. It marks each control that the user can see and reach,
// and it reads the text in the visible area.
function collect(attribute) {
  for (const old of document.querySelectorAll(`[${attribute}]`)) {
    old.removeAttribute(attribute)
  }
  const selector = [
    "a[href]",
    "button",
    "input:not([type=hidden])",
    "select",
    "textarea",
    "summary",
    "[contenteditable=true]",
    "[tabindex]:not([tabindex='-1'])",
    ...[
      "button",
      "link",
      "tab",
      "menuitem",
      "menuitemcheckbox",
      "menuitemradio",
      "option",
      "checkbox",
      "radio",
      "switch",
      "combobox",
      "slider",
      "treeitem",
    ].map((role) => `[role=${role}]`),
  ].join(",")
  const clean = (value, max = 80) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max)
  const inView = (rect) =>
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  const kinds = {
    A: "link",
    BUTTON: "button",
    SELECT: "list",
    TEXTAREA: "field",
    SUMMARY: "button",
  }
  const found = []
  for (const element of document.querySelectorAll(selector)) {
    const rect = element.getBoundingClientRect()
    if (!inView(rect)) continue
    if (getComputedStyle(element).visibility === "hidden") continue
    // The point that a user can click: the center of the visible part.
    const x = (Math.max(rect.left, 0) + Math.min(rect.right, innerWidth)) / 2
    const y = (Math.max(rect.top, 0) + Math.min(rect.bottom, innerHeight)) / 2
    const top = document.elementFromPoint(x, y)
    if (!top || !(element.contains(top) || top.contains(element))) continue
    const labelledBy = (element.getAttribute("aria-labelledby") ?? "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText ?? "")
      .join(" ")
    const type = element.getAttribute("type")
    const name = clean(
      element.getAttribute("aria-label") ||
        labelledBy ||
        element.labels?.[0]?.innerText ||
        element.innerText ||
        element.getAttribute("placeholder") ||
        element.getAttribute("title") ||
        element.querySelector("img[alt]")?.getAttribute("alt") ||
        (["submit", "button"].includes(type) ? element.value : "")
    )
    const kind =
      element.getAttribute("role") ||
      (element.tagName === "INPUT"
        ? ["checkbox", "radio", "submit", "button"].includes(type)
          ? type.replace("submit", "button")
          : "field"
        : (kinds[element.tagName] ?? "control"))
    const control = { element, kind, name: name || "(no label)" }
    if (kind === "field" || kind === "list") {
      control.value = clean(element.value, 60)
      const placeholder = clean(element.getAttribute("placeholder"), 60)
      if (placeholder) control.placeholder = placeholder
    }
    const checked = element.getAttribute("aria-checked") ?? element.checked
    if (["checkbox", "radio", "switch"].includes(kind)) {
      control.checked = checked === true || checked === "true"
    }
    if (element.getAttribute("aria-selected") === "true")
      control.selected = true
    if (element.getAttribute("aria-expanded") === "true")
      control.expanded = true
    if (element.disabled || element.getAttribute("aria-disabled") === "true")
      control.disabled = true
    found.push(control)
  }
  // A link around a button is one control for the user. Keep the inner one.
  const controls = found.filter(
    (outer) =>
      !found.some(
        (inner) =>
          inner !== outer &&
          outer.element.contains(inner.element) &&
          inner.name === outer.name
      )
  )
  controls.forEach((control, index) => {
    control.ref = `e${index + 1}`
    control.element.setAttribute(attribute, control.ref)
    delete control.element
  })

  const lines = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  while (walker.nextNode()) {
    const node = walker.currentNode
    const value = clean(node.nodeValue, 300)
    if (!value) continue
    const parent = node.parentElement
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName))
      continue
    if (parent.checkVisibility && !parent.checkVisibility()) continue
    range.selectNodeContents(node)
    if (inView(range.getBoundingClientRect())) lines.push(value)
  }
  return {
    controls: controls.map(({ ref, ...rest }) => ({ ref, ...rest })),
    text: lines.join("\n").slice(0, 2500),
  }
}

async function keepBare() {
  let url
  try {
    url = new URL(page.url())
  } catch {
    return
  }
  if (url.origin !== new URL(run.startUrl).origin) return
  if (url.searchParams.has(BARE_PARAM)) return
  url.searchParams.set(BARE_PARAM, "")
  await page.goto(url.href).catch(() => {})
}

/** Waits for the screen to stop, then gives what the user can see. */
async function observe() {
  await page.waitForLoadState("load", { timeout: 5000 }).catch(() => {})
  await sleep(350)
  await keepBare()
  const path = new URL(page.url()).pathname
  if (run.visited.at(-1) !== path) run.visited.push(path)
  const seen = await page
    .evaluate(collect, REF_ATTRIBUTE)
    .catch(() => ({ controls: [], text: "" }))
  const shot = await page.screenshot({ type: "png" })
  const changed = lastShot ? !shot.equals(lastShot) : null
  lastShot = shot
  if (changed !== false || !lastScreenshot) {
    shotCount++
    const name = `${String(shotCount).padStart(3, "0")}.png`
    writeFileSync(join(runDir, "screens", name), shot)
    lastScreenshot = `screens/${name}`
  }
  return {
    screenshot: relative(ROOT, join(runDir, lastScreenshot))
      .split("\\")
      .join("/"),
    page: publicPage(),
    changed,
    controls: seen.controls,
    text: seen.text,
  }
}

function patience() {
  return {
    patience: { remaining: run.patienceRemaining, budget: run.patienceBudget },
    mood: patienceMessage(run.patienceRemaining, run.patienceBudget),
  }
}

function target(ref) {
  if (!/^e\d+$/.test(String(ref ?? ""))) {
    throw new Refusal(
      `"${ref ?? ""}" is not a ref. Use a ref from the list of controls. Example: e3.`
    )
  }
  return page.locator(`[${REF_ATTRIBUTE}="${ref}"]`)
}

async function describe(locator) {
  if ((await locator.count()) === 0) {
    throw new Refusal(
      "This ref is old. Run `test look` to get the controls that are on the screen now."
    )
  }
  return locator.evaluate((element) => {
    const text =
      element.getAttribute("aria-label") ||
      element.labels?.[0]?.innerText ||
      element.innerText ||
      element.getAttribute("placeholder") ||
      ""
    return text.replace(/\s+/g, " ").trim().slice(0, 60) || "a control"
  })
}

function needWhy(request) {
  const why = String(request.why ?? "").trim()
  if (why.length < 12) {
    throw new Refusal(
      'Add --why "<what you see, what you look for, and why you select this action>".'
    )
  }
  return why
}

/** One step of the user. `act` does it in the browser and gives the label. */
async function step(request, cost, act) {
  const why = cost > 0 ? needWhy(request) : String(request.why ?? "").trim()
  if (cost > 0 && run.patienceRemaining <= 0) {
    throw new Refusal(patienceMessage(0, run.patienceBudget))
  }
  let label
  let problem = null
  try {
    label = await act()
  } catch (error) {
    if (error instanceof Refusal) throw error
    label = `${request.action}: no result`
    problem =
      "The control did not react. Possibly something covers it, or it is disabled."
  }
  run.patienceRemaining = Math.max(0, run.patienceRemaining - cost)
  const seen = await observe()
  const action = {
    step: run.actions.length + 1,
    at: new Date().toISOString(),
    kind: request.action,
    label,
    why,
    cost,
    patienceRemaining: run.patienceRemaining,
    page: seen.page,
    screenshot: lastScreenshot,
    changed: seen.changed,
  }
  run.actions.push(action)
  save()
  const effect =
    problem ??
    (seen.changed === false
      ? "The screen did not change."
      : "The screen changed.")
  return {
    summary: `Step ${action.step}: ${label}. ${effect}`,
    step: action.step,
    ...seen,
    ...patience(),
  }
}

const ACTIONS = {
  async look() {
    return {
      summary: "This is the screen now.",
      ...(await observe()),
      ...patience(),
    }
  },

  click: (request) =>
    step(request, 1, async () => {
      const locator = target(request.ref)
      const name = await describe(locator)
      await locator.click({ timeout: 4000 })
      return `Clicked "${name}"`
    }),

  type: (request) =>
    step(request, 1, async () => {
      const locator = target(request.ref)
      const name = await describe(locator)
      const text = String(request.text ?? "")
      await locator.fill(text, { timeout: 4000 })
      if (request.submit) await page.keyboard.press("Enter")
      return `Typed "${text}" into "${name}"${request.submit ? " and pressed Enter" : ""}`
    }),

  select: (request) =>
    step(request, 1, async () => {
      const locator = target(request.ref)
      const name = await describe(locator)
      const isNative = await locator.evaluate((el) => el.tagName === "SELECT")
      if (!isNative) {
        throw new Refusal(
          "This control is not a simple list. Click it. Then click the option that you want."
        )
      }
      await locator.selectOption({ label: String(request.option ?? "") })
      return `Selected "${request.option}" in "${name}"`
    }),

  key: (request) =>
    step(request, 1, async () => {
      const key = KEYS.find(
        (name) => name.toLowerCase() === String(request.key ?? "").toLowerCase()
      )
      if (!key) {
        throw new Refusal(
          `"${request.key ?? ""}" is not a permitted key. Use one of: ${KEYS.join(", ")}.`
        )
      }
      await page.keyboard.press(key === "Space" ? " " : key)
      return `Pressed ${key}`
    }),

  back: (request) =>
    step(request, 1, async () => {
      await page.goBack({ timeout: 5000 })
      if (page.url() === "about:blank") await page.goForward()
      return "Went back one page"
    }),

  scroll: (request) =>
    step(request, 0, async () => {
      const direction = request.direction === "up" ? "up" : "down"
      const size = page.viewportSize()
      await page.mouse.move(size.width / 2, size.height / 2)
      await page.mouse.wheel(
        0,
        (direction === "up" ? -1 : 1) * size.height * 0.8
      )
      return `Scrolled ${direction}`
    }),

  hover: (request) =>
    step(request, 0, async () => {
      const locator = target(request.ref)
      const name = await describe(locator)
      await locator.hover({ timeout: 4000 })
      return `Put the pointer on "${name}"`
    }),

  async finding(request) {
    const type = String(request.type ?? "")
    const severity = String(request.severity ?? "")
    const description = String(request.description ?? "").trim()
    if (!(type in FINDING_TYPES)) {
      throw new Refusal(
        `Add --type. Use one of: ${Object.keys(FINDING_TYPES).join(", ")}.`
      )
    }
    if (!(severity in SEVERITIES)) {
      throw new Refusal(
        `Add --severity. Use one of: ${Object.keys(SEVERITIES).join(", ")}.`
      )
    }
    if (!description) {
      throw new Refusal('Add --description "<what happened>".')
    }
    const same = run.findings.some(
      (finding) => finding.type === type && finding.description === description
    )
    if (same) {
      return {
        summary: "This finding is already recorded. Continue with the task.",
        findings: run.findings.length,
        ...patience(),
      }
    }
    run.findings.push({
      type,
      severity,
      description,
      step: run.actions.length,
      page: publicPage(),
      screenshot: lastScreenshot,
    })
    save()
    return {
      summary: `I recorded finding ${run.findings.length}: ${severity}, ${type}.`,
      findings: run.findings.length,
      ...patience(),
    }
  },

  async end(request) {
    const outcome = String(request.outcome ?? "")
    if (!["completed", "abandoned"].includes(outcome)) {
      throw new Refusal("Add --outcome completed or --outcome abandoned.")
    }
    const summary = String(request.summary ?? "").trim()
    if (!summary) {
      throw new Refusal(
        'Add --summary "<what you did or where you stopped, and what you expected to see>".'
      )
    }
    const confidence = ["high", "medium", "low"].includes(request.confidence)
      ? request.confidence
      : null
    return finalize(outcome, { summary, confidence })
  },

  stop: () => finalize("stopped", {}),

  async status() {
    return {
      summary: `A user test is on: ${run.task.name} as ${run.persona.name}.`,
      running: true,
      run: run.id,
      page: publicPage(),
      steps: run.actions.length,
      findings: run.findings.length,
      ...patience(),
    }
  },
}

async function finalize(outcome, extra) {
  ended = true
  clearTimeout(idleTimer)
  const endPage = run.task.success.endPage
  Object.assign(run, extra, {
    outcome,
    finishedAt: new Date().toISOString(),
    reachedEndPage: endPage
      ? run.visited.includes(`/${run.task.prototype}/${endPage}`)
      : null,
  })
  save()
  writeFileSync(join(runDir, "report.html"), reportHtml(run))
  const report = relative(ROOT, join(runDir, "report.html"))
    .split("\\")
    .join("/")
  return {
    summary: `The user test is complete. Outcome: ${outcome}. Findings: ${run.findings.length}. Report: ${report}`,
    run: run.id,
    outcome,
    userSummary: run.summary ?? null,
    confidence: run.confidence ?? null,
    steps: run.actions.length,
    patience: { remaining: run.patienceRemaining, budget: run.patienceBudget },
    findings: run.findings,
    visited: run.visited,
    reachedEndPage: run.reachedEndPage,
    success: run.task.success,
    report,
    reportFile: join(runDir, "report.html"),
  }
}

async function shutDown() {
  if (readState("test", null)?.pid === process.pid) writeState("test", {})
  await browser?.close().catch(() => {})
  process.exit(0)
}

function resetIdleTimer() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(async () => {
    if (!ended) await finalize("timed-out", {})
    await shutDown()
  }, IDLE_LIMIT)
}

async function launch() {
  const headless = !run.show
  let lastError
  // The browser of Playwright first. Then a browser that the computer has.
  for (const options of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try {
      return await chromium.launch({ headless, ...options })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function main() {
  mkdirSync(join(runDir, "screens"), { recursive: true })
  try {
    browser = await launch()
  } catch (error) {
    writeState("test", {
      pid: process.pid,
      run: run.id,
      status: "no-browser",
      reason: String(error?.message ?? error).split("\n")[0],
    })
    process.exit(1)
  }
  const context = await browser.newContext({
    viewport: run.viewport,
    hasTouch: run.viewport.width < 600,
  })
  // A link in a prototype can drop the parameter that hides the Surface
  // controls. Keep it, so the user sees only the product.
  await context.addInitScript((param) => {
    const keep = (url) => {
      if (url === undefined || url === null) return url
      const next = new URL(String(url), location.href)
      if (next.origin !== location.origin || next.searchParams.has(param))
        return url
      next.searchParams.set(param, "")
      return next.href
    }
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method].bind(history)
      history[method] = (state, title, url) => original(state, title, keep(url))
    }
  }, BARE_PARAM)
  page = await context.newPage()
  context.on("page", (opened) => {
    page = opened
  })
  page.on("dialog", (dialog) => dialog.accept().catch(() => {}))
  await page.goto(run.startUrl, { waitUntil: "load" })

  const first = await observe()
  run.actions.push({
    step: 1,
    at: new Date().toISOString(),
    kind: "open",
    label: "Opened the prototype",
    why: "",
    cost: 0,
    patienceRemaining: run.patienceRemaining,
    page: first.page,
    screenshot: lastScreenshot,
    changed: null,
  })
  save()

  // One request at a time, in the sequence that they come.
  let queue = Promise.resolve()
  const server = createServer((request, response) => {
    let body = ""
    request.on("data", (chunk) => (body += chunk))
    request.on("end", () => {
      queue = queue.then(async () => {
        let result
        try {
          const message = JSON.parse(body || "{}")
          if (request.headers["x-surface-token"] !== token) {
            throw new Refusal("This request is not from Surface.")
          }
          if (ended) throw new Refusal("This user test is complete.")
          const action = ACTIONS[message.action]
          if (!action) {
            throw new Refusal(
              `"${message.action}" is not a test command. Use one of: ${Object.keys(ACTIONS).join(", ")}.`
            )
          }
          resetIdleTimer()
          result = { ok: true, ...(await action(message)) }
        } catch (error) {
          result = {
            ok: false,
            summary:
              error instanceof Refusal
                ? error.message
                : "The browser of the user test had a problem. Run `test look`. If that fails, run `test stop` and start again.",
            ...(error instanceof Refusal
              ? {}
              : { reason: String(error?.message ?? error).split("\n")[0] }),
          }
        }
        response.setHeader("content-type", "application/json")
        response.end(JSON.stringify(result))
        if (ended) await shutDown()
      })
    })
  })
  server.listen(0, "127.0.0.1", () => {
    resetIdleTimer()
    writeState("test", {
      pid: process.pid,
      port: server.address().port,
      token,
      run: run.id,
      runDir,
      status: "ready",
      first: { ...first, ...patience() },
    })
  })
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, async () => {
    if (!ended && page) await finalize("stopped", {}).catch(() => {})
    await shutDown()
  })
}

main().catch(async (error) => {
  writeState("test", {
    pid: process.pid,
    run: run.id,
    status: "failed",
    reason: String(error?.message ?? error).split("\n")[0],
  })
  await browser?.close().catch(() => {})
  process.exit(1)
})
