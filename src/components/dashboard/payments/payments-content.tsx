// src/components/dashboard/payments/payments-content.tsx
'use client';

import { getStripeInvoices, StripeInvoiceResponse } from '@/utils/stripe/get-stripe-invoices';
import { ErrorContent } from '@/components/dashboard/layout/error-content';
import { DataTable } from '@/components/dashboard/payments/components/data-table';
import { columns } from '@/components/dashboard/payments/components/columns';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface Props {
  subscriptionId?: string;
  userId?: string; // Propriété pour un userId explicite, bien que l'on se base surtout sur l'utilisateur connecté
}

export function PaymentsContent({ subscriptionId: propsSubscriptionId, userId: propsUserId }: Props) {
  const [invoiceResponse, setInvoiceResponse] = useState<StripeInvoiceResponse>({
    data: [],
    hasMore: false,
    error: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [currentPageCursor, setCurrentPageCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      setInitialAuthCheckComplete(true);
    });
  }, []);

  useEffect(() => {
    if (!initialAuthCheckComplete) {
      // Attendre que la vérification d'authentification initiale soit terminée
      return;
    }

    const effectiveUserId = propsUserId || currentUser?.id;

    if (!effectiveUserId) {
      // Si aucun ID utilisateur n'est disponible après la vérification d'authentification, ne pas tenter de récupérer les données.
      // Cela peut signifier que l'utilisateur n'est pas connecté ou que les données utilisateur ne sont pas encore disponibles.
      if (!loading) {
        // Mettre à jour seulement si on n'est pas déjà dans un état de chargement d'une tentative précédente
        setInvoiceResponse({ data: [], hasMore: false, error: 'Utilisateur non authentifié ou ID non disponible.' });
        setLoading(false);
      }
      return;
    }

    (async () => {
      setLoading(true);
      const response = await getStripeInvoices(effectiveUserId, propsSubscriptionId, currentPageCursor);
      if (response) {
        setInvoiceResponse(response);
      } else {
        setInvoiceResponse({ data: [], hasMore: false, error: 'Échec de la récupération des factures.' });
      }
      setLoading(false);
    })();
  }, [propsUserId, propsSubscriptionId, currentPageCursor, currentUser, initialAuthCheckComplete]);

  const goToNextPage = () => {
    if (invoiceResponse.data && invoiceResponse.data.length > 0 && invoiceResponse.hasMore) {
      const lastInvoiceId = invoiceResponse.data[invoiceResponse.data.length - 1].id;
      setCursorHistory([...cursorHistory, currentPageCursor]);
      setCurrentPageCursor(lastInvoiceId);
    }
  };

  const goToPrevPage = () => {
    if (cursorHistory.length > 0) {
      const previousCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory(cursorHistory.slice(0, -1));
      setCurrentPageCursor(previousCursor);
    }
  };

  if (loading && (!initialAuthCheckComplete || (!currentUser && !propsUserId))) {
    return <LoadingScreen />;
  }

  if (invoiceResponse.error) {
    return <ErrorContent />; // Envisagez de passer le message d'erreur : <ErrorContent message={invoiceResponse.error} />
  }

  // Si la récupération initiale est terminée, pas de chargement, pas d'erreur, mais pas de données,
  // DataTable affichera "No results."
  if (
    initialAuthCheckComplete &&
    !loading &&
    !invoiceResponse.error &&
    (!invoiceResponse.data || invoiceResponse.data.length === 0)
  ) {
    // DataTable affichera "No results."
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={invoiceResponse.data ?? []}
        hasMore={!!invoiceResponse.hasMore} // S'assurer que c'est un booléen
        goToNextPage={goToNextPage}
        goToPrevPage={goToPrevPage}
        hasPrev={cursorHistory.length > 0 && currentPageCursor !== undefined}
      />
    </div>
  );
}
