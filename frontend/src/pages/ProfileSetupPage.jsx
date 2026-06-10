import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Plus, X } from 'lucide-react'

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [form, setForm] = useState({
    headline: '',
    bio: '',
    location: '',
    contact_email: '',
    skills: [],
    target_roles: [],
  })

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) =>
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))

  const addRole = () => {
    const r = roleInput.trim()
    if (r && !form.target_roles.includes(r)) {
      setForm(f => ({ ...f, target_roles: [...f.target_roles, r] }))
    }
    setRoleInput('')
  }

  const removeRole = (role) =>
    setForm(f => ({ ...f, target_roles: f.target_roles.filter(r => r !== role) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.headline) { toast.error('Headline is required'); return }
    setLoading(true)
    try {
      await api.post('/profiles', form)
      toast.success('Profile created! 🎉')
      navigate('/profile/edit')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Setup Your Profile</h1>
        <p className="text-gray-500 mt-1">Let's build your professional portfolio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="label">Professional Headline *</label>
            <input
              className="input"
              placeholder="e.g. Data Scientist | ML Engineer | Open to Work"
              value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Tell employers about yourself, your passion, and what you're looking for..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="Riyadh, Saudi Arabia"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Skills</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. Python, SQL, Machine Learning..."
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-3">
              <Plus size={18} />
            </button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map(s => (
                <span key={s} className="badge bg-primary-100 text-primary-700 flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Target Roles */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Target Roles</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. Data Scientist, ML Engineer..."
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())}
            />
            <button type="button" onClick={addRole} className="btn-secondary px-3">
              <Plus size={18} />
            </button>
          </div>
          {form.target_roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.target_roles.map(r => (
                <span key={r} className="badge bg-green-100 text-green-700 flex items-center gap-1">
                  {r}
                  <button type="button" onClick={() => removeRole(r)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Creating Profile...' : 'Create Profile & Continue'}
        </button>
      </form>
    </div>
  )
}
