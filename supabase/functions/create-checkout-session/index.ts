
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"
import Stripe from "https://esm.sh/stripe@12.2.0"

// Initialize Stripe with your secret key
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16', // Specify Stripe API version for better stability
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
    const { priceId, planType, email, successUrl, cancelUrl } = await req.json()

    console.log(`Creating checkout session for user: ${user.id}, plan: ${planType}, price: ${priceId}`)

    // Check if user already has a Stripe customer ID
    const { data: profileData } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    let customerId = profileData?.stripe_customer_id

    // If not, create a new customer in Stripe
    if (!customerId) {
      console.log(`Creating new Stripe customer for user: ${user.id}`)
      const customer = await stripe.customers.create({
        email: email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      
      customerId = customer.id
      
      // Save Stripe customer ID to the user's profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)

      console.log(`Created Stripe customer: ${customerId} for user: ${user.id}`)
    } else {
      console.log(`Using existing Stripe customer: ${customerId} for user: ${user.id}`)
    }

    // Create a checkout session with detailed metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      // Include billing address collection for better customer data
      billing_address_collection: 'required',
      // Allow promotion codes for marketing
      allow_promotion_codes: true,
      // Collect phone number for support and verification purposes
      phone_number_collection: {
        enabled: true,
      },
    })

    console.log(`Created checkout session: ${session.id}, URL: ${session.url}`)

    // Return the checkout session URL
    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
