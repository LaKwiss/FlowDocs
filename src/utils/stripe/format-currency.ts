// src/utils/stripe/format-currency.ts
export function formatCurrency(amount: number, currency: string): string {
  const amountInMajorUnits = amount / 100; // Stripe utilise la plus petite unité (ex: centimes)
  return new Intl.NumberFormat(typeof navigator !== 'undefined' ? navigator.language : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInMajorUnits);
}
