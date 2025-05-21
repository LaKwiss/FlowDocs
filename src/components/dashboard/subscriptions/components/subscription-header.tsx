// src/components/dashboard/subscriptions/components/subscription-header.tsx
'use client'; // Garder 'use client' si MobileSidebar ou SubscriptionHeaderActionButton en ont besoin

import Stripe from 'stripe';
import Image from 'next/image'; // Gardez si vous avez des images de produits
import { Status } from '@/components/shared/status/status';
import { formatCurrency } from '@/utils/stripe/format-currency'; // Utilitaire créé précédemment
import dayjs from 'dayjs';
import { SubscriptionHeaderActionButton } from '@/components/dashboard/subscriptions/components/subscription-header-action-button';
import { SubscriptionAlerts } from '@/components/dashboard/subscriptions/components/subscription-alerts';
import { MobileSidebar } from '@/components/dashboard/layout/mobile-sidebar';

interface Props {
  subscription: Stripe.Subscription;
}

// Statuts d'abonnement Stripe et leur libellé pour l'affichage
const subscriptionStatusMap: Record<Stripe.Subscription.Status, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past Due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  paused: 'Paused', // Si vous utilisez la fonctionnalité de pause de Stripe
};

export function SubscriptionHeader({ subscription }: Props) {
  // Stripe stocke les items d'abonnement dans `items.data`
  const firstItem = subscription.items.data[0];
  const price = firstItem?.price; // Objet Stripe.Price
  const product = price?.product as Stripe.Product | undefined; // Le produit peut être étendu

  let formattedPrice = 'N/A';
  let frequency = '';

  if (price?.unit_amount && price?.currency) {
    const amount = price.unit_amount * (firstItem.quantity || 1);
    formattedPrice = formatCurrency(amount, price.currency); // Assurez-vous que formatCurrency gère bien les unités Stripe

    if (price.recurring) {
      frequency =
        price.recurring.interval_count === 1
          ? `/${price.recurring.interval}`
          : `every ${price.recurring.interval_count} ${price.recurring.interval}s`;
    }
  }

  const formattedStartedDate = subscription.created
    ? dayjs.unix(subscription.created).format('MMM DD, YYYY') // Stripe 'created' est un timestamp Unix
    : 'N/A';

  const statusLabel = subscriptionStatusMap[subscription.status] || subscription.status;

  return (
    <div className={'flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 sm:mb-0'}>
      <div className={'flex flex-col w-full'}>
        <SubscriptionAlerts subscription={subscription} />
        <div className={'flex items-center gap-5'}>
          <MobileSidebar />
          {/* Afficher l'image du produit si disponible et si le produit est étendu */}
          {product?.images && product.images.length > 0 && (
            <Image src={product.images[0]} alt={product.name || 'Product image'} width={48} height={48} />
          )}
          <span className={'text-4xl leading-9 font-medium'}>{product?.name || 'Subscription'}</span>
        </div>
        <div className={'flex items-center gap-6 py-8 pb-6 flex-wrap md:flex-nowrap'}>
          <div className={'flex gap-1 items-end'}>
            <span className={'text-4xl leading-9 font-medium'}>{formattedPrice}</span>
            <span className={'text-secondary text-sm leading-[14px] font-medium'}>{frequency}</span>
          </div>
          <div>
            <Status statusLabel={statusLabel} stripeStatus={subscription.status} />
          </div>
        </div>
        <div className={'text-secondary text-base leading-5 pb-8'}>Started on: {formattedStartedDate}</div>
      </div>
      <div>
        {/*
          SubscriptionHeaderActionButton attend l'objet Stripe.Subscription complet
          pour déterminer si l'annulation/réactivation est possible.
        */}
        <SubscriptionHeaderActionButton subscription={subscription} />
      </div>
    </div>
  );
}
