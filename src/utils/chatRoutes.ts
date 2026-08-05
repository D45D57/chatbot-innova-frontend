import type { NavigateFunction } from 'react-router-dom'

export const CHAT_PREVIEW_ROUTE = '/chat-preview/:slug'
export const PUBLIC_CHAT_ROUTE = '/:slug'

const encodeSlug = (slug: string) => encodeURIComponent(slug.trim())

export const getChatPreviewPath = (slug: string) =>
  `/chat-preview/${encodeSlug(slug)}`

export const getPublicChatPath = (slug: string) =>
  `/${encodeSlug(slug)}`

export const getPublicChatUrl = (slug: string, origin: string) =>
  `${origin.replace(/\/+$/, '')}${getPublicChatPath(slug)}`

let previewTrigger: HTMLElement | null = null

export const openChatPreview = (slug: string, navigate: NavigateFunction) => {
  previewTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  navigate(getChatPreviewPath(slug), {
    state: {
      backgroundPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    },
  })
}

export const restoreChatPreviewFocus = () => {
  const trigger = previewTrigger
  previewTrigger = null
  window.requestAnimationFrame(() => trigger?.focus())
}
