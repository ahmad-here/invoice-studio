import { useCallback, useState } from 'react'
import type { Invoice } from '@/types/invoice'
import { toast, useApp } from '@/app/store'
import { isNative, saveFile } from '@/services/files'
import { calculateTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { uid } from '@/lib/sanitize'
import { shiftDueDate, todayISO } from '@/lib/dates'

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

  /** Share the PDF: native/Web Share sheet with the file, else download it and open an email draft. */
  const share = useCallback(async (inv: Invoice) => {
    setBusy(`share:${inv.id}`)
    try {
      const { invoiceToPdfBlob } = await import('@/services/pdf/pdf')
      const blob = await invoiceToPdfBlob(inv, prefs)
      const name = `Invoice-${inv.number || 'draft'}.pdf`
      const total = formatMoney(calculateTotals(inv).balanceDue, inv.currency)
      const text = `Invoice ${inv.number} from ${inv.business.name || 'us'} — ${total} due${inv.dueDate ? ` by ${inv.dueDate}` : ''}.`
      if (isNative()) { await saveFile(blob, name); return }
      const file = new File([blob], name, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${inv.number}`, text }).catch((e) => { if ((e as Error).name !== 'AbortError') throw e })
        return
      }
      await saveFile(blob, name)
      if (inv.customer.email) {
        window.location.href = `mailto:${encodeURIComponent(inv.customer.email)}?subject=${encodeURIComponent(`Invoice ${inv.number}`)}&body=${encodeURIComponent(`${text}\n\nPlease find the invoice attached.`)}`
        toast.info('PDF downloaded — attach it to the email that just opened.')
      } else toast.info('PDF downloaded. Add a customer email to send it by email next time.')
    } catch (e) {
      toast.error(`Could not share: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }, [prefs])

  return { busy, downloadPdf, print, share }
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
    dueDate: shiftDueDate(inv.issueDate, inv.dueDate),
    items: inv.items.map((i) => ({ ...i, id: uid() })),
    createdAt: now,
    updatedAt: now,
  }
}
