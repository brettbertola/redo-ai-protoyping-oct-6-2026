---
name: test-persona-new
description: Makes a persona for Surface user tests. A persona is a simulated user with a backstory, a behavior and a quantity of patience. Use when the user asks for a persona, a test user, a type of user or a participant for a user test, or when the test-new skill needs a persona that does not exist.
---

# Make a persona

Read `AGENTS.md` first.

A **persona** is a simulated user. In a user test, an AI assistant behaves as this person. The traits control how the person reads, clicks and stops.

1. **Find the personas that exist.** Run `npm run surface -- test persona list`. If one agrees with the request, tell the designer. Do not make a second one.
2. **Find who the person is.** You must know the role, the experience with software and the situation. Ask only if the request is not clear. Example of an answer: "A shop owner who is not technical and has no time."
3. **Write the backstory.** Write two or three sentences in the first person. Do not use the name or the data of a real person.
4. **Select the traits.** Select one option for each trait from the backstory.

   | Trait | Question | Options |
   |---|---|---|
   | `search` | On a new page, where does this person start? | `search-first`: looks for a search field. `browse-first`: reads the navigation and the links. `mixed`: uses the first thing that gets attention. |
   | `reading` | How much does this person read? | `reads`: labels, descriptions and help text. `scans`: headings and bold text only. `glances`: large text, icons and buttons only. |
   | `exploration` | What does this person do with more than one option? | `breadth-first`: looks at all options first. `depth-first`: clicks the first option that can be correct. `linear`: goes from top to bottom. |
   | `scent` | How sure must this person be before a click? | `low`: clicks each thing that is a little related. `high`: clicks only a clear match. |
   | `effort` | How much effort does this person use to understand? | `high`: reads tooltips and instructions. `low`: ignores each text longer than one sentence. |
   | `recovery` | What does this person do when a step fails? | `retries`: does the step again. `backtracks`: goes back and uses a different path. `abandons`: leaves that path or stops. |
   | `persistence` | How long does this person continue? | `high`: tries many approaches. `medium`: tries some approaches. `low`: expects success the first time. |

5. **Select the patience.** The patience is the number of clicks and text entries before the person stops. Use 10 thru 15 for a person with no patience, 20 thru 30 for a moderate person, and 40 or more for a persistent person.
6. **Show your selection.** Give the designer the name, the backstory, the traits and the patience in a short table. Ask for a change only one time. If the designer started a user test and did not ask for a specific persona, do not wait. Continue.
7. **Make the persona.** Use a name with lowercase words and dashes. Example: `hurried-shop-owner`.

   ```
   npm run surface -- test persona new <name> --backstory "<text>" --search <option> --reading <option> --exploration <option> --scent <option> --effort <option> --recovery <option> --persistence <option> --patience <number>
   ```

   - If the command gives a `missing` list, add those flags and run it again.
   - To change a persona that exists, run the same command with all flags and `--replace`.
8. **Tell the designer the result.** Tell them that `/test-new` does a user test with this persona.

## Delete a persona

1. Run `npm run surface -- test persona delete <name>`. This command does not delete. It shows the file.
2. Tell the designer what the command will remove. Wait for a clear "yes".
3. Run the same command with `--yes`.
