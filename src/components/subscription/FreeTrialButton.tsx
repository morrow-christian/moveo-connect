
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function FreeTrialButton() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFreeTrial = async () => {
    try {
      setIsProcessing(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to start a free trial");
        return;
      }
      
      // Create a free subscription for the user
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        });
      
      if (error) {
        console.error("Error creating free subscription:", error);
        toast.error("Could not start free trial. Please try again.");
        return;
      }
      
      toast.success("Free trial activated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error in free trial:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      size="lg" 
      className="w-full"
      onClick={handleFreeTrial}
      disabled={isProcessing}
    >
      {isProcessing ? "Processing..." : "Start Free Trial"}
    </Button>
  );
}
