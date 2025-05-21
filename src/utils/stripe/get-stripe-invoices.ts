'use server';

import { getStripeCustomerId } from '@/utils/stripe/get-stripe-customer-id';
import { getStripeInstance } from '@/utils/stripe/get-stripe-instance';
import Stripe from 'stripe';

export interface StripeInvoiceResponse {
  data?: Stripe.Invoice[];
  hasMore?: boolean;
  error?: string;
}
const ErrorMessage = 'Something went wrong, please try again later';

function getErrorMessageResponse(): StripeInvoiceResponse {
  return { error: ErrorMessage, data: [], hasMore: false };
}

export async function getStripeInvoices(
  userId?: string,
  subscriptionId?: string,
  startingAfter?: string, // Pour la pagination
): Promise<StripeInvoiceResponse> {
  try {
    // Vérification de l'ID d'abonnement
    if (!subscriptionId) {
      return { data: [], hasMore: false };
    }

    // Récupération de l'ID client Stripe
    const stripeCustomerId = await getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      return { data: [], hasMore: false };
    }

    const stripe = getStripeInstance();

    // Récupérer les factures liées à un client, pas à un abonnement
    const invoicesResult = await stripe.invoices.list({
      customer: stripeCustomerId,
      subscription: subscriptionId,
      limit: 10,
      starting_after: startingAfter || undefined,
    });

    return {
      data: JSON.parse(JSON.stringify(invoicesResult.data)),
      hasMore: invoicesResult.has_more,
    };
  } catch (e: any) {
    console.error('Error fetching Stripe invoices:', e);
    return getErrorMessageResponse();
  }
}
