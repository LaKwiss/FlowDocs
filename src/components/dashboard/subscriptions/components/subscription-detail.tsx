// src/components/dashboard/subscriptions/components/subscription-detail.tsx
'use client';

import { getStripeSubscriptionDetail } from '@/utils/stripe/get-subscriptions-detail'; //
import { getStripeInvoices, StripeInvoiceResponse } from '@/utils/stripe/get-stripe-invoices'; //
import { SubscriptionPastPaymentsCard } from '@/components/dashboard/subscriptions/components/subscription-past-payments-card'; //
import { SubscriptionNextPaymentCard } from '@/components/dashboard/subscriptions/components/subscription-next-payment-card'; //
import { SubscriptionLineItems } from '@/components/dashboard/subscriptions/components/subscription-line-items'; //
import { SubscriptionHeader } from '@/components/dashboard/subscriptions/components/subscription-header'; //
import { Separator } from '@/components/ui/separator'; //
import { ErrorContent } from '@/components/dashboard/layout/error-content'; //
import { useEffect, useState } from 'react'; //
import { LoadingScreen } from '@/components/dashboard/layout/loading-screen'; //
import { createClient } from '@/utils/supabase/client'; //
import { User } from '@supabase/supabase-js'; //
import Stripe from 'stripe'; //
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button'; // Import Button
import { ArrowLeft } from 'lucide-react';

interface Props {
  subscriptionId: string;
}

export function SubscriptionDetail({ subscriptionId }: Props) {
  const router = useRouter(); // Initialize useRouter
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<Stripe.Subscription | undefined>(undefined); //
  const [subscriptionError, setSubscriptionError] = useState<string | undefined>(undefined); //
  const [invoices, setInvoices] = useState<StripeInvoiceResponse>(); //
  const [currentUser, setCurrentUser] = useState<User | null>(null); //

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []); //

  useEffect(() => {
    if (!currentUser) return;

    (async () => {
      setLoading(true);
      const [subscriptionResponse, invoicesResponse] = await Promise.all([
        getStripeSubscriptionDetail(subscriptionId, currentUser.id), //
        getStripeInvoices(currentUser.id, subscriptionId), //
      ]);

      if (subscriptionResponse) {
        setSubscriptionData(subscriptionResponse.data); //
        setSubscriptionError(subscriptionResponse.error); //
      }

      if (invoicesResponse) {
        setInvoices(invoicesResponse); //
      }
      setLoading(false);
    })();
  }, [subscriptionId, currentUser]); //

  if (loading) {
    return <LoadingScreen />; //
  }

  if (subscriptionError || !subscriptionData) {
    return <ErrorContent />; //
  }

  if (invoices?.error && !invoices.data?.length) {
    return <ErrorContent />; //
  }

  return (
    <>
      <div>
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <SubscriptionHeader subscription={subscriptionData} /> {/* */}
        <Separator className={'relative bg-border mb-8 dashboard-header-highlight'} /> {/* */}
      </div>
      <div className={'grid gap-6 grid-cols-1 xl:grid-cols-6'}>
        {/* */}
        <div className={'grid auto-rows-max gap-6 grid-cols-1 xl:col-span-2'}>
          {' '}
          {/* */}
          <SubscriptionNextPaymentCard subscription={subscriptionData} /> {/* */}
          <SubscriptionPastPaymentsCard invoices={invoices?.data} subscriptionId={subscriptionId} /> {/* */}
        </div>
        <div className={'grid auto-rows-max gap-6 grid-cols-1 xl:col-span-4'}>
          {' '}
          {/* */}
          <SubscriptionLineItems subscription={subscriptionData} /> {/* */}
        </div>
      </div>
    </>
  );
}
