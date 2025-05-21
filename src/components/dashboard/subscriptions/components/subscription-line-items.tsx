// src/components/dashboard/subscriptions/components/subscription-line-items.tsx
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import Stripe from 'stripe';
import { Fragment } from 'react';
import { formatCurrency } from '@/utils/stripe/format-currency';
import Image from 'next/image'; // Si vous avez des images pour vos produits/prix Stripe

interface Props {
  subscription?: Stripe.Subscription;
}

export function SubscriptionLineItems({ subscription }: Props) {
  if (!subscription || !subscription.items || subscription.items.data.length === 0) {
    return (
      <Card className={'bg-background/50 backdrop-blur-[24px] border-border p-6'}>
        <CardTitle className="flex justify-between items-center pb-6 border-border border-b">
          <span className={'text-xl font-medium'}>Products in this subscription</span>
        </CardTitle>
        <CardContent className={'p-0 pt-10'}>
          <p>No items found in this subscription.</p>
        </CardContent>
      </Card>
    );
  }

  // Stripe stocke les totaux au niveau de l'abonnement si nécessaire (ex: taxes automatiques)
  // Pour les items, chaque 'price' a un 'unit_amount'.
  // Les 'recurring_transaction_details' de Paddle n'ont pas d'équivalent direct aussi structuré.
  // On se base sur les items de l'abonnement.

  // Calculs de totaux (simplifiés, car Stripe les gère au niveau de la facture)
  // Ici on affiche les détails par item, les totaux globaux de l'abonnement (prochain paiement)
  // sont mieux gérés par `SubscriptionNextPaymentCard` ou en consultant `latest_invoice`.

  return (
    <Card className={'bg-background/50 backdrop-blur-[24px] border-border p-6'}>
      <CardTitle className="flex justify-between items-center pb-6 border-border border-b">
        <span className={'text-xl font-medium'}>Products in this subscription</span>
      </CardTitle>
      <CardContent className={'p-0 pt-10'}>
        <div className={'grid grid-cols-12'}>
          {/* En-têtes de colonnes */}
          <div className={'col-span-6'}></div> {/* Colonne vide pour l'alignement */}
          <div className={'flex gap-6 w-full col-span-6'}>
            <div className={'col-span-2 w-full text-base leading-4 font-semibold'}>Qty</div>
            <div className={'col-span-2 w-full text-base leading-4 font-semibold text-right'}>Unit Price</div>
            <div className={'col-span-2 w-full text-base leading-4 font-semibold text-right'}>Total</div>
          </div>
          {subscription.items.data.map((item) => {
            const price = item.price; // Objet Stripe.Price
            const product = price.product as Stripe.Product | undefined; // Si étendu
            const quantity = item.quantity || 1;
            const unitAmount = price.unit_amount || 0;
            const totalAmount = unitAmount * quantity;
            const currency = price.currency;

            // Les taxes avec Stripe sont plus complexes et généralement appliquées au niveau de la facture.
            // `price.tax_behavior` peut donner une indication.
            // Pour un affichage simple, on omet les taxes détaillées par ligne ici
            // ou on pourrait afficher 'inc. tax' ou 'exc. tax' basé sur tax_behavior.

            return (
              <Fragment key={item.id}>
                <div className={'col-span-6 border-border border-b py-6'}>
                  <div className={'flex gap-4 items-center'}>
                    <div>
                      {product?.images && product.images.length > 0 && (
                        <Image src={product.images[0]} width={48} height={48} alt={product.name || 'Product'} />
                      )}
                    </div>
                    <div className={'flex flex-col gap-3 px-4'}>
                      <div className={'text-base leading-6 font-semibold'}>{product?.name || 'Subscription Item'}</div>
                      <div className={'text-base leading-6 text-secondary'}>
                        {product?.description || price.nickname || ''}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={'flex gap-6 w-full col-span-6 items-center border-border border-b py-6'}>
                  <div className={'col-span-2 w-full text-base leading-4 font-semibold text-secondary'}>{quantity}</div>
                  <div className={'col-span-2 text-right w-full text-base leading-4 font-semibold text-secondary'}>
                    {formatCurrency(unitAmount, currency)}
                  </div>
                  <div className={'col-span-2 text-right w-full text-base leading-4 font-semibold text-secondary'}>
                    {formatCurrency(totalAmount, currency)}
                  </div>
                </div>
              </Fragment>
            );
          })}
          {/* Section des totaux (si applicable et si vous ne l'affichez pas ailleurs) */}
          {/* Stripe calcule les totaux sur les factures. L'abonnement a un 'latest_invoice'. */}
          {/* Pour le total récurrent, on peut sommer les items ou regarder la prochaine facture. */}
          {/* Exemple simplifié si on veut afficher un total basé sur les items courants : */}
          <div className={'col-span-6'}></div>
          <div className={'flex flex-col w-full col-span-6 pt-6'}>
            {/* Il est plus pertinent d'afficher le montant de la prochaine facture dans SubscriptionNextPaymentCard */}
            {/* <div className={'flex justify-between py-4 border-border border-b'}>
              <div className={'col-span-3 w-full text-base leading-4 text-secondary'}>Recurring Total (exc. tax)</div>
              <div className={'col-span-3 w-full text-base leading-4 font-semibold text-right'}>
                {formatCurrency(
                  subscription.items.data.reduce((acc, item) => acc + (item.price.unit_amount || 0) * (item.quantity || 1), 0),
                  subscription.items.data[0]?.price.currency || 'usd'
                )}
              </div>
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
