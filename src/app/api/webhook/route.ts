// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Readable } from 'stream';
import { createClient } from '@/utils/supabase/server-internal'; // Utilisez le client avec service_role

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Fonction pour lire le corps brut de la requête
async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const rawRequestBody = await buffer(request.body as any); // Next.js 13+

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error('Webhook Error: Missing signature or secret');
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(rawRequestBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = await createClient(); // Client Supabase avec rôle de service

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Si la session crée un abonnement
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          // Récupérer les détails de l'abonnement pour obtenir priceId, productId
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const firstItem = subscription.items.data[0];

          await supabase.from('subscriptions').upsert(
            {
              subscription_id: subscription.id,
              stripe_customer_id: customerId, // Assurez-vous que ce champ existe
              subscription_status: subscription.status,
              price_id: firstItem?.price.id || '',
              product_id: (firstItem?.price.product as string) || '',
              // current_period_end: new Date(subscription.current_period_end * 1000).toISOString(), // Exemple
              // metadata: subscription.metadata, // Si vous stockez des métadonnées
            },
            { onConflict: 'subscription_id' },
          );

          // Mettre à jour la table customers si nécessaire
          const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
          if (customer && !customer.deleted) {
            await supabase.from('customers').upsert(
              {
                // Si vous liez par user_id de Supabase, il faut le récupérer (via metadata de la session ou webhook customer.created)
                // user_id: customer.metadata.supabase_user_id, // Si défini lors de la création du client Stripe
                stripe_customer_id: customer.id,
                email: customer.email,
              },
              { onConflict: 'stripe_customer_id' },
            );
          }
        }
        console.log(`Checkout session completed: ${session.id}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const firstItem = subscription.items.data[0];
        await supabase
          .from('subscriptions')
          .upsert(
            {
              subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              subscription_status: subscription.status,
              price_id: firstItem?.price.id || '',
              product_id: (firstItem?.price.product as string) || '',
              scheduled_change: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
              // current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              // metadata: subscription.metadata,
            },
            { onConflict: 'subscription_id' },
          )
          .select();
        console.log(`Subscription ${event.type}: ${subscription.id}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Vous pouvez enregistrer les informations de la facture si nécessaire
        // Par exemple, pour l'historique des paiements
        console.log(`Invoice paid: ${invoice.id}`);
        // Potentiellement créer un enregistrement dans une table 'transactions' ou 'payments'
        // const charge = invoice.charge as string; // Peut être null
        // if (charge) {
        //   const stripeCharge = await stripe.charges.retrieve(charge);
        //   // ... enregistrer les infos de stripeCharge
        // }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Gérer les échecs de paiement, notifier l'utilisateur, etc.
        console.log(`Invoice payment failed: ${invoice.id}`);
        break;
      }

      // Gérer d'autres événements importants pour votre application
      // case 'customer.created':
      // case 'customer.updated':
      //   // ...
      //   break;

      default:
        console.warn(`Unhandled event type ${event.type}`);
    }
    return NextResponse.json({ status: 200, received: true, eventName: event.type });
  } catch (e: any) {
    console.error('Error processing webhook event:', e.message, e);
    return NextResponse.json({ error: `Webhook handler failed: ${e.message}` }, { status: 500 });
  }
}
