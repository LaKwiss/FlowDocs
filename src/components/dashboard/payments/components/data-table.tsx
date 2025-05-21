// src/components/dashboard/payments/components/data-table.tsx
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel, // Peut être moins pertinent avec la pagination par curseur Stripe
  useReactTable,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
// Le type Transaction de Paddle est remplacé par le type de données que vous utiliserez de Stripe (ex: Stripe.Invoice)
// import { Transaction } from '@paddle/paddle-node-sdk'; // Supprimé

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hasMore?: boolean;
  // totalRecords n'est pas toujours disponible facilement avec la pagination par curseur de Stripe
  // totalRecords?: number;
  goToNextPage: () => void; // La signature peut changer si vous passez le curseur ici
  goToPrevPage: () => void;
  hasPrev: boolean;
  // Props spécifiques à Stripe si nécessaire pour la pagination, par exemple :
  // fetchNextPage: (cursor: string | null) => void;
  // fetchPrevPage: (cursor: string | null) => void;
  // nextPageCursor?: string | null;
  // prevPageCursor?: string | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hasMore,
  // totalRecords,
  goToNextPage,
  goToPrevPage,
  hasPrev,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // La pagination est gérée manuellement (côté serveur / avec des curseurs)
    // pageCount et rowCount sont moins pertinents avec la pagination par curseur sans total fixe.
    // On peut les omettre ou les baser sur les données actuellement chargées.
    // pageCount: totalRecords ? Math.ceil(totalRecords / data.length) : -1, // -1 si inconnu
    // rowCount: totalRecords, // Ou data.length si on ne connaît pas le total
  });

  return (
    <div className="rounded-md border bg-background relative">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      minWidth: header.column.columnDef.size,
                      maxWidth: header.column.columnDef.size,
                    }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      minWidth: cell.column.columnDef.size,
                      maxWidth: cell.column.columnDef.size,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 px-6 py-4">
        <Button
          size={'sm'}
          variant={'outline'}
          className={'flex gap-2 text-sm rounded-sm border-border'}
          onClick={() => goToPrevPage()}
          disabled={!hasPrev}
        >
          Previous
        </Button>
        <Button
          size={'sm'}
          variant={'outline'}
          className={'flex gap-2 text-sm rounded-sm border-border'}
          // La logique de goToNextPage n'a plus besoin de l'ID du dernier élément pour Stripe,
          // car le curseur est géré dans PaymentsContent.
          onClick={() => goToNextPage()}
          disabled={!hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
