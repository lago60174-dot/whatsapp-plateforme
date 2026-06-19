// ============================================================
// MODULE PDF PROCESSOR
// Extraction, chunking et embeddings via mistral-embed
// ============================================================

import { supabase } from './supabase'
import { generateEmbedding } from './mistral'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) {
      chunks.push(chunk)
    }
  }

  return chunks
}

export async function processAndStorePDF(
  file: Buffer,
  fileName: string,
  companyId: string,
  documentId: string
): Promise<{ chunksCreated: number }> {
  const pdfParse = (await import('pdf-parse')).default
  const pdfData = await pdfParse(file)

  const cleanedText = pdfData.text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const chunks = chunkText(cleanedText, CHUNK_SIZE, CHUNK_OVERLAP)
  const chunksToInsert = []

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i])
    chunksToInsert.push({
      document_id: documentId,
      company_id: companyId,
      content: chunks[i],
      chunk_index: i,
      embedding,
    })

    // Pause tous les 10 chunks pour respecter les rate limits Mistral
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const { error } = await supabase
    .from('document_chunks')
    .insert(chunksToInsert)

  if (error) throw new Error(`Failed to store chunks: ${error.message}`)

  return { chunksCreated: chunks.length }
}
