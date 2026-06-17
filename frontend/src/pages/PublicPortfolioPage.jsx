import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MapPin, Mail, Github, Linkedin, ExternalLink, Download, Star, X } from 'lucide-react'

const LINK_ICON = { linkedin: Linkedin, github: Github }

export default function PublicPortfolioPage() {
  const { token } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [modal, setModal]     = useState(null)

  useEffect(() => {
    api.get(`/profile/public/${token}`)
      .then(r => setProfile(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="spinner" />
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-6">
      <div>
        <p className="text-5xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-gray-200 mb-2">Portfolio Not Found</h2>
        <p className="text-sm text-gray-600 font-mono">// invalid or expired share token</p>
      </div>
    </div>
  )

  const featured = profile.projects?.filter(p => p.is_featured) || []
  const rest     = profile.projects?.filter(p => !p.is_featured) || []
  const all      = [...featured, ...rest]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Top bar */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-2">
          <span className="text-white font-bold text-[11px] leading-none w-4 h-4 bg-blue-600 rounded flex items-center justify-center" style={{ fontFamily: 'Georgia, serif' }}>N</span>
          <span className="text-[11px] font-mono text-gray-600">NSTEP</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Hero */}
        <div className="flex items-start gap-5">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-800 flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 flex-shrink-0">
              {profile.full_name?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-100 mb-0.5">{profile.full_name}</h1>
            {profile.headline && (
              <p className="text-sm font-mono text-blue-400 mb-2">{profile.headline}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
              {profile.location      && <span className="flex items-center gap-1"><MapPin size={10} />{profile.location}</span>}
              {profile.contact_email && <span className="flex items-center gap-1"><Mail size={10} />{profile.contact_email}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.social_links?.map(link => {
                const Icon = LINK_ICON[link.link_type] || ExternalLink
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200 text-xs rounded-lg transition-colors font-mono">
                    <Icon size={11} />{link.label || link.link_type}
                  </a>
                )
              })}
              {profile.resume && (
                <a href={profile.resume.file_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 border border-blue-600/30 hover:border-blue-500 text-blue-400 text-xs rounded-lg transition-colors font-mono">
                  <Download size={11} /> Resume
                </a>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        {profile.bio && (
          <div className="card">
            <div className="card-head"><span className="card-comment">// about</span></div>
            <div className="card-body text-sm text-gray-500 leading-relaxed">{profile.bio}</div>
          </div>
        )}

        {/* Skills + Roles */}
        {(profile.skills?.length > 0 || profile.target_roles?.length > 0) && (
          <div className="grid grid-cols-3 gap-4">
            {profile.skills?.length > 0 && (
              <div className="col-span-2 card">
                <div className="card-head"><span className="card-comment">// skills[]</span></div>
                <div className="card-body flex flex-wrap gap-1.5">
                  {profile.skills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
            )}
            {profile.target_roles?.length > 0 && (
              <div className="card">
                <div className="card-head"><span className="card-comment">// seeking</span></div>
                <div className="card-body space-y-2">
                  {profile.target_roles.map(r => (
                    <span key={r} className="block badge badge-blue text-center">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {all.length > 0 && (
          <div>
            <p className="section-comment mb-3">// projects[{all.length}]</p>
            <div className="space-y-3">
              {all.map(project => (
                <div key={project.id}
                  className="card hover:border-gray-700 transition-colors cursor-pointer"
                  onClick={() => setModal(project)}>
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {project.is_featured && <Star size={11} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
                          <h3 className="text-sm font-semibold text-gray-200">{project.title}</h3>
                        </div>
                        {project.summary && <p className="text-xs text-gray-500 mb-2">{project.summary}</p>}
                        {project.role && (
                          <p className="text-[10px] font-mono text-gray-700 mb-2">
                            {project.role}{project.duration && ` · ${project.duration}`}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {project.tech_stack?.slice(0, 5).map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-500 hover:text-gray-200 transition-colors">
                            <Github size={12} />
                          </a>
                        )}
                        {project.demo_url && (
                          <a href={project.demo_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 bg-blue-600/10 border border-blue-600/30 hover:border-blue-500 rounded-lg text-blue-400 transition-colors">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[10px] font-mono text-gray-800 pt-6">
          // powered by NSTEP
        </p>
      </div>

      {/* Project detail modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-800">
              <div>
                <h2 className="font-semibold text-gray-100">{modal.title}</h2>
                {modal.summary && <p className="text-xs text-gray-500 mt-1">{modal.summary}</p>}
              </div>
              <button onClick={() => setModal(null)} className="text-gray-600 hover:text-gray-300 mt-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex flex-wrap gap-1.5">
                {modal.tech_stack?.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
              {[
                ['business_problem', 'Problem'],
                ['solution', 'Solution'],
                ['architecture', 'Architecture'],
                ['results', 'Results'],
              ].filter(([k]) => modal[k]).map(([k, label]) => (
                <div key={k}>
                  <p className="section-comment mb-1">// {label.toLowerCase()}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{modal[k]}</p>
                </div>
              ))}
              {modal.description && (
                <div>
                  <p className="section-comment mb-2">// description</p>
                  <div className="md-content text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{modal.description}</ReactMarkdown>
                  </div>
                </div>
              )}
              {modal.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {modal.images.map(img => (
                    <img key={img.id} src={img.image_url} alt=""
                      className="rounded-lg w-full h-36 object-cover border border-gray-800" />
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                {modal.github_url && (
                  <a href={modal.github_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                    <Github size={12} /> GitHub
                  </a>
                )}
                {modal.demo_url && (
                  <a href={modal.demo_url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                    <ExternalLink size={12} /> Live Demo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}