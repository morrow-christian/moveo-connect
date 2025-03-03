
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AppLayout } from "@/components/AppLayout"
import { useSubscription } from "@/hooks/useSubscription"
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans"
import { ActiveSubscription } from "@/components/subscription/ActiveSubscription"

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "monthly" | "annual" | null>(null)
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription()

  if (isLoadingSubscription) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-6xl py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {subscription ? "Your Subscription" : "Choose Your Plan"}
          </h1>
          <p className="text-gray-600">
            {subscription 
              ? `You are currently subscribed to our ${subscription.plan_type} plan`
              : "Select the subscription plan that works best for you"
            }
          </p>
        </div>

        {subscription ? (
          <ActiveSubscription subscription={subscription} />
        ) : (
          <SubscriptionPlans
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
          />
        )}
      </div>
    </AppLayout>
  )
}
