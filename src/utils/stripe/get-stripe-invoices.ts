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
const ErrorMessage = 'Un problème est survenu, veuillez réessayer plus tard';

export async function getStripeInvoices(
  userId?: string,
  subscriptionId?: string,
  startingAfter?: string,
): Promise<StripeInvoiceResponse> {
  console.log(
    '[getStripeInvoices] Called with userId:',
    userId,
    'subscriptionId:',
    `"${subscriptionId}"`,
    'startingAfter:',
    startingAfter,
  );
  try {
    const stripeCustomerId = await getStripeCustomerId(userId);
    console.log('[getStripeInvoices] stripeCustomerId:', stripeCustomerId);
    if (!stripeCustomerId) {
      return { data: [], hasMore: false, error: "L'ID client Stripe n'a pas été trouvé pour l'utilisateur actuel." };
    }

    const stripe = getStripeInstance();
    const listParams: Stripe.InvoiceListParams = {
      customer: stripeCustomerId,
      limit: 10, // Récupère jusqu'à 10 factures par appel
    };

    // Initialiser expandParams vide.
    // D'autres expansions légitimes pourraient être ajoutées ici si nécessaire (ex: 'data.charge').
    const expandParams: string[] = [];

    if (startingAfter) {
      listParams.starting_after = startingAfter;
    }

    if (subscriptionId && subscriptionId.trim() !== '') {
      listParams.subscription = subscriptionId;
      // La ligne 'expandParams.push('data.subscription');' a été SUPPRIMÉE
      // car elle causait l'erreur. Les factures incluront déjà l'ID de l'abonnement.
      console.log('[getStripeInvoices] Filtering by subscriptionId:', subscriptionId);
    } else {
      console.log('[getStripeInvoices] Not filtering by subscriptionId, fetching all for customer.');
    }

    // Appliquer les expansions seulement si expandParams n'est pas vide.
    if (expandParams.length > 0) {
      listParams.expand = expandParams;
    }

    const invoicesResult = await stripe.invoices.list(listParams);
    console.log(
      '[getStripeInvoices] Invoices fetched from Stripe:',
      invoicesResult.data.length,
      'Has more:',
      invoicesResult.has_more,
    );

    return {
      data: JSON.parse(JSON.stringify(invoicesResult.data)) as Stripe.Invoice[],
      hasMore: invoicesResult.has_more,
    };
  } catch (e: any) {
    console.error('Erreur lors de la récupération des factures Stripe:', e);
    // Le bloc catch spécifique pour l'erreur d'expansion de 'subscription' a été supprimé.
    // Ce gestionnaire général attrapera les autres erreurs éventuelles.
    return { error: e.message || ErrorMessage, data: [], hasMore: false };
  }
}
