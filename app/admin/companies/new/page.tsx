'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone_number_id: '',
    whatsapp_access_token: '',
    system_prompt: '',
    subscription_expires_at: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la création')
      setLoading(false)
      return
    }

    router.push(`/admin/companies/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/companies" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          ← Retour aux entreprises
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Nouvelle entreprise</h1>
        <p className="text-sm text-gray-500 mt-1">Ajoute un nouveau client à la plateforme</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Infos de base */}
        <div className="card space-y-4">
          <h2 className="font-medium text-gray-900 text-sm">Informations générales</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ex: Pharmacie du Centre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'expiration de l'abonnement
            </label>
            <input
              name="subscription_expires_at"
              type="date"
              value={form.subscription_expires_at}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Laisse vide si pas encore définie</p>
          </div>
        </div>

        {/* Connexion WhatsApp */}
        <div className="card space-y-4">
          <h2 className="font-medium text-gray-900 text-sm">Connexion WhatsApp</h2>
          <p className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            Ces informations se trouvent dans le dashboard Meta → WhatsApp → Configuration de l'API
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              name="phone_number_id"
              value={form.phone_number_id}
              onChange={handleChange}
              required
              placeholder="Ex: 123456789012345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">L'identifiant unique du numéro WhatsApp Business sur Meta</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              name="whatsapp_access_token"
              value={form.whatsapp_access_token}
              onChange={handleChange}
              required
              type="password"
              placeholder="EAAxxxxxxxxxxxxxxx..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Token d'accès Meta pour envoyer les messages — gardé confidentiel</p>
          </div>
        </div>

        {/* Prompt système */}
        <div className="card space-y-4">
          <h2 className="font-medium text-gray-900 text-sm">Instructions pour l'IA</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt système
            </label>
            <textarea
              name="system_prompt"
              value={form.system_prompt}
              onChange={handleChange}
              rows={5}
              placeholder={`Ex: Tu es l'assistant WhatsApp de la Pharmacie du Centre à Yaoundé. Tu aides les clients à trouver des médicaments, donner les horaires d'ouverture et répondre aux questions sur les services. Sois professionnel et bienveillant. Réponds toujours en français.`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Si vide, un prompt par défaut sera utilisé. Tu pourras modifier ça plus tard.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Création en cours...' : 'Créer l\'entreprise'}
          </button>
          <Link href="/admin/companies" className="btn-ghost">
            Annuler
          </Link>
        </div>

      </form>
    </div>
  )
}
