
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Subscription } from "@/types/subscription"
import { SubscriptionActions } from "./SubscriptionActions"
import { PLAN_FEATURES } from "./constants"

interface ActiveSubscriptionProps {
  subscription: Subscription
}

export function ActiveSubscription({ subscription }: ActiveSubscriptionProps) {
  const navigate = useNavigate()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Format dates for better readability
  const formattedEndDate = new Date(subscription.end_date).toLocaleDateString()

  // Handle subscription status styling
  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Active</span>
      case 'canceled':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"><AlertTriangle className="mr-1 h-3 w-3" />Canceled</span>
      case 'past_due':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />Past Due</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{subscription.status}</span>
    }
  }

  // Get plan name with proper capitalization
  const getPlanName = () => {
    return subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)
  }

  // Refresh handler for after subscription changes
  const handleSubscriptionUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
    // Optionally force a page refresh to get updated subscription data
    window.location.reload()
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            {getPlanName()} Plan
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {subscription.status === 'active' 
            ? `Your subscription is active until ${formattedEndDate}`
            : subscription.status === 'canceled'
              ? `Your subscription has been canceled and will end on ${formattedEndDate}`
              : `Your subscription requires attention`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Plan Features:</h3>
            <ul className="mt-2 space-y-2">
              {PLAN_FEATURES[subscription.plan_type]?.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {subscription.status === 'past_due' && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Payment Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your last payment was unsuccessful. Please update your payment method to continue using premium features.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add subscription actions */}
        <SubscriptionActions 
          subscription={subscription} 
          onSubscriptionUpdated={handleSubscriptionUpdated} 
        />
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
  )
}
