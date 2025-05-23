// src/components/dashboard/subscriptions/components/subscription-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Clock4 } from 'lucide-react';
import Link from 'next/link';
import { Status } from '@/components/shared/status/status';
import Stripe from 'stripe';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { formatCurrency } from '@/utils/stripe/format-currency';

interface Props {
  subscriptions: Stripe.Subscription[];
  className?: string;
}

const subscriptionStatusMap: Record<Stripe.Subscription.Status | string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past Due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  paused: 'Paused',
};

export function SubscriptionCards({ subscriptions, className }: Props) {
  if (!subscriptions || subscriptions.length === 0) {
    return <span className={'text-base font-medium'}>No active subscriptions</span>;
  } else {
    return (
      <div className={cn('grid flex-1 items-start gap-6', className)}>
        {subscriptions.map((subscription) => {
          const firstItem = subscription.items.data[0];
          const price = firstItem?.price as Stripe.Price | undefined;
          // 'price.product' sera un ID (string) si l'objet Product n'est pas expandé.
          // Si c'est un objet, ce sera Stripe.Product.
          const productData = price?.product as Stripe.Product | string | null;

          let productName = 'Subscription Plan'; // Default
          let productDescription = 'View details for more information.';
          let productImage: string | null = null;

          if (typeof productData === 'object' && productData !== null) {
            // Cas où productData EST l'objet Stripe.Product expandé
            productName = productData.name || productName;
            productDescription = productData.description || productDescription;
            productImage = productData.images && productData.images.length > 0 ? productData.images[0] : null;
          } else if (price?.nickname) {
            // Fallback sur price.nickname si l'objet Product n'est pas expandé
            productName = price.nickname;
          }
          // Si productData est un ID (string), nous ne pouvons pas obtenir le nom du produit ici sans une autre requête.

          let formattedPrice = 'N/A';
          let frequency = '';

          if (price?.unit_amount_decimal && price?.currency) {
            const amountInSmallestUnit = parseFloat(price.unit_amount_decimal) * (firstItem?.quantity || 1);
            formattedPrice = formatCurrency(amountInSmallestUnit, price.currency);
            if (price.recurring) {
              frequency =
                price.recurring.interval_count === 1
                  ? `/${price.recurring.interval}`
                  : `every ${price.recurring.interval_count} ${price.recurring.interval}s`;
            }
          } else if (price?.unit_amount && price?.currency) {
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
                      <Image src={productImage} alt={productName} width={48} height={48} className="rounded-md" />
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
