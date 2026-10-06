import { Link, useLocation } from "react-router"
import { usePrototypeProps } from "@surface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import config from "./prototype.config"

const ITEMS = [
  { name: "Canvas tote", price: "$38.00" },
  { name: "Enamel mug", price: "$16.00" },
]

export default function Checkout() {
  const { button } = usePrototypeProps(config)
  const { search } = useLocation()

  const pay = (
    <Link to={`/examples/mobile-checkout/confirmation${search}`}>
      <Button className="w-full" size="lg">
        Pay $54.00
      </Button>
    </Link>
  )

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 flex-col gap-6 p-5">
        <h1 className="font-heading text-xl font-semibold">Checkout</h1>
        <ul className="flex flex-col divide-y rounded-lg border">
          {ITEMS.map((item) => (
            <li key={item.name} className="flex justify-between p-3 text-base">
              <span>{item.name}</span>
              <span className="font-medium">{item.price}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="card">Card number</Label>
          <Input id="card" inputMode="numeric" />
        </div>
        {button === "inline" ? pay : null}
      </div>
      {button === "sticky" ? (
        <div className="sticky bottom-0 border-t bg-background p-4">{pay}</div>
      ) : null}
    </main>
  )
}
