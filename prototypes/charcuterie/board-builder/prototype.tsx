import { useState } from "react"
import { Link } from "react-router"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { Check, ChevronRight, Minus, Plus, Sparkles } from "lucide-react"
import { usePrototypeProps } from "@surface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import config from "./prototype.config"
import { ingredientFall, ingredientRest, tapSpring } from "./_motion"

const INGREDIENTS = [
  { id: "brie", name: "Triple cream brie", note: "Soft and buttery", price: 8, mark: "Br" },
  { id: "salami", name: "Fennel salami", note: "Savory and bright", price: 7, mark: "Sa" },
  { id: "figs", name: "Black mission figs", note: "Jammy and sweet", price: 5, mark: "Fi" },
  { id: "honey", name: "Wildflower honey", note: "Floral and golden", price: 4, mark: "Ho" },
  { id: "almonds", name: "Marcona almonds", note: "Toasted and crisp", price: 4, mark: "Al" },
  { id: "olives", name: "Castelvetrano olives", note: "Mild and briny", price: 5, mark: "Ol" },
] as const

const STARTING_ITEMS = ["brie", "salami", "figs"]

export default function BoardBuilder() {
  const { experience: Experience } = usePrototypeProps(config)
  const [selected, setSelected] = useState<string[]>(STARTING_ITEMS)

  const total = 48 + INGREDIENTS.reduce(
    (sum, item) => sum + (selected.includes(item.id) ? item.price : 0),
    0
  )

  function toggleIngredient(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  const guided = (
    <MotionConfig reducedMotion="user">
      <main className="min-h-dvh bg-background">
        <header className="border-b bg-background">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="font-heading text-base font-semibold">Gathered</p>
                <p className="text-xs text-muted-foreground">Board studio</p>
              </div>
            </div>
            <Badge variant="outline">Step 1 of 3</Badge>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-12">
          <section className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Badge variant="secondary">Made by you</Badge>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Build a board worth gathering around.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground">
                Select flavors for six guests. Each choice lands on your board.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {INGREDIENTS.map((ingredient) => {
                const isSelected = selected.includes(ingredient.id)
                return (
                  <motion.div
                    key={ingredient.id}
                    whileTap={{ scale: 0.98 }}
                    transition={tapSpring}
                  >
                    <Card className={isSelected ? "ring-2 ring-primary" : ""} size="sm">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-xs font-semibold">
                            {ingredient.mark}
                          </span>
                          <div className="min-w-0 flex-1">
                            <CardTitle>{ingredient.name}</CardTitle>
                            <CardDescription>{ingredient.note}</CardDescription>
                          </div>
                          {isSelected ? <Check className="size-4 text-primary" /> : null}
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">+${ingredient.price}</span>
                        <Button
                          size="sm"
                          variant={isSelected ? "secondary" : "outline"}
                          onClick={() => toggleIngredient(ingredient.id)}
                        >
                          {isSelected ? <Minus data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                          {isSelected ? "Remove" : "Add"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </section>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="bg-secondary/40">
              <CardHeader>
                <CardTitle>Your signature board</CardTitle>
                <CardDescription>Classic oval · Serves six</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-80 items-center justify-center rounded-3xl bg-primary p-5 shadow-md">
                  <div className="grid w-full grid-cols-3 gap-3 rounded-3xl border border-primary-foreground/20 p-4">
                    <AnimatePresence mode="popLayout">
                      {selected.map((id) => {
                        const ingredient = INGREDIENTS.find((item) => item.id === id)
                        if (!ingredient) return null
                        return (
                          <motion.div
                            layout
                            key={ingredient.id}
                            className="flex aspect-square items-center justify-center rounded-full bg-background text-center font-heading text-xs font-semibold shadow-md"
                            initial={{ y: -80, opacity: 0, scale: 0.82, rotate: -8 }}
                            animate={{
                              y: 0,
                              opacity: 1,
                              scale: [0.82, 1.08, 1],
                              rotate: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                            transition={{
                              y: { duration: 0.32, ease: ingredientFall },
                              opacity: { duration: 0.18 },
                              scale: ingredientRest,
                              rotate: ingredientRest,
                              layout: ingredientRest,
                            }}
                          >
                            {ingredient.mark}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                    {selected.length === 0 ? (
                      <p className="col-span-3 self-center text-center text-sm text-primary-foreground">
                        Add your first ingredient.
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Your board</p>
                <motion.p
                  key={total}
                  className="font-heading text-2xl font-semibold"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  ${total}
                </motion.p>
              </div>
              <Link to="/charcuterie/checkout">
                <Button size="lg">
                  Review order
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </MotionConfig>
  )

  return <Experience guided={guided} />
}
