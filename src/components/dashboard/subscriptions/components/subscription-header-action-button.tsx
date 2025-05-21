// src/components/dashboard/subscriptions/components/subscription-header-action-button.tsx
'use client';

import { cancelSubscriptionAtPeriodEnd, reactivateSubscription } from '@/app/dashboard/subscriptions/actions'; // Action renommée
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { Confirmation } from '@/components/shared/confirmation/confirmation';
import Stripe from 'stripe'; // Importer le type Stripe

interface Props {
  subscription: Stripe.Subscription; // Passer l'objet abonnement complet
}

export function SubscriptionHeaderActionButton({ subscription }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'reactivate' | null>(null);

  const subscriptionId = subscription.id;
  const isCancelationScheduled = subscription.cancel_at_period_end;
  const isCanceled = subscription.status === 'canceled'; // Ou autre statut terminal comme 'incomplete_expired'

  const handleAction = () => {
    if (!actionType) return;
    setModalOpen(false);
    setLoading(true);

    const actionPromise =
      actionType === 'cancel' ? cancelSubscriptionAtPeriodEnd(subscriptionId) : reactivateSubscription(subscriptionId);

    actionPromise
      .then((result) => {
        if ('error' in result) {
          throw new Error(result.error);
        }
        toast({
          description: (
            <div className={'flex items-center gap-3'}>
              <CircleCheck size={20} color={'#25F497'} />
              <div className={'flex flex-col gap-1'}>
                <span className={'text-primary font-medium test-sm leading-5'}>
                  {actionType === 'cancel' ? 'Cancellation scheduled' : 'Reactivation successful'}
                </span>
                <span className={'text-muted-foreground test-sm leading-5'}>
                  {actionType === 'cancel'
                    ? 'Subscription scheduled to cancel at the end of the billing period.'
                    : 'Subscription has been reactivated.'}
                </span>
              </div>
            </div>
          ),
        });
      })
      .catch((err) => {
        toast({
          description: (
            <div className={'flex items-start gap-3'}>
              <CircleAlert size={20} color={'#F42566'} />
              <div className={'flex flex-col gap-1'}>
                <div className={'text-primary font-medium test-sm leading-5'}>Error</div>
                <div className={'text-muted-foreground test-sm leading-5'}>
                  {err.message || 'Something went wrong, please try again later'}
                </div>
              </div>
            </div>
          ),
        });
      })
      .finally(() => setLoading(false));
  };

  const openConfirmationModal = (type: 'cancel' | 'reactivate') => {
    setActionType(type);
    setModalOpen(true);
  };

  if (isCanceled) {
    // Ne rien afficher si l'abonnement est déjà annulé définitivement
    return null;
  }

  return (
    <>
      {isCancelationScheduled ? (
        <Button
          disabled={loading}
          onClick={() => openConfirmationModal('reactivate')}
          size={'sm'}
          variant={'outline'}
          className={'flex gap-2 text-sm rounded-sm border-border'}
        >
          Reactivate Subscription
        </Button>
      ) : (
        <Button
          disabled={loading}
          onClick={() => openConfirmationModal('cancel')}
          size={'sm'}
          variant={'destructive'} // Ou 'outline' selon votre design
          className={'flex gap-2 text-sm rounded-sm border-border'}
        >
          Cancel subscription
        </Button>
      )}
      <Confirmation
        description={
          actionType === 'cancel'
            ? 'This subscription will be scheduled to cancel at the end of the billing period.'
            : 'Do you want to reactivate this subscription?'
        }
        title={actionType === 'cancel' ? 'Cancel subscription?' : 'Reactivate subscription?'}
        onClose={() => setModalOpen(false)}
        isOpen={isModalOpen}
        onConfirm={handleAction}
      />
    </>
  );
}
