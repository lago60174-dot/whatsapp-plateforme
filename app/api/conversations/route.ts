import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const companyId = searchParams.get('company_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('conversations')
    .select(`
      id,
      company_id,
      customer_phone,
      created_at,
      updated_at,
      companies (name),
      messages (id, role, content, created_at)
    `)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
