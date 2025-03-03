
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { Subscription } from "@/types/subscription"

export function useSubscription() {
  const navigate = useNavigate()

  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate("/auth")
        return null
      }

      try {
        const response = await supabase
          .from('subscriptions')
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()

        if (response.error) {
          console.error("Error fetching subscription:", response.error)
          if (response.error.code === "PGRST116") {
            // This error code means the table doesn't exist yet
            toast.error("Error loading subscription information")
            throw response.error
          }
          return null
        }

        return response.data as Subscription | null
      } catch (error) {
        console.error("Error in subscription query:", error)
        return null
      }
    },
  })
}
