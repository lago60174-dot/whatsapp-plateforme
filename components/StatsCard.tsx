type StatsCardProps = {
  label: string
  value: string | number
  sub?: string
  color?: 'green' | 'blue' | 'amber' | 'gray'
}

const colorMap = {
  green: 'bg-green-50 text-green-700',
  blue:  'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  gray:  'bg-gray-50 text-gray-600',
}

export default function StatsCard({ label, value, sub, color = 'gray' }: StatsCardProps) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colorMap[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
