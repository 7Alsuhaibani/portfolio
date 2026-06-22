// ─── SharePage ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Copy, RefreshCw, ExternalLink, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export function SharePage() {
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    api.get('/profile/me').then(r => setProfile(r.data)).finally(() => setLoading(false))
  }, [])

  const url = profile ? `${window.location.origin}/portfolio/${profile.share_token}` : ''

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }

  const regen = async () => {
    if (!confirm('Old link will stop working. Continue?')) return
    const r = await api.post('/profile/me/share-token')
    setProfile(r.data); toast.success('New link generated')
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      await api.post('/reviews/submit-for-review')
      setProfile(p => ({ ...p, review_status: 'ready' }))
      toast.success('Submitted for review!')
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="page-spinner"><div className="spinner" /></div>

  const STATUS_MAP = {
    draft:          { Icon: Clock,         color: 'text-gray-500',    msg: 'Complete your profile then submit for review.' },
    ready:          { Icon: Clock,         color: 'text-amber-400',   msg: 'Waiting for coach review.' },
    needs_revision: { Icon: AlertCircle,   color: 'text-red-400',     msg: 'Coach requested revisions. Update and resubmit.' },
    published:      { Icon: CheckCircle,   color: 'text-emerald-400', msg: 'Published! Ready to share with employers.' },
  }
  const sm = STATUS_MAP[profile?.review_status] || STATUS_MAP.draft
  const SIcon = sm.Icon

  return (
    <div className="p-8 max-w-3xl">
      <p className="section-comment"> portfolio_share</p>
      <h1 className="page-title mb-8">Share Portfolio</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="card-head"><span className="card-comment"> private_share_link</span></div>
          <div className="card-body">
            <div className="flex items-center gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg mb-3 overflow-hidden">
              <span className="text-[11px] font-mono text-gray-500 truncate flex-1">{url}</span>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={copy} className="btn-secondary btn-sm flex-1 justify-center">
                {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm justify-center">
                <ExternalLink size={12} /> Open
              </a>
            </div>
            <button onClick={regen} className="btn-ghost w-full justify-center btn-xs text-gray-600">
              <RefreshCw size={11} /> Regenerate link
            </button>
            <p className="text-center text-[10px] text-gray-700 font-mono mt-2">
               token_based private access
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><span className="card-comment">  review_status</span></div>
          <div className="card-body">
            <div className="flex items-center gap-2.5 mb-3">
              <SIcon size={15} className={sm.color} />
              <span className={`text-sm font-mono font-semibold ${sm.color}`}>
                {profile?.review_status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">{sm.msg}</p>
            {['draft', 'needs_revision'].includes(profile?.review_status) && (
              <button onClick={submit} disabled={submitting} className="btn-primary w-full justify-center btn-sm">
                {submitting
                  ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>
                  : <Send size={12} />}
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-comment">sharing_tips</span></div>
        <div className="card-body grid grid-cols-3 gap-3">
          {[
            { icon: '', title: 'Email Signature', tip: 'Add "Portfolio: [link]" to your email footer' },
            { icon: '', title: 'LinkedIn Bio',    tip: 'Paste the link in your LinkedIn About section' },
            { icon: '', title: 'Resume',          tip: 'Include next to your contact information' },
          ].map(item => (
            <div key={item.title} className="p-3.5 bg-gray-850 border border-gray-800 rounded-lg">
              <span className="text-lg mb-2 block">{item.icon}</span>
              <p className="text-xs font-semibold text-gray-300 mb-1">{item.title}</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SharePage
