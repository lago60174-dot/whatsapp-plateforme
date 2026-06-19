import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      documents(
        id,
        file_name,
        file_size,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params

  const body = await request.json()

  const {
    name,
    system_prompt,
    whatsapp_access_token,
    subscription_expires_at,
  } = body

  const { data, error } = await supabase
    .from('companies')
    .update({
      name,
      system_prompt,
      whatsapp_access_token,
      subscription_expires_at,
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

  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params

  // Suppression entreprise (CASCADE SQL)
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
