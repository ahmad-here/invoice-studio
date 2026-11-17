/** Single source for persisted key names. */
export const KV = {
  prefs: 'prefs',
  businesses: 'businesses',
  legacyBusiness: 'business',
  editorDraft: (key: string) => `editorDraft:${key}`,
} as const

export const LS = {
  tourDone: 'invoice-studio:tour-done',
} as const
