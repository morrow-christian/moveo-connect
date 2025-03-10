
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"

interface StripeCheckoutProps {
  planType: "monthly" | "annual"
  priceId: string
}

export function StripeCheckout({ planType, priceId }: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleCheckout = async () => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to subscribe")
        navigate("/auth")
        return
      }

      // Call the Supabase Edge Function directly using supabase.functions.invoke
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: JSON.stringify({
          priceId,
          planType,
          userId: user.id,
          email: user.email, // Pass user email for better customer data in Stripe
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscribe`,
        }),
      })

      if (error) {
        console.error("Checkout error:", error)
        throw new Error(error.message || 'Failed to create checkout session')
      }

      if (!data || !data.sessionUrl) {
        throw new Error('Invalid response from checkout session creation')
      }

      // Redirect to Stripe checkout
      window.location.href = data.sessionUrl
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to start checkout process")
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Subscribe to ${planType === "monthly" ? "Monthly" : "Annual"} Plan`
      )}
    </Button>
  )
}
