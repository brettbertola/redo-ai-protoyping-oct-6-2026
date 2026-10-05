---
name: surface-train
description: Teaches Surface the design direction and the build direction of the designer. It adds, changes or removes directives in the "Direction for this project" section of AGENTS.md. Use when the user says "train Surface", "always do this", "never do this", "remember this for all prototypes", or gives feedback that must apply to future prototypes.
---

# Train Surface

Read `AGENTS.md` first.

A **directive** is one rule that the assistant obeys in all prototypes. Example: "Put the primary action at the bottom right of a form. Then the position is the same on each screen."

The section must stay short. Each directive that you add makes the other directives weaker. Thus add a directive only if it is a principle.

## Procedure

1. **Get the feedback.** If the designer did not give it, ask: "What must I do differently in all prototypes?"
2. **Read the current direction.** Run `npm run surface -- train list`.
3. **Do the four tests** below on the feedback.
4. **Write the directive.** Use the format below.
5. **Show the directive to the designer.** Tell them the group. Wait for approval. Change the text if they ask.
6. **Save it.**
   - New directive: `npm run surface -- train add --group <design|build> "<text>"`
   - Change one: `npm run surface -- train replace <id> "<text>"`
   - Remove one: `npm run surface -- train remove <id>`
7. **Read the result.** If it has `warnings`, obey them. If a group is above its limit, propose which directives to merge or remove.
8. **Tell the designer the result** in one sentence. Do not change prototypes that exist, unless the designer asks.

## The four tests

Do the tests in this sequence. Stop at the first test that fails.

| Test | Question | If the answer is "no" |
|---|---|---|
| 1. General | Does it apply to most future prototypes? | Do not add it. Change the one prototype with the `prototype-update` skill. |
| 2. New | Is it missing from the current directives and from the design rules in `AGENTS.md`? | Do not add it. Tell the designer that the rule exists. If it is almost the same as a directive, use `replace` to make that directive better. |
| 3. Correct location | Is it a decision about design or build, and not a color, font, radius or dimension? | Do not add it. A color, font or radius is a property of the theme: use the `surface-setup` skill. Navigation is a property of a chrome: use the `chrome-update` skill. |
| 4. Principle | Can you give the cause in one sentence? | Ask the designer for the cause. A rule with no cause is not a principle. |

If the feedback is specific, find the principle. Ask the designer: "What is the rule behind this?"

| The designer says | Do not write | Write |
|---|---|---|
| "The Save button on the settings page is too far from the form" | "Move the Save button on the settings page" | "Put the primary action adjacent to the content that it changes. Then the user sees the relation." |
| "This table has too much space" | "Use py-1 in the orders table" | "Use compact density for data tables. Our users compare many rows." |
| "Do not make up product names" | "Use the name Acme Pro in the pricing prototype" | "Use real product names from the sample data files. Then a review is about the design, not the text." |

## Format of a directive

- Sentence 1 is the instruction. Use the imperative.
- Sentence 2 is the cause.
- Use a maximum of 40 words.
- Do not name a prototype, a chrome, a file, a color value or a dimension.
- Use the words from the table in `AGENTS.md`.

## Groups

| Group | Contents | Example |
|---|---|---|
| `design` | The appearance and the behavior of the screens | "Show an empty state for each list. Then the first use of a screen is clear." |
| `build` | The method that you use to make the screens | "Make each section of a page a component. Then the designer can make a variant of it quickly." |

## Notes

- The script refuses a directive that names a prototype, a chrome, a file, a color value or a dimension. Use `--force` only if the designer tells you to add it without changes.
- The limit is 10 directives for each group. When a group is full, merge two directives or remove one before you add a new one.
- An update of Surface keeps the directives.
