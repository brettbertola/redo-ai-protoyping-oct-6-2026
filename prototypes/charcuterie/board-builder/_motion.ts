export const tapSpring = {
  type: "spring",
  stiffness: 500,
  damping: 30,
} as const

export const ingredientRest = {
  type: "spring",
  stiffness: 500,
  damping: 13,
} as const

export const ingredientFall = [0.55, 0, 1, 0.45] as const
