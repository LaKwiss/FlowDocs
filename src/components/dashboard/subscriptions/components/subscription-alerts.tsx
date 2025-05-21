// src/components/dashboard/subscriptions/components/subscription-alerts.tsx
import Stripe from 'stripe';
import { Alert } from '@/components/ui/alert';
import dayjs from 'dayjs';

interface Props {
  subscription: Stripe.Subscription;
}

export function SubscriptionAlerts({ subscription }: Props) {
  if (subscription.status === 'canceled') {
    return (
      <Alert variant={'destructive'} className={'mb-10'}>
        This subscription was canceled on{' '}
        {subscription.canceled_at ? dayjs.unix(subscription.canceled_at).format('MMM DD, YYYY [at] h:mma') : 'N/A'}{' '}
        {/* Stripe `canceled_at` est un timestamp Unix */}
        and is no longer active.
      </Alert>
    );
  }

  if (subscription.cancel_at_period_end) {
    // cancel_at est un timestamp Unix indiquant quand l'abonnement sera effectivement annulé.
    const cancelAtDate = subscription.cancel_at
      ? dayjs.unix(subscription.cancel_at).format('MMM DD, YYYY [at] h:mma')
      : 'the end of the current period';
    return <Alert className={'mb-10'}>This subscription is scheduled to be canceled on {cancelAtDate}.</Alert>;
  }

  if (subscription.status === 'past_due') {
    return (
      <Alert variant={'destructive'} className={'mb-10'}>
        This subscription is past due. Please update your payment method.
      </Alert>
    );
  }

  if (subscription.status === 'unpaid') {
    return (
      <Alert variant={'destructive'} className={'mb-10'}>
        This subscription has an unpaid invoice. Please update your payment method.
      </Alert>
    );
  }

  // Vous pouvez ajouter d'autres alertes pour des statuts comme 'incomplete', 'incomplete_expired', etc.

  return null;
}
