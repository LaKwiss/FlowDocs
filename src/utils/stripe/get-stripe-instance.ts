// src/utils/stripe/get-stripe-instance.ts
import Stripe from 'stripe';

let stripe: Stripe;

export function getStripeInstance() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is missing from environment variables.');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil', // Utilisez la dernière version stable
      typescript: true,
    });
  }
  return stripe;
}
