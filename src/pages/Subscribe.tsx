
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Subscription } from "@/types/subscription"
import { StripeCheckout } from "@/components/stripe/StripeCheckout"

// Stripe Price IDs for the subscription plans
const STRIPE_PRICES = {
  monthly: "price_monthly_placeholder", // Replace with your actual Stripe price ID
  annual: "price_annual_placeholder",   // Replace with your actual Stripe price ID
}

export default function Subscribe() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | null>(null)

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate("/auth")
        return null
      }

      const response = await (supabase as any)
        .from('subscriptions')
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (response.error) {
        toast.error("Error loading subscription information")
        throw response.error
      }

      return response.data as Subscription | null
    },
  })

  if (isLoadingSubscription) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (subscription) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-6xl py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Your Subscription</h1>
            <p className="text-gray-600">
              You are currently subscribed to our {subscription.plan_type} plan
            </p>
          </div>

          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                Active Subscription
              </CardTitle>
              <CardDescription>
                Your subscription is active until{" "}
                {new Date(subscription.end_date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Plan Type: <span className="font-medium capitalize">{subscription.plan_type}</span>
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium capitalize">{subscription.status}</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-600">
            Select the subscription plan that works best for you
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          <Card className={`border-2 transition-all ${selectedPlan === "monthly" ? "border-primary" : "border-transparent"}`}>
            <CardHeader>
              <CardTitle>Monthly Plan</CardTitle>
              <CardDescription>Perfect for short-term projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$19.99<span className="text-sm font-normal text-gray-500">/month</span></p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Calendar integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>30-day free cancellation</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedPlan === "monthly" ? "default" : "outline"} 
                className="w-full"
                onClick={() => setSelectedPlan("monthly")}
              >
                Select Monthly
              </Button>
            </CardFooter>
          </Card>

          <Card className={`border-2 transition-all ${selectedPlan === "annual" ? "border-primary" : "border-transparent"}`}>
            <CardHeader>
              <CardTitle>Annual Plan</CardTitle>
              <CardDescription>Save 20% with yearly billing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$191.88<span className="text-sm font-normal text-gray-500">/year</span></p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Calendar integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>60-day free cancellation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedPlan === "annual" ? "default" : "outline"} 
                className="w-full"
                onClick={() => setSelectedPlan("annual")}
              >
                Select Annual
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          {selectedPlan ? (
            <div className="w-full max-w-md">
              <StripeCheckout 
                planType={selectedPlan} 
                priceId={selectedPlan === "monthly" ? STRIPE_PRICES.monthly : STRIPE_PRICES.annual} 
              />
            </div>
          ) : (
            <Button 
              size="lg" 
              disabled={true}
              className="w-full max-w-md"
            >
              Select a plan to continue
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
