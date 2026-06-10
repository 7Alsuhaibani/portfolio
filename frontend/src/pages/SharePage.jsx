import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Copy, Plus, Trash2, Eye, Link, Clock, CheckCircle } from 'lucide-react'

export default function SharePage() {
  const [links, setLinks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [expires, setExpires] = useState('')

  const load = async () => {
    try {
      const { data } = await api.get('/share/links')
      setLinks(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setCreating(true)
    try {
      const payload = {}
      if (expires) payload.expires_at = new Date(expires).toISOString()
      const { data } = await api.post('/share/links', payload)
      setLinks(l => [data, ...l])
      setExpires('')
      toast.success('Shareable link created!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create link')
    } finally {
      setCreating(false)
    }
  }

  const deactivate = async (id) => {
    try {
      await api.delete(`/share/links/${id}`)
      setLinks(l => l.map(x => x.id === id ? { ...x, is_active: false } : x))
      toast.success('Link deactivated')
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  const copyLink = (token) => {
    const url = `${window.location.origin}/portfolio/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  const isExpired = (link) =>
    link.expires_at && new Date(link.expires_at) < new Date()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Share Portfolio</h1>
        <p className="text-gray-500 mt-1">Generate private links to share with employers</p>
      </div>

      {/* Create new link */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Generate New Link</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Expiration Date (optional)</label>
            <input
              type="datetime-local"
              className="input"
              value={expires}
              onChange={e => setExpires(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <button
            onClick={create}
            disabled={creating}
            className="btn-primary flex items-center gap-2 py-2.5"
          >
            <Plus size={18} />
            {creating ? 'Creating...' : 'Generate Link'}
          </button>
        </div>
      </div>

      {/* Links list */}
      <div className="space-y-4">
        {links.length === 0 && (
          <div className="card text-center py-10 text-gray-500">
            <Link size={36} className="mx-auto mb-3 text-gray-300" />
            <p>No shareable links yet. Generate your first one above!</p>
          </div>
        )}

        {links.map(link => {
          const url = `${window.location.origin}/portfolio/${link.token}`
          const expired = isExpired(link)
          const active = link.is_active && !expired

          return (
            <div
              key={link.id}
              className={`card ${!active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {active
                      ? <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle size={11} /> Active
                        </span>
                      : expired
                        ? <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
                            <Clock size={11} /> Expired
                          </span>
                        : <span className="badge bg-gray-100 text-gray-500">Inactive</span>
                    }
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye size={12} /> {link.view_count} views
                    </span>
                  </div>

                  <p className="text-sm font-mono text-gray-700 truncate mb-1">{url}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Created: {new Date(link.created_at).toLocaleDateString()}</span>
                    {link.expires_at && (
                      <span>Expires: {new Date(link.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {active && (
                    <>
                      <button
                        onClick={() => copyLink(link.token)}
                        className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
                      >
                        <Copy size={14} /> Copy
                      </button>
                      <a
                        href={`/portfolio/${link.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
                      >
                        <Eye size={14} /> Preview
                      </a>
                    </>
                  )}
                  {active && (
                    <button
                      onClick={() => deactivate(link.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Deactivate"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
