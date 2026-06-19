// ============================================================
// ROUTE : /api/companies/[id]/documents
// POST → Upload d'un PDF + traitement RAG complet
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processAndStorePDF } from '@/lib/pdf-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 })
    }

    // Vérifier que l'entreprise existe
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
    }

    // Créer l'entrée du document en base
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        company_id: params.id,
        file_name: file.name,
        file_size: file.size,
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // Convertir le fichier en Buffer pour le traitement
    const buffer = Buffer.from(await file.arrayBuffer())

    // Lancer le traitement PDF (extraction + chunking + embeddings)
    const result = await processAndStorePDF(
      buffer,
      file.name,
      params.id,
      document.id
    )

    return NextResponse.json({
      message: 'Document traité avec succès',
      document,
      chunksCreated: result.chunksCreated,
    }, { status: 201 })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du document' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, file_name, file_size, created_at')
    .eq('company_id', params.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
