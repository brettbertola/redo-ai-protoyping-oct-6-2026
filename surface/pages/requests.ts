// One entry for each skill in .agents/skills. The home page shows each one
// as a slash command: /<skill>. `npm run surface -- check` fails if this list
// and the skills folder are different.
export const SKILLS = [
  {
    skill: "surface-setup",
    does: "Installs the necessary items and applies your theme.",
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
    skill: "prototype-new",
    does: "Makes a new prototype.",
  },
  {
    skill: "prototype-update",
    does: "Changes a prototype.",
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
]

// The home page puts the skills in groups by the first word of the name.
const GROUP_LABELS: Record<string, string> = {
  surface: "Surface",
  prototype: "Prototypes",
  variant: "Variants",
  chrome: "Chromes",
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
