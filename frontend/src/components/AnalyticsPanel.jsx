import React, { useState } from 'react'
import { Layers, Bot, User, CheckCircle, Flame, ShieldAlert, Check } from 'lucide-react'
import IncidentPanel from './IncidentPanel'

export default function AnalyticsPanel({ tickets = [], stats, learningStats, incidents, refresh }) {
  const [selectedTicket, setSelectedTicket] = useState(null)
  
  // Calculate specific stats
  const totalRaised = tickets.length || stats?.total_tickets || 0
  const aiSolved = tickets.filter(t => t.status === 'ai_resolved').length || stats?.auto_resolved || 0
  const humanSolved = tickets.filter(t => t.status === 'human_resolved').length || 0
  const incidentsDetected = incidents?.length || stats?.incidents_detected || 0

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Analytics Hub</h2>
        <p className="text-slate-500 mt-2">Comprehensive overview of volume, AI efficiency, and user histories.</p>
      </header>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg"><Layers className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-slate-500">Total Tickets Raised</p><h3 className="text-3xl font-bold text-slate-800">{totalRaised}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg"><Bot className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-slate-500">AI Solved Count</p><h3 className="text-3xl font-bold text-slate-800">{aiSolved}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg"><User className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-slate-500">Human Solved</p><h3 className="text-3xl font-bold text-slate-800">{humanSolved}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-lg"><ShieldAlert className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-slate-500">Incidents Detected</p><h3 className="text-3xl font-bold text-slate-800">{incidentsDetected}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[600px]">
        {/* Ticket List Queue */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800">
             Ticket Queue & User History
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {tickets.map(t => (
              <div 
                key={t.ticket_id} 
                onClick={() => setSelectedTicket(t)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTicket?.ticket_id === t.ticket_id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500">#{t.ticket_id} • {new Date(t.timestamp).toLocaleDateString()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    t.status === 'ai_resolved' ? 'bg-emerald-100 text-emerald-700' : 
                    t.status === 'human_resolved' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {t.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{t.text}</p>
                <div className="text-xs text-slate-400 mt-1 flex justify-between">
                  <span>{t.classification}</span>
                  {t.urgency === 'Critical' && <span className="text-red-500 flex items-center gap-1"><Flame className="w-3 h-3"/> Critical</span>}
                </div>
              </div>
            ))}
            {tickets.length === 0 && <div className="p-10 text-center text-slate-400">No tickets found.</div>}
          </div>
        </div>

        {/* Detailed Solutions & Chat History */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
          {selectedTicket ? (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shadow-sm z-10">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Ticket #{selectedTicket.ticket_id}</h3>
                  <p className="text-sm text-slate-500">Category: {selectedTicket.classification}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
                 
                 {/* Final Solution Block */}
                 <div className="bg-white border-2 border-emerald-100 rounded-xl p-5 shadow-sm">
                   <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-3"><CheckCircle className="w-5 h-5"/> Verified Solution</h4>
                   <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedTicket.status === 'ai_resolved' ? selectedTicket.ai_resolution : 
                       selectedTicket.status === 'human_resolved' ? selectedTicket.human_resolution :
                       "Pending resolution."}
                   </p>
                 </div>

                 {/* Chat History */}
                 <div>
                   <h4 className="font-bold text-slate-800 mb-4 px-1">Chatting History</h4>
                   <div className="space-y-6">
                     {selectedTicket.messages && selectedTicket.messages.map((msg, idx) => {
                       const isUser = msg.sender === 'user' || msg.sender === 'client';
                       const isHumanMode = msg.sender === 'human';
                       
                       return (
                         <div key={idx} className={`flex gap-4 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                             isUser ? 'bg-slate-200' : (isHumanMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600')
                           }`}>
                             {isUser ? <User className="w-4 h-4 text-slate-600" /> : (isHumanMode ? <ShieldAlert className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
                           </div>
                           <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                             isUser ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' 
                                    : (isHumanMode ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-none' 
                                                   : 'bg-blue-50 border border-blue-100 text-blue-900 rounded-tr-none')
                           }`}>
                             <div className={`text-xs mb-1 font-semibold ${isUser ? 'text-slate-500' : (isHumanMode ? 'text-amber-700' : 'text-blue-500/80')}`}>
                               {isUser ? 'User' : (isHumanMode ? 'Human Agent' : 'AI Agent')}
                               {msg.timestamp ? ` • ${new Date(msg.timestamp).toLocaleString()}` : ''}
                             </div>
                             <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-400 bg-slate-50">
              <Bot className="w-16 h-16 text-slate-200 mb-4" />
              <p>Select a ticket to view its full chatting history and resolution.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
