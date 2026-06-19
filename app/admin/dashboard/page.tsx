import { supabase } from '@/lib/supabase'
import StatsCard from '@/components/StatsCard'
import Link from 'next/link'

async function getStats() {
  const [companiesRes, messagesRes, conversationsRes] = await Promise.all([
    supabase.from('companies').select('id, status'),
    supabase.from('messages').select('id, created_at').eq('role', 'user'),
    supabase.from('conversations').select('id').order('created_at', { ascending: false }).limit(5),
  ])

  const companies = companiesRes.data || []
  const messages  = messagesRes.data  || []

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const messagesThisMonth = messages.filter(m => m.created_at >= startOfMonth)

  return {
    totalCompanies:  companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    suspended:       companies.filter(c => c.status === 'suspended').length,
    totalMessages:   messages.length,
    messagesMonth:   messagesThisMonth.length,
  }
}

async function getRecentCompanies() {
  const { data } = await supabase
    .from('companies')
    .select('id, name, status, monthly_message_count, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

export default async function DashboardPage() {
  const [stats, recentCompanies] = await Promise.all([getStats(), getRecentCompanies()])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Entreprises actives"
          value={stats.activeCompanies}
          sub={`${stats.totalCompanies} au total`}
          color="green"
        />
        <StatsCard
          label="Messages ce mois"
          value={stats.messagesMonth}
          sub={`${stats.totalMessages} depuis le début`}
          color="blue"
        />
        <StatsCard
          label="Suspendues"
          value={stats.suspended}
          sub="En attente de paiement"
          color="amber"
        />
        <StatsCard
          label="Revenu estimé"
          value={`${(stats.activeCompanies * 50000).toLocaleString('fr-FR')} FCFA`}
          sub="Base 50 000/mois"
          color="green"
        />
      </div>

      {/* Entreprises récentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Entreprises récentes</h2>
          <Link href="/admin/companies" className="text-sm text-green-600 hover:text-green-700 font-medium">
            Voir tout →
          </Link>
        </div>

        {recentCompanies.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Aucune entreprise pour le moment</p>
            <Link href="/admin/companies/new" className="btn-primary mt-4 inline-flex">
              Ajouter la première
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentCompanies.map(company => (
              <div key={company.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                    <p className="text-xs text-gray-400">{company.monthly_message_count} messages ce mois</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={company.status === 'active' ? 'badge-active' : 'badge-suspended'}>
                    {company.status === 'active' ? 'Actif' : 'Suspendu'}
                  </span>
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Gérer →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
