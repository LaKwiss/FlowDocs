// src/components/home/pricing/pricing.tsx
'use client';

import { Toggle } from '@/components/shared/toggle/toggle';
import { PriceCards } from '@/components/home/pricing/price-cards';
import { useEffect, useState } from 'react';
import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';
// Les imports initializePaddle, Paddle et usePaddlePrices de Paddle sont supprimés
// import { Environments, initializePaddle, Paddle } from '@paddle/paddle-js';
// import { usePaddlePrices } from '@/hooks/usePaddlePrices';

// L'interface Props est modifiée pour supprimer 'country'
interface Props {
  // country: string; // Supprimé
}

// La prop 'country' est supprimée de la signature de la fonction
export function Pricing({}: Props) {
  // Ou simplement export function Pricing()
  const [frequency, setFrequency] = useState<IBillingFrequency>(BillingFrequency[0]);
  // La logique liée à Paddle (useState pour paddle, usePaddlePrices) est supprimée.
  // const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  // const { prices, loading } = usePaddlePrices(paddle, country);

  // L'useEffect pour initialiser Paddle est supprimé.
  // useEffect(() => {
  //   if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && process.env.NEXT_PUBLIC_PADDLE_ENV) {
  //     initializePaddle({
  //       token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  //       environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
  //     }).then((paddleInstance) => { // Renommé pour éviter la confusion avec l'état
  //       if (paddleInstance) {
  //         setPaddle(paddleInstance);
  //       }
  //     });
  //   }
  // }, []);

  // Si vous avez besoin de charger des informations de prix de Stripe dynamiquement
  // (par exemple, pour afficher des prix localisés avant le checkout, bien que Stripe Checkout le fasse aussi),
  // vous implémenteriez un hook similaire à usePaddlePrices mais pour Stripe ici.
  // Exemple (hypothétique, car Stripe Checkout gère beaucoup de cela) :
  // const { stripePrices, loadingStripePrices } = useStripePrices(frequency);

  return (
    <div className="mx-auto max-w-7xl relative px-[32px] flex flex-col items-center justify-between">
      <Toggle frequency={frequency} setFrequency={setFrequency} />
      {/*
        PriceCards n'attend plus 'loading' et 'priceMap' de l'ancien hook Paddle.
        Si vous avez un nouveau hook comme 'useStripePrices', vous passeriez ses résultats ici.
        Sinon, si l'affichage des prix est simplifié (comme dans notre adaptation de PriceAmount),
        il pourrait ne pas avoir besoin de props supplémentaires liées aux données de prix dynamiques.
      */}
      <PriceCards
        frequency={frequency}
        // loading={loadingStripePrices} // Si vous avez un chargement pour les prix Stripe
        // priceMap={stripePrices}      // Si vous avez une map de prix Stripe
      />
    </div>
  );
}
