
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Subscription } from "@/types/subscription"
import { useSubscriptionActions } from "@/hooks/useSubscriptionActions"
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog"
import { UpgradeSubscriptionDialog } from "./UpgradeSubscriptionDialog"

interface SubscriptionActionsProps {
  subscription: Subscription
  onSubscriptionUpdated: () => void
}

export function SubscriptionActions({ subscription, onSubscriptionUpdated }: SubscriptionActionsProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  
  const { isLoading, handleCancel, handleUpgrade } = useSubscriptionActions(
    subscription, 
    onSubscriptionUpdated
  )
  
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
          
          <UpgradeSubscriptionDialog
            subscription={subscription}
            isOpen={isUpgrading}
            isLoading={isLoading}
            onOpenChange={setIsUpgrading}
            onConfirm={handleUpgrade}
          />
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
          
          <CancelSubscriptionDialog
            isOpen={isCanceling}
            isLoading={isLoading}
            onOpenChange={setIsCanceling}
            onConfirm={handleCancel}
          />
        </>
      )}
    </div>
  )
}
