// src/components/dashboard/subscriptions/views/multiple-subscriptions-view.tsx
import { DashboardPageHeader } from '@/components/dashboard/layout/dashboard-page-header';
import { SubscriptionCards } from '@/components/dashboard/subscriptions/components/subscription-cards';
// Importer le type Subscription de Stripe
import Stripe from 'stripe';

interface Props {
  // Utiliser le type Stripe.Subscription
  subscriptions: Stripe.Subscription[];
}

export function MultipleSubscriptionsView({ subscriptions }: Props) {
  return (
    <>
      <DashboardPageHeader pageTitle={'Subscriptions'} />
      {/*
        SubscriptionCards attend maintenant un tableau de Stripe.Subscription.
        Assurez-vous que SubscriptionCards est également adapté pour gérer ce type.
        La classe de grille est conservée, vous pouvez l'ajuster si nécessaire.
      */}
      <SubscriptionCards className={'grid-cols-1 lg:grid-cols-3 gap-6'} subscriptions={subscriptions} />
    </>
  );
}
