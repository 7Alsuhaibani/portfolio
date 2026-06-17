import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import useAuth from '../hooks/useAuth'
import { ExternalLink, MessageSquare, X, CheckCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react'

const S_CLS = {
  draft:          'status-draft',
  ready:          'status-ready',
  needs_revision: 'status-needs_revision',
  published:      'status-published',
}

export default function AdminPage() {
  const [stats, setStats]     = useState(null)
  const [profiles, setProfiles] = useState([])
  const [filter, setFilter]   = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [rf, setRf]           = useState({ feedback: '', status: 'needs_revision' })
  const [saving, setSaving]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)   // profile pending deletion
  const [deleting, setDeleting]   = useState(false)
  const { user } = useAuth()
  const canDelete = user?.role === 'admin'   // only true admins, not coaches

  const load = async (f = '') => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/profile/all', { params: f ? { status: f } : {} }),
      ])
      setStats(s.data); setProfiles(p.data)
    } catch { toast.error('Load failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(filter) }, [filter])

  const submitReview = async () => {
    if (!rf.feedback.trim()) { toast.error('Write feedback first'); return }
    setSaving(true)
    try {
      await api.post(`/reviews/${modal.id}`, rf)
      toast.success('Review submitted')
      setModal(null); load(filter)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const deletePortfolio = async () => {
    if (!delTarget) return
    setDeleting(true)
    try {
      await api.delete(`/admin/profiles/${delTarget.id}`)
      toast.success('Portfolio deleted')
      setDelTarget(null)
      load(filter)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const FILTERS = [
    ['', 'All'], ['ready', 'Ready'], ['needs_revision', 'Revision'],
    ['published', 'Published'], ['draft', 'Draft'],
  ]

  return (
    <div className="p-8 max-w-6xl">
      <p className="section-comment">// admin.portfolios()</p>
      <h1 className="page-title mb-8">All Portfolios</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { l: 'Total',     v: stats.total_profiles,     c: 'text-blue-400'    },
            { l: 'Published', v: stats.published_profiles,  c: 'text-emerald-400' },
            { l: 'Ready',     v: stats.ready_profiles,      c: 'text-amber-400'   },
            { l: 'Revision',  v: stats.needs_revision,      c: 'text-red-400'     },
            { l: 'Projects',  v: stats.total_projects,      c: 'text-cyan-400'    },
          ].map(s => (
            <div key={s.l} className="card p-4">
              <p className={`text-2xl font-bold font-mono ${s.c}`}>{s.v}</p>
              <p className="text-[10px] text-gray-600 mt-0.5 font-mono">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="tab-bar">
        {FILTERS.map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`tab-btn ${filter === val ? 'active' : ''}`}>{label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-spinner"><div className="spinner" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-850 border-b border-gray-800">
              <tr>
                {['Student', 'Tech Stack', 'Projects', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono font-semibold text-gray-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-700 font-mono">
                    // no portfolios found
                  </td>
                </tr>
              ) : profiles.map(p => (
                <tr key={p.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-300">{p.full_name}</p>
                    {p.headline && (
                      <p className="text-gray-600 font-mono truncate max-w-[180px] mt-0.5">{p.headline}</p>
                    )}
                    {p.location && <p className="text-gray-700 mt-0.5">{p.location}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {p.skills?.slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
                      {p.skills?.length > 3 && (
                        <span className="tag text-gray-600">+{p.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge badge-blue font-mono">{p.projects_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={S_CLS[p.review_status] || 'status-draft'}>
                      {p.review_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <a href={`/portfolio/${p.share_token}`} target="_blank" rel="noopener noreferrer"
                        className="btn-ghost btn-xs px-2"><ExternalLink size={11} /></a>
                      {p.review_status === 'ready' && (
                        <button
                          onClick={() => { setModal(p); setRf({ feedback: '', status: 'needs_revision' }) }}
                          className="btn-primary btn-xs">
                          <MessageSquare size={11} /> Review
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDelTarget(p)}
                          title="Delete portfolio"
                          className="btn-ghost btn-xs px-2 text-red-400 hover:text-red-300 hover:border-red-500/40">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="section-comment">// review.submit()</p>
                <h2 className="text-base font-semibold text-gray-100 mt-0.5">{modal.full_name}</h2>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-600 hover:text-gray-300 mt-1">
                <X size={17} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {[
                { v: 'published',      l: '✅ Publish',        on: 'border-emerald-600 bg-emerald-600/10 text-emerald-400' },
                { v: 'needs_revision', l: '⚠️ Needs Revision', on: 'border-amber-600 bg-amber-600/10 text-amber-400'      },
              ].map(opt => (
                <button key={opt.v} onClick={() => setRf(f => ({ ...f, status: opt.v }))}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                    rf.status === opt.v ? opt.on : 'border-gray-700 text-gray-600 hover:border-gray-600'
                  }`}>
                  {opt.l}
                </button>
              ))}
            </div>

            <textarea
              className="field-textarea mono text-xs min-h-[100px] mb-4"
              placeholder="// Write constructive feedback for the student..."
              value={rf.feedback}
              onChange={e => setRf(f => ({ ...f, feedback: e.target.value }))}
            />

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn-ghost btn-sm">Cancel</button>
              <button onClick={submitReview} disabled={saving || !rf.feedback.trim()} className="btn-primary btn-sm">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {delTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
                <div>
                  <p className="section-comment">// admin.delete()</p>
                  <h2 className="text-base font-semibold text-gray-100 mt-0.5">Delete portfolio</h2>
                </div>
              </div>
              <button onClick={() => setDelTarget(null)} className="text-gray-600 hover:text-gray-300 mt-1">
                <X size={17} />
              </button>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              This will permanently remove{' '}
              <span className="text-gray-200 font-medium">{delTarget.full_name}</span>'s portfolio,
              including their account, all projects, uploads, links and reviews.
              This action cannot be undone.
            </p>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setDelTarget(null)} className="btn-ghost btn-sm">Cancel</button>
              <button
                onClick={deletePortfolio}
                disabled={deleting}
                className="btn-sm inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-2 transition-colors disabled:opacity-50">
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}