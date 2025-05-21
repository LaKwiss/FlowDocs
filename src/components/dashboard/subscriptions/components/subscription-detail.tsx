// src/components/dashboard/subscriptions/components/subscription-detail.tsx
'use client';

import { getStripeSubscriptionDetail, StripeSubscriptionDetailResponse } from '@/utils/stripe/get-subscriptions-detail';
import { getStripeInvoices, StripeInvoiceResponse } from '@/utils/stripe/get-stripe-invoices';
import { SubscriptionPastPaymentsCard } from '@/components/dashboard/subscriptions/components/subscription-past-payments-card'; // À adapter
import { SubscriptionNextPaymentCard } from '@/components/dashboard/subscriptions/components/subscription-next-payment-card'; // À adapter
import { SubscriptionLineItems } from '@/components/dashboard/subscriptions/components/subscription-line-items'; // À adapter
import { SubscriptionHeader } from '@/components/dashboard/subscriptions/components/subscription-header'; // À adapter
import { Separator } from '@/components/ui/separator';
import { ErrorContent } from '@/components/dashboard/layout/error-content';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
import { createClient } from '@/utils/supabase/client'; // Pour obtenir l'ID utilisateur côté client
import { User } from '@supabase/supabase-js';

interface Props {
  subscriptionId: string;
}

export function SubscriptionDetail({ subscriptionId }: Props) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<StripeSubscriptionDetailResponse>();
  const [invoices, setInvoices] = useState<StripeInvoiceResponse>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return; // Attendre que l'utilisateur soit chargé

    (async () => {
      setLoading(true);
      const [subscriptionResponse, invoicesResponse] = await Promise.all([
        getStripeSubscriptionDetail(subscriptionId, currentUser.id), // Passer userId pour la vérification d'appartenance
        getStripeInvoices(currentUser.id, subscriptionId), // Passer userId et subscriptionId
      ]);

      if (subscriptionResponse) {
        setSubscription(subscriptionResponse);
      }

      if (invoicesResponse) {
        setInvoices(invoicesResponse);
      }
      setLoading(false);
    })();
  }, [subscriptionId, currentUser]);

  if (loading) {
    return <LoadingScreen />;
  } else if (subscription?.data && invoices?.data) {
    // Vérifier si une erreur est retournée par getStripeSubscriptionDetail (ex: non-appartenance)
    if (subscription.error) {
      return <ErrorContent />;
    }
    return (
      <>
        <div>
          {/* Adapter SubscriptionHeader pour Stripe.Subscription */}
          <SubscriptionHeader subscription={subscription.data} />
          <Separator className={'relative bg-border mb-8 dashboard-header-highlight'} />
        </div>
        <div className={'grid gap-6 grid-cols-1 xl:grid-cols-6'}>
          <div className={'grid auto-rows-max gap-6 grid-cols-1 xl:col-span-2'}>
            {/* Adapter SubscriptionNextPaymentCard pour Stripe.Subscription et Stripe.Invoice */}
            <SubscriptionNextPaymentCard invoices={invoices.data} subscription={subscription.data} />
            {/* Adapter SubscriptionPastPaymentsCard pour Stripe.Invoice */}
            <SubscriptionPastPaymentsCard invoices={invoices.data} subscriptionId={subscriptionId} />
          </div>
          <div className={'grid auto-rows-max gap-6 grid-cols-1 xl:col-span-4'}>
            {/* Adapter SubscriptionLineItems pour Stripe.Subscription */}
            <SubscriptionLineItems subscription={subscription.data} />
          </div>
        </div>
      </>
    );
  } else {
    return <ErrorContent />;
  }
}
