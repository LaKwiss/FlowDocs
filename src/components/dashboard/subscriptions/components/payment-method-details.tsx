// src/components/dashboard/subscriptions/components/payment-method-details.tsx
import Stripe from 'stripe';
import { CreditCard /* Ajoutez d'autres icônes si nécessaire */ } from 'lucide-react';

// Labels pour les types de PaymentMethod Stripe
// Vous pouvez étendre ceci si vous supportez plus de types que 'card'
const PaymentMethodLabels: Record<Stripe.PaymentMethod.Type | string, string> = {
  card: 'Card',
  // Ajoutez d'autres types comme 'sepa_debit', 'paypal', etc.
  alipay: 'Alipay',
  // ...
  unknown: 'Unknown',
};

interface Props {
  paymentMethod: Stripe.PaymentMethod | null;
}

export function PaymentMethodDetails({ paymentMethod }: Props) {
  if (!paymentMethod) return <span className={'text-base text-secondary leading-4'}>-</span>;

  const type = paymentMethod.type;

  if (type === 'card' && paymentMethod.card) {
    return (
      <>
        <CreditCard size={18} />
        <span className={'text-base text-secondary leading-4'}>
          {paymentMethod.card.brand?.toUpperCase()} **** {paymentMethod.card.last4}
        </span>
      </>
    );
  } else {
    return type ? (
      <span className={'text-base text-secondary leading-4'}>{PaymentMethodLabels[type] || type}</span>
    ) : (
      '-'
    );
  }
}
