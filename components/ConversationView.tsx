import type { Conversation } from '@/types'

type ConversationViewProps = {
  conversation: Conversation
}

export default function ConversationView({ conversation }: ConversationViewProps) {
  const messages = conversation.messages || []

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header conversation */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{conversation.customer_phone}</p>
            <p className="text-xs text-gray-400">
              {messages.length} messages · Dernière activité le {new Date(conversation.updated_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ece5dd] min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-8">Aucun message</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-white text-gray-800 rounded-tl-none'
                    : 'bg-green-100 text-gray-800 rounded-tr-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-green-700'}`}>
                  {formatTime(msg.created_at)}
                  {msg.role === 'assistant' && (
                    <span className="ml-1">· IA</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
