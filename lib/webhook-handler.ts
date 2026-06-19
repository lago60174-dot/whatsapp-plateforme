// ============================================================
// WEBHOOK HANDLER — Orchestrateur principal
// ============================================================

import { supabase } from './supabase'
import { searchRelevantChunks } from './rag'
import { generateResponse } from './mistral'
import { sendWhatsAppMessage, sendTypingIndicator } from './whatsapp'
import type { WhatsAppWebhookPayload } from '@/types'

export async function handleWhatsAppMessage(
  payload: WhatsAppWebhookPayload
): Promise<void> {
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const { value } = change

      if (!value.messages || value.messages.length === 0) continue

      for (const message of value.messages) {
        if (message.type !== 'text' || !message.text?.body) continue

        const phoneNumberId = value.metadata.phone_number_id
        const customerPhone = message.from
        const userMessage = message.text.body

        try {
          // ── Étape 1 : Trouver l'entreprise ──
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('phone_number_id', phoneNumberId)
            .single()

          if (companyError || !company) {
            console.error(
              `No company found for phone_number_id: ${phoneNumberId}`
            )
            continue
          }

          // ── Étape 2 : Vérifier statut ──
          if (company.status === 'suspended') {
            console.log(
              `Company ${company.name} is suspended, skipping`
            )
            continue
          }

          // ── Étape 3 : Typing indicator ──
          await sendTypingIndicator(
            company.phone_number_id,
            company.whatsapp_access_token,
            message.id
          )

          // ── Étape 4 : Conversation (SAFE FIX ICI) ──
          let conversationId: string

          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', company.id)
            .eq('customer_phone', customerPhone)
            .single()

          if (existingConv?.id) {
            conversationId = existingConv.id
          } else {
            const { data: newConv, error: createError } =
              await supabase
                .from('conversations')
                .insert({
                  company_id: company.id,
                  customer_phone: customerPhone,
                })
                .select('id')
                .single()

            if (createError || !newConv?.id) {
              console.error('Error creating conversation', createError)
              continue
            }

            conversationId = newConv.id
          }

          // ── Étape 5 : Sauvegarder message user ──
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: userMessage,
          })

          // ── Étape 6 : Historique ──
          const { data: recentMessages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(10)

          const history = (recentMessages || [])
            .reverse()
            .slice(0, -1)
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }))

          // ── Étape 7 : RAG ──
          const ragContext = await searchRelevantChunks(
            company.id,
            userMessage
          )

          // ── Étape 8 : IA Mistral ──
          const aiResponse = await generateResponse(
            company.system_prompt,
            ragContext,
            history,
            userMessage
          )

          // ── Étape 9 : WhatsApp response ──
          await sendWhatsAppMessage(
            company.phone_number_id,
            company.whatsapp_access_token,
            customerPhone,
            aiResponse
          )

          // ── Étape 10 : Save assistant message ──
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse,
          })

          // ── Étape 11 : compteur ──
          await supabase
            .from('companies')
            .update({
              monthly_message_count:
                company.monthly_message_count + 1,
            })
            .eq('id', company.id)
        } catch (error) {
          console.error(
            `Error processing message for ${phoneNumberId}:`,
            error
          )
        }
      }
    }
  }
}
