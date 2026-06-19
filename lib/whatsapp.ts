// ============================================================
// MODULE WHATSAPP
// Tout ce qui touche à l'API Meta WhatsApp Cloud
// ============================================================

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

/**
 * Envoie un message texte à un numéro WhatsApp
 * 
 * @param phoneNumberId - L'ID du numéro WhatsApp Business de l'entreprise
 * @param accessToken   - Le token d'accès Meta de l'entreprise
 * @param to            - Le numéro du destinataire (format international: 237XXXXXXXXX)
 * @param message       - Le texte à envoyer
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
  }
}

/**
 * Envoie l'indicateur "en train d'écrire..." 
 * Améliore l'expérience utilisateur pendant que l'IA génère la réponse
 */
export async function sendTypingIndicator(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  })
}
