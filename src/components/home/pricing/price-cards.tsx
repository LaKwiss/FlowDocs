'use client';

import { useState } from 'react';
// useRouter n'est plus nécessaire ici si Stripe.js gère la redirection
// import { useRouter } from 'next/navigation';
import { PricingTier, Tier } from '@/constants/pricing-tier';
import { IBillingFrequency } from '@/constants/billing-frequency';
import { FeaturesList } from '@/components/home/pricing/features-list';
import { PriceAmount } from '@/components/home/pricing/price-amount';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PriceTitle } from '@/components/home/pricing/price-title';
import { Separator } from '@/components/ui/separator';
import { FeaturedCardGradient } from '@/components/gradients/featured-card-gradient';
import { useToast } from '@/components/ui/use-toast';
import { createCheckoutSession } from '@/app/actions/stripe-actions';
import getStripe from '@/utils/stripe/get-stripejs'; // Importez votre utilitaire getStripe

interface Props {
  frequency: IBillingFrequency;
}

export function PriceCards({ frequency }: Props) {
  // const router = useRouter(); // Plus nécessaire si redirectToCheckout est utilisé
  const { toast } = useToast();
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);

  const handleGetStarted = async (tier: Tier) => {
    setLoadingTierId(tier.id);
    try {
      const priceId = tier.stripePriceIds[frequency.value as keyof Tier['stripePriceIds']];

      if (!priceId) {
        console.error('Stripe Price ID not found for tier:', tier.id, 'and frequency:', frequency.value);
        throw new Error('Configuration error: Price ID not found.');
      }

      const { sessionId, error: sessionError } = await createCheckoutSession(priceId);

      if (sessionError) {
        throw new Error(sessionError);
      }

      if (sessionId) {
        const stripe = await getStripe(); // Obtenir l'instance Stripe.js
        if (!stripe) {
          throw new Error('Stripe.js has not loaded yet.');
        }

        // Rediriger vers Stripe Checkout
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

        if (stripeError) {
          console.error('Stripe redirectToCheckout error:', stripeError);
          throw new Error(stripeError.message || 'Failed to redirect to Stripe Checkout.');
        }
        // Si redirectToCheckout réussit, l'utilisateur est sur la page Stripe et ce code n'est plus exécuté.
        // Si l'utilisateur ferme la page Stripe avant de payer, il sera redirigé vers l'URL d'annulation
        // configurée dans votre session Checkout.
      } else {
        throw new Error('Failed to create checkout session or session ID is missing.');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not proceed to checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      // setLoadingTierId(null) ne sera atteint que si redirectToCheckout échoue et lève une erreur,
      // ou si la session ID n'est pas obtenue. Si la redirection est réussie, le composant est démonté.
      // Il est donc bon de le garder ici pour les cas d'erreur avant redirection.
      setLoadingTierId(null);
    }
  };

  return (
    <div className="isolate mx-auto grid grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
      {PricingTier.map((tier) => (
        <div key={tier.id} className={cn('rounded-lg bg-background/70 backdrop-blur-[6px] overflow-hidden')}>
          <div className={cn('flex gap-5 flex-col rounded-lg rounded-b-none pricing-card-border')}>
            {tier.featured && <FeaturedCardGradient />}
            <PriceTitle tier={tier} />
            <PriceAmount tier={tier} frequencyValue={frequency.value} priceSuffix={frequency.priceSuffix} />
            <div className={'px-8'}>
              <Separator className={'bg-border'} />
            </div>
            <div className={'px-8 text-[16px] leading-[24px]'}>{tier.description}</div>
          </div>
          <div className={'px-8 mt-8'}>
            <Button
              className={'w-full'}
              variant={'secondary'}
              onClick={() => handleGetStarted(tier)}
              disabled={loadingTierId === tier.id}
            >
              {loadingTierId === tier.id ? 'Processing...' : 'Get started'}
            </Button>
          </div>
          <FeaturesList tier={tier} />
        </div>
      ))}
    </div>
  );
}
