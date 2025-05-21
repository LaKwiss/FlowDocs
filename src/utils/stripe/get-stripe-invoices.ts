// src/utils/stripe/get-stripe-invoices.ts
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
    const stripeCustomerId = await getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      return { data: [], hasMore: false };
    }

    const stripe = getStripeInstance();
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      subscription: subscriptionId || undefined,
      limit: 10, // Ajustez selon vos besoins
      starting_after: startingAfter || undefined,
      expand: ['data.charge', 'data.payment_intent'],
    });

    return {
      data: JSON.parse(JSON.stringify(invoices.data)) as Stripe.Invoice[],
      hasMore: invoices.has_more,
    };
  } catch (e: any) {
    console.error('Error fetching Stripe invoices:', e);
    return getErrorMessageResponse();
  }
}
