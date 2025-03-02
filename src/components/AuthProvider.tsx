
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"

interface AuthProviderProps {
  children: (session: any | null, loading: boolean, subscription: any | null) => React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
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
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle()

      if (error) {
        console.error("Error fetching subscription:", error)
      }

      setSubscription(data)
      setLoading(false)
    } catch (error) {
      console.error("Error checking subscription:", error)
      setLoading(false)
    }
  }

  return children(session, loading, subscription)
}
