// src/utils/stripe/get-stripe-subscriptions.ts
'use server';

import { getStripeCustomerId } from '@/utils/stripe/get-stripe-customer-id';
import { getStripeInstance } from '@/utils/stripe/get-stripe-instance';
import Stripe from 'stripe';

// Adapter StripeSubscriptionResponse pour correspondre à vos besoins
export interface StripeSubscriptionResponse {
  data?: Stripe.Subscription[];
  hasMore?: boolean; // Stripe utilise has_more dans la pagination List
  error?: string;
  // totalRecords n'est pas directement fourni par Stripe list,
  // mais peut être estimé ou géré différemment si nécessaire.
}

const ErrorMessage = 'Something went wrong, please try again later';

function getErrorMessageResponse(): StripeSubscriptionResponse {
  return { error: ErrorMessage, data: [], hasMore: false };
}

export async function getStripeSubscriptions(userId?: string): Promise<StripeSubscriptionResponse> {
  try {
    const stripeCustomerId = await getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      // Si aucun client Stripe n'est trouvé pour l'utilisateur, il n'a pas d'abonnements.
      return { data: [], hasMore: false };
    }

    const stripe = getStripeInstance();
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all', // ou 'active', 'trialing', 'canceled', etc.
      limit: 20, // Gérer la pagination si nécessaire
      expand: ['data.default_payment_method', 'data.latest_invoice'], // Pour plus de détails
    });

    return {
      data: JSON.parse(JSON.stringify(subscriptions.data)) as Stripe.Subscription[],
      hasMore: subscriptions.has_more,
    };
  } catch (e: any) {
    console.error('Error fetching Stripe subscriptions:', e);
    return getErrorMessageResponse();
  }
}
