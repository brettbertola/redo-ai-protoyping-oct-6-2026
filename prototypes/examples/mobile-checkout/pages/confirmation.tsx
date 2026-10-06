import { Link, useLocation } from "react-router"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Confirmation() {
  const { search } = useLocation()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-6" />
      </span>
      <h1 className="font-heading text-xl font-semibold">Payment received</h1>
      <p className="font-heading text-3xl font-semibold">$54.00</p>
      <p className="text-base">
        Your order is placed. A receipt is on its way to your inbox.
      </p>
      <Link to={`/examples/mobile-checkout${search}`}>
        <Button variant="outline">Done</Button>
      </Link>
    </main>
  )
}
