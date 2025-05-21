// src/components/home/pricing/price-amount.tsx
import { Tier } from '@/constants/pricing-tier';
import { cn } from '@/lib/utils';

interface Props {
  tier: Tier;
  frequencyValue: string; // 'month' ou 'year'
  priceSuffix: string;
  // Plus besoin de loading et priceMap
}

// Exemple simplifié : vous devrez adapter ceci pour afficher les prix Stripe
// comme vous le souhaitez. Vous pourriez avoir une structure dans `PricingTier`
// qui contient directement les chaînes de prix à afficher.
const getDisplayPrice = (tier: Tier, frequencyValue: string): string => {
  // Logique pour obtenir le prix à afficher pour le tier et la fréquence.
  // Par exemple, vous pourriez avoir une propriété `displayPrice` dans vos Tiers.
  // Pour cet exemple, on retourne un placeholder.
  if (tier.id === 'starter' && frequencyValue === 'month') return '$10';
  if (tier.id === 'starter' && frequencyValue === 'year') return '$100';
  if (tier.id === 'pro' && frequencyValue === 'month') return '$25';
  if (tier.id === 'pro' && frequencyValue === 'year') return '$250';
  if (tier.id === 'advanced' && frequencyValue === 'month') return '$50';
  if (tier.id === 'advanced' && frequencyValue === 'year') return '$500';
  return '$X'; // Placeholder
};

export function PriceAmount({ tier, frequencyValue, priceSuffix }: Props) {
  const displayPrice = getDisplayPrice(tier, frequencyValue);

  return (
    <div className="mt-6 flex flex-col px-8">
      {/* Remplacer Skeleton par l'affichage direct ou un nouveau Skeleton si chargement depuis Stripe */}
      <div className={cn('text-[80px] leading-[96px] tracking-[-1.6px] font-medium')}>{displayPrice}</div>
      <div className={cn('font-medium leading-[12px] text-[12px]')}>{priceSuffix}</div>
    </div>
  );
}
