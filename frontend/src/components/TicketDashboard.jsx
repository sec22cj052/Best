import { BarChart3, CheckCircle2, AlertTriangle, Users, Clock } from 'lucide-react'

const statCards = [
  { key: 'total_tickets', label: 'Total Tickets', icon: BarChart3, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
  { key: 'auto_resolved', label: 'Auto-Resolved', icon: CheckCircle2, color: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
  { key: 'hitl_required', label: 'Human Review', icon: Users, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
  { key: 'incidents_detected', label: 'Incidents', icon: AlertTriangle, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20' },
]

export default function TicketDashboard({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map(({ key, label, icon: Icon, color, shadow }) => (
        <div key={key} className="glass-card p-5 group animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${shadow} group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-dark-400 uppercase tracking-wider font-medium">{label}</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {stats[key] ?? 0}
          </div>
          {key === 'auto_resolved' && stats.total_tickets > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-dark-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000"
                  style={{ width: `${Math.round((stats.auto_resolved / stats.total_tickets) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                {Math.round((stats.auto_resolved / stats.total_tickets) * 100)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
