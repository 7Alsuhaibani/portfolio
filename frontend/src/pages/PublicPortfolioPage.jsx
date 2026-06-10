import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import {
  MapPin, Mail, Github, Linkedin, Globe, ExternalLink,
  Star, FileText, ChevronDown, ChevronUp
} from 'lucide-react'

function MarkdownView({ content }) {
  if (!content) return null
  // Simple markdown to HTML (for full support use react-markdown)
  const html = content
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-gray-900 mt-5 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
  return (
    <div
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }}
    />
  )
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              {project.is_featured && (
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
              )}
              <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
            </div>
            {(project.role || project.duration) && (
              <p className="text-sm text-gray-500 mt-0.5">
                {[project.role, project.duration].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5">
                <Github size={14} /> GitHub
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg px-3 py-1.5">
                <ExternalLink size={14} /> Demo
              </a>
            )}
          </div>
        </div>

        {project.summary && (
          <p className="text-gray-600 text-sm mb-4">{project.summary}</p>
        )}

        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tech_stack.map(t => (
              <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
        )}

        {project.results && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Results</p>
            <p className="text-sm text-green-800">{project.results}</p>
          </div>
        )}

        {project.images?.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {project.images.map(img => (
              <img
                key={img.id}
                src={`/${img.file_path}`}
                alt={img.caption || ''}
                className="rounded-lg h-20 w-full object-cover"
              />
            ))}
          </div>
        )}

        {project.description && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {expanded ? 'Hide details' : 'Show full details'}
            </button>
            {expanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <MarkdownView content={project.description} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PublicPortfolioPage() {
  const { token, slug } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = token ? `/share/view/${token}` : `/share/slug/${slug}`
        const { data } = await api.get(endpoint)
        setProfile(data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Portfolio not found')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Portfolio Not Found</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  )

  const featured = profile.projects?.filter(p => p.is_featured) || []
  const regular  = profile.projects?.filter(p => !p.is_featured) || []
  const allProjects = [...featured, ...regular]

  const linkIcons = { linkedin: Linkedin, github: Github, website: Globe }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden">
              {profile.profile_photo
                ? <img src={`/${profile.profile_photo}`} alt="" className="w-full h-full object-cover" />
                : profile.user?.full_name?.[0] || 'U'
              }
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{profile.user?.full_name}</h1>
              {profile.headline && (
                <p className="text-primary-300 text-lg mb-3">{profile.headline}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-4">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {profile.location}
                  </span>
                )}
                {profile.contact_email && (
                  <a href={`mailto:${profile.contact_email}`}
                     className="flex items-center gap-1.5 hover:text-white">
                    <Mail size={14} /> {profile.contact_email}
                  </a>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-3">
                {profile.social_links?.map(link => {
                  const Icon = linkIcons[link.link_type] || ExternalLink
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Icon size={14} />
                      {link.label || link.link_type}
                    </a>
                  )
                })}
                {profile.resume_file && (
                  <a
                    href={`/${profile.resume_file}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <FileText size={14} /> Download Resume
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* About */}
        {profile.bio && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <div className="card">
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          </section>
        )}

        {/* Skills & Roles */}
        {(profile.skills?.length > 0 || profile.target_roles?.length > 0) && (
          <section className="grid grid-cols-2 gap-6">
            {profile.skills?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(s => (
                    <span key={s} className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full border border-primary-100">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.target_roles?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Open To</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.target_roles.map(r => (
                    <span key={r} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Projects */}
        {allProjects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Projects ({allProjects.length})
            </h2>
            <div className="space-y-6">
              {allProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-400 border-t border-gray-200">
          Built with Portfolio Platform · WeCloudData
        </div>
      </div>
    </div>
  )
}
