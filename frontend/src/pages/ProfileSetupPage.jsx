import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ full_name: '', headline: '', location: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/profile/me', form)
      toast.success('Profile created!')
      navigate('/dashboard')
    } catch { toast.error('Save failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="section-comment">profile.setup()</p>
        <h1 className="page-title mb-2">Set Up Your Profile</h1>
        <p className="text-sm text-gray-600 mb-8">You can change all of this later</p>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="field-label">Full Name *</label>
            <input className="field-input" placeholder="Hamad Al-Suhaibani"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required />
          </div>
          <div>
            <label className="field-label">Headline</label>
            <input className="field-input mono" placeholder="ML Engineer | Python | FastAPI"
              value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Location</label>
            <input className="field-input" placeholder="Toronto, ON"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {loading ? 'Saving...' : 'Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
