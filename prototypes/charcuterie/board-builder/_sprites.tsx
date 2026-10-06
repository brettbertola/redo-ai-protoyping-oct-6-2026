import { cn } from "@/lib/utils"

export type SpriteName =
  | "brie"
  | "salami"
  | "figs"
  | "honey"
  | "almonds"
  | "olives"
  | "crackers"
  | "grapes"
  | "board"
  | "empty-dish"
  | "coins"
  | "cloche"
  | "sparkles"
  | "crumbs"
  | "stamp"
  | "dish-marker"

const SPRITES: Record<SpriteName, readonly [number, number]> = {
  brie: [0, 0],
  salami: [1, 0],
  figs: [2, 0],
  honey: [3, 0],
  almonds: [0, 1],
  olives: [1, 1],
  crackers: [2, 1],
  grapes: [3, 1],
  board: [0, 2],
  "empty-dish": [1, 2],
  coins: [2, 2],
  cloche: [3, 2],
  sparkles: [0, 3],
  crumbs: [1, 3],
  stamp: [2, 3],
  "dish-marker": [3, 3],
}

export function Sprite({
  name,
  className,
}: {
  name: SpriteName
  className?: string
}) {
  const [column, row] = SPRITES[name]
  const sheetScale = ["coins", "cloche", "sparkles", "crumbs"].includes(name)
    ? 5
    : 4.6
  const position = (index: number) =>
    `${((0.5 - (index + 0.5) * (sheetScale / 4)) / (1 - sheetScale)) * 100}%`
  const x = position(column)
  const y = position(row)

  return (
    <span
      aria-hidden="true"
      className={cn("block bg-no-repeat", className)}
      style={{
        backgroundImage: 'url("/charcuterie/tactile-sprites.webp")', // surface-allow
        backgroundPosition: `${x} ${y}`, // surface-allow
        backgroundSize: `${sheetScale * 100}% ${sheetScale * 100}%`, // surface-allow
      }}
    />
  )
}
