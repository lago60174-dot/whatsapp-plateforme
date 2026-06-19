'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DocumentUpload from '@/components/DocumentUpload'
import type { Company, Document } from '@/types'

type Tab = 'infos' | 'documents' | 'prompt'

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [company, setCompany]     = useState<Company | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<Tab>('infos')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  const [form, setForm] = useState({
    name: '',
    system_prompt: '',
    subscription_expires_at: '',
    whatsapp_access_token: '',
  })

  useEffect(() => {
    fetch(`/api/companies/${id}`)
      .then(r => r.json())
      .then(data => {
        setCompany(data)
        setDocuments(data.documents || [])
        setForm({
          name: data.name || '',
          system_prompt: data.system_prompt || '',
          subscription_expires_at: data.subscription_expires_at
            ? data.subscription_expires_at.split('T')[0]
            : '',
          whatsapp_access_token: data.whatsapp_access_token || '',
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function handleToggle() {
    const res = await fetch(`/api/companies/${id}/toggle`, { method: 'POST' })
    const data = await res.json()
    setCompany(prev => prev ? { ...prev, status: data.status } : prev)
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${company?.name}" ? Cette action est irréversible.`)) return
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    router.push('/admin/companies')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="card h-40 mt-6" />
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Entreprise introuvable</p>
        <Link href="/admin/companies" className="btn-primary mt-4 inline-flex">Retour</Link>
      </div>
    )
  }

  const isActive = company.status === 'active'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'infos',     label: 'Informations' },
    { key: 'documents', label: `Documents (${documents.length})` },
    { key: 'prompt',    label: 'Prompt IA' },
  ]

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/companies" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          ← Retour aux entreprises
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{company.name}</h1>
              <span className={isActive ? 'badge-active' : 'badge-suspended'}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                {isActive ? 'Actif' : 'Suspendu'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-mono">
              Phone Number ID : {company.phone_number_id}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggle}
              className={isActive ? 'btn-danger' : 'btn-primary'}
            >
              {isActive ? 'Suspendre' : 'Activer'}
            </button>
            <button onClick={handleDelete} className="btn-ghost text-red-500 hover:bg-red-50">
              Supprimer
            </button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="flex gap-4 mt-4">
          <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">{company.monthly_message_count}</p>
            <p className="text-xs text-gray-400">Messages ce mois</p>
          </div>
          {company.subscription_expires_at && (
            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900">
                {new Date(company.subscription_expires_at).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-xs text-gray-400">Expiration abonnement</p>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-green-500 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Onglet : Informations */}
      {tab === 'infos' && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token WhatsApp
            </label>
            <input
              type="password"
              value={form.whatsapp_access_token}
              onChange={e => setForm(p => ({ ...p, whatsapp_access_token: e.target.value }))}
              placeholder="Laisse vide pour ne pas modifier"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'expiration de l'abonnement
            </label>
            <input
              type="date"
              value={form.subscription_expires_at}
              onChange={e => setForm(p => ({ ...p, subscription_expires_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement...' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Onglet : Documents */}
      {tab === 'documents' && (
        <div className="card">
          <div className="mb-4">
            <h2 className="font-medium text-gray-900 text-sm">Base de connaissances</h2>
            <p className="text-xs text-gray-400 mt-1">
              Upload les PDFs de cette entreprise : catalogue, FAQ, horaires, tarifs...
              L'IA s'en servira pour répondre aux clients.
            </p>
          </div>
          <DocumentUpload
            companyId={id}
            documents={documents}
            onUpload={doc => setDocuments(prev => [doc, ...prev])}
          />
        </div>
      )}

      {/* Onglet : Prompt IA */}
      {tab === 'prompt' && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-medium text-gray-900 text-sm">Instructions de l'IA</h2>
            <p className="text-xs text-gray-400 mt-1">
              Définis le comportement du chatbot pour cette entreprise : ton, langue, limites, spécialité...
            </p>
          </div>
          <textarea
            value={form.system_prompt}
            onChange={e => setForm(p => ({ ...p, system_prompt: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
            placeholder="Tu es l'assistant WhatsApp de..."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{form.system_prompt.length} caractères</p>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : saved ? '✓ Enregistré' : 'Enregistrer le prompt'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
