// ============================================================
// ROUTE : /api/companies
// GET  → Liste toutes les entreprises
// POST → Crée une nouvelle entreprise
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, phone_number_id, status, subscription_expires_at, monthly_message_count, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, phone_number_id, whatsapp_access_token, system_prompt } = body

  if (!name || !phone_number_id || !whatsapp_access_token) {
    return NextResponse.json(
      { error: 'Champs requis : name, phone_number_id, whatsapp_access_token' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name,
      phone_number_id,
      whatsapp_access_token,
      system_prompt: system_prompt || `Tu es l'assistant IA de ${name}. Réponds aux questions des clients de manière professionnelle et courtoise.`,
      status: 'active',
      monthly_message_count: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
