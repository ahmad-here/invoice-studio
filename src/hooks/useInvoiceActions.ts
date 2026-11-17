import { useCallback, useState } from 'react'
import type { Invoice } from '@/types/invoice'
import { toast, useApp } from '@/app/store'
import { saveFile } from '@/services/files'
import { uid } from '@/lib/sanitize'
import { addDays, parseISO, todayISO } from '@/lib/dates'

/** PDF download / print / duplicate with loading state and user feedback. */
export function useInvoiceActions() {
  const prefs = useApp((s) => s.prefs)
  const [busy, setBusy] = useState<string | null>(null)

  const downloadPdf = useCallback(async (inv: Invoice) => {
    setBusy(`pdf:${inv.id}`)
    try {
      const { invoiceToPdfBlob } = await import('@/services/pdf/pdf')
      const blob = await invoiceToPdfBlob(inv, prefs)
      if (await saveFile(blob, `Invoice-${inv.number || 'draft'}.pdf`)) toast.success(`Invoice ${inv.number} downloaded.`)
    } catch (e) {
      toast.error(`Could not create the PDF: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }, [prefs])

  const print = useCallback(async (inv: Invoice) => {
    setBusy(`print:${inv.id}`)
    try {
      const { printInvoice } = await import('@/services/printing/print')
      await printInvoice(inv, prefs)
    } catch (e) {
      toast.error(`Could not print: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }, [prefs])

  return { busy, downloadPdf, print }
}

export function duplicateInvoice(inv: Invoice, number: string): Invoice {
  const now = Date.now()
  return {
    ...structuredClone(inv),
    id: uid(),
    number,
    status: 'draft',
    amountPaid: 0,
    issueDate: todayISO(),
    dueDate: (() => {
      const a = parseISO(inv.issueDate), b = parseISO(inv.dueDate)
      if (!b) return ''
      const gap = a ? Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000)) : 0
      return addDays(todayISO(), gap)
    })(),
    items: inv.items.map((i) => ({ ...i, id: uid() })),
    createdAt: now,
    updatedAt: now,
  }
}
