
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { Subscription } from "@/types/subscription"
import { STRIPE_PRICES } from "@/components/subscription/constants"

export function useSubscriptionActions(subscription: Subscription, onSubscriptionUpdated: () => void) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleCancel = async () => {
    setIsLoading(true)
    
    try {
      // Check if it's a free subscription (can be canceled directly in database)
      if (subscription.plan_type === 'free') {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id)
          
        if (error) throw error
        
        toast.success("Free trial canceled")
        onSubscriptionUpdated()
        return
      }
      
      // For paid plans, we need to cancel through Stripe
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })
      
      if (error) throw error
      
      if (data?.success) {
        toast.success("Subscription canceled successfully")
        onSubscriptionUpdated()
      } else {
        throw new Error(data?.message || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast.error(error instanceof Error ? error.message : "Failed to cancel subscription")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      // If already an annual subscription, there's nothing to upgrade to
      if (subscription.plan_type === 'annual') {
        toast.info("You're already on our highest tier plan")
        setIsLoading(false)
        return
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to upgrade your subscription")
        return
      }
      
      // For free plans, create a new checkout session
      if (subscription.plan_type === 'free') {
        navigate("/subscribe")
        return
      }
      
      // For monthly plans upgrading to annual, we need to create a change subscription session
      const { data, error } = await supabase.functions.invoke('change-subscription', {
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          newPriceId: STRIPE_PRICES.annual,
          userId: user.id,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/settings`,
        }),
      })
      
      if (error) throw error
      
      if (data?.sessionUrl) {
        // Redirect to Stripe checkout for subscription update
        window.location.href = data.sessionUrl
      } else {
        throw new Error("Failed to create upgrade session")
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upgrade subscription")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    handleCancel,
    handleUpgrade
  }
}
