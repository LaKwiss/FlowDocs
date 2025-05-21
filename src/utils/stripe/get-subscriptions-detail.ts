// src/utils/stripe/get-stripe-subscription-detail.ts
'use server';

import { getStripeInstance } from '@/utils/stripe/get-stripe-instance';
import Stripe from 'stripe';
import { getStripeCustomerId } from './get-stripe-customer-id';

export interface StripeSubscriptionDetailResponse {
  data?: Stripe.Subscription;
  error?: string;
}
const ErrorMessage = 'Something went wrong, please try again later';

export async function getStripeSubscriptionDetail(
  subscriptionId: string,
  userId?: string,
): Promise<StripeSubscriptionDetailResponse> {
  try {
    // Optionnel: Vérifier que l'abonnement appartient à l'utilisateur connecté
    const stripeCustomerId = await getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      return { error: 'User not found or not associated with a Stripe customer.' };
    }

    const stripe = getStripeInstance();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product', 'default_payment_method', 'latest_invoice'],
    });

    if (subscription.customer !== stripeCustomerId) {
      return { error: 'Subscription does not belong to this user.' };
    }

    return { data: JSON.parse(JSON.stringify(subscription)) as Stripe.Subscription };
  } catch (e: any) {
    console.error(`Error fetching Stripe subscription detail for ${subscriptionId}:`, e);
    return { error: ErrorMessage };
  }
}
