// src/utils/stripe/get-stripe-customer-id.ts
import { createClient } from '@/utils/supabase/server'; // Ou client, selon le contexte d'appel

export async function getStripeCustomerId(userId?: string): Promise<string | null> {
  const supabase = await createClient();
  let currentUserId = userId;

  if (!currentUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No Supabase user found to retrieve Stripe customer ID.');
      return null;
    }
    currentUserId = user.id;
  }

  if (currentUserId) {
    const { data: customerData, error } = await supabase
      .from('customers') // Assurez-vous que cette table a une colonne 'user_id' et 'stripe_customer_id'
      .select('stripe_customer_id')
      .eq('user_id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Stripe customer ID:', error);
      return null;
    }
    return customerData?.stripe_customer_id || null;
  }
  return null;
}
