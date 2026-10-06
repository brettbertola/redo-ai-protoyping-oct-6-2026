---
name: variant-animate
description: Makes animation a variant of a Surface prototype, so that the designer can compare different animations of the same screen. It also animates one option of a variant that exists. Use when the user asks for alternative animations, wants to compare motion, timing, springs or easing, wants an option with and without animation, or asks you to animate one variant or one option.
---

# Animate a variant

Read `AGENTS.md` first. Then read `.agents/skills/prototype-animate/animation-guide.md`. It contains the animation principles, the durations, the tools and the code patterns. Obey it.

1. **Find the variants that exist.** Run `npm run surface -- variant list <category/name>`.
2. **Make the decision.**

   | Request | Procedure |
   |---|---|
   | Compare different animations of the same screen | Make an `enum` variant with the name `animation`. Go to step 3. |
   | Add one more animation to compare | Add an option to the `animation` variant. Go to step 3. |
   | Animate one option of a `component` variant | Edit `variants/<variant>/<option>.tsx`. Go to step 5. |
   | Animate the full prototype in the same way for each option | Use the `prototype-animate` skill. |
3. **Make the options.** Use lowercase words with dashes.
   - New variant: `npm run surface -- variant add <prototype> animation --kind enum none`
   - New option: `npm run surface -- variant add <prototype> animation <option>`
   - Always keep the option `none`. It shows the screen with no animation, so that the designer can compare.
   - Give each option the name of its movement: `drop`, `bounce`, `slide`, `fade`. Do not use `v1` or `new`.
   - Make two to four options. Each option must be different from the others in one clear property: the path, the timing or the material.
   - If the designer wants an animation to show first, run `npm run surface -- variant set-default <prototype> animation <option>`.
4. **Write one animation for each option.** Only the animation changes between options. The screen and its final state stay the same.
   - Put all options in `_motion.ts`, adjacent to `prototype.tsx`:

     ```ts
     import type { TargetAndTransition, Transition } from "motion/react"

     type Entry = { initial: TargetAndTransition; transition: Transition }

     export const scoopEntry = {
       none: { initial: { y: 0 }, transition: { duration: 0 } },
       drop: { initial: { y: -240 }, transition: { duration: 0.3, ease: "easeIn" } },
       bounce: {
         initial: { y: -240 },
         transition: { type: "spring", stiffness: 500, damping: 12 },
       },
     } satisfies Record<string, Entry>
     ```

   - Read the option in `prototype.tsx`:

     ```tsx
     const { animation } = usePrototypeProps(config)
     const entry = scoopEntry[animation]

     <motion.div initial={entry.initial} animate={{ y: 0 }} transition={entry.transition} />
     ```

   - Write the beats of each option before you write its code, as the guide shows.
5. **Obey the guide for each option.** Each option must have a purpose, correct durations and a reduced motion alternative.
6. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem.
7. **Look at the result.** Make sure that the preview is on (`surface-start` skill). If you have a browser tool, open each option and operate the trigger.
8. **Show the result.** Give the designer the `url` from the result. Tell them which action starts the animation. Tell them that ⌘⇧K changes the animation (Ctrl+Shift+K on Windows).
