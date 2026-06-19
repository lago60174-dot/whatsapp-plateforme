// ============================================================
// MODULE RAG — Recherche vectorielle dans les documents
// Utilise maintenant mistral-embed au lieu de Gemini
// ============================================================

import { supabase } from './supabase'
import { generateEmbedding } from './mistral'

export async function searchRelevantChunks(
  companyId: string,
  question: string,
  topK: number = 5
): Promise<string> {
  const questionEmbedding = await generateEmbedding(question)

  const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: questionEmbedding,
    match_company_id: companyId,
    match_count: topK,
    match_threshold: 0.7,
  })

  if (error) {
    console.error('RAG search error:', error)
    return ''
  }

  if (!chunks || chunks.length === 0) return ''

  return chunks
    .map((chunk: { content: string; similarity: number }, i: number) =>
      `[Source ${i + 1}]\n${chunk.content}`
    )
    .join('\n\n')
}
