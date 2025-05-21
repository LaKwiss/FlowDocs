// src/components/dashboard/subscriptions/components/subscription-detail.tsx
'use client';

import { getStripeSubscriptionDetail, StripeSubscriptionDetailResponse } from '@/utils/stripe/get-subscriptions-detail'; // Ensure this file exists at the specified path
import { getStripeInvoices, StripeInvoiceResponse } from '@/utils/stripe/get-stripe-invoices';
import { SubscriptionPastPaymentsCard } from '@/components/dashboard/subscriptions/components/subscription-past-payments-card';
import { SubscriptionNextPaymentCard } from '@/components/dashboard/subscriptions/components/subscription-next-payment-card';
import { SubscriptionLineItems } from '@/components/dashboard/subscriptions/components/subscription-line-items';
import { SubscriptionHeader } from '@/components/dashboard/subscriptions/components/subscription-header';
import { Separator } from '@/components/ui/separator';
import { ErrorContent } from '@/components/dashboard/layout/error-content';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Stripe from 'stripe'; // Importer le type Stripe pour l'utiliser explicitement

interface Props {
  subscriptionId: string;
}

export function SubscriptionDetail({ subscriptionId }: Props) {
  const [loading, setLoading] = useState(true);
  // Utiliser le type Stripe.Subscription directement pour plus de clarté
  const [subscriptionData, setSubscriptionData] = useState<Stripe.Subscription | undefined>(undefined);
  const [subscriptionError, setSubscriptionError] = useState<string | undefined>(undefined);
  const [invoices, setInvoices] = useState<StripeInvoiceResponse>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    (async () => {
      setLoading(true);
      const [subscriptionResponse, invoicesResponse] = await Promise.all([
        getStripeSubscriptionDetail(subscriptionId, currentUser.id),
        getStripeInvoices(currentUser.id, subscriptionId),
      ]);

      if (subscriptionResponse) {
        setSubscriptionData(subscriptionResponse.data);
        setSubscriptionError(subscriptionResponse.error);
      }

      if (invoicesResponse) {
        setInvoices(invoicesResponse);
      }
      setLoading(false);
    })();
  }, [subscriptionId, currentUser]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (subscriptionError || !subscriptionData) {
    // Si une erreur spécifique est retournée (ex: non-appartenance) ou si les données sont absentes
    return <ErrorContent />;
  }

  // invoices?.data pourrait être undefined si getStripeInvoices retourne une erreur mais pas subscriptionResponse
  if (invoices?.error && !invoices.data?.length) {
    return <ErrorContent />;
  }

  return (
    <>
      <div>
        <SubscriptionHeader subscription={subscriptionData} />
        <Separator className={'relative bg-border mb-8 dashboard-header-highlight'} />
      </div>
      <div className={'grid gap-6 grid-cols-1 xl:grid-cols-6'}>
        <div className={'grid auto-rows-max gap-6 grid-cols-1 xl:col-span-2'}>
          {/*
            Correction: La prop 'invoices' n'est pas attendue par SubscriptionNextPaymentCard.
            Ce composant déduit les informations du prochain paiement à partir de l'objet 'subscription' lui-même.
          */}
          <SubscriptionNextPaymentCard subscription={subscriptionData} />
          <SubscriptionPastPaymentsCard invoices={invoices?.data} subscriptionId={subscriptionId} />
        </div>
        <div className={'grid auto-rows-max gap-6 grid-cols-1 xl:col-span-4'}>
          <SubscriptionLineItems subscription={subscriptionData} />
        </div>
      </div>
    </>
  );
}
