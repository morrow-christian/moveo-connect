
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Import Stripe library
import Stripe from "https://esm.sh/stripe@14.3.0";
const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get client token from request
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: "Missing subscription ID" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    console.log(`Canceling subscription: ${subscriptionId}`);
    
    // Cancel the subscription at period end (this allows the customer to still use the service until the end of the billing period)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    // Update the subscription in the database
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
        end_date: new Date(subscription.cancel_at * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);
    
    if (error) {
      console.error("Error updating subscription in database:", error);
      throw new Error("Error updating subscription");
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription will be canceled at the end of the billing period",
        subscription,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error canceling subscription:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
