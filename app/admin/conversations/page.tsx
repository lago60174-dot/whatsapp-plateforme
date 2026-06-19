'use client'

import { useEffect, useState } from 'react'
import ConversationView from '@/components/ConversationView'
import type { Conversation } from '@/types'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => {
        setConversations(data)
        if (data.length > 0) setSelected(data[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = conversations.filter(c =>
    c.customer_phone.includes(search) ||
    (c as any).companies?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function formatDate(str: string) {
    const d = new Date(str)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000)    return 'À l\'instant'
    if (diff < 3600000)  return `Il y a ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`
    return d.toLocaleDateString('fr-FR')
  }

  const lastMessage = (conv: Conversation) => {
    const msgs = conv.messages || []
    if (msgs.length === 0) return 'Aucun message'
    const last = msgs[msgs.length - 1]
    return last.content.length > 50 ? last.content.slice(0, 50) + '...' : last.content
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Colonne gauche — liste des conversations */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900 mb-3">Conversations</h1>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0 divide-y divide-gray-100">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-48" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-10">Aucune conversation</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selected?.id === conv.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.customer_phone}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{lastMessage(conv)}</p>
                  {(conv as any).companies?.name && (
                    <p className="text-xs text-green-600 mt-0.5">{(conv as any).companies.name}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colonne droite — conversation sélectionnée */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <ConversationView conversation={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-400">Sélectionne une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
