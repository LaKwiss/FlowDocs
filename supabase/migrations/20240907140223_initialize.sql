-- supabase/migrations/xxxx_update_for_stripe.sql

-- Table Customers
-- Supprimer l'ancienne contrainte de clé étrangère si elle existe sur la table subscriptions
-- ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS public_subscriptions_customer_id_fkey;

-- Supprimer l'ancienne colonne customer_id (Paddle) et renommer/ajouter stripe_customer_id
-- Option 1: Supprimer et recréer (si pas de données à migrer ou migration manuelle des données)
DROP TABLE IF EXISTS public.customers CASCADE; -- CASCADE si d'autres tables y font référence
CREATE TABLE public.customers (
  user_id uuid references auth.users(id) not null primary key, -- Clé primaire liée à l'utilisateur Supabase
  stripe_customer_id text unique, -- ID client Stripe, peut être null au début
  email text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
-- Rétablir les politiques RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated user to read their own customer data" ON public.customers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Permettre aux fonctions serveur (via service_role) de tout faire
CREATE POLICY "Allow service_role to manage customers" ON public.customers
  FOR ALL TO service_role USING (true);


-- Table Subscriptions
DROP TABLE IF EXISTS public.subscriptions CASCADE;
CREATE TABLE public.subscriptions (
  subscription_id text not null primary key, -- ID d'abonnement Stripe (sub_xxxxxxxx)
  stripe_customer_id text references public.customers(stripe_customer_id), -- Clé étrangère vers stripe_customer_id
  user_id uuid references auth.users(id), -- Redondant si stripe_customer_id est lié à user_id, mais utile
  subscription_status text not null, -- ex: active, trialing, canceled, past_due
  price_id text, -- ID du tarif Stripe
  product_id text, -- ID du produit Stripe
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  cancel_at timestamp with time zone, -- Date d'annulation effective si cancel_at_period_end
  canceled_at timestamp with time zone, -- Date à laquelle l'annulation a été demandée
  metadata jsonb, -- Pour stocker d'autres informations
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
-- Rétablir les politiques RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated user to read their own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow service_role to manage subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true);

-- (Optionnel) Table pour les factures/paiements Stripe si vous voulez un historique détaillé
-- CREATE TABLE public.invoices (
--   invoice_id text not null primary key,
--   subscription_id text references public.subscriptions(subscription_id),
--   stripe_customer_id text references public.customers(stripe_customer_id),
--   user_id uuid references auth.users(id),
--   amount_paid integer,
--   amount_due integer,
--   currency text,
--   status text, -- paid, open, void, etc.
--   hosted_invoice_url text,
--   created_at timestamp with time zone,
--   paid_at timestamp with time zone,
--   updated_at timestamp with time zone not null default now()
-- );
-- ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated user to read their own invoices" ON public.invoices
--   FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- CREATE POLICY "Allow service_role to manage invoices" ON public.invoices
--   FOR ALL TO service_role USING (true);