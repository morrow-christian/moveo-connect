
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useSubscription } from "@/hooks/useSubscription"

export function CalendarSync() {
  const { data: subscription } = useSubscription()
  
  const handleGoogleSync = async () => {
    try {
      // Check if user has an active subscription
      if (!subscription) {
        toast.error("Calendar integration requires an active subscription. Please subscribe to continue.")
        return
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/schedule`
        }
      })
      
      if (error) throw error
      
    } catch (error: any) {
      toast.error("Failed to sync with Google Calendar")
      console.error(error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Sync Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleSync}>
          Sync with Google Calendar
        </DropdownMenuItem>
        {/* We can add Outlook option here later */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
