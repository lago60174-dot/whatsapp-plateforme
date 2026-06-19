// ============================================================
// MODULE RAG (Retrieval-Augmented Generation)
// Recherche les informations pertinentes dans les documents
// de l'entreprise avant de générer une réponse IA
// ============================================================

import { supabase } from './supabase'
import { generateEmbedding } from './gemini'

/**
 * Trouve les chunks de documents les plus pertinents pour une question
 * 
 * Fonctionnement :
 * 1. Convertit la question en vecteur (embedding)
 * 2. Cherche dans pgvector les 5 chunks les plus "proches" (similaires)
 * 3. Retourne le texte de ces chunks pour le donner à Gemini
 * 
 * @param companyId - ID de l'entreprise (on ne cherche que dans SES documents)
 * @param question  - La question posée par le client WhatsApp
 * @param topK      - Nombre de chunks à récupérer (5 par défaut)
 */
export async function searchRelevantChunks(
  companyId: string,
  question: string,
  topK: number = 5
): Promise<string> {
  // Étape 1 : Convertir la question en vecteur
  const questionEmbedding = await generateEmbedding(question)

  // Étape 2 : Recherche vectorielle dans Supabase via pgvector
  // La fonction "match_document_chunks" est définie dans schema.sql
  const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: questionEmbedding,
    match_company_id: companyId,
    match_count: topK,
    match_threshold: 0.7, // Seuil de similarité minimum (0 à 1)
  })

  if (error) {
    console.error('RAG search error:', error)
    return ''
  }

  if (!chunks || chunks.length === 0) {
    return ''
  }

  // Étape 3 : Assembler les chunks en un seul bloc de texte
  return chunks
    .map((chunk: { content: string; similarity: number }, i: number) =>
      `[Source ${i + 1}]\n${chunk.content}`
    )
    .join('\n\n')
}
