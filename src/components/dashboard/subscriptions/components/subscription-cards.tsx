// src/components/dashboard/subscriptions/components/subscription-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Status } from '@/components/shared/status/status';
import Stripe from 'stripe'; // Importer le type Stripe
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { formatCurrency } from '@/utils/stripe/format-currency'; // Votre utilitaire pour formater la monnaie

interface Props {
  subscriptions: Stripe.Subscription[];
  className?: string; // className est optionnel
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

export function SubscriptionCards({ subscriptions, className }: Props) {
  if (!subscriptions || subscriptions.length === 0) {
    return <span className={'text-base font-medium'}>No active subscriptions</span>;
  } else {
    return (
      <div className={cn('grid flex-1 items-start gap-6', className)}>
        {' '}
        {/* Ajout de gap-6 ici pour l'espacement */}
        {subscriptions.map((subscription) => {
          const firstItem = subscription.items.data[0];
          // Assurez-vous que 'price' et 'product' sont bien des objets et non des string (ID)
          // Cela dépend de la manière dont vous "étendez" (expand) les objets lors de l'appel API Stripe.
          const price = firstItem?.price as Stripe.Price | undefined;
          const product = price?.product as Stripe.Product | undefined;

          let formattedPrice = 'N/A';
          let frequency = '';
          let productDescription = product?.description || 'View details for more information.';
          let productName = product?.name || 'Subscription Plan';
          let productImage = product?.images && product.images.length > 0 ? product.images[0] : null;

          if (price?.unit_amount_decimal && price?.currency) {
            // Utilisez unit_amount_decimal pour une précision exacte, convertissez en nombre.
            // Multipliez par la quantité s'il y en a plusieurs (généralement 1 pour les abonnements simples)
            const amountInSmallestUnit = parseFloat(price.unit_amount_decimal) * (firstItem?.quantity || 1);
            // formatCurrency doit prendre le montant dans la plus petite unité (ex: centimes)
            formattedPrice = formatCurrency(amountInSmallestUnit, price.currency);

            if (price.recurring) {
              frequency =
                price.recurring.interval_count === 1
                  ? `/${price.recurring.interval}`
                  : `every ${price.recurring.interval_count} ${price.recurring.interval}s`;
            }
          } else if (price?.unit_amount && price?.currency) {
            // Fallback pour unit_amount si unit_amount_decimal n'est pas là
            const amount = price.unit_amount * (firstItem.quantity || 1);
            formattedPrice = formatCurrency(amount, price.currency);
            if (price.recurring) {
              frequency =
                price.recurring.interval_count === 1
                  ? `/${price.recurring.interval}`
                  : `every ${price.recurring.interval_count} ${price.recurring.interval}s`;
            }
          }

          const statusLabel = subscriptionStatusMap[subscription.status] || subscription.status;

          return (
            <Card key={subscription.id} className={'bg-background/50 backdrop-blur-[24px] border-border p-6'}>
              <CardHeader className="p-0 space-y-0">
                <CardTitle className="flex flex-col justify-between items-start mb-6">
                  <div
                    className={cn('flex mb-4 w-full', {
                      'justify-between': productImage,
                      'justify-end': !productImage,
                    })}
                  >
                    {productImage && (
                      <Image
                        src={productImage}
                        alt={productName}
                        width={48}
                        height={48}
                        className="rounded-md" // Optionnel: pour arrondir les coins de l'image
                      />
                    )}
                    <Link
                      href={`/dashboard/subscriptions/${subscription.id}`}
                      aria-label={`View details for ${productName}`}
                    >
                      <ArrowRight size={20} className="text-muted-foreground hover:text-foreground" />
                    </Link>
                  </div>
                  <span className={'text-xl leading-7 font-medium'}>{productName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={'p-0 flex justify-between gap-3 flex-wrap xl:flex-nowrap'}>
                <div className={'flex flex-col gap-3'}>
                  <div className="text-base leading-6 text-secondary">{productDescription}</div>
                  <div className="text-base leading-[16px] text-primary">
                    {formattedPrice}
                    {frequency && <span className="text-sm text-muted-foreground"> {frequency}</span>}
                  </div>
                </div>
                <Status statusLabel={statusLabel} stripeStatus={subscription.status} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }
}
