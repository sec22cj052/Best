import { AlertTriangle, AlertOctagon, ShieldAlert, Clock } from 'lucide-react'

const severityConfig = {
  critical: { color: 'text-rose-400', bg: 'from-rose-500/10 to-rose-600/5', border: 'border-rose-500/30', icon: AlertOctagon },
  high: { color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/30', icon: ShieldAlert },
  medium: { color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/30', icon: AlertTriangle },
  low: { color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/30', icon: AlertTriangle },
}

export default function IncidentPanel({ incidents }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Incident Alerts</h2>
        </div>
        {incidents.length > 0 && (
          <span className="badge badge-danger text-[10px]">{incidents.length} active</span>
        )}
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-8">
          <ShieldAlert className="w-8 h-8 text-dark-600 mx-auto mb-2" />
          <p className="text-xs text-dark-400">No active incidents</p>
          <p className="text-[10px] text-dark-500 mt-1">Incidents trigger when ≥5 similar tickets appear in 30 min</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident, i) => {
            const config = severityConfig[incident.severity] || severityConfig.medium
            const SevIcon = config.icon

            return (
              <div
                key={i}
                className={`p-3 rounded-xl bg-gradient-to-r ${config.bg} border ${config.border} animate-slide-up`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SevIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-xs font-semibold uppercase ${config.color}`}>
                    {incident.severity} severity
                  </span>
                </div>
                <p className="text-xs text-dark-200">
                  <span className="font-medium text-white">{incident.incident_size}</span> similar{' '}
                  <span className="text-blue-400 font-medium">{incident.category}</span> tickets detected
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-dark-400">
                  <Clock className="w-3 h-3" />
                  <span>Window: {incident.time_window_minutes} min</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
