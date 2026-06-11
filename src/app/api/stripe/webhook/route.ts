import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const session = event.data.object as any

  if (event.type === 'checkout.session.completed') {
    await supabase.from('subscriptions')
      .update({ plan: 'pro', status: 'active', stripe_subscription_id: session.subscription })
      .eq('stripe_customer_id', session.customer)
  }

  if (event.type === 'customer.subscription.deleted') {
    await supabase.from('subscriptions')
      .update({ plan: 'free', status: 'cancelled' })
      .eq('stripe_customer_id', session.customer)
  }

  return NextResponse.json({ received: true })
}