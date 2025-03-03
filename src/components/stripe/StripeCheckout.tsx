
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

      // Create a checkout session via Supabase function
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          priceId,
          planType,
          userId: user.id,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscribe`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Checkout error:", errorData)
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionUrl } = await response.json()

      // Redirect to Stripe checkout
      window.location.href = sessionUrl
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
