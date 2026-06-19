// ============================================================
// TYPES PRINCIPAUX DU PROJET
// Ce fichier définit la "forme" de chaque objet dans l'app
// ============================================================

// Une entreprise cliente
export type Company = {
  id: string
  name: string
  phone_number_id: string        // L'ID Meta du numéro WhatsApp Business
  whatsapp_access_token: string  // Le token d'accès Meta (stocké chiffré)
  status: 'active' | 'suspended'
  system_prompt: string          // Les instructions données à l'IA pour cette entreprise
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

// Un chunk de document (fragment de texte avec embedding)
export type DocumentChunk = {
  id: string
  document_id: string
  company_id: string
  content: string       // Le texte du fragment
  chunk_index: number
  embedding: number[]   // Le vecteur (768 dimensions)
}

// Une conversation entre un client et le bot
export type Conversation = {
  id: string
  company_id: string
  customer_phone: string
  created_at: string
  updated_at: string
  messages?: Message[]
}

// Un message dans une conversation
export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// La structure d'un webhook envoyé par Meta WhatsApp
export type WhatsAppWebhookPayload = {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string  // C'est ça qu'on utilise pour identifier l'entreprise
        }
        messages?: Array<{
          id: string
          from: string             // Numéro du client qui envoie le message
          timestamp: string
          type: string
          text?: { body: string }
        }>
        statuses?: Array<{         // Notifications de statut (delivered, read) — à ignorer
          id: string
          status: string
        }>
      }
      field: string
    }>
  }>
}
