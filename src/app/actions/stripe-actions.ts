// src/app/actions/stripe-actions.ts
'use server';

import Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, validateUserSession } from '@/utils/supabase/server';
import { getStripeInstance } from '@/utils/stripe/get-stripe-instance';
import { getStripeCustomerId } from '@/utils/stripe/get-stripe-customer-id';

const stripe = getStripeInstance();

interface ActionResponse {
  sessionId?: string;
  error?: string;
  url?: string;
}

interface ErrorResponse {
  error: string;
}

export async function createCheckoutSession(priceId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated. Please login to continue.' };
  }

  let stripeCustomerId: string | null = await getStripeCustomerId(user.id);

  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      const { error: dbError } = await supabase
        .from('customers')
        .upsert(
          { user_id: user.id, email: user.email!, stripe_customer_id: stripeCustomerId },
          { onConflict: 'user_id' },
        );

      if (dbError) {
        console.error('Error saving Stripe customer ID to DB:', dbError);
        // Ne pas bloquer le checkout, mais enregistrer l'erreur.
      }
    } catch (e: any) {
      console.error('Error creating Stripe customer:', e);
      return { error: 'Failed to create customer session with payment provider.' };
    }
  }

  if (!stripeCustomerId) {
    return { error: 'Could not identify or create customer with payment provider.' };
  }

  const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id, // Utile pour le webhook checkout.session.completed
      },
    });

    if (!session.id) {
      return { error: 'Failed to create checkout session with Stripe.' };
    }

    return { sessionId: session.id };
  } catch (e: any) {
    console.error('Error creating Stripe checkout session:', e);
    return { error: e.message || 'Failed to create checkout session.' };
  }
}

export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string,
): Promise<Stripe.Subscription | ErrorResponse> {
  try {
    const {
      data: { user },
      error: authError,
    } = await (await createClient()).auth.getUser();
    if (authError || !user) {
      return { error: 'User not authenticated.' };
    }
    await validateUserSession();

    const stripeCustomerId = await getStripeCustomerId(user.id);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.customer !== stripeCustomerId) {
      return { error: 'Subscription does not belong to this user.' };
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    if (updatedSubscription) {
      revalidatePath('/dashboard/subscriptions');
      revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
    }
    return JSON.parse(JSON.stringify(updatedSubscription)) as Stripe.Subscription;
  } catch (e: any) {
    console.error('Error canceling Stripe subscription:', e);
    return { error: e.message || 'Something went wrong, please try again later' };
  }
}

export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription | ErrorResponse> {
  try {
    const {
      data: { user },
      error: authError,
    } = await (await createClient()).auth.getUser();
    if (authError || !user) {
      return { error: 'User not authenticated.' };
    }
    await validateUserSession();

    const stripeCustomerId = await getStripeCustomerId(user.id);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.customer !== stripeCustomerId) {
      return { error: 'Subscription does not belong to this user.' };
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    if (updatedSubscription) {
      revalidatePath('/dashboard/subscriptions');
      revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
    }
    return JSON.parse(JSON.stringify(updatedSubscription)) as Stripe.Subscription;
  } catch (e: any) {
    console.error('Error reactivating Stripe subscription:', e);
    return { error: e.message || 'Something went wrong, please try again later' };
  }
}

export async function createCustomerPortalSession(userId?: string): Promise<ActionResponse> {
  try {
    const {
      data: { user },
      error: authError,
    } = await (await createClient()).auth.getUser();
    if (authError || !user) {
      return { error: 'User not authenticated.' };
    }
    await validateUserSession();

    const supabaseUserIdToUse = userId || user.id;

    const stripeCustomerId = await getStripeCustomerId(supabaseUserIdToUse);

    if (!stripeCustomerId) {
      return { error: 'Stripe customer ID not found for this user.' };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/subscriptions`,
    });
    return { url: portalSession.url };
  } catch (e: any) {
    console.error('Error creating Stripe customer portal session:', e);
    return { error: e.message || 'Could not create customer portal session.' };
  }
}
