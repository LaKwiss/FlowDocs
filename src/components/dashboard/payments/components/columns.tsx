// src/components/dashboard/payments/components/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table'; //
import Stripe from 'stripe'; //
import dayjs from 'dayjs'; //
import { formatCurrency } from '@/utils/stripe/format-currency'; //
import { Status } from '@/components/shared/status/status'; //

const columnSize = 'auto' as unknown as number; //

const invoiceStatusMap: Record<Stripe.Invoice.Status, string> = {
  draft: 'Brouillon', //
  open: 'Ouverte', // Due //
  paid: 'Payée', //
  uncollectible: 'Non recouvrable', //
  void: 'Annulée', //
};

export const columns: ColumnDef<Stripe.Invoice>[] = [
  //
  {
    accessorKey: 'created', //
    header: 'Date', //
    size: columnSize, //
    cell: ({ row }) => {
      const createdTimestamp = row.getValue('created') as number; //
      return createdTimestamp ? dayjs.unix(createdTimestamp).format('DD MMM YYYY') : '-'; // Correction format date //
    },
  },
  {
    accessorKey: 'total', //
    header: () => <div className="text-right font-medium">Montant</div>, //
    size: columnSize, //
    cell: ({ row }) => {
      const total = row.original.total; //
      const currency = row.original.currency; //
      const formatted = formatCurrency(total, currency); //
      return <div className="text-right font-medium">{formatted}</div>; //
    },
  },
  {
    accessorKey: 'status', //
    header: 'Statut', //
    size: columnSize, //
    cell: ({ row }) => {
      const status = row.original.status; //
      return <Status statusLabel={status ? invoiceStatusMap[status] : 'Inconnu'} stripeStatus={status || 'unknown'} />;
    },
  },
  {
    accessorKey: 'description', //
    header: 'Description', //
    size: columnSize, //
    cell: ({ row }) => {
      const invoice = row.original; //
      const firstLineItem = invoice.lines?.data[0]; //
      let description = invoice.description || firstLineItem?.description || 'Abonnement'; //
      if (invoice.lines && invoice.lines.data.length > 1) {
        description += ` (+${invoice.lines.data.length - 1} autres articles)`; //
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
  {
    id: 'actions', //
    header: 'Facture', //
    cell: ({ row }) => {
      const invoice = row.original; //
      if (invoice.hosted_invoice_url) {
        //
        return (
          <a
            href={invoice.hosted_invoice_url} //
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Voir la facture
          </a>
        );
      }
      return null;
    },
  },
];
