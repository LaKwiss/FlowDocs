// src/components/dashboard/subscriptions/components/payment-method-section.tsx
'use client';

import { Button } from '@/components/ui/button';
import { PaymentMethodDetails } from '@/components/dashboard/subscriptions/components/payment-method-details';
import Stripe from 'stripe';
import { createCustomerPortalSession } from '@/app/actions/stripe-actions';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Client Supabase côté client
import { User } from '@supabase/supabase-js';

interface Props {
  subscription?: Stripe.Subscription; // L'abonnement Stripe complet est passé en prop
}

export function PaymentMethodSection({ subscription }: Props) {
  const { toast } = useToast();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Récupérer l'utilisateur courant côté client pour s'assurer que l'ID est disponible
  // si createCustomerPortalSession doit le déduire.
  useState(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  });

  // Le moyen de paiement par défaut est directement sur l'objet subscription s'il est étendu (expand)
  // ou peut être null.
  const paymentMethod = subscription?.default_payment_method as Stripe.PaymentMethod | null;

  const handleManagePayment = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication Error',
        description: 'Please ensure you are logged in.',
        variant: 'destructive',
      });
      return;
    }
    setLoadingPortal(true);
    try {
      // Passer l'ID utilisateur Supabase à l'action
      const { url, error } = await createCustomerPortalSession(currentUser.id);
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Customer portal URL not received.');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not open payment management. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  // Ne pas afficher la section si aucun moyen de paiement par défaut n'est lié à l'abonnement
  // ou si l'abonnement lui-même n'est pas fourni.
  if (!subscription || !paymentMethod) {
    // Optionnel: Afficher un message indiquant qu'aucun moyen de paiement n'est configuré
    // ou que l'abonnement ne le requiert pas (ex: période d'essai sans moyen de paiement)
    if (subscription && subscription.status === 'trialing' && !paymentMethod) {
      return <div className={'pt-6 text-sm text-muted-foreground'}>No payment method required during trial.</div>;
    }
    return null;
  }

  // Ne pas montrer le bouton "Update" pour les abonnements annulés ou terminés.
  const canUpdatePaymentMethod = !(subscription.status === 'canceled' || subscription.status === 'incomplete_expired');

  return (
    <div className={'flex gap-6 pt-6 items-end justify-between @16xs:flex-wrap'}>
      <div className={'flex flex-col gap-4'}>
        <div className={'text-base text-secondary leading-4 whitespace-nowrap'}>Payment method</div>
        <div className={'flex gap-1 items-end'}>
          <PaymentMethodDetails paymentMethod={paymentMethod} />
        </div>
      </div>
      {canUpdatePaymentMethod && (
        <div>
          <Button
            onClick={handleManagePayment}
            disabled={loadingPortal || !currentUser}
            size={'sm'}
            className={'text-sm rounded-sm border-border'}
            variant={'outline'}
          >
            {loadingPortal ? 'Loading...' : 'Update Payment Method'}
          </Button>
        </div>
      )}
    </div>
  );
}
