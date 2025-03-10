
import { Button } from "@/components/ui/button";
import { StripeCheckout } from "@/components/stripe/StripeCheckout";
import { PlanCard } from "./PlanCard";
import { FreeTrialButton } from "./FreeTrialButton";
import { STRIPE_PRICES } from "./constants";

interface SubscriptionPlansProps {
  selectedPlan: "free" | "monthly" | "annual" | null;
  setSelectedPlan: (plan: "free" | "monthly" | "annual" | null) => void;
}

export function SubscriptionPlans({ selectedPlan, setSelectedPlan }: SubscriptionPlansProps) {
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <PlanCard 
          type="free" 
          selectedPlan={selectedPlan} 
          onSelect={setSelectedPlan} 
        />
        <PlanCard 
          type="monthly" 
          selectedPlan={selectedPlan} 
          onSelect={setSelectedPlan} 
        />
        <PlanCard 
          type="annual" 
          selectedPlan={selectedPlan} 
          onSelect={setSelectedPlan} 
        />
      </div>

      <div className="mt-8 flex justify-center">
        {selectedPlan ? (
          <div className="w-full max-w-md">
            {selectedPlan === "free" ? (
              <FreeTrialButton />
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
  );
}
