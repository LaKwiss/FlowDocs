// src/components/dashboard/subscriptions/components/subscription-past-payments-card.tsx
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Stripe from 'stripe';
import dayjs from 'dayjs';
import { formatCurrency } from '@/utils/stripe/format-currency';
import { Status } from '@/components/shared/status/status';

interface Props {
  subscriptionId: string; // ID de l'abonnement Stripe
  invoices?: Stripe.Invoice[]; // Liste des factures Stripe
}

// Statuts de facture Stripe et leur libellé pour l'affichage
const invoiceStatusMap: Record<Stripe.Invoice.Status, string> = {
  draft: 'Draft',
  open: 'Open', // Due
  paid: 'Paid',
  uncollectible: 'Uncollectible',
  void: 'Void',
};

export function SubscriptionPastPaymentsCard({ subscriptionId, invoices }: Props) {
  if (!invoices || invoices.length === 0) {
    return (
      <Card className={'bg-background/50 backdrop-blur-[24px] border-border p-6 @container'}>
        <CardTitle className="flex justify-between items-center pb-6 border-border border-b flex-wrap">
          <span className={'text-xl font-medium'}>Payments</span>
          {/* Le lien peut pointer vers une page qui liste toutes les factures pour cet abonnement si besoin */}
          <Button asChild={true} size={'sm'} variant={'outline'} className={'text-sm rounded-sm border-border'}>
            <Link href={`/dashboard/payments/${subscriptionId}`}>View all</Link>
          </Button>
        </CardTitle>
        <CardContent className={'p-0 pt-6'}>
          <p>No past payments found for this subscription.</p>
        </CardContent>
      </Card>
    );
  }

  // Afficher seulement les factures payées ou pertinentes comme "paiements passés"
  const relevantInvoices = invoices.filter(
    (inv) => inv.status === 'paid' || inv.status === 'open' || inv.status === 'uncollectible',
  );

  return (
    <Card className={'bg-background/50 backdrop-blur-[24px] border-border p-6 @container'}>
      <CardTitle className="flex justify-between items-center pb-6 border-border border-b flex-wrap">
        <span className={'text-xl font-medium'}>Payments</span>
        <Button asChild={true} size={'sm'} variant={'outline'} className={'text-sm rounded-sm border-border'}>
          <Link href={`/dashboard/payments/${subscriptionId}`}>View all</Link>
        </Button>
      </CardTitle>
      <CardContent className={'p-0'}>
        {relevantInvoices.slice(0, 3).map((invoice) => {
          // Afficher les 3 plus récentes
          const formattedPrice = formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency);
          // La "raison" du paiement est moins directe qu'avec Paddle. On peut utiliser la description de la ligne de facture.
          const description = invoice.lines?.data[0]?.description || invoice.description || 'Subscription Payment';
          const paymentDate = invoice.status_transitions?.paid_at // Timestamp Unix si payée
            ? dayjs.unix(invoice.status_transitions.paid_at)
            : dayjs.unix(invoice.created); // Sinon, date de création

          return (
            <div key={invoice.id} className={'flex flex-col gap-4 border-border border-b py-6'}>
              <div className={'text-secondary text-base leading-4'}>{paymentDate.format('MMM DD, YYYY')}</div>
              <div className={'flex-wrap flex items-center gap-5'}>
                <span className={'font-semibold text-base leading-4'}>{description}</span>
                {/* Optionnel: Lien vers la facture hébergée */}
                {invoice.hosted_invoice_url && (
                  <a
                    href={invoice.hosted_invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Details
                  </a>
                )}
              </div>
              <div className={'flex gap-5 items-center flex-wrap'}>
                <div className={'text-base leading-4 font-semibold'}>{formattedPrice}</div>
                <Status
                  statusLabel={invoiceStatusMap[invoice.status || 'open']}
                  stripeStatus={invoice.status || 'open'}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
