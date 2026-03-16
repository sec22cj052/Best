import { useState } from 'react'
import { AlertCircle, Clock, Search, Send, User, Bot, CheckCircle, Flame, ShieldCheck } from 'lucide-react'

export default function AdminDashboard({ tickets, refresh }) {
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [search, setSearch] = useState('')
  const [hitlResolution, setHitlResolution] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedTicket = tickets.find(t => t.ticket_id === selectedTicketId)
  
  const filteredTickets = tickets.filter(t => 
    t.text.toLowerCase().includes(search.toLowerCase()) ||
    t.ticket_id.toString().includes(search)
  )

  const handleHitlResolve = async () => {
    if (!hitlResolution.trim() || submitting || !selectedTicketId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/hitl-resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_by_step_resolution: hitlResolution, created_by: 'human_admin' })
      })
      if (res.ok) {
        setHitlResolution('')
        setSelectedTicketId(null)
        await refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'Critical') return <Flame className="w-4 h-4 text-red-500" />
    if (urgency === 'High') return <AlertCircle className="w-4 h-4 text-amber-500" />
    if (urgency === 'Medium') return <Clock className="w-4 h-4 text-blue-500" />
    return <CheckCircle className="w-4 h-4 text-slate-400" />
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Operations</h2>
          <p className="text-slate-500 mt-1">Manage ticket queue, override AI, and provide Step-by-Step Training.</p>
        </div>
        <div className="relative w-80">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Ticket Queue */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Queue ({filteredTickets.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.map(t => (
              <div 
                key={t.ticket_id} 
                onClick={() => setSelectedTicketId(t.ticket_id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTicketId === t.ticket_id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getUrgencyIcon(t.urgency)}
                    <span className={`text-xs font-bold ${
                      t.urgency === 'Critical' ? 'text-red-700' : 
                      t.urgency === 'High' ? 'text-amber-700' : 'text-slate-600'
                    }`}>#{t.ticket_id} • {t.urgency}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'requires_human' ? 'bg-amber-100 text-amber-700' : 
                    t.status === 'ai_resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t.status === 'requires_human' ? 'REQUIRES REVIEW' : t.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{t.text}</p>
                <div className="mt-2 text-xs text-slate-400 flex justify-between">
                  <span>{t.classification}</span>
                  <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">No tickets found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Workspace */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
          {selectedTicket ? (
            <div className="flex flex-col h-full bg-slate-50">
              
              {/* Workspace Header */}
              <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Ticket #{selectedTicket.ticket_id}</h3>
                  <div className="flex gap-3 text-sm text-slate-500 mt-1">
                    <span>Category: <strong className="text-slate-700">{selectedTicket.classification}</strong></span>
                    <span>AI Confidence: <strong className="text-slate-700">{(selectedTicket.confidence * 100).toFixed(1)}%</strong></span>
                    {selectedTicket.resolution_source && (
                      <span>Source: <strong className="text-blue-600">{selectedTicket.resolution_source}</strong></span>
                    )}
                  </div>
                </div>
                {(selectedTicket.status === 'requires_human' || selectedTicket.status === 'pending_ai') && (
                  <span className="badge badge-warning text-sm px-3 py-1">Awaiting Resolution</span>
                )}
              </div>

              {/* Conversation Area (Read Only for Admin during review, they respond below) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Original Ticket Text as first message if not using standard messages array effectively yet */}
                 <div className="flex gap-4 flex-row">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="max-w-[75%] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-800">
                      <div className="text-xs text-slate-500 mb-1">CLIENT • Original Request</div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.text}</div>
                    </div>
                  </div>

                  {/* Show subsequent thread if it exists */}
                  {selectedTicket.messages && selectedTicket.messages.map((msg, idx) => (
                     <div key={idx} className={`flex gap-4 ${msg.sender === 'client' ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.sender === 'client' ? 'bg-slate-200' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {msg.sender === 'client' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                        msg.sender === 'client' ? 'bg-white border border-slate-200 text-slate-800' : 'bg-blue-50 border border-blue-100 text-blue-900'
                      }`}>
                        <div className={`text-xs mb-1 ${msg.sender === 'client' ? 'text-slate-500' : 'text-blue-500/80'}`}>
                          {msg.sender.toUpperCase()} • {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Resolution Input Area */}
              <div className="bg-white p-6 border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> 
                  Human-in-the-loop Override & Training
                </h4>
                <div className="flex items-start gap-4">
                  <textarea 
                    value={hitlResolution}
                    onChange={e => setHitlResolution(e.target.value)}
                    placeholder="Provide a step-by-step resolution. This will instantly train the AI for future tickets..."
                    className="flex-1 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 h-28 resize-none bg-slate-50 focus:bg-white transition-colors"
                  />
                  <button 
                    onClick={handleHitlResolve}
                    disabled={!hitlResolution.trim() || submitting}
                    className="btn-primary h-28 px-6 rounded-lg font-medium flex flex-col items-center justify-center gap-2 min-w-[140px]"
                  >
                    <Send className="w-5 h-5" />
                    <span>Resolve &<br/>Train AI</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Select a ticket from the queue to review.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
// Temporary mock import for ShieldCheck inside AdminDashboard (missing in initial import list)
// Wait, I will just add ShieldCheck in the main imports. Oh, I can import it globally.
