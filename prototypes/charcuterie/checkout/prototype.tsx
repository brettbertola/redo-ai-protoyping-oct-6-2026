import { Link } from "react-router"
import { ArrowLeft, CalendarDays, Check, CreditCard, ShieldCheck } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import config from "./prototype.config"

const ORDER_ITEMS = [
  ["Classic oval board", "$48"],
  ["Triple cream brie", "$8"],
  ["Fennel salami", "$7"],
  ["Black mission figs", "$5"],
] as const

export default function Checkout() {
  usePrototypeProps(config)

  return (
    <main className="min-h-dvh bg-secondary/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-2 text-sm font-medium" to="/charcuterie/board-builder">
            <ArrowLeft className="size-4" />
            Edit board
          </Link>
          <Badge variant="outline">Secure checkout</Badge>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:py-12">
        <section className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Step 2 of 3</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Finish your gathering.</h1>
            <p className="text-base text-muted-foreground">
              Choose a delivery time and add your payment details.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                Delivery
              </CardTitle>
              <CardDescription>Saturday, October 10 · 145 Garden Lane</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="afternoon" className="grid sm:grid-cols-3">
                {["11 AM – 1 PM", "1 PM – 3 PM", "3 PM – 5 PM"].map((time, index) => (
                  <FieldLabel key={time}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={["morning", "afternoon", "evening"][index]} />
                      <span>{time}</span>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4" />
                Payment
              </CardTitle>
              <CardDescription>Your receipt goes to this email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" defaultValue="alex@example.com" />
                </Field>
                <Field className="sm:col-span-2">
                  <Label htmlFor="card">Card number</Label>
                  <Input id="card" inputMode="numeric" placeholder="4242 4242 4242 4242" />
                </Field>
                <Field>
                  <Label htmlFor="expiry">Expiration</Label>
                  <Input id="expiry" inputMode="numeric" placeholder="MM / YY" />
                </Field>
                <Field>
                  <Label htmlFor="cvc">Security code</Label>
                  <Input id="cvc" inputMode="numeric" placeholder="CVC" />
                </Field>
              </FieldGroup>
              <div className="flex items-start gap-3 pt-5">
                <Checkbox id="gift" defaultChecked />
                <Label htmlFor="gift" className="items-start leading-normal">
                  Include a handwritten card with the message “Save me some brie.”
                </Label>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
              <CardDescription>One board · Serves six</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex min-h-40 items-center justify-center rounded-2xl bg-primary p-5">
                <div className="grid grid-cols-3 gap-3">
                  {['Br', 'Sa', 'Fi'].map((mark) => (
                    <span key={mark} className="flex size-12 items-center justify-center rounded-full bg-background font-heading text-xs font-semibold shadow-md">
                      {mark}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {ORDER_ITEMS.map(([name, price]) => (
                  <div key={name} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{name}</span>
                    <span>{price}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between gap-4 font-medium">
                <span>Total</span>
                <span>$68</span>
              </div>
              <Link to="/charcuterie/success">
                <Button className="w-full" size="lg">
                  Place order · $68
                </Button>
              </Link>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" />
                Payment details stay protected.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
