
import { Loader2 } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Subscription } from "@/types/subscription"

interface UpgradeSubscriptionDialogProps {
  subscription: Subscription
  isOpen: boolean
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function UpgradeSubscriptionDialog({ 
  subscription,
  isOpen, 
  isLoading, 
  onOpenChange, 
  onConfirm 
}: UpgradeSubscriptionDialogProps) {
  const isFree = subscription.plan_type === 'free'
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upgrade Subscription</AlertDialogTitle>
          <AlertDialogDescription>
            {isFree
              ? "You're about to upgrade from the free plan to a paid subscription."
              : "You're about to upgrade from monthly to annual billing. This will save you 17% compared to monthly billing."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
