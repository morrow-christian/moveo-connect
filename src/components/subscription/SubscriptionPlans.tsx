
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StripeCheckout } from "@/components/stripe/StripeCheckout"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

// Stripe Price IDs for the subscription plans
export const STRIPE_PRICES = {
  monthly: "price_1P48jKJ3nN8yCZvlLxw1hv4z",
  annual: "price_1P48kQJ3nN8yCZvlzZMCLlTN",
}

interface SubscriptionPlansProps {
  selectedPlan: "free" | "monthly" | "annual" | null
  setSelectedPlan: (plan: "free" | "monthly" | "annual" | null) => void
}

export function SubscriptionPlans({ selectedPlan, setSelectedPlan }: SubscriptionPlansProps) {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFreeTrial = async () => {
    try {
      setIsProcessing(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to start a free trial")
        return
      }
      
      // Create a free subscription for the user
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        })
      
      if (error) {
        console.error("Error creating free subscription:", error)
        toast.error("Could not start free trial. Please try again.")
        return
      }
      
      toast.success("Free trial activated successfully!")
      navigate("/")
    } catch (error) {
      console.error("Error in free trial:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <Card className={`border-2 transition-all ${selectedPlan === "free" ? "border-primary" : "border-transparent"}`}>
          <CardHeader>
            <CardTitle>Free Trial</CardTitle>
            <CardDescription>Perfect for testing our services</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$0<span className="text-sm font-normal text-gray-500">/month</span></p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Up to 3 clients</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Basic calendar</span>
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>14-day trial</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant={selectedPlan === "free" ? "default" : "outline"} 
              className="w-full"
              onClick={() => setSelectedPlan("free")}
            >
              Start Free Trial
            </Button>
          </CardFooter>
        </Card>

        <Card className={`border-2 transition-all ${selectedPlan === "monthly" ? "border-primary" : "border-transparent"}`}>
          <CardHeader>
            <CardTitle>Monthly Plan</CardTitle>
            <CardDescription>Perfect for short-term projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$15<span className="text-sm font-normal text-gray-500">/month</span></p>
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
            <CardDescription>Save 33% with yearly billing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$120<span className="text-sm font-normal text-gray-500">/year</span></p>
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
            {selectedPlan === "free" ? (
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleFreeTrial}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Start Free Trial"}
              </Button>
            ) : (
              <StripeCheckout 
                planType={selectedPlan} 
                priceId={selectedPlan === "monthly" ? STRIPE_PRICES.monthly : STRIPE_PRICES.annual} 
              />
            )}
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
    </>
  )
}
