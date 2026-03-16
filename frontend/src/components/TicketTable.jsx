import { useState } from 'react'
import { FileText, CheckCircle, Clock, AlertTriangle, ChevronRight, UserCheck } from 'lucide-react'

const categoryColors = {
  login: 'badge-info',
  network: 'badge-purple',
  database: 'badge-warning',
  hardware: 'badge-danger',
  billing: 'badge-success',
  access: 'badge-info',
  software: 'badge-purple',
  email: 'badge-warning',
}

export default function TicketTable({ tickets, onSelect, onApprove, selectedId }) {
  const [approveModal, setApproveModal] = useState(null)
  const [correctCat, setCorrectCat] = useState('')
  const [humanRes, setHumanRes] = useState('')

  const handleApprove = (ticketId) => {
    onApprove(ticketId, correctCat || null, humanRes || null)
    setApproveModal(null)
    setCorrectCat('')
    setHumanRes('')
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Processed Tickets</h2>
        </div>
        <span className="text-xs text-dark-400">{tickets.length} tickets</span>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No tickets processed yet</p>
          <p className="text-xs text-dark-500 mt-1">Click "Run AI Demo" to generate test tickets</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {tickets.map((ticket) => (
            <div
              key={ticket.ticket_id}
              onClick={() => onSelect(ticket.ticket_id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-dark-700/30 ${
                selectedId === ticket.ticket_id
                  ? 'bg-blue-500/5 border-blue-500/30'
                  : 'bg-dark-800/30 border-dark-700/20 hover:border-dark-600/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] text-dark-500 font-mono">#{ticket.ticket_id}</span>
                    <span className={`badge ${categoryColors[ticket.classification] || 'badge-info'} text-[10px]`}>
                      {ticket.classification}
                    </span>
                    {ticket.auto_resolved ? (
                      <span className="badge badge-success text-[10px]">
                        <CheckCircle className="w-3 h-3" /> Auto
                      </span>
                    ) : (
                      <span className="badge badge-warning text-[10px]">
                        <Clock className="w-3 h-3" /> Review
                      </span>
                    )}
                    {ticket.incident_alert?.incident_detected && (
                      <span className="badge badge-danger text-[10px]">
                        <AlertTriangle className="w-3 h-3" /> Incident
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-200 leading-relaxed">{ticket.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-dark-400">
                      Confidence: <span className={`font-medium ${ticket.confidence >= 0.7 ? 'text-emerald-400' : ticket.confidence >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {(ticket.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span className="text-[10px] text-dark-500">{ticket.total_pipeline_time_ms}ms</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {ticket.status === 'pending_review' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setApproveModal(ticket) }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Approve / Correct"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-dark-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setApproveModal(null)}>
          <div className="glass-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white mb-1">Approve Ticket #{approveModal.ticket_id}</h3>
            <p className="text-xs text-dark-400 mb-4">Predicted: <span className="text-blue-400">{approveModal.classification}</span> ({(approveModal.confidence * 100).toFixed(0)}% confidence)</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-300 font-medium">Correct Category (leave blank if prediction is correct)</label>
                <select
                  value={correctCat}
                  onChange={(e) => setCorrectCat(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600/50 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">— Prediction is correct —</option>
                  {['login', 'network', 'database', 'hardware', 'billing', 'access', 'software', 'email'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-300 font-medium">Resolution Notes (optional)</label>
                <textarea
                  value={humanRes}
                  onChange={(e) => setHumanRes(e.target.value)}
                  placeholder="Describe the resolution..."
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600/50 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-blue-500/50 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleApprove(approveModal.ticket_id)}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium hover:from-emerald-500 hover:to-green-500 transition-all"
              >
                Approve & Save Feedback
              </button>
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 rounded-lg bg-dark-700 text-dark-300 text-sm hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
