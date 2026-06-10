import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Plus, X, Upload, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react'

// Simple markdown textarea (no external MDEditor dependency issues)
function MarkdownEditor({ value, onChange, placeholder }) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex gap-2">
        {['**bold**', '*italic*', '## Heading', '- List', '`code`'].map(snippet => (
          <button
            key={snippet}
            type="button"
            onClick={() => onChange(value + '\n' + snippet)}
            className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {snippet}
          </button>
        ))}
      </div>
      <textarea
        className="w-full px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        rows={10}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

const TEMPLATE = `## Overview
Brief overview of the project.

## Business Problem
What problem does this solve?

## Solution
How did you solve it?

## Architecture
System design and architecture decisions.

## My Role
What was your specific contribution?

## Results
Key outcomes and metrics.
`

export default function ProjectEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const imageRef = useRef()
  const isEdit = !!id

  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [techInput, setTechInput]   = useState('')
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    summary: '',
    description: TEMPLATE,
    business_problem: '',
    solution: '',
    architecture: '',
    tech_stack: [],
    skills_used: [],
    role: '',
    duration: '',
    github_url: '',
    demo_url: '',
    results: '',
    is_featured: false,
  })
  const [images, setImages] = useState([])

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/projects/${id}`)
        setForm({
          title:            data.title,
          summary:          data.summary || '',
          description:      data.description || TEMPLATE,
          business_problem: data.business_problem || '',
          solution:         data.solution || '',
          architecture:     data.architecture || '',
          tech_stack:       data.tech_stack || [],
          skills_used:      data.skills_used || [],
          role:             data.role || '',
          duration:         data.duration || '',
          github_url:       data.github_url || '',
          demo_url:         data.demo_url || '',
          results:          data.results || '',
          is_featured:      data.is_featured || false,
        })
        setImages(data.images || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const save = async (e) => {
    e.preventDefault()
    if (!form.title) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/projects/${id}`, form)
        toast.success('Project updated!')
      } else {
        await api.post('/projects', form)
        toast.success('Project created!')
        navigate('/projects')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addTag = (field, value, setter) => {
    const v = value.trim()
    if (v && !form[field].includes(v))
      setForm(f => ({ ...f, [field]: [...f[field], v] }))
    setter('')
  }

  const removeTag = (field, value) =>
    setForm(f => ({ ...f, [field]: f[field].filter(x => x !== value) }))

  const uploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !id) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      const { data } = await api.post(`/projects/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImages(imgs => [...imgs, data])
      toast.success('Image uploaded!')
    } catch {
      toast.error('Upload failed')
    }
  }

  const deleteImage = async (imageId) => {
    try {
      await api.delete(`/projects/${id}/images/${imageId}`)
      setImages(imgs => imgs.filter(i => i.id !== imageId))
      toast.success('Image removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Project' : 'New Project'}
          </h1>
          <p className="text-gray-500 text-sm">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Core Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Project Info</h2>

          <div>
            <label className="label">Project Title *</label>
            <input
              className="input"
              placeholder="Customer Churn Prediction System"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">One-line Summary</label>
            <input
              className="input"
              placeholder="Short description for project cards"
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Your Role</label>
              <input
                className="input"
                placeholder="ML Engineer"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <input
                className="input"
                placeholder="6 weeks"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={form.is_featured}
              onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="featured" className="text-sm text-gray-700">Mark as Featured Project</label>
          </div>
        </div>

        {/* Tech Stack & Skills */}
        <div className="card grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="font-semibold text-gray-900">Tech Stack</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Python, FastAPI..."
                value={techInput}
                onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('tech_stack', techInput, setTechInput))}
              />
              <button type="button" onClick={() => addTag('tech_stack', techInput, setTechInput)} className="btn-secondary px-3">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tech_stack.map(t => (
                <span key={t} className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                  {t} <button type="button" onClick={() => removeTag('tech_stack', t)}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-semibold text-gray-900">Skills Used</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="ML, Feature Engineering..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('skills_used', skillInput, setSkillInput))}
              />
              <button type="button" onClick={() => addTag('skills_used', skillInput, setSkillInput)} className="btn-secondary px-3">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.skills_used.map(s => (
                <span key={s} className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
                  {s} <button type="button" onClick={() => removeTag('skills_used', s)}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GitHub Repository</label>
              <input
                type="url"
                className="input"
                placeholder="https://github.com/..."
                value={form.github_url}
                onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Live Demo URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://..."
                value={form.demo_url}
                onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Description (Markdown) */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Project Description (Markdown)</h2>
          <p className="text-xs text-gray-500">Write your full project story using Markdown formatting.</p>
          <MarkdownEditor
            value={form.description}
            onChange={v => setForm(f => ({ ...f, description: v }))}
            placeholder="Describe your project in detail..."
          />
        </div>

        {/* Results */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Results & Impact</h2>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Key outcomes, metrics, or impact of the project..."
            value={form.results}
            onChange={e => setForm(f => ({ ...f, results: e.target.value }))}
          />
        </div>

        {/* Images (only for existing projects) */}
        {isEdit && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Screenshots / Images</h2>
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors"
            >
              <ImageIcon size={24} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload screenshot</p>
            </button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={`/${img.file_path}`}
                      alt={img.caption}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => deleteImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => navigate('/projects')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
