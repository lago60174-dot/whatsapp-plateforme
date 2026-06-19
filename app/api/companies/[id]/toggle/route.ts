// ============================================================
// ROUTE : /api/companies/[id]/toggle
// POST → Bascule le statut actif/suspendu
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params

    // Récupérer le statut actuel
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Inverser le statut
    const newStatus =
      company.status === 'active'
        ? 'suspended'
        : 'active'

    const { data, error } = await supabase
      .from('companies')
      .update({
        status: newStatus,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Entreprise ${
        newStatus === 'active'
          ? 'activée'
          : 'suspendue'
      } avec succès`,
      status: newStatus,
      company: data,
    })
  } catch (error) {
    console.error('Toggle company status error:', error)

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
