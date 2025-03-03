
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"

export default function SubscriptionSuccess() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const navigate = useNavigate()

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setIsLoading(false)
        return
      }

      try {
        // Verify the checkout session with the backend
        const response = await fetch('/api/verify-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            sessionId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to verify subscription')
        }

        toast.success("Your subscription has been activated!")
      } catch (error) {
        console.error("Error verifying subscription:", error)
        toast.error("Could not verify your subscription")
      } finally {
        setIsLoading(false)
      }
    }

    verifySubscription()
  }, [sessionId])

  if (isLoading) {
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
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Subscription Activated
            </CardTitle>
            <CardDescription>
              Thank you for subscribing to our service!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Your subscription has been successfully activated. You can now access all the features included in your plan.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  )
}
