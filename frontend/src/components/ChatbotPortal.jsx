import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

export default function ChatbotPortal() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Hi! I'm your AI Support Assistant. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTicketId, setActiveTicketId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let interval;
    if (activeTicketId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/tickets/${activeTicketId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const filteredMessages = data.messages.filter(m => !(m.sender === 'agent' && m.text.startsWith('[DRAFT')));

              const formattedMessages = filteredMessages.map((m, i) => ({
                id: `backend-${i}`,
                sender: m.sender === 'user' ? 'user' : 'ai',
                text: m.text,
                isHuman: m.sender === 'human'
              }));
              
              const allMessages = [
                { id: 1, sender: 'ai', text: "Hi! I'm your AI Support Assistant. How can I help you today?" },
                ...formattedMessages
              ];
              
              if (data.status === 'requires_human' && !data.messages.some(m => m.sender === 'human')) {
                 allMessages.push({
                   id: 'sys-transfer',
                   sender: 'ai',
                   text: "I am routing your request to a human agent. Please hold on.",
                   isHuman: false
                 });
              }
              
              setMessages(allMessages);
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTicketId]);

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }])
    setLoading(true)

    try {
      if (!activeTicketId) {
        // Initial submission
        const res = await fetch('/api/tickets/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userMsg, urgency: 'Low' })
        })
        const data = await res.json()
        
        setActiveTicketId(data.ticket_id)
        
        // Update messages exactly with what the backend has
        if (data.messages) {
          // Filter out agent drafts from the end-user chatbot view
          const filteredMessages = data.messages.filter(m => !(m.sender === 'agent' && m.text.startsWith('[DRAFT')));
          
          const formattedMessages = filteredMessages.map((m, i) => ({
            id: `backend-${i}`,
            sender: m.sender === 'user' ? 'user' : 'ai',
            text: m.text,
            isHuman: m.sender === 'human'
          }))
          const allMessages = [
            { id: 1, sender: 'ai', text: "Hi! I'm your AI Support Assistant. How can I help you today?" },
            ...formattedMessages
          ];

          if (data.status === 'requires_human' && !data.messages.some(m => m.sender === 'human')) {
            allMessages.push({
              id: 'sys-transfer',
              sender: 'ai',
              text: "I am routing your request to a human agent. Please hold on.",
              isHuman: false
            });
          }

          setMessages(allMessages)
        }
      } else {
        // Reply to existing ticket
        const res = await fetch(`/api/tickets/${activeTicketId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userMsg, sender: 'user' })
        })
        // We do not add a fake response here because polling will sync the chat history.
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: "Sorry, I'm having trouble connecting right now." 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col h-[600px] border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex items-center gap-3 shadow-md z-10">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Support Assistant</h1>
            <p className="text-blue-100 text-xs text-opacity-80">Online 24/7</p>
          </div>
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
          {messages.map(msg => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-3 rounded-2xl whitespace-pre-wrap text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : (msg.isHuman ? 'bg-amber-100 border border-amber-200 text-amber-900 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none')
                }`}>
                  {msg.isHuman && <div className="text-xs font-bold text-amber-700 mb-1">Human Agent</div>}
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-slate-500">Typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-black"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          {activeTicketId && (
            <div className="text-center mt-2">
              <span className="text-xs text-slate-400">Ticket #{activeTicketId}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
