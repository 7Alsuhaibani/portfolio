import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Save, Upload, Trash2, Plus, X, Loader2, User } from 'lucide-react'

const SKILL_LIST = [
  'Python','SQL','R','JavaScript','TypeScript','React','FastAPI','Django','Node.js',
  'PostgreSQL','MongoDB','Redis','TensorFlow','PyTorch','Scikit-learn',
  'Pandas','NumPy','Spark','Kafka','Airflow','dbt','Docker','Kubernetes','AWS','GCP',
]
const LINK_TYPES = ['linkedin','github','website','demo','blog','other']
const TABS = ['Info', 'Skills', 'Resume', 'Links']

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`toggle ${value ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <div className={`toggle-thumb ${value ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  )
}

export default function ProfileEditPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [tab, setTab]         = useState('Info')
  const [form, setForm]       = useState({})
  const [skillInput, setSkillInput] = useState('')
  const [roleInput, setRoleInput]   = useState('')
  const [newLink, setNewLink] = useState({ link_type: 'linkedin', url: '', label: '' })

  useEffect(() => {
    api.get('/profile/me').then(res => {
      setProfile(res.data)
      setForm({
        full_name:     res.data.full_name     || '',
        headline:      res.data.headline      || '',
        bio:           res.data.bio           || '',
        location:      res.data.location      || '',
        contact_email: res.data.contact_email || '',
        skills:        res.data.skills        || [],
        target_roles:  res.data.target_roles  || [],
        is_public:     res.data.is_public     || false,
      })
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const r = await api.put('/profile/me', form)
      setProfile(r.data)
      toast.success('Saved')
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  /* Avatar */
  const onAvatarDrop = useCallback(async ([file]) => {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await api.post('/profile/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(r.data); toast.success('Avatar updated')
    } catch { toast.error('Upload failed') }
  }, [])
  const { getRootProps: aRoot, getInputProps: aInput } = useDropzone({
    onDrop: onAvatarDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  /* Resume */
  const onResumeDrop = useCallback(async ([file]) => {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await api.post('/profile/me/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(p => ({ ...p, resume: r.data })); toast.success('Resume uploaded')
    } catch (e) { toast.error(e.response?.data?.detail || 'Upload failed') }
  }, [])
  const { getRootProps: rRoot, getInputProps: rInput, isDragActive } = useDropzone({
    onDrop: onResumeDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  const delResume = async () => {
    await api.delete('/profile/me/resume')
    setProfile(p => ({ ...p, resume: null }))
    toast.success('Resume removed')
  }

  const addLink = async () => {
    if (!newLink.url) return
    try {
      const r = await api.post('/profile/me/links', newLink)
      setProfile(p => ({ ...p, social_links: [...(p.social_links || []), r.data] }))
      setNewLink({ link_type: 'linkedin', url: '', label: '' })
      toast.success('Link added')
    } catch { toast.error('Failed') }
  }

  const delLink = async (id) => {
    await api.delete(`/profile/me/links/${id}`)
    setProfile(p => ({ ...p, social_links: p.social_links.filter(l => l.id !== id) }))
  }

  const addSkill = (s) => {
    const v = (s || skillInput).trim()
    if (v && !form.skills.includes(v))
      setForm(f => ({ ...f, skills: [...f.skills, v] }))
    setSkillInput('')
  }
  const removeSkill = (s) => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))

  const addRole = () => {
    const v = roleInput.trim()
    if (v && !form.target_roles.includes(v))
      setForm(f => ({ ...f, target_roles: [...f.target_roles, v] }))
    setRoleInput('')
  }
  const removeRole = (r) => setForm(f => ({ ...f, target_roles: f.target_roles.filter(x => x !== r) }))

  if (loading) return <div className="page-spinner"><div className="spinner" /></div>

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-comment">// profile.edit()</p>
          <h1 className="page-title">Edit Profile</h1>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* ── Info ── */}
      {tab === 'Info' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 card">
            <div className="card-head"><span className="card-comment">// basic_info</span></div>
            <div className="card-body space-y-4">
              <div className="mb-4">
  <label className="block text-sm font-medium text-gray-300 mb-1">
    Specialization / Theme
  </label>
  <select
    value={form.theme}
    onChange={(e) => setForm({ ...form, theme: e.target.value })}
    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2"
  >
    <option value="se">Software Engineering</option>
    <option value="ai">Artificial Intelligence</option>
  </select>
</div>

              <div>
                <label className="field-label">Full Name</label>
                <input className="field-input" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Headline</label>
                <input className="field-input mono" placeholder="ML Engineer | Python | TensorFlow"
                  value={form.headline}
                  onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Bio</label>
                <textarea className="field-textarea" rows={4} placeholder="Short professional summary..."
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Location</label>
                  <input className="field-input" placeholder="Toronto, ON"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Contact Email</label>
                  <input className="field-input" type="email"
                    value={form.contact_email}
                    onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Toggle value={form.is_public} onChange={v => setForm(f => ({ ...f, is_public: v }))} />
                <span className="text-xs text-gray-500">Make portfolio publicly discoverable</span>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="card h-fit">
            <div className="card-head"><span className="card-comment">// avatar</span></div>
            <div className="card-body text-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt=""
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-gray-700" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 mx-auto mb-4 flex items-center justify-center">
                  <User size={26} className="text-gray-600" />
                </div>
              )}
              <div {...aRoot()} className="drop-zone p-4">
                <input {...aInput()} />
                <Upload size={16} className="text-gray-600 mx-auto mb-1" />
                <p className="text-[11px] text-gray-600">Click or drop</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Skills ── */}
      {tab === 'Skills' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-head"><span className="card-comment">// skills[]</span></div>
            <div className="card-body">
              <div className="input-row mb-4">
                <input className="field-input mono text-xs flex-1" placeholder="Add skill..."
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                <button className="btn-secondary btn-sm" onClick={() => addSkill()}>
                  <Plus size={13} />
                </button>
              </div>
              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-gray-800">
                {SKILL_LIST.filter(s => !form.skills.includes(s)).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="tag hover:bg-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
              {/* Selected */}
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map(s => (
                  <span key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 border border-blue-600/30 text-blue-400 text-xs rounded-md font-mono">
                    {s}
                    <button onClick={() => removeSkill(s)}><X size={10} className="hover:text-red-400" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-comment">// target_roles[]</span></div>
            <div className="card-body">
              <div className="input-row mb-3">
                <input className="field-input flex-1" placeholder="e.g. Data Scientist"
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())} />
                <button className="btn-secondary btn-sm" onClick={addRole}><Plus size={13} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.target_roles.map(r => (
                  <span key={r}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md">
                    {r}
                    <button onClick={() => removeRole(r)}><X size={10} className="hover:text-red-400" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Resume ── */}
      {tab === 'Resume' && (
        <div className="card">
          <div className="card-head"><span className="card-comment">// resume</span></div>
          <div className="card-body">
            {profile?.resume && (
              <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium text-emerald-400 truncate">
                    {profile.resume.original_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {(profile.resume.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <a href={profile.resume.file_url} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary btn-sm">Download</a>
                <button onClick={delResume} className="btn-danger btn-sm"><Trash2 size={12} /></button>
              </div>
            )}
            <div {...rRoot()} className={`drop-zone ${isDragActive ? 'active' : ''}`}>
              <input {...rInput()} />
              <Upload size={28} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {isDragActive ? 'Drop it!' : 'Drop resume or click to browse'}
              </p>
              <p className="text-xs text-gray-700 mt-1">PDF or Word — max 10 MB</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Links ── */}
      {tab === 'Links' && (
        <div className="card">
          <div className="card-head"><span className="card-comment">// social_links[]</span></div>
          <div className="card-body">
            <div className="grid grid-cols-4 gap-2 mb-5">
              <select className="field-select text-xs col-span-1" value={newLink.link_type}
                onChange={e => setNewLink(l => ({ ...l, link_type: e.target.value }))}>
                {LINK_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input className="field-input text-xs mono col-span-2" placeholder="https://..."
                value={newLink.url}
                onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} />
              <button className="btn-primary btn-sm justify-center" onClick={addLink}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {(profile?.social_links || []).map(link => (
                <div key={link.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 border border-gray-750 rounded-lg">
                  <span className="badge badge-cyan">{link.link_type}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-xs text-blue-400 hover:text-blue-300 font-mono truncate transition-colors">
                    {link.url}
                  </a>
                  <button onClick={() => delLink(link.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {!profile?.social_links?.length && (
                <p className="text-center text-xs text-gray-700 py-6 font-mono">
                  // no links added
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
