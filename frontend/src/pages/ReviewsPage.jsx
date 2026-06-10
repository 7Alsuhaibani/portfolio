import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { MessageSquare, ExternalLink, Clock, CheckCircle, X, ChevronDown } from 'lucide-react'

const STATUS_COLORS = {
  draft:          'bg-gray-100 text-gray-600',
  ready:          'bg-yellow-100 text-yellow-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  published:      'bg-green-100 text-green-700',
}

export default function ReviewsPage() {
  const [profiles, setProfiles]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)   // profile expanded
  const [reviews, setReviews]         = useState([])
  const [reviewForm, setReviewForm]   = useState({ feedback: '', status: 'needs_revision' })
  const [submitting, setSubmitting]   = useState(false)
  const [showModal, setShowModal]     = useState(false)

  useEffect(() => {
    api.get('/profile/all', { params: { status: 'ready' } })
      .then(res => setProfiles(res.data))
      .catch(() => toast.error('Failed to load portfolios'))
      .finally(() => setLoading(false))
  }, [])

  const openReview = async (profile) => {
    setSelected(profile)
    setShowModal(true)
    setReviewForm({ feedback: '', status: 'needs_revision' })
    try {
      const res = await api.get(`/reviews/${profile.id}`)
      setReviews(res.data)
    } catch {
      setReviews([])
    }
  }

  const submitReview = async () => {
    if (!reviewForm.feedback.trim()) { toast.error('Please write feedback'); return }
    setSubmitting(true)
    try {
      await api.post(`/reviews/${selected.id}`, reviewForm)
      toast.success('Review submitted!')
      setShowModal(false)
      // Remove from ready list
      setProfiles(prev => prev.filter(p => p.id !== selected.id))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Reviews</h1>
        <p className="text-gray-500 mt-1">
          Portfolios waiting for your review
          {profiles.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
              {profiles.length} pending
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
          <h3 className="text-lg font-semibold text-gray-700">All caught up!</h3>
          <p className="text-gray-400 mt-1">No portfolios are waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                  {profile.full_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{profile.full_name}</p>
                  {profile.headline && (
                    <p className="text-sm text-gray-500 truncate">{profile.headline}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {profile.skills?.slice(0, 4).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-gray-400">
                  {profile.projects_count} project{profile.projects_count !== 1 ? 's' : ''}
                </span>
                <a
                  href={`/portfolio/${profile.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink size={14} /> View
                </a>
                <button
                  onClick={() => openReview(profile)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <MessageSquare size={14} /> Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">{selected.full_name}</h2>
                {selected.headline && <p className="text-sm text-gray-500">{selected.headline}</p>}
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Previous reviews */}
            {reviews.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previous Feedback</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {reviews.map(r => (
                    <div key={r.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                          {r.status?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{r.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New review */}
            <div className="mb-4">
              <label className="label">Your Decision</label>
              <div className="flex gap-3 mt-1.5">
                {[
                  { value: 'published',      label: '✅ Publish Portfolio' },
                  { value: 'needs_revision', label: '⚠️ Request Revision' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setReviewForm(f => ({ ...f, status: opt.value }))}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      reviewForm.status === opt.value
                        ? opt.value === 'published'
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-yellow-400 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="label">Feedback</label>
              <textarea
                className="input mt-1.5 min-h-[120px] resize-none"
                placeholder="Provide constructive feedback for the student..."
                value={reviewForm.feedback}
                onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2">
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