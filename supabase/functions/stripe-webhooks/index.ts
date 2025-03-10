
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Import Stripe library
import Stripe from "https://esm.sh/stripe@14.3.0";
const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16",
});

async function handleStripeEvent(event: Stripe.Event) {
  const eventType = event.type;
  console.log(`Processing webhook event: ${eventType}`);
  
  // Handle different event types
  switch (eventType) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event);
      break;
    
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event);
      break;
    
    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event);
      break;
    
    case "invoice.payment_failed":
      await handlePaymentFailed(event);
      break;
      
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Handle subscription updates (creation or update)
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Handling subscription update for ${subscription.id}`);
  
  // Fetch more details if needed
  const fullSubscription = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ["customer", "items.data.price.product"],
  });
  
  // Get the customer ID
  const stripeCustomerId = fullSubscription.customer as string;
  
  // Find the user by Stripe customer ID
  const { data: users, error: userError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  
  if (userError || !users) {
    console.error("Error finding user for subscription:", userError);
    return;
  }
  
  const userId = users.user_id;
  
  // Determine plan type based on interval
  const priceId = fullSubscription.items.data[0].price.id;
  const interval = fullSubscription.items.data[0].price.recurring?.interval;
  const planType = interval === "year" ? "annual" : "monthly";
  
  // Update or create subscription record
  const { error: updateError } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_type: planType,
      status: subscription.status === "active" ? "active" : "past_due",
      start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (updateError) {
    console.error("Error updating subscription:", updateError);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Handling subscription cancellation for ${subscription.id}`);
  
  // Update subscription status in database
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
  
  if (error) {
    console.error("Error updating subscription status:", error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  
  // If this is linked to a subscription, update the subscription status
  if (invoice.subscription) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription);
    
    if (error) {
      console.error("Error updating subscription after payment:", error);
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  console.log(`Payment failed for invoice ${invoice.id}`);
  
  // If this is linked to a subscription, update the subscription status
  if (invoice.subscription) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", invoice.subscription);
    
    if (error) {
      console.error("Error updating subscription after failed payment:", error);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // For non-OPTIONS requests, process the webhook
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }
    
    // Process the event
    return await handleStripeEvent(event);
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
