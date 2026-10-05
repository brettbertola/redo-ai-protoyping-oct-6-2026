import { expect, test, type Page } from "@playwright/test"

// IDs in test names refer to docs/migration-checklist.md.
const DASHBOARD = "/examples/dashboard"
const CHECKOUT = "/examples/mobile-checkout"
const mod = process.platform === "darwin" ? "Meta" : "Control"

async function openPalette(page: Page, variants = false) {
  await expect(page.getByLabel("Open command palette")).toBeVisible()
  await page.keyboard.press(variants ? `${mod}+Shift+K` : `${mod}+K`)
  await expect(page.getByRole("dialog")).toBeVisible()
}

function frame(page: Page) {
  return page.frameLocator("[data-surface-device] iframe")
}

test("B1 B2 B9: home lists prototypes; unknown URL shows not-found", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: /Dashboard/ })).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Mobile Checkout/ })
  ).toBeVisible()
  await page.goto("/nope/nope")
  await expect(page.getByText("This page does not exist")).toBeVisible()
  await page.getByRole("link", { name: "Go to all prototypes" }).click()
  await expect(page).toHaveURL("/")
})

test("D1 D2: palette opens, searches, navigates, and remembers recents", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByText("Prototypes").first()).toBeVisible()
  await openPalette(page)
  await page.keyboard.type("dashb")
  await expect(page.getByRole("option", { name: /Dashboard/ })).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(DASHBOARD)
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible()

  await openPalette(page)
  await expect(page.getByText("Recent")).toBeVisible()
  await page.keyboard.press("Tab")
  await expect(page.getByPlaceholder("Search variants…")).toBeVisible()
})

test("C1 C2 D4 B8: variants switch through the URL and omit defaults", async ({
  page,
}) => {
  const chunks: string[] = []
  page.on("request", (r) => {
    if (r.url().includes("/variants/layout/")) chunks.push(r.url())
  })
  await page.goto(DASHBOARD)
  await expect(page.getByText("Owned by Priya")).toBeVisible()
  expect(chunks.some((u) => u.includes("cards"))).toBe(true)
  expect(chunks.some((u) => u.includes("table"))).toBe(false)

  await openPalette(page, true)
  await page.getByRole("option", { name: /^table/ }).click()
  await expect(page).toHaveURL(`${DASHBOARD}?layout=table`)
  await expect(page.locator("th", { hasText: "Owner" })).toBeVisible()

  await page.getByRole("option", { name: /^false/ }).click()
  await expect(page).toHaveURL(`${DASHBOARD}?layout=table&banner=false`)
  await expect(page.getByText("to switch variants")).toBeHidden()

  await page.getByRole("option", { name: /^cards/ }).click()
  await expect(page).toHaveURL(`${DASHBOARD}?banner=false`)
})

test("C3: invalid values fall back and are removed; other params stay", async ({
  page,
}) => {
  const warnings: string[] = []
  page.on("console", (m) => {
    if (m.type() === "warning") warnings.push(m.text())
  })
  await page.goto(`${DASHBOARD}?layout=zzz&density=comfortable&mine=1`)
  await expect(page).toHaveURL(`${DASHBOARD}?mine=1`)
  await expect(page.getByText("Owned by Priya")).toBeVisible()
  expect(warnings.filter((w) => w.includes("layout")).length).toBeGreaterThan(0)
})

test("C6 C8: saved defaults stick and store only the difference", async ({
  page,
}) => {
  await page.goto(DASHBOARD)
  await openPalette(page, true)
  await page
    .getByRole("option", { name: /^table/ })
    .getByRole("button", { name: "Set default" })
    .click()
  await expect(page).toHaveURL(DASHBOARD)
  await expect(page.locator("th", { hasText: "Owner" })).toBeVisible()
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("surface:variant-defaults:v1") ?? "{}")
  )
  expect(stored).toEqual({ [DASHBOARD]: { layout: "table" } })
  await page.keyboard.press("Escape")
  await expect(page.locator("[data-surface-launcher-card]")).toContainText(
    "table"
  )
  await page.reload()
  await expect(page.locator("th", { hasText: "Owner" })).toBeVisible()
})

test("E1 E3: browse panel toggles, navigates and remembers folders", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByText("Prototypes").first()).toBeVisible()
  await page.keyboard.press(`${mod}+Shift+B`)
  const panel = page.locator(".surface-browse-panel")
  await expect(panel).toBeVisible()
  await panel.getByRole("button", { name: "Examples" }).click()
  await panel.getByRole("button", { name: "Dashboard" }).click()
  await expect(page).toHaveURL(DASHBOARD)
  await expect(panel).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible()
  await page.keyboard.press(`${mod}+Shift+B`)
  await expect(panel.getByRole("button", { name: "Dashboard" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(panel).toBeHidden()
})

test("F5: recents are most-recent-first and exclude home", async ({ page }) => {
  await page.goto(DASHBOARD)
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible()
  await page.goto("/")
  await page.goto(`${CHECKOUT}?_device=responsive`)
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()
  const recents = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("surface:recents:v1") ?? "[]").map(
      (r: { path: string }) => r.path
    )
  )
  expect(recents).toEqual([CHECKOUT, DASHBOARD])
})

test("G1 G2 G3: chrome comes from config and can be overridden", async ({
  page,
}) => {
  await page.goto(DASHBOARD)
  await expect(page.getByText("Acme")).toBeVisible()
  await openPalette(page)
  await page.keyboard.type("no chrome")
  await page.getByRole("option", { name: /No chrome/ }).click()
  await expect(page).toHaveURL(`${DASHBOARD}?_chrome=none`)
  await expect(page.getByText("Acme")).toBeHidden()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("G4: chrome toggles appear in the palette and persist", async ({
  page,
}) => {
  await page.goto(DASHBOARD)
  await expect(page.getByText("Acme")).toBeVisible()
  await openPalette(page)
  await page.keyboard.type("collapsed")
  await page.getByRole("option", { name: /collapsed sidebar/ }).click()
  await expect(page.getByText("Acme")).toBeHidden()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible()
  await expect(page.getByText("Acme")).toBeHidden()
})

test("G7 G8 B5: device frame has the exact viewport and follows navigation", async ({
  page,
}) => {
  await page.goto(CHECKOUT)
  const iframe = page.locator("[data-surface-device] iframe")
  await expect(iframe).toHaveAttribute("width", "390")
  await expect(iframe).toHaveAttribute("height", "844")
  const inner = frame(page)
  await expect(inner.getByRole("heading", { name: "Checkout" })).toBeVisible()
  const width = await iframe.evaluate(
    (el) => (el as HTMLIFrameElement).contentWindow!.innerWidth
  )
  expect(width).toBe(390)

  await inner.getByRole("button", { name: /Pay/ }).click()
  await expect(inner.getByText("Order placed")).toBeVisible()
  await expect(page).toHaveURL(`${CHECKOUT}/confirmation`)

  await openPalette(page, true)
  await page.getByRole("option", { name: /^inline/ }).click()
  await expect(page).toHaveURL(`${CHECKOUT}/confirmation?button=inline`)
})

test("G7: breakpoints respond to the device, not the window", async ({
  page,
}) => {
  await page.goto(`${DASHBOARD}?_device=phone`)
  const inner = frame(page)
  await expect(inner.getByRole("heading", { name: "Projects" })).toBeVisible()
  await expect(inner.getByText("Acme")).toBeHidden()
  await page.goto(`${DASHBOARD}?_device=desktop`)
  await expect(frame(page).getByText("Acme")).toBeVisible()
})

test("G9: shortcuts work with focus inside the device frame", async ({
  page,
}) => {
  await page.goto(CHECKOUT)
  const inner = frame(page)
  await inner.getByLabel("Email").click()
  await page.keyboard.press(`${mod}+K`)
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("G10: a pasted link restores device, chrome and variants", async ({
  page,
}) => {
  await page.goto(`${DASHBOARD}?layout=table&_chrome=none&_device=tablet`)
  const iframe = page.locator("[data-surface-device] iframe")
  await expect(iframe).toHaveAttribute("width", "820")
  const inner = frame(page)
  await expect(inner.getByRole("columnheader", { name: "Owner" })).toBeVisible()
  await expect(inner.getByText("Acme")).toBeHidden()
})
