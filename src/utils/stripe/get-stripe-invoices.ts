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

// function getErrorMessageResponse(): StripeInvoiceResponse {
//   return { error: ErrorMessage, data: [], hasMore: false };
// }

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
      limit: 10,
    };

    // Expansion conditionnelle
    const expandParams: string[] = [];

    if (startingAfter) {
      listParams.starting_after = startingAfter;
    }

    if (subscriptionId && subscriptionId.trim() !== '') {
      listParams.subscription = subscriptionId;
      expandParams.push('data.subscription'); // Étendre l'abonnement seulement si on filtre par abonnement
      console.log('[getStripeInvoices] Filtering by subscriptionId:', subscriptionId, 'and expanding subscription');
    } else {
      console.log('[getStripeInvoices] Not filtering by subscriptionId, fetching all for customer.');
      // Optionnel: vous pourriez vouloir étendre d'autres champs ici si nécessaire pour la vue générale,
      // mais 'data.subscription' est risqué sans filtre d'abonnement.
      // Par exemple, étendre 'data.charge' si vous voulez des détails sur le paiement.
      // expandParams.push('data.charge');
    }

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
    // Si c'est l'erreur spécifique d'expansion, on peut la gérer plus finement
    if (e instanceof Stripe.errors.StripeInvalidRequestError && e.message.includes("doesn't exist: subscription")) {
      console.warn("[getStripeInvoices] Erreur d'expansion de 'subscription'. Nouvelle tentative sans l'expansion.");
      // Nouvelle tentative sans l'expansion problématique (si la logique initiale n'a pas suffi)
      // Ceci est une sécurité, la logique d'expansion conditionnelle devrait prévenir cela.
      const stripe = getStripeInstance();
      const simplifiedListParams: Stripe.InvoiceListParams = {
        customer: (await getStripeCustomerId(userId))!, // On sait qu'il existe à ce stade
        limit: 10,
      };
      if (startingAfter) simplifiedListParams.starting_after = startingAfter;
      if (subscriptionId && subscriptionId.trim() !== '') simplifiedListParams.subscription = subscriptionId;

      try {
        const invoicesResultRetry = await stripe.invoices.list(simplifiedListParams);
        console.log(
          '[getStripeInvoices] Retry successful. Invoices fetched:',
          invoicesResultRetry.data.length,
          'Has more:',
          invoicesResultRetry.has_more,
        );
        return {
          data: JSON.parse(JSON.stringify(invoicesResultRetry.data)) as Stripe.Invoice[],
          hasMore: invoicesResultRetry.has_more,
        };
      } catch (retryError: any) {
        console.error('Erreur lors de la nouvelle tentative de récupération des factures Stripe:', retryError);
        return { error: retryError.message || ErrorMessage, data: [], hasMore: false };
      }
    }
    return { error: e.message || ErrorMessage, data: [], hasMore: false };
  }
}
