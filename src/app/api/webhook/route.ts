// src/app/api/webhook/route.ts
// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'; //
import Stripe from 'stripe'; //
import { Readable } from 'stream'; //
import { createClient } from '@/utils/supabase/server-internal'; //

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); //
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!; //

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
} //

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature'); //
  const rawRequestBody = await buffer(request.body as any); //

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error('Webhook Error: Signature ou secret manquant'); //
      return NextResponse.json({ error: 'Secret du webhook non configuré.' }, { status: 400 }); //
    }
    event = stripe.webhooks.constructEvent(rawRequestBody, sig, webhookSecret); //
  } catch (err: any) {
    console.error(`Échec de la vérification de la signature du webhook: ${err.message}`); //
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 }); //
  }

  const supabase = await createClient(); //

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session; //
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          //
          const subscriptionId = session.subscription as string; //
          const customerId = session.customer as string; //

          const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as Stripe.Subscription; //
          const firstItem = subscription.items.data[0]; //
          const supabaseUserIdFromSession = session.metadata?.supabase_user_id; //

          // Upsert de l'abonnement
          await supabase.from('subscriptions').upsert(
            {
              subscription_id: subscription.id, //
              stripe_customer_id: customerId, //
              user_id: supabaseUserIdFromSession || null, // Lien vers l'utilisateur Supabase
              subscription_status: subscription.status, //
              price_id: firstItem?.price.id || '', //
              product_id: (firstItem?.price.product as string) || '', //
              current_period_end: new Date(firstItem.current_period_end * 1000).toISOString(),
              current_period_start: new Date(firstItem.current_period_start * 1000).toISOString(),
              metadata: subscription.metadata, //
            },
            { onConflict: 'subscription_id' }, //
          );

          // Upsert du client
          const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer; //
          if (customer && !customer.deleted) {
            //
            const supabaseUserIdFromCustomer = customer.metadata?.supabase_user_id || supabaseUserIdFromSession;
            if (supabaseUserIdFromCustomer) {
              await supabase.from('customers').upsert(
                {
                  user_id: supabaseUserIdFromCustomer,
                  stripe_customer_id: customer.id, //
                  email: customer.email!, //
                },
                { onConflict: 'user_id' }, // Utiliser user_id comme cible de conflit car c'est la PK
              );
            } else {
              console.warn(
                `Webhook: supabase_user_id manquant dans les métadonnées du client Stripe ${customer.id} et de la session.`,
              );
            }
          }
        }
        console.log(`Session de paiement terminée: ${session.id}`); //
        break;
      }

      case 'customer.subscription.created': //
      case 'customer.subscription.updated': //
      case 'customer.subscription.deleted': {
        //
        const subscription = event.data.object as Stripe.Subscription; //
        const firstItem = subscription.items.data[0]; //

        // Essayer de récupérer le user_id via les métadonnées du client Stripe
        let supabaseUserId: string | null = null;
        if (typeof subscription.customer === 'string') {
          try {
            const customer = (await stripe.customers.retrieve(subscription.customer)) as Stripe.Customer;
            if (customer && customer.metadata && customer.metadata.supabase_user_id) {
              supabaseUserId = customer.metadata.supabase_user_id;
            }
          } catch (customerError) {
            console.error('Erreur lors de la récupération du client Stripe pour user_id:', customerError);
          }
        }

        await supabase
          .from('subscriptions')
          .upsert(
            {
              subscription_id: subscription.id, //
              stripe_customer_id: subscription.customer as string, //
              user_id: supabaseUserId,
              subscription_status: subscription.status, //
              price_id: firstItem?.price.id || '', //
              product_id: (firstItem?.price.product as string) || '', //
              current_period_end: new Date(firstItem.current_period_end * 1000).toISOString(),
              current_period_start: new Date(firstItem.current_period_start * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null, //
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              metadata: subscription.metadata, //
            },
            { onConflict: 'subscription_id' }, //
          )
          .select(); //
        console.log(`Abonnement ${event.type}: ${subscription.id}`); //
        break;
      }

      case 'invoice.paid': {
        //
        const invoice = event.data.object as Stripe.Invoice; //
        console.log(`Facture payée: ${invoice.id}`); //
        break;
      }

      case 'invoice.payment_failed': {
        //
        const invoice = event.data.object as Stripe.Invoice; //
        console.log(`Échec du paiement de la facture: ${invoice.id}`); //
        break;
      }
      default:
        console.warn(`Type d'événement non géré ${event.type}`); //
    }
    return NextResponse.json({ status: 200, received: true, eventName: event.type }); //
  } catch (e: any) {
    console.error('Erreur lors du traitement du webhook:', e.message, e); //
    return NextResponse.json({ error: `Échec du gestionnaire de webhook: ${e.message}` }, { status: 500 }); //
  }
}
