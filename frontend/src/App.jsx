import { useState, useEffect, useCallback } from 'react'
import { Layers, ShieldCheck, BarChart3, RefreshCw, LifeBuoy } from 'lucide-react'
import ClientPortal from './components/ClientPortal'
import AdminDashboard from './components/AdminDashboard'
import AnalyticsPanel from './components/AnalyticsPanel'

const API_BASE = '/api'

export default function App() {
  const [activeTab, setActiveTab] = useState('client')
  
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ total_tickets: 0, auto_resolved: 0, hitl_required: 0, incidents_detected: 0 })
  const [incidents, setIncidents] = useState([])
  const [learningStats, setLearningStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tickets`)
      const data = await res.json()
      setTickets(data.tickets || [])
      setStats(data.stats || stats)
    } catch (e) { console.error('Failed to fetch tickets:', e) }
  }, [stats])

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents`)
      const data = await res.json()
      setIncidents(data.incidents || [])
    } catch (e) { console.error('Failed to fetch incidents:', e) }
  }, [])

  const fetchLearningStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/learning/stats`)
      const data = await res.json()
      setLearningStats(data)
    } catch (e) { console.error('Failed to fetch learning stats:', e) }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchTickets(), fetchIncidents(), fetchLearningStats()])
    setLoading(false)
  }, [fetchTickets, fetchIncidents, fetchLearningStats])

  useEffect(() => { refreshAll() }, [refreshAll])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col items-center py-6 h-full shadow-sm z-10">
        <div className="flex items-center gap-3 mb-10 px-6 w-full">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <LifeBuoy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">AI Support</h1>
            <p className="text-xs text-slate-500">Enterprise Platform</p>
          </div>
        </div>

        <nav className="flex-1 w-full px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('client')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'client' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Layers className="w-5 h-5" />
            Client Portal
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            Admin Operations
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Metrics & Analytics
          </button>
        </nav>

        <div className="w-full px-6 mt-auto">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-50">
        {activeTab === 'client' && <ClientPortal tickets={tickets} refresh={refreshAll} />}
        {activeTab === 'admin' && <AdminDashboard tickets={tickets} refresh={refreshAll} />}
        {activeTab === 'analytics' && <AnalyticsPanel stats={stats} learningStats={learningStats} incidents={incidents} refresh={refreshAll} />}
      </main>

    </div>
  )
}
