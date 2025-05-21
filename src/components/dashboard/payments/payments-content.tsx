// src/components/dashboard/payments/payments-content.tsx
'use client';

import { getStripeInvoices, StripeInvoiceResponse } from '@/utils/stripe/get-stripe-invoices';
import { ErrorContent } from '@/components/dashboard/layout/error-content';
import { DataTable } from '@/components/dashboard/payments/components/data-table';
import { columns } from '@/components/dashboard/payments/components/columns';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/dashboard/layout/loading-screen';
// Remplacer usePagination par une logique adaptée à la pagination Stripe (curseurs 'starting_after')
// Pour l'instant, nous allons simplifier et ne pas implémenter la pagination complexe ici.
// Vous devrez gérer `starting_after` pour la pagination.

interface Props {
  subscriptionId?: string; // Stripe Invoices peuvent être filtrées par subscriptionId
  userId?: string; // Pour récupérer le customer_id Stripe
}

export function PaymentsContent({ subscriptionId, userId }: Props) {
  const [invoiceResponse, setInvoiceResponse] = useState<StripeInvoiceResponse>({
    data: [],
    hasMore: false,
    error: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [currentPageCursor, setCurrentPageCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // L'userId est nécessaire pour getStripeInvoices pour trouver le client Stripe.
      // Si vous passez déjà un subscriptionId, vous pourriez aussi vouloir passer userId
      // pour vous assurer que l'utilisateur a le droit de voir ces factures.
      const response = await getStripeInvoices(userId, subscriptionId, currentPageCursor);
      if (response) {
        setInvoiceResponse(response);
      }
      setLoading(false);
    })();
  }, [userId, subscriptionId, currentPageCursor]);

  const goToNextPage = () => {
    if (invoiceResponse.data && invoiceResponse.data.length > 0 && invoiceResponse.hasMore) {
      const lastInvoiceId = invoiceResponse.data[invoiceResponse.data.length - 1].id;
      setCursorHistory([...cursorHistory, currentPageCursor || '']); // Sauvegarde du curseur actuel (ou vide pour la première page)
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

  if (loading && !invoiceResponse.data?.length) {
    // Afficher le chargement seulement si aucune donnée n'est encore là
    return <LoadingScreen />;
  }
  if (invoiceResponse.error) {
    return <ErrorContent />;
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={invoiceResponse.data ?? []}
        hasMore={invoiceResponse.hasMore}
        // totalRecords n'est pas directement fourni par Stripe pour les listes
        goToNextPage={goToNextPage} // Adapter pour la pagination Stripe
        goToPrevPage={goToPrevPage} // Adapter
        hasPrev={cursorHistory.length > 0} // Simple logique de retour
      />
    </div>
  );
}
