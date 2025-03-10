
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"
import Stripe from "https://esm.sh/stripe@12.2.0"

// Initialize Stripe with your secret key
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Get Stripe webhook secret from env
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature")
    
    if (!signature) {
      console.error("No Stripe signature found")
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get request body as text for verification
    const reqBody = await req.text()
    
    // Verify the event using the signature and webhook secret
    let event
    try {
      event = stripe.webhooks.constructEvent(reqBody, signature, stripeWebhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`Stripe webhook received: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Error in stripe-webhooks function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})

// Handler for subscription.created event
async function handleSubscriptionCreated(subscription: any) {
  console.log("Handling subscription created event:", subscription.id)
  
  try {
    // Get customer ID
    const customerId = subscription.customer
    
    // Get user ID from customer metadata
    const { data: customerData } = await stripe.customers.retrieve(customerId)
    
    // Extract user_id from metadata
    const userId = customerData?.metadata?.supabase_user_id
    
    if (!userId) {
      console.error("No user_id found in customer metadata:", customerId)
      return
    }
    
    // Get subscription item price details
    const priceId = subscription.items.data[0]?.price?.id
    
    // Determine plan type based on price ID
    let planType = 'monthly'
    if (priceId && priceId.includes('annual')) {
      planType = 'annual'
    }
    
    // Create or update subscription
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        status: mapStripeStatus(subscription.status),
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
      }, {
        onConflict: 'user_id',
      })
      
    if (error) {
      console.error("Error updating subscription record:", error)
    }
  } catch (error) {
    console.error("Error in handleSubscriptionCreated:", error)
  }
}

// Handler for subscription.updated event
async function handleSubscriptionUpdated(subscription: any) {
  console.log("Handling subscription updated event:", subscription.id)
  
  try {
    // Find the subscription in our database
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()
      
    if (fetchError || !subscriptionData) {
      console.error("Error fetching subscription:", fetchError || "Subscription not found")
      return
    }
    
    // Get subscription item price details 
    const priceId = subscription.items.data[0]?.price?.id
    
    // Determine plan type based on price ID
    let planType = subscriptionData.plan_type
    if (priceId) {
      if (priceId.includes('annual')) {
        planType = 'annual'
      } else if (priceId.includes('monthly')) {
        planType = 'monthly'
      }
    }
    
    // Update the subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: mapStripeStatus(subscription.status),
        plan_type: planType,
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_price_id: priceId,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
      
    if (error) {
      console.error("Error updating subscription:", error)
    }
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error)
  }
}

// Handler for subscription.deleted event
async function handleSubscriptionDeleted(subscription: any) {
  console.log("Handling subscription deleted event:", subscription.id)
  
  try {
    // Update the subscription status to canceled
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
      
    if (error) {
      console.error("Error updating deleted subscription:", error)
    }
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error)
  }
}

// Handler for invoice.payment_succeeded event
async function handlePaymentSucceeded(invoice: any) {
  console.log("Handling payment succeeded event for invoice:", invoice.id)
  
  try {
    if (!invoice.subscription) {
      console.log("Invoice is not associated with a subscription")
      return
    }
    
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    
    // Update subscription end date
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription)
      
    if (error) {
      console.error("Error updating subscription after payment success:", error)
    }
  } catch (error) {
    console.error("Error in handlePaymentSucceeded:", error)
  }
}

// Handler for invoice.payment_failed event
async function handlePaymentFailed(invoice: any) {
  console.log("Handling payment failed event for invoice:", invoice.id)
  
  try {
    if (!invoice.subscription) {
      console.log("Invoice is not associated with a subscription")
      return
    }
    
    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription)
      
    if (error) {
      console.error("Error updating subscription after payment failure:", error)
    }
  } catch (error) {
    console.error("Error in handlePaymentFailed:", error)
  }
}

// Helper to map Stripe subscription status to our status
function mapStripeStatus(stripeStatus: string): 'active' | 'canceled' | 'past_due' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    case 'past_due':
    case 'incomplete':
    case 'unpaid':
      return 'past_due'
    default:
      return 'active'
  }
}
