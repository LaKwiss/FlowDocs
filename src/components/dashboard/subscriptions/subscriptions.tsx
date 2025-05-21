// src/components/dashboard/subscriptions/subscriptions.tsx
import { SubscriptionDetail } from '@/components/dashboard/subscriptions/components/subscription-detail';
import { NoSubscriptionView } from '@/components/dashboard/subscriptions/views/no-subscription-view';
import { MultipleSubscriptionsView } from '@/components/dashboard/subscriptions/views/multiple-subscriptions-view';
import { SubscriptionErrorView } from '@/components/dashboard/subscriptions/views/subscription-error-view';
import { getStripeSubscriptions } from '@/utils/stripe/get-stripe-subscriptions'; // Remplacer par la fonction Stripe
import { createClient } from '@/utils/supabase/server'; // Pour obtenir l'ID utilisateur
import { redirect } from 'next/navigation';

export async function Subscriptions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    // Bien que le layout du tableau de bord devrait déjà gérer cela.
    return redirect('/login');
  }

  // Récupérer les abonnements Stripe pour l'utilisateur connecté
  const { data: subscriptions, error } = await getStripeSubscriptions(user.id);

  if (error) {
    // S'il y a une erreur lors de la récupération des abonnements
    return <SubscriptionErrorView />;
  }

  if (subscriptions) {
    if (subscriptions.length === 0) {
      return <NoSubscriptionView />;
    } else if (subscriptions.length === 1) {
      // SubscriptionDetail attend un subscriptionId.
      // Il récupérera ensuite les détails complets de cet abonnement,
      // y compris les informations étendues nécessaires.
      return <SubscriptionDetail subscriptionId={subscriptions[0].id} />;
    } else {
      // MultipleSubscriptionsView attend la liste des abonnements.
      // Assurez-vous que les données passées sont suffisantes pour l'affichage
      // dans SubscriptionCards (nom du produit, prix, statut, etc.).
      // getStripeSubscriptions devrait étendre les champs nécessaires si possible.
      return <MultipleSubscriptionsView subscriptions={subscriptions} />;
    }
  } else {
    // Cas où subscriptions est undefined mais pas d'erreur (peu probable si getStripeSubscriptions est bien typé)
    return <SubscriptionErrorView />;
  }
}
