// ============================================================
// ROUTE : /api/companies/[id]/toggle
// POST → Bascule le statut actif/suspendu
// C'est le bouton "couper le chatbot" en cas de non-paiement
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Récupérer le statut actuel
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('status')
    .eq('id', params.id)
    .single()

  if (fetchError || !company) {
    return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
  }

  // Inverser le statut
  const newStatus = company.status === 'active' ? 'suspended' : 'active'

  const { data, error } = await supabase
    .from('companies')
    .update({ status: newStatus })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    message: `Entreprise ${newStatus === 'active' ? 'activée' : 'suspendue'} avec succès`,
    status: newStatus,
    company: data,
  })
}
