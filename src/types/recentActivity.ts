export type RecentActivityType =
  | 'consultation_created'
  | 'consultation_bot_resolved'
  | 'quote_pending'
  | 'quote_in_progress'
  | 'quote_sent'
  | 'quote_completed'
  | 'quote_rejected'

export interface RecentActivityItem {
  id: string
  type: RecentActivityType
  title: string
  description?: string
  createdAt: string
  source: 'consultation' | 'quote'
  entityId: string
  targetPath: string
}

export type RecentActivityStatus = 'loading' | 'success' | 'partial' | 'error'

export interface RecentActivityData {
  items: RecentActivityItem[]
  status: RecentActivityStatus
}
