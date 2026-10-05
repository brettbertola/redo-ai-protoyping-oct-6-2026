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
      <h1 className="font-heading text-xl font-semibold">Order placed</h1>
      <p className="text-sm text-muted-foreground">
        A receipt is on its way to your inbox.
      </p>
      <Link to={`/examples/mobile-checkout${search}`}>
        <Button variant="outline">Back to checkout</Button>
      </Link>
    </main>
  )
}
