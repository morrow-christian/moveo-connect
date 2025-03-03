
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

      const response = await (supabase as any)
        .from('subscriptions')
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (response.error) {
        toast.error("Error loading subscription information")
        throw response.error
      }

      return response.data as Subscription | null
    },
  })
}
