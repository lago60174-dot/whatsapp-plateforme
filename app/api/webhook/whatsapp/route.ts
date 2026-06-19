// ============================================================
// ROUTE : /api/webhook/whatsapp
// Point d'entrée pour tous les messages WhatsApp
//
// GET  → Vérification du webhook par Meta (à faire une seule fois)
// POST → Réception des messages des clients WhatsApp
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { handleWhatsAppMessage } from '@/lib/webhook-handler'

// ──────────────────────────────────────────────
// GET : Vérification du webhook par Meta
// Meta appelle cette URL lors de la configuration
// et vérifie que tu renvoies le bon "challenge"
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Ton token de vérification est défini dans .env.local
  // Il doit correspondre à ce que tu mets dans le dashboard Meta
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ──────────────────────────────────────────────
// POST : Réception des messages
// Meta envoie ici chaque message WhatsApp reçu
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // On répond immédiatement 200 à Meta
    // (Meta attend une réponse rapide, sinon il renvoie le message)
    // Le traitement réel se fait en arrière-plan
    handleWhatsAppMessage(payload).catch(err =>
      console.error('Webhook handler error:', err)
    )

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook POST error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
