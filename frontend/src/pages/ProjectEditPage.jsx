import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Save, ArrowLeft, Plus, X, Upload, Loader2, Eye, Code2, Star } from 'lucide-react'

const TABS = ['Overview', 'Description', 'Results', 'Media']

export default function ProjectEditPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = !!id

  const [tab, setTab]       = useState('Overview')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [mdPreview, setMdPreview] = useState(false)
  const [images, setImages] = useState([])
  const [techInput, setTechInput] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState({
    title: '', summary: '', description: '',
    business_problem: '', solution: '', architecture: '',
    tech_stack: [], skills_used: [],
    role: '', duration: '', results: '',
    github_url: '', demo_url: '',
    is_featured: false, order_index: 0,
  })

  useEffect(() => {
    if (!isEdit) return
    api.get(`/projects/${id}`).then(r => {
      const p = r.data
      setForm({
        title: p.title||'', summary: p.summary||'', description: p.description||'',
        business_problem: p.business_problem||'', solution: p.solution||'',
        architecture: p.architecture||'', tech_stack: p.tech_stack||[],
        skills_used: p.skills_used||[], role: p.role||'', duration: p.duration||'',
        results: p.results||'', github_url: p.github_url||'', demo_url: p.demo_url||'',
        is_featured: p.is_featured||false, order_index: p.order_index||0,
      })
      setImages(p.images||[])
    }).finally(() => setLoading(false))
  }, [id, isEdit])

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      if (isEdit) { await api.put(`/projects/${id}`, form); toast.success('Updated') }
      else        { await api.post('/projects/', form); toast.success('Created'); navigate('/projects') }
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const addTech  = () => { const v = techInput.trim(); if (v && !form.tech_stack.includes(v)) setForm(f => ({ ...f, tech_stack: [...f.tech_stack, v] })); setTechInput('')  }
  const addSkill = () => { const v = skillInput.trim(); if (v && !form.skills_used.includes(v)) setForm(f => ({ ...f, skills_used: [...f.skills_used, v] })); setSkillInput('') }

  const onDrop = useCallback(async (files) => {
    if (!isEdit) { toast.error('Save project first to upload images'); return }
    for (const file of files) {
      const fd = new FormData(); fd.append('file', file)
      try {
        const r = await api.post(`/projects/${id}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setImages(prev => [...prev, r.data])
      } catch { toast.error('Upload failed') }
    }
  }, [id, isEdit])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] },
  })

  const delImage = async (imgId) => {
    await api.delete(`/projects/${id}/images/${imgId}`)
    setImages(prev => prev.filter(i => i.id !== imgId))
    toast.success('Removed')
  }

  if (loading) return <div className="page-spinner"><div className="spinner" /></div>

  const ta = (field, placeholder, rows = 4) => (
    <textarea
      className="field-textarea mono text-xs w-full"
      rows={rows}
      placeholder={placeholder}
      value={form[field]}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
    />
  )

  const chip = (v, onRemove, color = 'tag') => (
    <span key={v} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md ${
      color === 'blue'
        ? 'bg-blue-600/10 border border-blue-600/30 text-blue-400 font-mono'
        : 'bg-gray-800 border border-gray-700 text-gray-400'
    }`}>
      {v}
      <button onClick={() => onRemove(v)}><X size={9} className="hover:text-red-400" /></button>
    </span>
  )

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="btn-ghost btn-sm px-2">
            <ArrowLeft size={15} />
          </button>
          <div>
            <p className="section-comment">// {isEdit ? 'project.update()' : 'project.create()'}</p>
            <h1 className="page-title">{isEdit ? 'Edit Project' : 'New Project'}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {tab === 'Description' && (
            <button onClick={() => setMdPreview(v => !v)} className="btn-secondary btn-sm">
              {mdPreview ? <Code2 size={13}/> : <Eye size={13}/>}
              {mdPreview ? 'Edit' : 'Preview'}
            </button>
          )}
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-head"><span className="card-comment"> project_meta</span></div>
            <div className="card-body space-y-4">
              <div>
                <label className="field-label">Title *</label>
                <input className="field-input" placeholder="Customer Churn Prediction System"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Summary</label>
                <input className="field-input" placeholder="One-line overview for project cards..."
                  value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Your Role</label>
                  <input className="field-input" placeholder="Lead Data Scientist"
                    value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Duration</label>
                  <input className="field-input" placeholder="3 months"
                    value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">GitHub URL</label>
                  <input className="field-input mono text-xs" placeholder="https://github.com/..."
                    value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Demo URL</label>
                  <input className="field-input mono text-xs" placeholder="https://..."
                    value={form.demo_url} onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-comment"> tech_stack</span></div>
            <div className="card-body">
              <div className="input-row mb-3">
                <input className="field-input mono text-xs flex-1" placeholder="Python, FastAPI, Docker..."
                  value={techInput} onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())} />
                <button className="btn-secondary btn-sm" onClick={addTech}><Plus size={13}/></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tech_stack.map(t => chip(t, (v) => setForm(f => ({ ...f, tech_stack: f.tech_stack.filter(x => x !== v) })), 'blue'))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-comment"> skills_used</span></div>
            <div className="card-body">
              <div className="input-row mb-3">
                <input className="field-input text-xs flex-1" placeholder="Machine Learning, Feature Engineering..."
                  value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                <button className="btn-secondary btn-sm" onClick={addSkill}><Plus size={13}/></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.skills_used.map(s => chip(s, (v) => setForm(f => ({ ...f, skills_used: f.skills_used.filter(x => x !== v) })), 'gray'))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-1">
            <div className={`toggle ${form.is_featured ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}>
              <div className={`toggle-thumb ${form.is_featured ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Star size={11} className={form.is_featured ? 'text-amber-400' : 'text-gray-700'} />
              Feature on portfolio homepage
            </span>
          </div>
        </div>
      )}

      {/* ── Description ── */}
      {tab === 'Description' && (
        <div className={`grid gap-4 ${mdPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="space-y-4">
            {[
              { key: 'business_problem', label: 'business_problem', ph: 'What problem did you solve? Why did it matter?',       rows: 3 },
              { key: 'solution',         label: 'solution',         ph: 'Your approach and methodology...',                     rows: 3 },
              { key: 'architecture',     label: 'architecture',     ph: 'System design, data flow, model architecture...',      rows: 3 },
              { key: 'description',      label: 'description (markdown)', ph: '## Overview\n\nDetailed write-up...', rows: 8 },
            ].map(({ key, label, ph, rows }) => (
              <div key={key} className="card">
                <div className="card-head"><span className="card-comment"> {label}</span></div>
                <div className="card-body">{ta(key, ph, rows)}</div>
              </div>
            ))}
          </div>
          {mdPreview && (
            <div className="card h-fit sticky top-4">
              <div className="card-head"><span className="card-comment"> preview</span></div>
              <div className="card-body md-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {form.description || '*Start writing to see preview...*'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Results ── */}
      {tab === 'Results' && (
        <div className="card">
          <div className="card-head"><span className="card-comment"> results & impact</span></div>
          <div className="card-body">
            <p className="text-[10px] text-gray-600 font-mono mb-3">
              # Include concrete metrics: accuracy %, latency ms, revenue impact, users served
            </p>
            {ta('results', 'e.g. Reduced churn by 23%. Model accuracy: 92%. Processed 1M events/day.', 10)}
          </div>
        </div>
      )}

      {/* ── Media ── */}
      {tab === 'Media' && (
        <div className="card">
          <div className="card-head"><span className="card-comment"> screenshots[]</span></div>
          <div className="card-body">
            {!isEdit && (
              <div className="p-3 mb-4 border border-amber-500/20 bg-amber-500/5 rounded-lg text-xs text-amber-400 font-mono">
                 Save project first to enable image uploads
              </div>
            )}
            <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''} mb-4`}>
              <input {...getInputProps()} />
              <Upload size={24} className="text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{isDragActive ? 'Drop!' : 'Drop screenshots or click'}</p>
              <p className="text-xs text-gray-700 mt-1 font-mono"> PNG, JPG, GIF</p>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-800">
                    <img src={img.image_url} alt="" className="w-full h-28 object-cover" />
                    <button onClick={() => delImage(img.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
