import { Bot, ChevronDown, Cpu, Search, Wrench, Shield, Brain } from 'lucide-react'

const agents = [
  { name: 'Classifier Agent', icon: Cpu, key: 'classifier', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20' },
  { name: 'Retrieval Agent', icon: Search, key: 'retrieval', color: 'text-cyan-400', bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20' },
  { name: 'Resolution Agent', icon: Wrench, key: 'resolution', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20' },
  { name: 'Incident Agent', icon: Shield, key: 'incident', color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20' },
  { name: 'Explainability Agent', icon: Brain, key: 'explainability', color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20' },
]

export default function AgentPipeline({ selectedTicket }) {
  const agentResults = selectedTicket?.agent_results || null

  const getAgentData = (key) => {
    if (!agentResults || !agentResults[key]) return null
    return agentResults[key]
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Agent Pipeline</h2>
      </div>

      {/* Ticket Input Node */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-dark-700/80 to-dark-700/40 border border-dark-600/30 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white">Ticket Input</p>
          {selectedTicket && (
            <p className="text-[11px] text-dark-300 truncate">{selectedTicket.text?.substring(0, 60)}...</p>
          )}
        </div>
      </div>

      {/* Pipeline Flow */}
      {agents.map((agent, i) => {
        const data = getAgentData(agent.key)
        const isActive = !!data

        return (
          <div key={agent.key}>
            {/* Connector */}
            <div className="pipeline-connector" />

            {/* Agent Card */}
            <div className={`relative p-3 rounded-xl bg-gradient-to-r ${agent.bg} border ${isActive ? agent.border : 'border-dark-700/30'} transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-dark-800/80 flex items-center justify-center flex-shrink-0 ${isActive ? 'pulse-glow' : ''}`}>
                  <agent.icon className={`w-4 h-4 ${agent.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{agent.name}</p>
                  {isActive && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-dark-300">{data.execution_time_ms}ms</span>
                      {data.confidence !== undefined && (
                        <span className={`text-[10px] font-medium ${data.confidence >= 0.7 ? 'text-emerald-400' : data.confidence >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {(data.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {data.category && (
                        <span className="badge badge-info text-[10px] py-0">{data.category}</span>
                      )}
                    </div>
                  )}
                </div>
                {isActive && (
                  <span className="badge badge-success text-[10px] py-0.5">✓</span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Final Output */}
      <div className="pipeline-connector" />
      <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedTicket ? 'from-emerald-500/10 to-green-600/5 border-emerald-500/20' : 'from-dark-700/40 to-dark-700/20 border-dark-700/30'} border transition-all`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-dark-800/80 flex items-center justify-center flex-shrink-0">
            <ChevronDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Final Response</p>
            {selectedTicket && (
              <p className="text-[10px] text-dark-300">
                {selectedTicket.total_pipeline_time_ms}ms total
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
