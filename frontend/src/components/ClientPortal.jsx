import { useState } from 'react'
import { Send, Upload, Clock, CheckCircle, User, Bot, Loader2 } from 'lucide-react'

export default function ClientPortal({ tickets, refresh }) {
  const [subject, setSubject] = useState('')
  const [urgency, setUrgency] = useState('Low')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewingTicket, setViewingTicket] = useState(null)
  
  // New reply state
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim() || submitting) return
    
    setSubmitting(true)
    try {
      // The backend analyze endpoint does submission
      const textPayload = subject ? `${subject}\n\n${description}` : description
      
      const res = await fetch('/api/tickets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textPayload, urgency })
      })
      
      if (res.ok) {
        setSubject('')
        setDescription('')
        setUrgency('Low')
        await refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (ticketId) => {
    if (!replyText.trim() || replying) return
    setReplying(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, sender: 'client' })
      })
      if (res.ok) {
        const updatedTicket = await res.json()
        setViewingTicket(updatedTicket)
        setReplyText('')
        await refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setReplying(false)
    }
  }

  const loadFullTicket = async (id) => {
    const res = await fetch(`/api/tickets/${id}`)
    const data = await res.json()
    setViewingTicket(data)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">IT Support Portal</h2>
        <p className="text-slate-500 mt-2">Submit tickets and track AI or human agent progress.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: Submit New Ticket */}
        <div className="col-span-12 lg:col-span-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Submit New Ticket
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Short summary of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urgency Level</label>
                <select 
                  value={urgency}
                  onChange={e => setUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-32 resize-none"
                  placeholder="Please provide detailed steps or error messages..."
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || !description.trim()}
                className="w-full btn-primary py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Submit Ticket
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Ticket List / View */}
        <div className="col-span-12 lg:col-span-8">
          
          {viewingTicket ? (
            <div className="glass-card flex flex-col h-[700px]">
              {/* Ticket Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="font-bold text-slate-800">Ticket #{viewingTicket.ticket_id}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`badge ${viewingTicket.status === 'ai_resolved' ? 'badge-success' : viewingTicket.status === 'human_resolved' ? 'badge-info' : 'badge-warning'}`}>
                      {viewingTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`badge ${
                      viewingTicket.urgency === 'Critical' ? 'badge-danger' : 
                      viewingTicket.urgency === 'High' ? 'badge-warning' : 
                      'badge-info'
                    }`}>
                      {viewingTicket.urgency} Urgency
                    </span>
                  </div>
                </div>
                <button onClick={() => setViewingTicket(null)} className="text-sm text-slate-500 hover:text-slate-800">Back to List</button>
              </div>
              
              {/* Message Thread */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
                {viewingTicket.messages?.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.sender === 'client' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                      msg.sender === 'client' ? 'bg-slate-200' : 
                      msg.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {msg.sender === 'client' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                      msg.sender === 'client' ? 'bg-blue-600 text-white' : 'glass-card text-slate-700'
                    }`}>
                      <div className={`text-xs mb-1 opacity-70 ${msg.sender === 'client' ? 'text-blue-100' : 'text-slate-500'}`}>
                        {msg.sender.toUpperCase()} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 bg-white border-t border-slate-100 rounded-b-xl flex gap-3">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReply(viewingTicket.ticket_id)}
                  placeholder="Type a reply..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
                <button 
                  onClick={() => handleReply(viewingTicket.ticket_id)}
                  disabled={!replyText.trim() || replying}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Your Tickets</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No tickets submitted yet.</div>
                ) : (
                  tickets.map(t => (
                    <div 
                      key={t.ticket_id} 
                      onClick={() => loadFullTicket(t.ticket_id)}
                      className="p-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="max-w-[70%]">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-slate-800 text-sm">Ticket #{t.ticket_id}</span>
                          <span className="text-xs text-slate-400">{new Date(t.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 text-sm truncate">{t.text}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`badge ${
                          t.status === 'ai_resolved' ? 'badge-success' : 
                          t.status === 'human_resolved' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {t.status === 'requires_human' ? 'PENDING AGENT' : t.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{t.urgency} Urgency</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
