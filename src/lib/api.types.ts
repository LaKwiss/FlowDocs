// src/lib/api.types.ts
import Stripe from 'stripe';

// Conservez les anciens types si une migration progressive est nécessaire,
// sinon remplacez-les ou supprimez-les.

// Nouveaux types pour Stripe (ou utilisez directement Stripe.Subscription, Stripe.Invoice etc.)
export interface StripeSubscriptionApiResponse {
  data?: Stripe.Subscription[];
  hasMore: boolean;
  error?: string;
}

export interface StripeInvoiceApiResponse {
  data?: Stripe.Invoice[];
  hasMore: boolean;
  error?: string;
}

export interface StripeSubscriptionDetailApiResponse {
  data?: Stripe.Subscription;
  error?: string;
}

// ... autres types nécessaires
