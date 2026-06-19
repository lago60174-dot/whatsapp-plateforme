// ============================================================
// MODULE PDF PROCESSOR
// Extrait le texte d'un PDF, le découpe, et génère les embeddings
// Appelé lors de l'upload d'un document dans le dashboard
// ============================================================

import { supabase } from './supabase'
import { generateEmbedding } from './gemini'

const CHUNK_SIZE = 500      // Taille d'un fragment en tokens (~400 mots)
const CHUNK_OVERLAP = 50    // Chevauchement entre fragments (pour ne pas couper les idées)

/**
 * Découpe un texte en fragments avec chevauchement
 * Exemple : "ABCDE" avec size=3 overlap=1 → ["ABC", "CDE"]
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) { // Ignorer les chunks trop courts
      chunks.push(chunk)
    }
  }

  return chunks
}

/**
 * Traite un PDF complet :
 * 1. Extrait le texte (via pdf-parse)
 * 2. Découpe en chunks
 * 3. Génère les embeddings pour chaque chunk
 * 4. Stocke tout dans Supabase
 * 
 * @param file      - Le fichier PDF (Buffer)
 * @param fileName  - Nom du fichier
 * @param companyId - ID de l'entreprise propriétaire
 * @param documentId - ID du document créé en base
 */
export async function processAndStorePDF(
  file: Buffer,
  fileName: string,
  companyId: string,
  documentId: string
): Promise<{ chunksCreated: number }> {
  // Extraction du texte
  // Note : installe pdf-parse avec "npm install pdf-parse"
  const pdfParse = (await import('pdf-parse')).default
  const pdfData = await pdfParse(file)
  const rawText = pdfData.text

  // Nettoyage du texte
  const cleanedText = rawText
    .replace(/\n{3,}/g, '\n\n')  // Supprimer les sauts de ligne excessifs
    .replace(/\s{2,}/g, ' ')      // Supprimer les espaces multiples
    .trim()

  // Découpage en chunks
  const chunks = chunkText(cleanedText, CHUNK_SIZE, CHUNK_OVERLAP)

  // Génération des embeddings et stockage en batch
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

    // Petite pause pour éviter les rate limits de l'API Gemini
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Insertion en base de données
  const { error } = await supabase
    .from('document_chunks')
    .insert(chunksToInsert)

  if (error) throw new Error(`Failed to store chunks: ${error.message}`)

  return { chunksCreated: chunks.length }
}
