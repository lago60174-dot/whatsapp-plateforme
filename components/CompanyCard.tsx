'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Company } from '@/types'

type CompanyCardProps = {
  company: Company
  onToggle: (id: string, newStatus: 'active' | 'suspended') => void
}

export default function CompanyCard({ company, onToggle }: CompanyCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/companies/${company.id}/toggle`, { method: 'POST' })
      const data = await res.json()
      onToggle(company.id, data.status)
    } finally {
      setLoading(false)
    }
  }

  const isActive = company.status === 'active'

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600 font-semibold text-sm">
          {company.name.charAt(0).toUpperCase()}
        </div>

        {/* Infos */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 text-sm truncate">{company.name}</p>
            <span className={isActive ? 'badge-active' : 'badge-suspended'}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
              {isActive ? 'Actif' : 'Suspendu'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
            ID: {company.phone_number_id}
          </p>
          <p className="text-xs text-gray-400">
            {company.monthly_message_count} messages ce mois
            {company.subscription_expires_at && (
              <> · Expire le {new Date(company.subscription_expires_at).toLocaleDateString('fr-FR')}</>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href={`/admin/companies/${company.id}`} className="btn-ghost text-xs">
          Gérer
        </Link>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={isActive ? 'btn-danger text-xs' : 'btn-primary text-xs'}
        >
          {loading ? '...' : isActive ? 'Suspendre' : 'Activer'}
        </button>
      </div>
    </div>
  )
}
