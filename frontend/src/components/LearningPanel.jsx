import { GraduationCap, Database, RefreshCw, TrendingUp, CheckCircle } from 'lucide-react'

export default function LearningPanel({ stats }) {
  if (!stats) return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white">Self-Learning</h2>
      </div>
      <div className="shimmer h-24 rounded-xl" />
    </div>
  )

  const accuracy = stats.accuracy?.accuracy ?? 0
  const feedbackCount = stats.feedback_entries ?? 0
  const threshold = stats.retrain_threshold ?? 20
  const progress = Math.min((feedbackCount / threshold) * 100, 100)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white">Self-Learning</h2>
      </div>

      <div className="space-y-3">
        {/* Model Version */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-dark-400">Model Version</span>
          <span className="badge badge-purple text-[10px]">{stats.model_version}</span>
        </div>

        {/* Feedback Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-dark-400">Feedback Progress</span>
            <span className="text-[10px] text-dark-300">{feedbackCount}/{threshold}</span>
          </div>
          <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {stats.retrain_ready && (
            <p className="text-[10px] text-purple-400 mt-1 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Ready for retraining
            </p>
          )}
        </div>

        {/* Accuracy */}
        {feedbackCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Accuracy
            </span>
            <span className={`text-xs font-semibold ${accuracy >= 0.8 ? 'text-emerald-400' : accuracy >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
              {(accuracy * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* Dataset Stats */}
        {stats.dataset && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-400 flex items-center gap-1">
              <Database className="w-3 h-3" /> Dataset Size
            </span>
            <span className="text-xs text-dark-200">{stats.dataset.total_entries}</span>
          </div>
        )}

        {/* Last Retrained */}
        {stats.last_retrained && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Last Retrained
            </span>
            <span className="text-[10px] text-dark-300">{new Date(stats.last_retrained).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
