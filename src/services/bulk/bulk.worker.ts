/// <reference lib="webworker" />
import { processFile, type ParseContext } from './parse'

export interface WorkerRequest { name: string; text: string; ctx: ParseContext; mapping?: Record<string, string | null> }

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { name, text, ctx, mapping } = e.data
    self.postMessage({ ok: true, ...processFile(name, text, ctx, mapping) })
  } catch (err) {
    self.postMessage({ ok: false, error: (err as Error).message })
  }
}
