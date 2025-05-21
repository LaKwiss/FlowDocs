// src/app/dashboard/subscriptions/actions.ts
'use server';

import { validateUserSession } from '@/utils/supabase/server';
import Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { getStripeInstance } from '@/utils/stripe/get-stripe-instance';

const stripe = getStripeInstance();

interface ErrorResponse {
  error: string;
}

// Type pour la réponse d'annulation d'abonnement Stripe
// Stripe.Subscription est un type complexe, on peut simplifier ou utiliser tel quel
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string,
): Promise<Stripe.Subscription | ErrorResponse> {
  try {
    await validateUserSession(); // Valide que l'utilisateur est connecté

    // Note: Vous devriez aussi vérifier que l'abonnement appartient bien à l'utilisateur connecté
    // avant de permettre l'annulation. Cela peut se faire en récupérant le customerId Stripe
    // de l'utilisateur depuis votre base de données et en vérifiant que l'abonnement
    // récupéré de Stripe correspond à ce customerId.

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    if (subscription) {
      revalidatePath('/dashboard/subscriptions');
      revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
    }
    // Stripe.Subscription est un objet complexe. Le retourner directement peut être lourd.
    // Choisissez les champs pertinents ou retournez un objet simplifié.
    // Pour la simplicité ici, on le retourne, mais attention à la sérialisation si besoin.
    return JSON.parse(JSON.stringify(subscription)) as Stripe.Subscription;
  } catch (e: any) {
    console.error('Error canceling Stripe subscription:', e);
    return { error: e.message || 'Something went wrong, please try again later' };
  }
}

// Action pour réactiver un abonnement annulé (si cancel_at_period_end = true)
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription | ErrorResponse> {
  try {
    await validateUserSession();
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    if (subscription) {
      revalidatePath('/dashboard/subscriptions');
      revalidatePath(`/dashboard/subscriptions/${subscriptionId}`);
    }
    return JSON.parse(JSON.stringify(subscription)) as Stripe.Subscription;
  } catch (e: any) {
    console.error('Error reactivating Stripe subscription:', e);
    return { error: e.message || 'Something went wrong, please try again later' };
  }
}
