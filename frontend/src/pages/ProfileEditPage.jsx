import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import {
  Plus, X, Upload, Trash2, Camera, FileText,
  Github, Linkedin, Globe, Link as LinkIcon
} from 'lucide-react'

const LINK_TYPES = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'github',   label: 'GitHub',   icon: Github },
  { value: 'website',  label: 'Website',  icon: Globe },
  { value: 'demo',     label: 'Demo',     icon: LinkIcon },
  { value: 'blog',     label: 'Blog',     icon: LinkIcon },
  { value: 'other',    label: 'Other',    icon: LinkIcon },
]

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const photoRef = useRef()
  const resumeRef = useRef()

  const [loading, setLoading]   = useState(false)
  const [profile, setProfile]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [roleInput, setRoleInput]   = useState('')
  const [newLink, setNewLink]   = useState({ link_type: 'linkedin', url: '', label: '' })

  const [form, setForm] = useState({
    headline: '', bio: '', location: '',
    contact_email: '', skills: [], target_roles: [],
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/profiles/me')
        setProfile(data)
        setForm({
          headline:      data.headline || '',
          bio:           data.bio || '',
          location:      data.location || '',
          contact_email: data.contact_email || '',
          skills:        data.skills || [],
          target_roles:  data.target_roles || [],
        })
      } catch {
        navigate('/profile/setup')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/profiles/me', form)
      setProfile(data)
      toast.success('Profile saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    try {
      const { data } = await api.post('/profiles/me/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(data)
      toast.success('Photo updated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    }
  }

  const uploadResume = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('resume', file)
    try {
      const { data } = await api.post('/profiles/me/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(data)
      toast.success('Resume uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    }
  }

  const deleteResume = async () => {
    try {
      const { data } = await api.delete('/profiles/me/resume')
      setProfile(data)
      toast.success('Resume removed')
    } catch {
      toast.error('Failed to remove resume')
    }
  }

  const addLink = async () => {
    if (!newLink.url) { toast.error('URL is required'); return }
    try {
      await api.post('/profiles/me/links', newLink)
      const { data } = await api.get('/profiles/me')
      setProfile(data)
      setNewLink({ link_type: 'linkedin', url: '', label: '' })
      toast.success('Link added!')
    } catch {
      toast.error('Failed to add link')
    }
  }

  const deleteLink = async (id) => {
    try {
      await api.delete(`/profiles/me/links/${id}`)
      setProfile(p => ({ ...p, social_links: p.social_links.filter(l => l.id !== id) }))
      toast.success('Link removed')
    } catch {
      toast.error('Failed to remove link')
    }
  }

  const toggleVisibility = async () => {
    try {
      await api.patch(`/profiles/me/visibility?is_public=${!profile.is_public}`)
      setProfile(p => ({ ...p, is_public: !p.is_public }))
      toast.success(profile.is_public ? 'Portfolio set to private' : 'Portfolio is now public!')
    } catch {
      toast.error('Failed to update visibility')
    }
  }

  const addTag = (field, value, setInput) => {
    const v = value.trim()
    if (v && !form[field].includes(v))
      setForm(f => ({ ...f, [field]: [...f[field], v] }))
    setInput('')
  }

  const removeTag = (field, value) =>
    setForm(f => ({ ...f, [field]: f[field].filter(x => x !== value) }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-500 mt-1">Keep your portfolio up to date</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Photo & Visibility */}
        <div className="card flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {profile?.profile_photo
                ? <img src={`/${profile.profile_photo}`} alt="" className="w-full h-full object-cover" />
                : profile?.user?.full_name?.[0] || 'U'
              }
            </div>
            <button
              onClick={() => photoRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <Camera size={12} />
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{profile?.user?.full_name}</p>
            <p className="text-sm text-gray-500">Click camera to update photo</p>
          </div>
          <div>
            <button
              onClick={toggleVisibility}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                profile?.is_public
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {profile?.is_public ? '🌐 Public' : '🔒 Private'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              placeholder="Data Scientist | ML Engineer"
              value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input resize-none"
              rows={4}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                className="input"
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
              placeholder="Add a skill..."
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('skills', skillInput, setSkillInput))}
            />
            <button type="button" onClick={() => addTag('skills', skillInput, setSkillInput)} className="btn-secondary px-3">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map(s => (
              <span key={s} className="badge bg-primary-100 text-primary-700 flex items-center gap-1 py-1 px-2.5">
                {s}
                <button onClick={() => removeTag('skills', s)}><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Target Roles */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Target Roles</h2>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Add a target role..."
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('target_roles', roleInput, setRoleInput))}
            />
            <button type="button" onClick={() => addTag('target_roles', roleInput, setRoleInput)} className="btn-secondary px-3">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.target_roles.map(r => (
              <span key={r} className="badge bg-green-100 text-green-700 flex items-center gap-1 py-1 px-2.5">
                {r}
                <button onClick={() => removeTag('target_roles', r)}><X size={12} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Resume */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Resume</h2>
          {profile?.resume_file ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-red-500" />
                <div>
                  <p className="text-sm font-medium">{profile.resume_filename}</p>
                  <a href={`/${profile.resume_file}`} target="_blank" rel="noreferrer"
                     className="text-xs text-primary-600 hover:underline">View Resume</a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => resumeRef.current?.click()} className="btn-secondary text-xs px-3 py-1.5">
                  <Upload size={14} className="mr-1" />Replace
                </button>
                <button onClick={deleteResume} className="text-red-500 hover:text-red-700 p-1.5">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => resumeRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors"
            >
              <Upload size={24} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload resume (PDF or Word)</p>
            </button>
          )}
          <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadResume} />
        </div>

        {/* Social Links */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Social Links</h2>
          <div className="grid grid-cols-3 gap-2">
            <select
              className="input"
              value={newLink.link_type}
              onChange={e => setNewLink(l => ({ ...l, link_type: e.target.value }))}
            >
              {LINK_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              className="input col-span-2"
              placeholder="https://..."
              value={newLink.url}
              onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addLink()}
            />
          </div>
          <button onClick={addLink} className="btn-secondary w-full flex items-center justify-center gap-2">
            <Plus size={16} /> Add Link
          </button>

          {profile?.social_links?.map(link => (
            <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="badge bg-gray-200 text-gray-700 capitalize mr-2">{link.link_type}</span>
                <a href={link.url} target="_blank" rel="noreferrer"
                   className="text-sm text-primary-600 hover:underline truncate">{link.url}</a>
              </div>
              <button onClick={() => deleteLink(link.id)} className="text-red-500 hover:text-red-700 ml-2">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
