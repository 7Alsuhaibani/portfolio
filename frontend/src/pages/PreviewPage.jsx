import { useState, useEffect } from 'react'
import api from '../utils/api'
import { ExternalLink } from 'lucide-react'

export default function PreviewPage() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    api.get('/profile/me').then(r => setToken(r.data.share_token))
  }, [])

  if (!token) return <div className="page-spinner"><div className="spinner" /></div>

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div>
          <span className="section-comment">// portfolio.preview()</span>
          <p className="text-xs text-gray-600 mt-0.5">Employer-facing view</p>
        </div>
        <a href={`/portfolio/${token}`} target="_blank" rel="noopener noreferrer"
          className="btn-secondary btn-sm">
          <ExternalLink size={12} /> Open in new tab
        </a>
      </div>
      <div className="flex-1 p-4 bg-gray-950">
        <iframe
          src={`/portfolio/${token}`}
          className="w-full h-full rounded-xl border border-gray-800"
          title="Portfolio Preview"
        />
      </div>
    </div>
  )
}
