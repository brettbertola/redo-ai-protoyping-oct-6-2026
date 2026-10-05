import { createHash } from "node:crypto"
import { fileURLToPath } from "node:url"
import { defineConfig } from "@playwright/test"

// Each folder of the project gets its own port, so two worktrees can run the
// tests at the same time. A test must not use the server of a different folder.
const folder = fileURLToPath(new URL(".", import.meta.url))
const hash = createHash("sha256").update(folder).digest().readUInt16BE(0)
const PORT = Number(process.env.SURFACE_TEST_PORT) || 4300 + (hash % 700)

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
})
