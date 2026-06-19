// ============================================================
// WEBHOOK HANDLER — ORCHESTRATEUR PRINCIPAL
// C'est le cerveau du système.
// Reçoit un message WhatsApp → trouve l'entreprise → RAG → IA → répond
// ============================================================

import { supabase } from './supabase'
import { searchRelevantChunks } from './rag'
import { generateResponse } from './gemini'
import { sendWhatsAppMessage, sendTypingIndicator } from './whatsapp'
import type { WhatsAppWebhookPayload } from '@/types'

export async function handleWhatsAppMessage(
  payload: WhatsAppWebhookPayload
): Promise<void> {
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const { value } = change

      // Ignorer les notifications de statut (delivered, read, sent)
      // Meta envoie ces notifications constamment — on les ignore
      if (!value.messages || value.messages.length === 0) continue

      for (const message of value.messages) {
        // On ne traite que les messages texte pour le MVP
        if (message.type !== 'text' || !message.text?.body) continue

        const phoneNumberId = value.metadata.phone_number_id
        const customerPhone = message.from
        const userMessage = message.text.body

        try {
          // ─── ÉTAPE 1 : Trouver l'entreprise via son phone_number_id ───
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('phone_number_id', phoneNumberId)
            .single()

          if (companyError || !company) {
            console.error(`No company found for phone_number_id: ${phoneNumberId}`)
            continue
          }

          // ─── ÉTAPE 2 : Vérifier si l'abonnement est actif ───
          if (company.status === 'suspended') {
            // Entreprise suspendue → pas de réponse du bot
            console.log(`Company ${company.name} is suspended, skipping message`)
            continue
          }

          // ─── ÉTAPE 3 : Envoyer l'indicateur "en train d'écrire..." ───
          await sendTypingIndicator(
            company.phone_number_id,
            company.whatsapp_access_token,
            message.id
          )

          // ─── ÉTAPE 4 : Trouver ou créer la conversation ───
          let conversation
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', company.id)
            .eq('customer_phone', customerPhone)
            .single()

          if (existingConv) {
            conversation = existingConv
          } else {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({ company_id: company.id, customer_phone: customerPhone })
              .select('id')
              .single()
            conversation = newConv
          }

          // ─── ÉTAPE 5 : Sauvegarder le message de l'utilisateur ───
          await supabase.from('messages').insert({
            conversation_id: conversation.id,
            role: 'user',
            content: userMessage,
          })

          // ─── ÉTAPE 6 : Récupérer l'historique récent (10 derniers messages) ───
          const { data: recentMessages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(10)

          const history = (recentMessages || [])
            .reverse()
            .slice(0, -1) // Exclure le message actuel (déjà dans userMessage)
            .map(msg => ({
              role: msg.role === 'user' ? 'user' as const : 'model' as const,
              parts: [{ text: msg.content }],
            }))

          // ─── ÉTAPE 7 : Recherche RAG dans les documents de l'entreprise ───
          const ragContext = await searchRelevantChunks(company.id, userMessage)

          // ─── ÉTAPE 8 : Générer la réponse avec Gemini ───
          const aiResponse = await generateResponse(
            company.system_prompt,
            ragContext,
            history,
            userMessage
          )

          // ─── ÉTAPE 9 : Envoyer la réponse sur WhatsApp ───
          await sendWhatsAppMessage(
            company.phone_number_id,
            company.whatsapp_access_token,
            customerPhone,
            aiResponse
          )

          // ─── ÉTAPE 10 : Sauvegarder la réponse du bot ───
          await supabase.from('messages').insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: aiResponse,
          })

          // ─── ÉTAPE 11 : Incrémenter le compteur de messages ───
          await supabase
            .from('companies')
            .update({ monthly_message_count: company.monthly_message_count + 1 })
            .eq('id', company.id)

        } catch (error) {
          console.error(`Error processing message for ${phoneNumberId}:`, error)
          // On ne re-throw pas pour éviter que Meta ne renvoie le message en boucle
        }
      }
    }
  }
}
