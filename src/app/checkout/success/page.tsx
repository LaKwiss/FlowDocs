// src/app/checkout/success/page.tsx
import { SuccessPageGradients } from '@/components/gradients/success-page-gradients';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import '../../../styles/checkout.css';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';
import { redirect } from 'next/navigation';

async function getSessionDetails(sessionId: string) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'subscription'],
    });
    return session;
  } catch (error) {
    console.error('Error fetching Stripe session:', error);
    return null;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionId = searchParams?.session_id as string;
  let sessionDetails = null;

  if (sessionId) {
    sessionDetails = await getSessionDetails(sessionId);
    // Ici, vous pourriez vouloir vérifier que la session appartient bien à l'utilisateur connecté
    // ou mettre à jour la base de données avec les informations de l'abonnement si ce n'est pas
    // déjà fait par un webhook.
    // Pour l'instant, on affiche juste un message générique.
  } else {
    // Rediriger si pas de session_id, car cette page n'a pas de sens sans
    return redirect('/');
  }

  return (
    <main>
      <div className={'relative h-screen overflow-hidden'}>
        <SuccessPageGradients />
        <div className={'absolute inset-0 px-6 flex items-center justify-center'}>
          <div className={'flex flex-col items-center text-white text-center'}>
            <Image
              className={'pb-12'}
              src={'/assets/icons/logo/aeroedit-success-icon.svg'} // Gardez ou changez le logo
              alt={'Success icon'}
              height={96}
              width={96}
            />
            <h1 className={'text-4xl md:text-[80px] leading-9 md:leading-[80px] font-medium pb-6'}>
              Payment successful
            </h1>
            <p className={'text-lg pb-16'}>
              {sessionDetails
                ? `Thank you for your purchase! Your subscription is now active.`
                : 'Success! Your payment is complete, and you’re all set.'}
            </p>
            <Button variant={'secondary'} asChild={true}>
              {user ? <Link href={'/dashboard'}>Go to Dashboard</Link> : <Link href={'/'}>Go to Home</Link>}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
