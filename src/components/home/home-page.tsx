// src/components/home/home-page.tsx
'use client';

import { useState, useEffect } from 'react'; // useEffect est nécessaire pour useUserInfo
import { createClient } from '@/utils/supabase/client';
import { useUserInfo } from '@/hooks/useUserInfo';
import '../../styles/home-page.css';
// import { LocalizationBanner } from '@/components/home/header/localization-banner'; // Supprimé
import Header from '@/components/home/header/header';
import { HeroSection } from '@/components/home/hero-section/hero-section';
import { Pricing } from '@/components/home/pricing/pricing';
import { HomePageBackground } from '@/components/gradients/home-page-background';
import { Footer } from '@/components/home/footer/footer';

export function HomePage() {
  const supabase = createClient();
  const { user } = useUserInfo(supabase); // useUserInfo utilise useEffect, donc le composant doit être client
  // const [country, setCountry] = useState('US'); // Supprimé, plus nécessaire pour LocalizationBanner

  return (
    <>
      {/* <LocalizationBanner country={country} onCountryChange={setCountry} /> Supprimé */}
      <div>
        <HomePageBackground />
        <Header user={user} />
        <HeroSection />
        {/* La prop 'country' est supprimée du composant Pricing car la logique de localisation
            était liée à la LocalizationBanner de Paddle. Stripe Checkout gère la localisation.
            Si vous avez besoin d'afficher des prix pré-localisés, Pricing devrait être adapté
            pour potentiellement récupérer ces informations via l'API Stripe.
        */}
        <Pricing />
        <Footer />
      </div>
    </>
  );
}
