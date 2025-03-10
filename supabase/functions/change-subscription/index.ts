
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
    // Get request data
    const {
      subscriptionId,
      newPriceId,
      userId,
      successUrl,
      cancelUrl,
    } = await req.json();
    
    // Validate required fields
    if (!subscriptionId || !newPriceId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    console.log(`Upgrading subscription ${subscriptionId} to price ${newPriceId}`);
    
    // Get user email for the checkout session
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (profileError || !profileData) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("User profile not found");
    }
    
    // Get the current subscription to retrieve customer ID
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
      
    if (subError || !subscriptionData) {
      console.error("Error fetching subscription:", subError);
      throw new Error("Subscription not found");
    }
    
    // Create a checkout session for subscription update
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: subscriptionData.stripe_customer_id,
      line_items: [{
        price: newPriceId,
        quantity: 1
      }],
      subscription_behavior: 'new_subscription',
      success_url: successUrl || `${req.headers.get("origin")}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/settings`,
      client_reference_id: userId,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        sessionUrl: session.url,
        sessionId: session.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
