---
name: test-task-new
description: Makes a task for Surface user tests. A task is the goal that a simulated user tries to complete in one prototype, with the conditions for success. Use when the user asks for a task, a scenario or a goal for a user test, or when the test-new skill needs a task that does not exist.
---

# Make a task

Read `AGENTS.md` first.

A **task** is one goal for a user in one prototype. It has two parts:

- The **goal** is the text that the participant gets. It has no hints.
- The **success conditions** are for you. The participant does not see them.

1. **Find the prototypes.** Run `npm run surface -- prototype list`. Find each prototype that the designer refers to. Ask if you are not sure.
   - A task is for one prototype. If the designer wants more than one prototype, make one task for each prototype.
2. **Find the tasks that exist.** Run `npm run surface -- test task list`. If one agrees with the request, tell the designer. Do not make a second one.
3. **Show the prototypes and their variants.** The result of `prototype list` contains the variants of each prototype. Show each prototype as a tree. Then ask for changes.

   ```
   These are the prototypes for the task:

   examples/dashboard
   ├ 1. layout
   │  ├ a. cards (default) ✓
   │  └ b. table
   ├ 2. density
   │  ├ a. comfortable (default) ✓
   │  └ b. compact
   └ 3. banner
      ├ a. true (default) ✓
      └ b. false

   examples/mobile-checkout
   └ 4. button
      ├ a. sticky (default) ✓
      └ b. inline

   Do you want to use a different option for a variant?
   Give its number and letter. Example: 1.b
   ```

   - Put the prototype on the first line. Put each variant on its own line below the prototype. Put each option on its own line below its variant.
   - Give each variant a number: `1.`, `2.`, `3.`. If there is more than one prototype, continue the numbers from one prototype to the subsequent prototype. Thus each number refers to only one variant.
   - Give each option a letter: `a.`, `b.`, `c.`. A variant can have many options. Show them all.
   - Use the sequence of the result of the command for the numbers and the letters. Do not change the sequence when the designer selects a different option.
   - Start each line with `├`. Start the last line of a group with `└`. Use `│` to continue the line of the variants.
   - Put `(default)` after the default option. Put `✓` after the option that the task uses. Each variant has only one `✓`.
   - If a prototype has no variants, show one line: `└ No variants`. If no prototype has variants, do not ask the question.
   - At first, the `✓` is on the default option of each variant.
   - The designer selects an option with its number and letter. Example: `1.b` selects the option `table` of the variant `layout`. The designer can give more than one: `1.b 4.b`.
   - After each change, show the trees again with the `✓` on the new option. Ask again.
   - Continue only after the designer says that the options are correct.
   - If the designer started a user test and did not ask for specific options, do not wait. Show the trees and continue.
4. **Write the goal.** Write it as you tell a real user. Use the words of the user, not the words on the screen.
   - Good: "You want a different picture behind your tracking page. Change it."
   - Bad: "Click Settings, then click Appearance." This text gives the path.
   - Do not use the label of a button or the name of a page in the goal.
   - If the designer did not give a goal, read the prototype and propose the most important goal of the screen.
5. **Find the success conditions.** Read the files of the prototype: `prototype.tsx`, `pages/` and `variants/`. For a "component" variant, read the file of the option that the task uses.
   - **End page**: the page in `pages/` that shows when the task is done. If the task ends on the first screen, there is no end page.
   - **Interactions**: the controls that the user must use. Example: "Email field; Pay button".
   - **Signal**: what the screen shows when the task is done. Example: "The screen says that the order is placed."
   - If the prototype cannot complete the task (a button does nothing), tell the designer. Offer `/prototype-update` to add the missing step.
6. **Select the start.**
   - The task starts on the first screen of the prototype. Use `--start-page <page>` to start on a page in `pages/`.
   - If the `✓` is on an option that is not the default in step 3, add `--variants "<variant>=<option>&<variant>=<option>"`. Include only those variants.
   - If all variants use the default option, do not add `--variants`. A user test can select the variants when it starts.
7. **Select the difficulty** for a user who knows the product: `easy` (3 thru 5 clicks), `moderate` (5 thru 10 clicks) or `hard` (more than 10 clicks).
8. **Make the task.** Use a name with lowercase words and dashes. Start it with a verb. Example: `pay-for-order`.

   ```
   npm run surface -- test task new <name> --prototype <category/name> --goal "<text>" --signal "<text>" --interactions "<control>; <control>" --end-page <page> --difficulty <easy|moderate|hard>
   ```

   - If you make more than one task, run the command one time for each prototype. Give each task a different name.
   - If the command gives a `missing` list, correct those flags and run it again.
   - To change a task that exists, run the same command with all flags and `--replace`.
9. **Tell the designer the result.** For each task, show the tree of the prototype and its variants again. Below it, give the goal and the success conditions in two short lists. Tell them that `/test-new` does a user test with this task.

## Delete a task

1. Run `npm run surface -- test task delete <name>`. This command does not delete. It shows the file.
2. Tell the designer what the command will remove. Wait for a clear "yes".
3. Run the same command with `--yes`.
