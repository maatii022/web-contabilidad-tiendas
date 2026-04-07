'use client';

import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';

import { ExpenseSheet } from '@/components/forms/expense-sheet';
import { InvoiceSheet } from '@/components/forms/invoice-sheet';
import { buttonClassName } from '@/components/ui/button';
import type { ExpenseCatalogs } from '@/features/expenses/types';

export function DashboardQuickActions({
  catalogs,
  canManage,
  returnPath = '/dashboard'
}: {
  catalogs: ExpenseCatalogs;
  canManage: boolean;
  returnPath?: string;
}) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  if (!canManage) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={buttonClassName('secondary')} onClick={() => setExpenseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Nuevo gasto
        </button>
        <button type="button" className={buttonClassName('primary')} onClick={() => setInvoiceOpen(true)}>
          <Receipt className="mr-2 h-4 w-4" />Nueva factura
        </button>
      </div>
      <ExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} catalogs={catalogs} returnPath={returnPath} />
      <InvoiceSheet open={invoiceOpen} onClose={() => setInvoiceOpen(false)} catalogs={catalogs} returnPath={returnPath} />
    </>
  );
}
