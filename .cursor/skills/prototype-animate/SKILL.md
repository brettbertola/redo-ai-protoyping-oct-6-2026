---
name: prototype-animate
description: Adds animation to a Surface prototype. It makes product animations, such as an ice cream scoop that falls onto a cone, and interface animations, such as a sheet that opens. Use when the user asks you to animate a prototype, a screen or an element, or asks for motion, a transition, a micro-interaction, a spring, a bounce, or an object that moves, falls, grows or changes.
---

# Animate a prototype

Read `AGENTS.md` first. Then read `.agents/skills/prototype-animate/animation-guide.md`. It contains the animation principles, the durations, the tools and the code patterns. Obey it.

A **product animation** shows the product do its work. Example: a scoop falls onto a cone when the user adds a flavor.
An **interface animation** moves a control or a container. Example: a sheet opens.

1. **Find the prototype.** Run `npm run surface -- prototype list`. If more than one prototype agrees with the request, ask the designer which one.
2. **Read the files.** Read `prototype.config.ts`, `prototype.tsx` and the files adjacent to them. Include `variants/` and `pages/`.
3. **Find the purpose.** Use the table "The purpose" in the guide. Find the trigger, the object that moves and the job of the animation.
   - For a product animation, decide what the object is made of: heavy or light, soft or hard.
   - If the request gives no object and no trigger, give two or three specific alternatives. Let the designer select one.
4. **Write the beats.** Write the trigger and each beat with its duration, as the guide shows. Tell the designer the beats in a few lines. Do not wait for an answer.
5. **Prepare the parts.** Make each part that moves a separate element. Make the final state correct with no animation.
6. **Select the tool.** Use the table "The tool" in the guide. Motion is the default.
7. **Write the animation.** Use the code patterns in the guide.
   - Put the spring values and the durations in `_motion.ts`, adjacent to `prototype.tsx`.
   - Add one beat at a time.
   - Animate only `x`, `y`, `scale`, `rotate` and `opacity`. Use `layout` for a size change or a position change.
8. **Add the reduced motion alternative.** Obey the section "Reduced motion" in the guide.
9. **Examine the animation against the guide.** Repair each item that fails.

   | Question | Correct answer |
   |---|---|
   | Does the animation do one job from the table "The purpose"? | Yes |
   | Does the timing agree with the weight and the material of the object? | Yes |
   | Can the user tap again during the animation? | Yes |
   | Is each duration in the range of the table "Durations and easing"? | Yes |
   | Is the screen correct if the animation does not play? | Yes |
   | Do two animations compete for the eyes at the same time? | No |
   | Does an animation loop with no cause? | No |
10. **Do a check.** Run `npm run surface -- check --no-build`. Repair each problem.
11. **Look at the result.** Make sure that the preview is on (`surface-start` skill). If you have a browser tool, open the address and operate the trigger.
12. **Show the result.** Give the designer the address. Tell them which action starts the animation. Tell them that `/variant-animate` lets them compare different animations.
