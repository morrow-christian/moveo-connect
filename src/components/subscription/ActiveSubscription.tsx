
import { Subscription } from "@/types/subscription"
import { useNavigate } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ActiveSubscriptionProps {
  subscription: Subscription
}

export function ActiveSubscription({ subscription }: ActiveSubscriptionProps) {
  const navigate = useNavigate()

  return (
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
  )
}
