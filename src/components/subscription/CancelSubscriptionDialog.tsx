
import { useState } from "react"
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

interface CancelSubscriptionDialogProps {
  isOpen: boolean
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function CancelSubscriptionDialog({ 
  isOpen, 
  isLoading, 
  onOpenChange, 
  onConfirm 
}: CancelSubscriptionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Subscription</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="bg-destructive text-destructive-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cancel Subscription
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
