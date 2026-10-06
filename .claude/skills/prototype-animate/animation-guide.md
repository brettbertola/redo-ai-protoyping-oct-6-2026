# Animation guide

The `prototype-animate` skill and the `variant-animate` skill use this guide. Read all of it before you write an animation.

## Words

| Word | Meaning |
|---|---|
| animation | One change of an element in time: position, size, rotation, opacity or shape |
| product animation | An animation that shows the product do its work. Example: a scoop falls onto a cone |
| interface animation | An animation of a control or a container. Example: a sheet opens, a button reacts |
| beat | One step of an animation. Example: the scoop touches the cone |
| trigger | The action or event that starts an animation. Example: a tap on "Add a scoop" |
| reduced motion | The setting of a person who does not want movement on the screen |

## The purpose

Each animation must do one of these jobs. If it does none of them, do not add it.

| Job | Example |
|---|---|
| Show cause and effect | The scoop that the user selected falls onto the cone |
| Show where an item comes from and where it goes | The item moves from the list into the cart |
| Confirm an action | The button gets smaller under the finger. A check mark draws itself |
| Show the state of the product | The cone gets higher with each scoop. A full cone moves a small quantity |
| Direct the eyes to one place | The total price changes after the scoop comes to rest |
| Give the product a character | The scoop is soft: it gets flat when it hits, then it recovers |

A product animation tells a small story about the product. Thus you must know the product. Ask yourself: what is this object made of? Is it heavy or light? Is it soft or hard? An ice cream scoop is heavy and soft. A paper receipt is light and stiff. The animation must agree with the answer.

## The principles

These are the classic animation principles, adjusted for a product.

1. **Timing gives weight.** A heavy object starts slowly and stops slowly. A light object moves quickly. Do not give all objects the same duration.
2. **Slow in and slow out.** Objects in the real world do not start or stop instantly. Use easing or a spring. Use linear motion only for a spinner or a progress bar.
3. **Anticipation.** Before a large movement, make a small movement in the opposite direction. Example: the scoop goes up 8 px before it falls. Keep it short: 80 ms to 150 ms.
4. **Squash and stretch.** A soft object gets longer while it moves fast. It gets flat when it hits. Keep the volume constant: if `scaleY` is 0.8, `scaleX` is approximately 1.2. Set the origin to the contact point. A hard object does not change shape.
5. **Follow-through and overlap.** The parts of an object do not all stop at the same time. The cone moves down 4 px when the scoop hits. The sprinkles come to rest after the scoop.
6. **Arcs.** Objects that a person or gravity moves follow a curve, not a straight line. To make an arc, give `x` and `y` different easing.
7. **Staging.** Show one idea at a time. While the product animation plays, other elements do not move. Keep the area around it clear.
8. **Secondary action.** A small animation can support the main one. It must be smaller, and it must start later. Example: the price counts up after the scoop comes to rest.
9. **Stagger.** When a group of items comes in, start each item 30 ms to 60 ms after the previous one. Keep the total time of the group below 400 ms.
10. **Exaggeration.** Make the movement a small quantity larger than in the real world, so that the user sees it. In a product, a small quantity is sufficient.
11. **Continuity.** An element that is on two screens is one object. Move it from the old position to the new one. Do not hide it and show a copy.
12. **Solid objects.** An object keeps its size, its color and its light direction during the animation. A scoop that lands is the same scoop that the user selected.

## The rules for a product

1. **The user has control.** Do not block input during an animation. A new tap during an animation must work immediately. Springs in Motion do this automatically.
2. **Frequency sets the size.** The more frequently the user sees an animation, the shorter and smaller it must be. A product animation that plays one time for each order can be long. A button reaction must be almost invisible.
3. **An exit is shorter than an entry.** Use approximately 70% of the entry duration.
4. **An animation starts at its trigger.** A menu grows from its button. A scoop comes from the flavor that the user tapped, or from the top of the screen above the cone.
5. **Do not make the user wait.** If an animation comes before the subsequent step, keep it below 1 second. Let the user continue before it ends.
6. **No loops.** An animation plays one time and stops. A loop is permitted only while the product does work, such as a load.
7. **The final state is the truth.** When the animation ends, the screen must show the correct data. The screen must also be correct if the animation does not play.

## Durations and easing

| Type | Duration | Easing |
|---|---|---|
| Reaction to a tap or a hover | 100 ms to 150 ms | Spring: stiffness 500, damping 30 |
| Small element comes in (badge, tooltip, check mark) | 150 ms to 200 ms | Ease out |
| Sheet, dialog or panel comes in | 250 ms to 350 ms | Ease out, or spring with no bounce |
| Element goes out | 70% of the entry | Ease in |
| Element moves on the screen | 300 ms to 400 ms | Ease in and out, or spring |
| Object falls | 250 ms to 400 ms | Ease in. Then squash on contact |
| Object comes to rest after contact | 300 ms to 600 ms | Spring with bounce: stiffness 400 to 600, damping 10 to 15 |
| Full product animation | 600 ms to 1200 ms | A sequence of beats |

- On a phone, use the low end of each range. On a desktop, large movements can use the high end.
- A spring with bounce is correct for a physical object. It is not correct for a dialog, a menu or a page.
- Use the same spring for the same type of object in all the prototype. Put the values in one file.

## The tool

Three tools are installed. Use the first one that can do the job.

| Tool | Import | Use |
|---|---|---|
| CSS classes | `animate-in fade-in slide-in-from-bottom-4 duration-200` | A simple entry or exit. The shadcn components already use these classes |
| Motion | `motion/react` | The default. Springs, gestures, layout change, shared elements, entry and exit, short sequences |
| GSAP | `gsap` and `@gsap/react` | A long timeline with many beats, a scroll story, text that splits, a shape that changes into a different shape |

- Do not use two tools on the same element.
- Do not add a different animation library. If a request needs Lottie or Rive files, tell the designer.

## Procedure for a product animation

1. **Write the beats first.** Write the trigger and three to six beats in plain words, each with a duration. Example:

   ```
   Trigger: the user taps "Add a scoop".
   1. Anticipation (100 ms): the scoop shows above the cone and goes up 8 px.
   2. Fall (300 ms, ease in): the scoop falls and gets a small quantity longer.
   3. Contact (80 ms): the scoop gets flat. The cone goes down 4 px.
   4. Rest (400 ms, spring with bounce): the scoop and the cone recover.
   5. Secondary (200 ms): the price changes.
   ```

2. **Make each part that moves a separate element.** The cone is one element. Each scoop is one element. Draw simple shapes with `div` elements or inline SVG. Use theme colors.
3. **Make the final state first.** Make the screen correct with no animation. Then add the animation from the initial state to that state.
4. **Add one beat at a time.** Look at the result after each beat.
5. **Add the reduced motion alternative.** See below.

## Code patterns

Use these patterns. They agree with the installed versions.

### Shared values

```ts
// _motion.ts, adjacent to prototype.tsx
export const tap = { type: "spring", stiffness: 500, damping: 30 } as const
export const rest = { type: "spring", stiffness: 500, damping: 12 } as const
export const fall = [0.55, 0, 1, 0.45] as const // ease in
```

### Entry, exit and layout change (Motion)

```tsx
import { AnimatePresence, MotionConfig, motion } from "motion/react"

<MotionConfig reducedMotion="user">
  <div className="flex h-64 flex-col-reverse items-center">
    <Cone />
    <AnimatePresence>
      {scoops.map((scoop) => (
        <motion.div
          key={scoop.id}
          layout
          className="size-20 origin-bottom rounded-full bg-primary"
          initial={{ y: -240, opacity: 0, scaleX: 0.9, scaleY: 1.1 }}
          animate={{ y: 0, opacity: 1, scaleX: [0.9, 1.15, 1], scaleY: [1.1, 0.8, 1] }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          transition={{
            y: { duration: 0.3, ease: fall },
            opacity: { duration: 0.1 },
            scaleX: { duration: 0.4, delay: 0.28, times: [0, 0.4, 1] },
            scaleY: { duration: 0.4, delay: 0.28, times: [0, 0.4, 1] },
          }}
        />
      ))}
    </AnimatePresence>
  </div>
</MotionConfig>
```

- `layout` moves the other items when one item comes in or goes out.
- `layoutId="scoop-3"` on two elements moves one object between two places or two screens.
- Each item in `AnimatePresence` must have a stable `key`. Do not use the array index.

### Reaction to a tap (Motion)

```tsx
<motion.div whileTap={{ scale: 0.97 }} transition={tap}>
  <Button onClick={addScoop}>Add a scoop</Button>
</motion.div>
```

Put the `motion.div` around the component. Do not change the files in `src/components/ui/`.

### Sequence of beats (Motion)

```tsx
import { stagger, useAnimate, useReducedMotion } from "motion/react"

const [scope, animate] = useAnimate()
const reduce = useReducedMotion()

async function playOrder() {
  if (reduce) return
  await animate([
    [".scoop", { y: [-240, 0] }, { duration: 0.3, ease: "easeIn" }],
    [".scoop", { scaleY: [0.8, 1] }, { type: "spring", stiffness: 500, damping: 12 }],
    [".sprinkle", { opacity: [0, 1], y: [-8, 0] }, { delay: stagger(0.04), at: "-0.1" }],
  ])
}

return <div ref={scope}>…</div>
```

### Long timeline (GSAP)

```tsx
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

const root = useRef<HTMLDivElement>(null)
useGSAP(
  () => {
    const media = gsap.matchMedia()
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .from(".scoop", { y: -240, duration: 0.3, ease: "power2.in" })
        .to(".scoop", { scaleY: 0.8, duration: 0.08 })
        .to(".scoop", { scaleY: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })
        .from(".sprinkle", { opacity: 0, y: -8, stagger: 0.04 }, "-=0.3")
    })
  },
  { scope: root }
)

return <div ref={root}>…</div>
```

Always use `useGSAP` with a `scope`. It removes the animation when the screen closes. Do not use `useEffect` for GSAP.

## Performance

1. Animate only `x`, `y`, `scale`, `rotate` and `opacity`. The browser can do these at 60 frames each second.
2. Do not animate `width`, `height`, `top`, `left`, `margin` or `padding`. For a size change or a position change, use `layout` in Motion.
3. Do not animate `box-shadow` or `filter` on a large element. Animate the opacity of a second layer as an alternative.
4. Do not animate more than approximately 20 elements at the same time on a phone.

## Reduced motion

Each animation must have an alternative for reduced motion.

1. Put `<MotionConfig reducedMotion="user">` around the screen. Motion then removes movement and keeps opacity changes.
2. For a sequence with `useAnimate`, read `useReducedMotion()`. If it is true, go directly to the final state.
3. For GSAP, put the timeline in `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`.
4. For CSS classes, add `motion-reduce:animate-none`.
5. Do not make an element flash more than three times in one second.

## Surface rules

1. The design rules in `AGENTS.md` apply. Use theme colors for shapes: `bg-primary`, `bg-secondary`, `bg-accent`, `fill-primary`.
2. To animate a color, use a token: `backgroundColor: "var(--primary)"`. Do not use a hex value.
3. Movement values in `initial`, `animate` and `style` are permitted. Example: `y: -240`, `scale: 0.97`.
4. If the product needs a color that the theme does not have, tell the designer. Use `surface-allow` only after they agree.
5. Keep the movement in the frame of the device. A phone prototype is 390 px wide.
6. If the animation uses saved state, add `registerPrototypeReset`. Then "Reset prototype" lets the designer play it again.
7. An animation that plays when the screen opens must play again after a reload of the page.
