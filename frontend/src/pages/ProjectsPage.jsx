import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Plus, Edit2, Trash2, Github, ExternalLink, Star, FolderGit2 } from 'lucide-react'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/projects/me').then(r => setProjects(r.data)).finally(() => setLoading(false))
  }, [])

  const del = async (id) => {
    if (!confirm('Delete this project?')) return
    await api.delete(`/projects/${id}`)
    setProjects(p => p.filter(x => x.id !== id))
    toast.success('Deleted')
  }

  if (loading) return <div className="page-spinner"><div className="spinner" /></div>

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-comment"> projects_list</p>
          <h1 className="page-title">My Projects</h1>
        </div>
        <Link to="/projects/new" className="btn-primary">
          <Plus size={14} /> New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-20">
          <FolderGit2 size={40} className="text-gray-800 mx-auto mb-3" />
          <p className="text-gray-600 text-sm mb-1">No projects yet</p>
          <p className="text-gray-700 text-xs mb-6 font-mono"> projects = []</p>
          <Link to="/projects/new" className="btn-primary inline-flex">
            <Plus size={13} /> Add First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="card hover:border-gray-700 transition-colors">
              <div className="card-head">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderGit2 size={13} className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-200 truncate">{p.title}</span>
                </div>
                {p.is_featured && <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
              </div>
              <div className="card-body">
                {p.summary && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{p.summary}</p>
                )}
                {p.role && (
                  <p className="text-[10px] font-mono text-gray-600 mb-3">
                    <span className="text-gray-700">role:</span>{' '}
                    <span className="text-gray-500">{p.role}</span>
                    {p.duration && <><span className="text-gray-700"> · duration:</span>{' '}<span className="text-gray-500">{p.duration}</span></>}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.tech_stack?.slice(0, 4).map(t => <span key={t} className="tag">{t}</span>)}
                  {p.tech_stack?.length > 4 && (
                    <span className="tag text-gray-600">+{p.tech_stack.length - 4}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div className="flex gap-1">
                    {p.github_url && (
                      <a href={p.github_url} target="_blank" rel="noopener noreferrer"
                        className="btn-ghost btn-xs px-2"><Github size={12} /></a>
                    )}
                    {p.demo_url && (
                      <a href={p.demo_url} target="_blank" rel="noopener noreferrer"
                        className="btn-ghost btn-xs px-2"><ExternalLink size={12} /></a>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Link to={`/projects/${p.id}/edit`} className="btn-secondary btn-xs">
                      <Edit2 size={11} /> Edit
                    </Link>
                    <button onClick={() => del(p.id)} className="btn-danger btn-xs px-2">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
