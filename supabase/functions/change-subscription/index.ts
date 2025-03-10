
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // Extract token from authorization header
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // Parse request body
    const { subscriptionId, newPriceId, successUrl, cancelUrl } = await req.json()

    if (!subscriptionId || !newPriceId) {
      return new Response(JSON.stringify({ error: "Subscription ID and new price ID are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    console.log(`Changing subscription: ${subscriptionId} to price: ${newPriceId} for user: ${user.id}`)

    // Verify the subscription belongs to the user
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subscriptionError || !subscription) {
      console.error("Error verifying subscription:", subscriptionError)
      return new Response(JSON.stringify({ error: "Subscription not found or does not belong to user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      })
    }

    // Create a Stripe Checkout Session for the subscription update
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: subscription.stripe_customer_id,
      line_items: [
        {
          price: newPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      success_url: successUrl || `${req.headers.get("origin")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/settings`,
      // Use either the Billing Portal or just a simple Checkout:
      // If using Checkout:
      allow_promotion_codes: true,
      client_reference_id: user.id,
      subscription: subscriptionId,
      // If we want to use the Billing Portal:
      // billing_address_collection: 'auto',
      metadata: {
        user_id: user.id,
        action: 'upgrade',
        subscription_id: subscriptionId,
      },
    })

    // Return the session URL to redirect the user
    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error changing subscription:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
