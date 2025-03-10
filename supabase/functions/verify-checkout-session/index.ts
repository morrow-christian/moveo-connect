
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
    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    console.log(`Verifying checkout session: ${sessionId} for user: ${user.id}`)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (!session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Verify that the session was successful
    if (session.payment_status !== 'paid') {
      console.log(`Session ${sessionId} payment status: ${session.payment_status}`)
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Verify that the user matches
    const sessionUserId = session.metadata?.user_id
    if (sessionUserId !== user.id) {
      console.log(`User mismatch: session user ${sessionUserId} vs. authenticated user ${user.id}`)
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      })
    }

    // Get plan type from session metadata
    const planType = session.metadata?.plan_type || 'monthly'
    const stripeSubscriptionId = session.subscription?.toString() || ''
    const stripePriceId = session.subscription?.items?.data[0]?.price?.id || ''

    // Create or update the subscription record in Supabase
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: planType,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: planType === 'annual' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_customer_id: session.customer?.toString() || '',
        stripe_subscription_id: stripeSubscriptionId,
        stripe_price_id: stripePriceId,
      }, {
        onConflict: 'user_id',
        returning: 'minimal',
      })

    if (subscriptionError) {
      console.error("Error creating subscription record:", subscriptionError)
      return new Response(JSON.stringify({ error: "Failed to create subscription record" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    console.log(`Successfully verified and created subscription for user: ${user.id}, plan: ${planType}`)

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        subscription: {
          id: session.id,
          planType: planType,
          status: 'active',
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error verifying checkout session:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
