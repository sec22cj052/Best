import { Radio, Cpu, Search, Wrench, Shield, Brain } from 'lucide-react'

const agentIcons = {
  ClassifierAgent: { icon: Cpu, color: 'text-blue-400' },
  RetrievalAgent: { icon: Search, color: 'text-cyan-400' },
  ResolutionAgent: { icon: Wrench, color: 'text-emerald-400' },
  IncidentAgent: { icon: Shield, color: 'text-amber-400' },
  ExplainabilityAgent: { icon: Brain, color: 'text-purple-400' },
}

export default function AgentActivityFeed({ logs }) {
  // Build activity entries from ticket processing logs
  const activities = []
  logs.forEach((log) => {
    activities.push({
      agent: 'ClassifierAgent',
      message: `predicted ${log.classification} (${(log.confidence * 100).toFixed(0)}%)`,
      ticketId: log.ticket_id,
    })
    activities.push({
      agent: 'RetrievalAgent',
      message: `searched vector index`,
      ticketId: log.ticket_id,
    })
    activities.push({
      agent: 'ResolutionAgent',
      message: log.auto_resolved ? 'matched KB entry → auto-resolved' : 'no confident match → needs review',
      ticketId: log.ticket_id,
    })
    if (log.incident) {
      activities.push({
        agent: 'IncidentAgent',
        message: '⚠️ INCIDENT DETECTED',
        ticketId: log.ticket_id,
      })
    } else {
      activities.push({
        agent: 'IncidentAgent',
        message: 'no incident detected',
        ticketId: log.ticket_id,
      })
    }
  })

  // Show latest 30
  const displayed = activities.slice(-30).reverse()

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Agent Activity</h2>
        </div>
        {activities.length > 0 && (
          <span className="text-[10px] text-dark-400">{activities.length} events</span>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-8">
          <Radio className="w-8 h-8 text-dark-600 mx-auto mb-2" />
          <p className="text-xs text-dark-400">No activity yet</p>
          <p className="text-[10px] text-dark-500 mt-1">Run the demo to see agent logs</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
          {displayed.map((act, i) => {
            const config = agentIcons[act.agent] || { icon: Cpu, color: 'text-dark-400' }
            const AgentIcon = config.icon

            return (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-dark-700/20 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <AgentIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="min-w-0">
                  <p className="text-[11px] text-dark-200">
                    <span className={`font-medium ${config.color}`}>{act.agent}</span>
                    {' → '}
                    <span className="text-dark-300">{act.message}</span>
                  </p>
                  <span className="text-[9px] text-dark-500 font-mono">ticket #{act.ticketId}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
