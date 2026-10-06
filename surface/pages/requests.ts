// One entry for each skill in .agents/skills. The home page shows each one
// as a slash command: /<skill>. `npm run surface -- check` fails if this list
// and the skills folder are different.
export const SKILLS = [
  {
    skill: "surface-setup",
    does: "Installs the necessary items and applies your theme.",
  },
  {
    skill: "surface-doctor",
    does: "Finds and repairs problems with your setup.",
  },
  {
    skill: "surface-start",
    does: "Starts the preview and opens it in your browser.",
  },
  {
    skill: "surface-train",
    does: "Teaches Surface a rule for all your prototypes.",
  },
  {
    skill: "surface-ship",
    does: "Publishes your prototypes to a link that you can share.",
  },
  {
    skill: "surface-update",
    does: "Gets the latest version of Surface.",
  },
  {
    skill: "surface-develop",
    does: "Changes how Surface works for all prototypes.",
  },
  {
    skill: "prototype-new",
    does: "Makes a new prototype.",
  },
  {
    skill: "prototype-update",
    does: "Changes a prototype.",
  },
  {
    skill: "prototype-animate",
    does: "Adds animation to a prototype.",
  },
  {
    skill: "prototype-delete",
    does: "Deletes a prototype and its variants.",
  },
  {
    skill: "variant-new",
    does: "Adds an alternative that you can select.",
  },
  {
    skill: "variant-update",
    does: "Changes a variant, its name or its default.",
  },
  {
    skill: "variant-animate",
    does: "Makes animations that you can compare.",
  },
  {
    skill: "variant-delete",
    does: "Deletes an option or a full variant.",
  },
  {
    skill: "chrome-new",
    does: "Makes the navigation that shows around your prototypes.",
  },
  {
    skill: "chrome-update",
    does: "Changes a chrome.",
  },
  {
    skill: "chrome-delete",
    does: "Deletes a chrome.",
  },
  {
    skill: "test-new",
    does: "Does a user test of a prototype with a simulated user.",
  },
  {
    skill: "test-persona-new",
    does: "Makes a simulated user for your user tests.",
  },
  {
    skill: "test-task-new",
    does: "Makes a goal that a simulated user tries to complete.",
  },
]

// The home page puts the skills in groups by the first word of the name.
const GROUP_LABELS: Record<string, string> = {
  surface: "Surface",
  prototype: "Prototypes",
  variant: "Variants",
  chrome: "Chromes",
  test: "User tests",
}

type Skill = (typeof SKILLS)[number]

export const SKILL_GROUPS = (() => {
  const groups: { prefix: string; label: string; skills: Skill[] }[] = []
  for (const skill of SKILLS) {
    const prefix = skill.skill.split("-")[0]
    let group = groups.find((item) => item.prefix === prefix)
    if (!group) {
      group = { prefix, label: GROUP_LABELS[prefix] ?? prefix, skills: [] }
      groups.push(group)
    }
    group.skills.push(skill)
  }
  return groups
})()

// The home page shows these keys. The README has the same list in the section
// "Controls in the preview". Change the two together.
export const SHORTCUT_GROUPS = [
  {
    label: "In each prototype",
    shortcuts: [
      {
        keys: "⌘K",
        does: "Find a prototype. Select a chrome. Select a device size.",
      },
      { keys: "⌘⇧K", does: "Select a variant of the current prototype." },
      { keys: "⌘⇧B", does: "See all prototypes in a panel." },
      { keys: "Right-click", does: "Open the Surface menu." },
      { keys: "⇧ Right-click", does: "Open the menu of the browser." },
    ],
  },
  {
    label: "In the command palette",
    shortcuts: [
      { keys: "Tab", does: "Go between the prototypes and the variants." },
      { keys: "⌘D", does: "Save the current options as your defaults." },
      { keys: "⌘C", does: "Copy the link to the screen that you see." },
      { keys: "Esc", does: "Close the command palette." },
    ],
  },
]
