import { useRef, useState } from "react"
import { Link } from "react-router"
import { AnimatePresence, MotionConfig, motion, type PanInfo } from "motion/react"
import { Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ingredientRest, tapSpring } from "../../_motion"
import { Sprite, type SpriteName } from "../../_sprites"

const INGREDIENTS: Array<{
  id: string
  name: string
  sprite: SpriteName
  soft: boolean
}> = [
  { id: "brie", name: "Brie", sprite: "brie", soft: true },
  { id: "salami", name: "Salami", sprite: "salami", soft: true },
  { id: "figs", name: "Figs", sprite: "figs", soft: true },
  { id: "honey", name: "Honeycomb", sprite: "honey", soft: true },
  { id: "almonds", name: "Almonds", sprite: "almonds", soft: false },
  { id: "olives", name: "Olives", sprite: "olives", soft: false },
]

const STARTING_ITEMS = ["brie", "salami"]

export default function TactileOption() {
  const [selected, setSelected] = useState<string[]>(STARTING_ITEMS)
  const [dragging, setDragging] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  function addIngredient(id: string) {
    setSelected((current) => current.includes(id) ? current : [...current, id])
  }

  function removeIngredient(id: string) {
    setSelected((current) => current.filter((item) => item !== id))
  }

  function toggleIngredient(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function pointIsOnBoard(info: PanInfo) {
    const board = boardRef.current?.getBoundingClientRect()
    if (!board) return false
    return (
      info.point.x >= board.left &&
      info.point.x <= board.right &&
      info.point.y >= board.top &&
      info.point.y <= board.bottom
    )
  }

  function finishTrayDrag(id: string, info: PanInfo) {
    setDragging(false)
    if (pointIsOnBoard(info)) addIngredient(id)
  }

  function finishBoardDrag(id: string, info: PanInfo) {
    setDragging(false)
    if (!pointIsOnBoard(info)) removeIngredient(id)
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-dvh flex-col overflow-hidden bg-secondary/60 p-3 sm:p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 sm:gap-5">
          <header className="grid grid-cols-3 items-center">
            <Button
              aria-label="Undo the last ingredient"
              className="size-12 rounded-full shadow-md"
              disabled={selected.length === 0}
              onClick={() => setSelected((current) => current.slice(0, -1))}
              size="icon-lg"
              variant="secondary"
            >
              <RotateCcw className="size-5" />
            </Button>

            <div aria-label="Step one of three" className="flex items-center justify-center gap-2" role="img">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Check className="size-4" />
              </span>
              <span className="size-3 rounded-full border-2 border-primary bg-background" />
              <span className="size-3 rounded-full border-2 border-primary bg-background" />
            </div>

            <motion.div
              aria-label={`${selected.length} ingredients selected`}
              className="justify-self-end"
              key={selected.length}
              initial={{ opacity: 0, scale: 0.88, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Sprite className="size-14" name="coins" />
            </motion.div>
          </header>

          <section className="grid min-h-0 flex-1 items-center gap-3 lg:grid-cols-[1fr_5fr_1fr]">
            <div className="hidden flex-col items-center gap-4 lg:flex">
              <Sprite className="size-20" name="sparkles" />
              <Sprite className="size-20 opacity-70" name="crumbs" />
            </div>

            <div
              ref={boardRef}
              aria-label="Charcuterie board"
              className={cn(
                "relative mx-auto aspect-square w-[min(100%,50dvh)] rounded-full transition-shadow",
                dragging ? "ring-4 ring-primary/20" : ""
              )}
              role="group"
            >
              <Sprite className="absolute inset-0 size-full" name="board" />
              <div className="absolute inset-x-1/4 top-1/4 bottom-1/4 grid grid-cols-3 items-center gap-1 sm:gap-3">
                <AnimatePresence mode="popLayout">
                  {selected.map((id) => {
                    const ingredient = INGREDIENTS.find((item) => item.id === id)
                    if (!ingredient) return null
                    return (
                      <motion.div
                        drag
                        dragSnapToOrigin
                        key={ingredient.id}
                        layout
                        layoutId={`tactile-${ingredient.id}`}
                        onDragEnd={(_, info) => finishBoardDrag(ingredient.id, info)}
                        onDragStart={() => setDragging(true)}
                        transition={ingredientRest}
                        whileDrag={{ scale: 1.12, y: -8 }}
                      >
                        <motion.div
                          animate={ingredient.soft
                            ? { scaleX: [0.94, 1.12, 1], scaleY: [1.06, 0.86, 1] }
                            : { scale: [0.94, 1] }}
                          transition={{ duration: 0.42, ease: "easeOut" }}
                        >
                          <Button
                            aria-label={`Return ${ingredient.name} to its dish`}
                            className="size-16 rounded-full p-0 sm:size-24"
                            onClick={() => removeIngredient(ingredient.id)}
                            size="icon-lg"
                            variant="ghost"
                          >
                            <Sprite className="size-full" name={ingredient.sprite} />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <Link to="/charcuterie/checkout">
                <motion.div whileTap={{ scale: 0.97 }} transition={tapSpring}>
                  <Button
                    aria-label="Continue to checkout"
                    className="size-24 rounded-full p-0 shadow-md"
                    size="icon-lg"
                    variant="secondary"
                  >
                    <Sprite className="size-20" name="cloche" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </section>

          <section aria-label="Ingredient dishes" className="rounded-3xl border bg-card/80 p-2 shadow-md sm:p-3">
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-6 sm:gap-3">
              {INGREDIENTS.map((ingredient) => {
                const isSelected = selected.includes(ingredient.id)
                return (
                  <motion.div
                    className="flex justify-center"
                    drag={!isSelected}
                    dragSnapToOrigin
                    key={ingredient.id}
                    onDragEnd={(_, info) => finishTrayDrag(ingredient.id, info)}
                    onDragStart={() => setDragging(true)}
                    transition={tapSpring}
                    whileDrag={{ scale: 1.08, y: -8 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Button
                      aria-label={isSelected ? `Return ${ingredient.name}` : `Add ${ingredient.name}`}
                      aria-pressed={isSelected}
                      className="relative size-20 rounded-2xl p-0 sm:size-24"
                      onClick={() => toggleIngredient(ingredient.id)}
                      size="icon-lg"
                      variant="ghost"
                    >
                      <Sprite className="absolute inset-0 size-full opacity-80" name="empty-dish" />
                      {!isSelected ? (
                        <motion.span
                          className="absolute inset-0"
                          layoutId={`tactile-${ingredient.id}`}
                          transition={ingredientRest}
                        >
                          <Sprite className="size-full" name={ingredient.sprite} />
                        </motion.span>
                      ) : null}
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </section>

          <div className="flex justify-center lg:hidden">
            <Link to="/charcuterie/checkout">
              <motion.div whileTap={{ scale: 0.97 }} transition={tapSpring}>
                <Button
                  aria-label="Continue to checkout"
                  className="size-20 rounded-full p-0 shadow-md"
                  size="icon-lg"
                  variant="secondary"
                >
                  <Sprite className="size-16" name="cloche" />
                </Button>
              </motion.div>
            </Link>
          </div>

          <p aria-live="polite" className="sr-only">
            {selected.length} ingredients are on the board.
          </p>
        </div>
      </main>
    </MotionConfig>
  )
}
