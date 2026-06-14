import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { ExternalLink, MessageSquare, X, CheckCircle, Loader2 } from 'lucide-react'

export default function ReviewsPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [history, setHistory]   = useState([])
  const [rf, setRf]             = useState({ feedback: '', status: 'needs_revision' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    api.get('/profile/all', { params: { status: 'ready' } })
      .then(r => setProfiles(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const open = async (p) => {
    setModal(p); setRf({ feedback: '', status: 'needs_revision' })
    try { const r = await api.get(`/reviews/${p.id}`); setHistory(r.data) }
    catch { setHistory([]) }
  }

  const submit = async () => {
    if (!rf.feedback.trim()) { toast.error('Write feedback'); return }
    setSaving(true)
    try {
      await api.post(`/reviews/${modal.id}`, rf)
      toast.success('Review submitted!')
      setModal(null)
      setProfiles(prev => prev.filter(p => p.id !== modal.id))
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-4xl">
      <p className="section-comment">// reviews.queue()</p>
      <h1 className="page-title mb-1">Review Queue</h1>
      <p className="text-xs text-gray-600 font-mono mb-8">
        {profiles.length > 0
          ? `// ${profiles.length} portfolio${profiles.length > 1 ? 's' : ''} pending review`
          : '// all caught up'}
      </p>

      {loading ? (
        <div className="page-spinner"><div className="spinner" /></div>
      ) : profiles.length === 0 ? (
        <div className="card text-center py-20">
          <CheckCircle size={36} className="text-emerald-800 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No portfolios pending review</p>
          <p className="text-[10px] text-gray-700 font-mono mt-1">// queue.length === 0</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className="card hover:border-gray-700 transition-colors">
              <div className="card-body flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                  {p.full_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{p.full_name}</p>
                  {p.headline && <p className="text-xs text-gray-600 font-mono truncate">{p.headline}</p>}
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {p.skills?.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-600 font-mono">{p.projects_count}p</span>
                  <a href={`/portfolio/${p.share_token}`} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary btn-xs px-2"><ExternalLink size={11} /></a>
                  <button onClick={() => open(p)} className="btn-primary btn-xs">
                    <MessageSquare size={11} /> Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="section-comment">// review.create()</p>
                <h2 className="text-base font-semibold text-gray-100 mt-0.5">{modal.full_name}</h2>
                {modal.headline && <p className="text-xs text-gray-600 font-mono">{modal.headline}</p>}
              </div>
              <button onClick={() => setModal(null)} className="text-gray-600 hover:text-gray-300">
                <X size={17} />
              </button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mb-4 p-3.5 bg-gray-850 border border-gray-800 rounded-xl">
                <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest mb-2">
                  // previous_reviews
                </p>
                {history.slice(0, 2).map(r => (
                  <div key={r.id} className="text-[11px] font-mono text-gray-600 mb-2 pb-2 border-b border-gray-800 last:border-0">
                    <span className={`badge mr-2 text-[9px] ${r.status === 'published' ? 'badge-green' : 'badge-red'}`}>
                      {r.status}
                    </span>
                    {r.feedback?.slice(0, 90)}
                    {r.feedback?.length > 90 && '...'}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              {[
                { v: 'published',      l: '✅ Publish',        active: 'border-emerald-600 bg-emerald-600/10 text-emerald-400' },
                { v: 'needs_revision', l: '⚠️ Needs Revision', active: 'border-amber-600 bg-amber-600/10 text-amber-400'      },
              ].map(opt => (
                <button key={opt.v} onClick={() => setRf(f => ({ ...f, status: opt.v }))}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                    rf.status === opt.v ? opt.active : 'border-gray-700 text-gray-600 hover:border-gray-600'
                  }`}>
                  {opt.l}
                </button>
              ))}
            </div>

            <textarea
              className="field-textarea mono text-xs min-h-[110px] mb-4"
              placeholder="// Write constructive feedback for the student..."
              value={rf.feedback}
              onChange={e => setRf(f => ({ ...f, feedback: e.target.value }))}
            />

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn-ghost btn-sm">Cancel</button>
              <button onClick={submit} disabled={saving || !rf.feedback.trim()} className="btn-primary btn-sm">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
