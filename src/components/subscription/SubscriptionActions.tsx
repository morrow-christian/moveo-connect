
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Subscription } from "@/types/subscription"
import { supabase } from "@/integrations/supabase/client"
import { STRIPE_PRICES } from "./constants"

interface SubscriptionActionsProps {
  subscription: Subscription
  onSubscriptionUpdated: () => void
}

export function SubscriptionActions({ subscription, onSubscriptionUpdated }: SubscriptionActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
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
      setIsCanceling(false)
    }
  }
  
  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      // If already an annual subscription, there's nothing to upgrade to
      if (subscription.plan_type === 'annual') {
        toast.info("You're already on our highest tier plan")
        setIsUpgrading(false)
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
      setIsUpgrading(false)
    }
  }
  
  // Determine if buttons should be shown based on subscription status
  const isActiveSubscription = subscription.status === 'active'
  const showUpgradeButton = isActiveSubscription && subscription.plan_type !== 'annual'
  const showCancelButton = isActiveSubscription

  return (
    <div className="mt-6 space-y-4">
      {showUpgradeButton && (
        <>
          <Button 
            onClick={() => setIsUpgrading(true)}
            className="w-full"
            disabled={isLoading}
          >
            {subscription.plan_type === 'free' ? 'Upgrade to Paid Plan' : 'Upgrade to Annual Plan'}
          </Button>
          
          <AlertDialog open={isUpgrading} onOpenChange={setIsUpgrading}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Upgrade Subscription</AlertDialogTitle>
                <AlertDialogDescription>
                  {subscription.plan_type === 'free' 
                    ? "You're about to upgrade from the free plan to a paid subscription."
                    : "You're about to upgrade from monthly to annual billing. This will save you 17% compared to monthly billing."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUpgrade} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upgrade Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      
      {showCancelButton && (
        <>
          <Button 
            variant="outline"
            onClick={() => setIsCanceling(true)}
            className="w-full"
            disabled={isLoading}
          >
            Cancel Subscription
          </Button>
          
          <AlertDialog open={isCanceling} onOpenChange={setIsCanceling}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Keep Subscription</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={isLoading} className="bg-destructive text-destructive-foreground">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Cancel Subscription
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
