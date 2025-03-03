
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"
import Stripe from "https://esm.sh/stripe@12.2.0"

// Initialize Stripe with your secret key
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers,
      status: 204,
    })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // Extract token from authorization header
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // Parse request body
    const { sessionId } = await req.json()

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Verify the session belongs to the user
    if (session.metadata?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // Verify the session was completed
    if (session.status !== "complete" && session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    // Calculate the end date based on the current period end
    const endDate = new Date(subscription.current_period_end * 1000).toISOString()
    const startDate = new Date(subscription.current_period_start * 1000).toISOString()
    const planType = session.metadata?.plan_type || "monthly"

    // Check if a subscription already exists
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from("subscriptions")
        .update({
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0].price.id,
          plan_type: planType,
          status: "active",
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id)
    } else {
      // Create new subscription
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        plan_type: planType,
        status: "active",
        start_date: startDate,
        end_date: endDate,
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error verifying checkout session:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
