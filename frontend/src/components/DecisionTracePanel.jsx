import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export default function DecisionTracePanel({ ticket }) {
  const [expanded, setExpanded] = useState({})

  if (!ticket?.decision_trace) return null

  const trace = ticket.decision_trace
  const dt = trace.decision_trace || {}
  const summary = trace.summary || ''

  const steps = [
    { key: 'classification', title: 'Classification', icon: '🏷️' },
    { key: 'semantic_search', title: 'Semantic Search', icon: '🔍' },
    { key: 'resolution', title: 'Resolution', icon: '🔧' },
    { key: 'incident_detection', title: 'Incident Detection', icon: '🛡️' },
    { key: 'final_decision', title: 'Final Decision', icon: '⚡' },
  ]

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Decision Trace — Ticket #{ticket.ticket_id}</h2>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/5 to-amber-600/5 border border-amber-500/10 mb-4">
        <p className="text-xs text-dark-200 leading-relaxed">{summary}</p>
      </div>

      {/* Trace Steps */}
      <div className="space-y-2">
        {steps.map(({ key, title, icon }) => {
          const step = dt[key]
          if (!step) return null
          const isOpen = expanded[key]

          return (
            <div key={key} className="rounded-xl bg-dark-800/40 border border-dark-700/20 overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 p-3 hover:bg-dark-700/20 transition-colors text-left"
              >
                <span className="text-sm">{icon}</span>
                <span className="text-xs font-semibold text-white flex-1">{step.step || title}</span>
                <span className="text-[10px] text-dark-400 font-mono">{step.agent}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-dark-400" /> : <ChevronRight className="w-3.5 h-3.5 text-dark-400" />}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-dark-700/20 animate-fade-in">
                  <p className="text-xs text-dark-300 leading-relaxed mb-2">{step.reasoning}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {step.method && (
                      <div className="text-dark-400">Method: <span className="text-dark-200">{step.method}</span></div>
                    )}
                    {step.predicted_category && (
                      <div className="text-dark-400">Category: <span className="text-blue-400 font-medium">{step.predicted_category}</span></div>
                    )}
                    {step.confidence !== undefined && (
                      <div className="text-dark-400">Confidence: <span className={`font-medium ${step.confidence >= 0.7 ? 'text-emerald-400' : step.confidence >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {(step.confidence * 100).toFixed(1)}%
                      </span></div>
                    )}
                    {step.matches_found !== undefined && (
                      <div className="text-dark-400">Matches: <span className="text-cyan-400">{step.matches_found}</span></div>
                    )}
                    {step.action && (
                      <div className="text-dark-400">Action: <span className={`font-medium ${step.action === 'auto_resolve' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {step.action === 'auto_resolve' ? '✓ Auto-resolve' : '⏳ Human review'}
                      </span></div>
                    )}
                    {step.incident_detected !== undefined && (
                      <div className="text-dark-400">Incident: {step.incident_detected ?
                        <span className="text-rose-400 font-medium">⚠ Detected ({step.severity})</span> :
                        <span className="text-emerald-400">None</span>}
                      </div>
                    )}
                  </div>
                  {step.top_alternatives && step.top_alternatives.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[10px] text-dark-400">Alternatives:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step.top_alternatives.map((alt, i) => (
                          <span key={i} className="badge badge-info text-[10px] py-0">
                            {alt.label} {(alt.score * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
