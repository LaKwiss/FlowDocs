// src/components/dashboard/subscriptions/components/subscription-next-payment-card.tsx
'use client';

import { Card } from '@/components/ui/card';
import Stripe from 'stripe';
import dayjs from 'dayjs';
import { formatCurrency } from '@/utils/stripe/format-currency';
import { PaymentMethodSection } from '@/components/dashboard/subscriptions/components/payment-method-section';

interface Props {
  subscription?: Stripe.Subscription;
  // Les 'transactions' (factures Stripe) pourraient être passées ici si on veut déduire le prochain paiement
  // à partir de la dernière facture non payée, mais Stripe fournit souvent ces infos directement
  // sur l'abonnement ou via l'objet upcoming invoice.
  // invoices?: Stripe.Invoice[]; // Optionnel, si vous voulez déduire des infos d'ici
}

export function SubscriptionNextPaymentCard({ subscription }: Props) {
  if (!subscription || subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    return null; // Pas de prochain paiement pour un abonnement annulé ou expiré
  }

  // Pour le prochain paiement, Stripe a `latest_invoice` qui peut être étendu
  // et qui peut avoir un `next_payment_attempt` (timestamp Unix) s'il est `open`.
  // Ou, l'abonnement lui-même a `current_period_end`.
  // Si une facture `upcoming` est disponible via l'API, c'est la meilleure source.

  let nextPaymentAmount = 'N/A';
  let nextPaymentDate = 'N/A';
  let currency = subscription.currency || 'usd'; // Devise de l'abonnement

  // Tentative de déduire à partir de latest_invoice (si elle est 'open' et a un next_payment_attempt)
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | undefined;
  if (latestInvoice && latestInvoice.status === 'open' && latestInvoice.next_payment_attempt) {
    nextPaymentAmount = formatCurrency(latestInvoice.amount_due, latestInvoice.currency || currency);
    nextPaymentDate = dayjs.unix(latestInvoice.next_payment_attempt).format('MMM DD, YYYY');
    currency = latestInvoice.currency || currency;
  } else if (subscription.billing_cycle_anchor) {
    // Sinon, utiliser la fin de la période actuelle comme date du prochain renouvellement.
    // Le montant serait basé sur les items de l'abonnement.
    const totalAmountFromItems = subscription.items.data.reduce(
      (acc, item) => acc + (item.price.unit_amount || 0) * (item.quantity || 1),
      0,
    );
    nextPaymentAmount = formatCurrency(totalAmountFromItems, currency);
    nextPaymentDate = dayjs.unix(subscription.billing_cycle_anchor).format('MMM DD, YYYY');
  }

  if (subscription.status === 'trialing' && subscription.trial_end) {
    nextPaymentDate = `Trial ends on ${dayjs.unix(subscription.trial_end).format('MMM DD, YYYY')}`;
    // Le montant sera celui après la période d'essai
  }

  // Si l'abonnement est configuré pour être annulé à la fin de la période, il n'y a plus de "prochain paiement".
  if (subscription.cancel_at_period_end && subscription.cancel_at) {
    return (
      <Card className={'bg-background/50 backdrop-blur-[24px] border-border p-6 @container'}>
        <div className={'flex gap-6 flex-col border-border border-b pb-6'}>
          <div className={'text-xl font-medium'}>Next payment</div>
          <div className={'text-base text-secondary leading-4'}>
            Subscription will cancel on {dayjs.unix(subscription.cancel_at).format('MMM DD, YYYY')}.
          </div>
        </div>
        {/* La section du moyen de paiement peut toujours être pertinente si l'utilisateur veut le changer avant l'annulation finale */}
        <PaymentMethodSection subscription={subscription} />
      </Card>
    );
  }

  return (
    <Card className={'bg-background/50 backdrop-blur-[24px] border-border p-6 @container'}>
      <div className={'flex gap-6 flex-col border-border border-b pb-6'}>
        <div className={'text-xl font-medium'}>Next payment</div>
        <div className={'flex gap-1 items-end @[200px]:flex-wrap'}>
          {' '}
          {/* Ajustement pour flex-wrap */}
          <span className={'text-xl leading-5 font-medium text-primary'}>{nextPaymentAmount}</span>
          <span className={'text-base text-secondary leading-4'}>due on</span>
          <span className={'text-base leading-4 font-semibold text-primary'}>{nextPaymentDate}</span>
        </div>
      </div>
      <PaymentMethodSection subscription={subscription} />
    </Card>
  );
}
