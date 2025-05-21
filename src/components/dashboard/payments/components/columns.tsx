// src/components/dashboard/payments/components/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import Stripe from 'stripe';
import dayjs from 'dayjs';
import { formatCurrency } from '@/utils/stripe/format-currency'; // À créer
import { Status } from '@/components/shared/status/status'; // Adapter Status pour les statuts Stripe

// Ajustez la taille des colonnes si nécessaire
const columnSize = 'auto' as unknown as number;

// Statuts de facture Stripe et leur signification pour l'affichage
const invoiceStatusMap: Record<Stripe.Invoice.Status, string> = {
  draft: 'Draft',
  open: 'Open', // Due
  paid: 'Paid',
  uncollectible: 'Uncollectible',
  void: 'Void',
};

export const columns: ColumnDef<Stripe.Invoice>[] = [
  {
    accessorKey: 'created', // Date de création de la facture
    header: 'Date',
    size: columnSize,
    cell: ({ row }) => {
      const createdTimestamp = row.getValue('created') as number;
      return createdTimestamp ? dayjs.unix(createdTimestamp).format('MMM DD, YYYY') : '-';
    },
  },
  {
    accessorKey: 'total', // Montant total de la facture
    header: () => <div className="text-right font-medium">Amount</div>,
    size: columnSize,
    cell: ({ row }) => {
      const total = row.original.total;
      const currency = row.original.currency;
      const formatted = formatCurrency(total, currency); // Stripe envoie les montants en plus petite unité
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: columnSize,
    cell: ({ row }) => {
      const status = row.original.status;
      return <Status status={status ? invoiceStatusMap[status] : 'Unknown'} />;
    },
  },
  {
    accessorKey: 'description', // Ou utilisez lines.data[0].description
    header: 'Description',
    size: columnSize,
    cell: ({ row }) => {
      const invoice = row.original;
      const firstLineItem = invoice.lines?.data[0];
      let description = invoice.description || firstLineItem?.description || 'Subscription';
      if (invoice.lines && invoice.lines.data.length > 1) {
        description += ` (+${invoice.lines.data.length - 1} more items)`;
      }
      return (
        <div className={'max-w-[250px]'}>
          <div className={'whitespace-nowrap flex gap-1 truncate'}>
            <span className={'font-medium truncate'}>{description}</span>
          </div>
        </div>
      );
    },
  },
  // Vous pouvez ajouter une colonne pour un lien vers la facture hébergée par Stripe
  {
    id: 'actions',
    header: 'Invoice',
    cell: ({ row }) => {
      const invoice = row.original;
      if (invoice.hosted_invoice_url) {
        return (
          <a
            href={invoice.hosted_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Invoice
          </a>
        );
      }
      return null;
    },
  },
];
