// src/utils/stripe/get-stripe-subscriptions.ts
'use server';

import { getStripeCustomerId } from '@/utils/stripe/get-stripe-customer-id';
import { getStripeInstance } from '@/utils/stripe/get-stripe-instance';
import Stripe from 'stripe';

export interface StripeSubscriptionResponse {
  data?: Stripe.Subscription[];
  hasMore?: boolean;
  error?: string;
}

const ErrorMessage = 'Something went wrong, please try again later';

function getErrorMessageResponse(): StripeSubscriptionResponse {
  return { error: ErrorMessage, data: [], hasMore: false };
}

export async function getStripeSubscriptions(userId?: string): Promise<StripeSubscriptionResponse> {
  try {
    const stripeCustomerId = await getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      return { data: [], hasMore: false };
    }

    const stripe = getStripeInstance();
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 20,
      // Ajustement de l'expansion pour éviter l'erreur de profondeur.
      // Nous essayons d'obtenir les détails du prix, qui incluent l'ID du produit.
      // L'objet Product complet n'est pas garanti ici sans une expansion plus profonde qui cause l'erreur.
      // Stripe devrait inclure l'objet Product si 'product' est directement sur 'price' ET que 'price' est expandé.
      // Si 'product' sur 'price' n'est qu'un ID, il faut expandre 'price.product'.
      // Essayons d'abord d'expandre le produit sur l'item de ligne, ce qui est généralement de la forme `plan.product` (ancien)
      // ou `price.product` (plus récent, où `price` est sur l'item).
      // La documentation de Stripe suggère que `plan` (et donc `plan.product`) peut être étendu.
      // Pour les items (plus récents que plan):
      expand: ['data.items.data.price', 'data.default_payment_method', 'data.latest_invoice'],
    });
    // Après avoir récupéré les abonnements, si `price.product` est un ID, et que nous avons besoin du nom,
    // il faudrait itérer et faire des requêtes `stripe.products.retrieve(productId)` (pas idéal pour la performance).
    // Alternativement, s'assurer que les `Price` ont des `nickname` utiles.

    return {
      data: JSON.parse(JSON.stringify(subscriptions.data)) as Stripe.Subscription[],
      hasMore: subscriptions.has_more,
    };
  } catch (e: any) {
    console.error('Error fetching Stripe subscriptions:', e);
    // Vérifier si l'erreur est liée à l'expansion
    if (e.message && e.message.includes('expand')) {
      return {
        error: `Stripe expansion error: ${e.message}. Check Stripe dashboard for API version compatibility or simplify expansions.`,
      };
    }
    return getErrorMessageResponse();
  }
}
