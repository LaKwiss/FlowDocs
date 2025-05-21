// src/lib/database.types.ts
// Adaptez ceci pour correspondre exactement à votre nouveau schéma Stripe
export interface Customer {
  user_id: string; // Clé primaire, UUID de auth.users
  stripe_customer_id: string | null;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  subscription_id: string; // ID d'abonnement Stripe (sub_xxx)
  user_id?: string | null; // UUID de auth.users
  stripe_customer_id?: string | null;
  subscription_status: string; // ex: active, trialing, etc. (Stripe.Subscription.Status)
  price_id?: string | null; // ID du tarif Stripe
  product_id?: string | null; // ID du produit Stripe
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  cancel_at?: string | null;
  canceled_at?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

// export interface Invoice { ... } // Si vous ajoutez une table Invoices
