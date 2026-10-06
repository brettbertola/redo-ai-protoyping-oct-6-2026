import { Link } from "react-router"
import { MotionConfig, motion } from "motion/react"
import { CalendarDays, Check, MapPin, Sparkles } from "lucide-react"
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
import { cardEntry, checkRest, confettiDuration } from "./_motion"

const CONFETTI = [
  { x: -120, y: -100, rotate: -160 },
  { x: -76, y: -140, rotate: 120 },
  { x: -34, y: -115, rotate: -90 },
  { x: 18, y: -145, rotate: 150 },
  { x: 58, y: -112, rotate: -130 },
  { x: 105, y: -132, rotate: 180 },
  { x: 130, y: -82, rotate: 100 },
  { x: -142, y: -54, rotate: -120 },
] as const

export default function Success() {
  usePrototypeProps(config)

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-primary px-5 py-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {CONFETTI.map((piece, index) => (
            <motion.span
              key={`${piece.x}-${piece.y}`}
              className={index % 2 === 0 ? "absolute h-3 w-2 rounded-sm bg-background" : "absolute size-2 rounded-full bg-secondary"}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
              animate={{
                x: piece.x,
                y: piece.y,
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1, 1, 0.8],
                rotate: piece.rotate,
              }}
              transition={{
                duration: confettiDuration,
                delay: 0.18 + index * 0.035,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 w-full max-w-xl"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={cardEntry}
        >
          <Card className="shadow-md">
            <CardHeader className="items-center text-center">
              <div className="relative flex size-20 items-center justify-center">
                <motion.span
                  className="absolute flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  initial={{ scale: 0, rotate: -24 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...checkRest, delay: 0.15 }}
                >
                  <Check className="size-7" />
                </motion.span>
              </div>
              <Badge variant="secondary">Order GB-1048</Badge>
              <CardTitle className="text-3xl">The good stuff is on its way.</CardTitle>
              <CardDescription className="max-w-md text-base">
                Your custom board is reserved. We sent the receipt to alex@example.com.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <motion.div
                className="grid gap-3 sm:grid-cols-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.45 }}
              >
                <div className="flex gap-3 rounded-xl bg-secondary p-4">
                  <CalendarDays className="size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Saturday, October 10</p>
                    <p className="text-sm text-muted-foreground">1 PM – 3 PM</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-secondary p-4">
                  <MapPin className="size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">145 Garden Lane</p>
                    <p className="text-sm text-muted-foreground">Leave with the host</p>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col items-center gap-3 text-center">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4" />
                  Your handwritten card is included.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link to="/charcuterie/board-builder">
                    <Button variant="outline">Build another board</Button>
                  </Link>
                  <Button>Track this order</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </MotionConfig>
  )
}
