// ============================================================
// MODULE MISTRAL AI
// Remplace Gemini — utilise Mistral pour les réponses et les embeddings
// Modèle chat     : mistral-large-latest (le plus puissant)
// Modèle embedding: mistral-embed
// ============================================================

import { Mistral } from '@mistralai/mistralai'

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
})

/**
 * Génère une réponse IA avec le contexte RAG de l'entreprise
 */
export async function generateResponse(
  systemPrompt: string,
  ragContext: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): Promise<string> {
  const systemMessage = `${systemPrompt}

---
INFORMATIONS DISPONIBLES (extraites de la base de connaissances) :
${ragContext || 'Aucune information spécifique trouvée pour cette question.'}
---

IMPORTANT : Réponds uniquement en te basant sur les informations ci-dessus.
Si tu ne trouves pas la réponse, dis-le poliment et propose à l'utilisateur de contacter directement l'entreprise.
Sois concis — tu réponds sur WhatsApp, donc évite les longs paragraphes.`

  const messages = [
    { role: 'system' as const, content: systemMessage },
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ]

  const result = await client.chat.complete({
    model: 'mistral-large-latest',
    messages,
    maxTokens: 1024,
    temperature: 0.3,
  })

  return result.choices?.[0]?.message?.content as string ?? ''
}

/**
 * Génère l'embedding d'un texte via mistral-embed
 * Dimension : 1024 (à adapter dans schema.sql)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await client.embeddings.create({
    model: 'mistral-embed',
    inputs: [text],
  })

  return result.data[0].embedding
}
