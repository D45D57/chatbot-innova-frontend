export type OpenQuoteDocumentResult = 'opened' | 'blocked' | 'invalid'

export function isValidQuoteDocumentUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function openQuoteDocument(url: string): OpenQuoteDocumentResult {
  if (!isValidQuoteDocumentUrl(url)) return 'invalid'
  const opened = window.open(url, '_blank')
  if (!opened) return 'blocked'
  opened.opener = null
  return 'opened'
}

export async function shareQuoteDocument(input: {
  url: string
  businessName: string
  quoteNumber?: string
}): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!navigator.share || !isValidQuoteDocumentUrl(input.url)) return 'unsupported'

  try {
    await navigator.share({
      title: input.quoteNumber ? `Presupuesto ${input.quoteNumber}` : 'Presupuesto',
      text: `Presupuesto de ${input.businessName}`,
      url: input.url,
    })
    return 'shared'
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}
