'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CompanyCard from '@/components/CompanyCard'
import type { Company } from '@/types'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => setCompanies(data))
      .finally(() => setLoading(false))
  }, [])

  function handleToggle(id: string, newStatus: 'active' | 'suspended') {
    setCompanies(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
    )
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const active    = companies.filter(c => c.status === 'active').length
  const suspended = companies.filter(c => c.status === 'suspended').length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Entreprises</h1>
          <p className="text-sm text-gray-500 mt-1">
            {active} actives · {suspended} suspendues
          </p>
        </div>
        <Link href="/admin/companies/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle entreprise
        </Link>
      </div>

      {/* Recherche */}
      <div className="relative mb-5">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher une entreprise..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {search ? 'Aucune entreprise trouvée' : 'Aucune entreprise pour le moment'}
          </p>
          {!search && (
            <Link href="/admin/companies/new" className="btn-primary mt-4 inline-flex">
              Ajouter la première entreprise
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
