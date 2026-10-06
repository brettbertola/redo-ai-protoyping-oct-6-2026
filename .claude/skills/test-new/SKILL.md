---
name: test-new
description: Does a user test of a Surface prototype. An AI participant gets a persona and a task, operates the prototype in a real browser as that user, and records usability findings in a report. Use when the user asks you to test a prototype with a user, to do a user test or a usability test, to get feedback from a simulated user, or to find out if a design is clear.
---

# Do a user test

Read `AGENTS.md` first.

In a **user test**, a participant tries one **task** in one prototype as one **persona**. The participant is an AI assistant. A script operates the browser, counts the patience and records each action and each **finding**.

There are two roles. Keep them apart.

- The **moderator** prepares the test, starts it and reports to the designer. You are the moderator.
- The **participant** sees only the screen. The participant must not know the files of the prototype or the success conditions.

## Prepare

Ask one question at a time. Give numbered options, so that the designer can answer with a number. Option 0 is always the new item. If the request already gives an item, do not ask for it.

1. **Ask for the persona.** Run `npm run surface -- test persona list`. Then ask:

   ```
   Which persona do you want to use?
   0. Make a new persona
   1. hurried-first-timer: a shop owner who has no time
   2. careful-expert: an operations manager who reads each screen
   ```

   - Make the list from the result of the command. Add a few words from each backstory.
   - If the designer selects 0, obey the `test-persona-new` skill. Then continue with step 2.
2. **Ask for the task.** Run `npm run surface -- test task list`. Then ask:

   ```
   Which task do you want to test?
   0. Make a new task
   1. pay-for-order (examples/mobile-checkout): Pay for the order.
   ```

   - Make the list from the result of the command. Show the prototype and the goal of each task.
   - If the request gives a prototype, show only the tasks of that prototype.
   - If the designer selects 0, obey the `test-task-new` skill. That skill asks for the prototype, the options of its variants and the goal. Then continue with step 3.
3. **Show the details and ask for changes.** Run `npm run surface -- variant list <prototype>` to get the variants. Then show this summary:

   ```
   This is the user test:

   Prototype: examples/dashboard
   ├ 1. layout
   │  ├ a. cards (default)
   │  └ b. table ✓
   ├ 2. density
   │  ├ a. comfortable (default) ✓
   │  └ b. compact
   └ 3. banner
      ├ a. true (default) ✓
      └ b. false

   Device: desktop
   Persona: hurried-first-timer. Patience: 12. Reads only large text and buttons.
   Task: Find the orders that are late.
   Success: The screen shows only the late orders.

   Do you want to change something before the test starts?
   To use a different option, give its number and letter. Example: 2.b
   ```

   - Obey the rules in "How to show a prototype and its variants".
   - If the task gives an option for a variant, put the `✓` on that option. If not, put it on the default option.
   - If the designer gives a number and a letter, select that option. Then show the summary again.
   - If the designer asks for a different change, make it. To change a persona or a task, use the related skill with `--replace`. Then show the summary again.
   - Start the test only after the designer says that the details are correct.
4. **Make sure that the preview is on.** Use the `surface-start` skill.

## How to show a prototype and its variants

The variants belong to the prototype, and the options belong to the variant. Show them as a tree below the prototype, each time that you show a prototype to the designer.

```
examples/dashboard
├ 1. layout
│  ├ a. cards (default)
│  └ b. table ✓
├ 2. density
│  ├ a. comfortable (default) ✓
│  └ b. compact
└ 3. banner
   ├ a. true (default) ✓
   └ b. false
```

- Put the prototype on the first line.
- Put each variant on its own line below the prototype. Give each variant a number: `1.`, `2.`, `3.`.
- Put each option on its own line below its variant. Give each option a letter: `a.`, `b.`, `c.`. A variant can have many options. Show them all.
- Use the sequence of the result of the command for the numbers and the letters. Do not change the sequence when the designer selects a different option.
- Start each line with `├`. Start the last line of a group with `└`. Use `│` to continue the line of the variants.
- Put `(default)` after the default option.
- Put `✓` after the option that the user test uses. Each variant has only one `✓`.
- The designer selects an option with its number and letter. Example: `1.b` selects the option `table` of the variant `layout`. The designer can give more than one: `1.b 2.b`.
- If the prototype has no variants, show one line: `└ No variants`.
- Do not show the variants or the options in a different list or on one line.

## Do the test

5. **Start the test.**

   ```
   npm run surface -- test start --persona <name> --task <name>
   ```

   - Add `--variants "<variant>=<option>&<variant>=<option>"` if the designer selected an option that is not the default.
   - Add `--show` if the designer wants to see the browser during the test.
   - If the result has a `fix`, run that command. Then start the test again. Do not ask the designer to type it.
   - There is only one user test at a time.
6. **Give the task to the participant.** The result contains `briefing`, `screenshot` and `controls`.
   - If you can start a subagent, start one as the participant. Give it the full `briefing`, the path of the `screenshot` and the `controls`. Give it nothing else. Do not give it the success conditions, the files of the prototype or this skill. Tell it to continue until it runs `test end`.
   - If you cannot start a subagent, you are the participant. Obey the `briefing`. Use only what the screenshots show. Do not use what you know about the files of the prototype.
7. **The participant does the task.** The participant runs the `test` commands in the `briefing` until it runs `test end`.
   - If the participant stops and did not run `test end`, run `npm run surface -- test status`. If the test is on, tell the participant to continue or to end.
   - If a command fails two times, run `npm run surface -- test stop`. Tell the designer the cause in one sentence.

## Report

8. **Read the result of `test end`.** It contains `outcome`, `userSummary`, `findings`, `visited`, `reachedEndPage` and `success`. If you do not have it, run `npm run surface -- test runs` and read `run.json` adjacent to the report.
9. **Make your decision as the moderator.** Compare `success` with what the participant did.
   - **Success**: the outcome is `completed` and the success conditions are true.
   - **False success**: the outcome is `completed` but the success conditions are not true. The user thinks that the task is done, and it is not. This is a critical finding.
   - **Failure**: the outcome is `abandoned`. Find the step where the user stopped.
10. **Tell the designer the result.** Keep it short.
    - One sentence: who tried what, and the result.
    - The prototype and its variants as a tree, with the `✓` on the options of this test. The report shows the same tree.
    - The findings, with the most severe first. For each finding, give the screen and what the user expected.
    - A maximum of three changes that you recommend. Each change must come from a finding.
    - The path of the report in `report`. The report opens in the browser automatically. It shows each step with a screenshot.
11. **Do not change the prototype in this skill.** Tell the designer that `/prototype-update` makes a change, and that `/variant-new` makes an alternative to compare.
12. **Offer the subsequent test.** One user test is one opinion. Offer a test with a different persona, or the same test on a different option of a variant.

## More than one test

- To compare the options of a variant, do the same task with the same persona for each option. Before the first test, show one tree for each test, so that the designer sees which options each test uses. After the last test, give the designer one table with the outcome, the patience used and the number of findings for each option.
- To compare personas, do the tests one after the other.
