import TicketDashboard from './TicketDashboard'
import IncidentPanel from './IncidentPanel'
import LearningPanel from './LearningPanel'
import AgentActivityFeed from './AgentActivityFeed'
import DecisionTracePanel from './DecisionTracePanel'

export default function AnalyticsPanel({ stats, learningStats, incidents, refresh }) {
  // Use existing widgets in a new clean layout
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      
      <header className="mb-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Metrics & Analytics</h2>
        <p className="text-slate-500 mt-2">Monitor AI performance, platform health, and incident alerts.</p>
      </header>
      
      {/* Top Stats Row (TicketDashboard) */}
      <div className="w-full">
        <TicketDashboard stats={stats} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
           {/* Incident Tracking */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Incident Detection Radar</h3>
             </div>
             <div className="p-1">
               <IncidentPanel incidents={incidents} />
             </div>
           </div>
           
           {/* Agent Activity Feed log */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Global Agent Operations Logs</h3>
             </div>
             <div className="p-6 h-96 overflow-y-auto">
               <AgentActivityFeed logs={[]} /> {/* Empty array for now, or you can pass logs if tracking globally */}
               <div className="text-center text-slate-400 mt-10">Historical logs are running in the background.</div>
             </div>
           </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
           {/* RAG / Learning Progress */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Feedback Matrix & RAG</h3>
             </div>
             <div className="p-1">
               <LearningPanel stats={learningStats} />
             </div>
           </div>
        </div>

      </div>
    </div>
  )
}
