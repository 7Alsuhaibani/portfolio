import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import {
  Users, FolderOpen, CheckCircle, Clock,
  AlertCircle, ExternalLink, MessageSquare, X
} from 'lucide-react'

const STATUS_COLORS = {
  draft:          'bg-gray-100 text-gray-600',
  ready:          'bg-yellow-100 text-yellow-700',
  needs_revision: 'bg-red-100 text-red-700',
  published:      'bg-green-100 text-green-700',
}

export default function AdminDashboardPage() {
  const [stats, setStats]       = useState(null)
  const [profiles, setProfiles] = useState([])
  const [filter, setFilter]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewForm, setReviewForm]   = useState({ feedback: '', status: 'needs_revision' })
  const [submitting, setSubmitting]   = useState(false)

  const load = async (statusFilter = '') => {
    setLoading(true)
    try {
      const [statsRes, profilesRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/profile/all', { params: statusFilter ? { status: statusFilter } : {} }),
      ])
      setStats(statsRes.data)
      setProfiles(profilesRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(filter) }, [filter])

  const submitReview = async () => {
    if (!reviewForm.feedback.trim()) { toast.error('Please enter feedback'); return }
    setSubmitting(true)
    try {
      await api.post(`/reviews/${reviewModal.id}`, reviewForm)
      toast.success('Review submitted!')
      setReviewModal(null)
      load(filter)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Review and manage student portfolios</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Portfolios', value: stats.total_profiles,    icon: Users,        bg: 'bg-blue-50',   color: 'text-blue-600'  },
            { label: 'Published',        value: stats.published_profiles, icon: CheckCircle,  bg: 'bg-green-50',  color: 'text-green-600' },
            { label: 'Ready to Review',  value: stats.ready_profiles,    icon: Clock,        bg: 'bg-yellow-50', color: 'text-yellow-600'},
            { label: 'Needs Revision',   value: stats.needs_revision,    icon: AlertCircle,  bg: 'bg-red-50',    color: 'text-red-600'   },
            { label: 'Total Projects',   value: stats.total_projects,    icon: FolderOpen,   bg: 'bg-purple-50', color: 'text-purple-600'},
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { val: '',               label: 'All' },
          { val: 'ready',          label: '🕐 Ready' },
          { val: 'needs_revision', label: '⚠️ Needs Revision' },
          { val: 'published',      label: '✅ Published' },
          { val: 'draft',          label: '📝 Draft' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === val
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No portfolios found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Student', 'Skills', 'Projects', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.full_name}</p>
                    {p.headline && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{p.headline}</p>}
                    {p.location && <p className="text-xs text-gray-400">{p.location}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {p.skills?.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>
                      ))}
                      {p.skills?.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{p.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {p.projects_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.review_status] || STATUS_COLORS.draft}`}>
                      {p.review_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/portfolio/${p.share_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink size={12} /> View
                      </a>
                      {p.review_status === 'ready' && (
                        <button
                          onClick={() => { setReviewModal(p); setReviewForm({ feedback: '', status: 'needs_revision' }) }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <MessageSquare size={12} /> Review
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

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Review: {reviewModal.full_name}</h2>
              <button onClick={() => setReviewModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="label">Decision</label>
              <div className="flex gap-3 mt-1.5">
                {[
                  { value: 'published',      label: '✅ Publish', bg: 'bg-green-50 border-green-400 text-green-700' },
                  { value: 'needs_revision', label: '⚠️ Needs Revision', bg: 'bg-yellow-50 border-yellow-400 text-yellow-700' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setReviewForm(f => ({ ...f, status: opt.value }))}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      reviewForm.status === opt.value ? opt.bg : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="label">Feedback for student</label>
              <textarea
                className="input mt-1.5 min-h-[120px] resize-none"
                placeholder="Write detailed feedback to help the student improve..."
                value={reviewForm.feedback}
                onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setReviewModal(null)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || !reviewForm.feedback.trim()}
                className="btn-primary px-5 py-2"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}