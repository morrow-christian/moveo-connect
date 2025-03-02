
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import { Subscription } from "@/types/subscription"

interface AuthProviderProps {
  children: (session: any | null, loading: boolean, subscription: Subscription | null) => React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkSubscription(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkSubscription(session.user.id)
      } else {
        setSubscription(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkSubscription = async (userId: string) => {
    try {
      // Using a more aggressive type assertion approach
      const response = await (supabase as any)
        .from('subscriptions')
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle()

      if (response.error) {
        console.error("Error fetching subscription:", response.error)
      }

      setSubscription(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error checking subscription:", error)
      setLoading(false)
    }
  }

  return children(session, loading, subscription)
}
