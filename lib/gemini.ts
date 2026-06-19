// ============================================================
// MODULE GEMINI
// Interface avec l'API Google Gemini 2.5 Flash
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Génère une réponse IA en utilisant le contexte RAG de l'entreprise
 * 
 * @param systemPrompt   - Les instructions spécifiques à l'entreprise
 * @param ragContext     - Les extraits de documents pertinents trouvés par la recherche vectorielle
 * @param conversationHistory - Les derniers messages de la conversation (pour le contexte)
 * @param userMessage    - Le message actuel de l'utilisateur
 */
export async function generateResponse(
  systemPrompt: string,
  ragContext: string,
  conversationHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  userMessage: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `${systemPrompt}

---
INFORMATIONS DISPONIBLES (extraites de la base de connaissances) :
${ragContext || 'Aucune information spécifique trouvée pour cette question.'}
---

IMPORTANT : Réponds uniquement en te basant sur les informations ci-dessus.
Si tu ne trouves pas la réponse, dis-le poliment et propose à l'utilisateur de contacter directement l'entreprise.
Sois concis — tu réponds sur WhatsApp, donc évite les longs paragraphes.`,
  })

  const chat = model.startChat({ history: conversationHistory })
  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

/**
 * Génère l'embedding (vecteur numérique) d'un texte
 * Utilisé pour le RAG : convertit une question en vecteur pour la recherche
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding.values
}
