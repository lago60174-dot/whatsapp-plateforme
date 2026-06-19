// ============================================================
// TYPES PRINCIPAUX DU PROJET
// ============================================================

// Une entreprise cliente
export type Company = {
  id: string
  name: string
  phone_number_id: string
  whatsapp_access_token: string
  status: 'active' | 'suspended'
  system_prompt: string
  subscription_expires_at: string | null
  monthly_message_count: number
  created_at: string
}

// Un document PDF uploadé
export type Document = {
  id: string
  company_id: string
  file_name: string
  file_size: number
  created_at: string
}

// Chunk de document (RAG)
export type DocumentChunk = {
  id: string
  document_id: string
  company_id: string
  content: string
  chunk_index: number
  embedding: number[]
}

// Message d'une conversation
export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Conversation WhatsApp (✔ FIX IMPORTANT ICI)
export type Conversation = {
  id: string
  company_id: string
  customer_phone: string
  created_at: string
  updated_at: string

  // 🔥 FIX: ajouté pour correspondre à Supabase join
  companies?: {
    name: string
  }

  messages?: Message[]
}

// Webhook WhatsApp Meta
export type WhatsAppWebhookPayload = {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: Array<{
          id: string
          from: string
          timestamp: string
          type: string
          text?: {
            body: string
          }
        }>
        statuses?: Array<{
          id: string
          status: string
        }>
      }
      field: string
    }>
  }>
}
