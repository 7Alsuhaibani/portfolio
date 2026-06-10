import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import useAuthStore from '../hooks/useAuth'
import {
  User, FolderOpen, Share2, CheckCircle,
  Clock, AlertCircle, TrendingUp, Plus, ExternalLink
} from 'lucide-react'

const StatusBadge = ({ status }) => {
  const map = {
    draft:          { color: 'bg-gray-100 text-gray-700',   label: 'Draft' },
    needs_revision: { color: 'bg-yellow-100 text-yellow-700', label: 'Needs Revision' },
    ready:          { color: 'bg-blue-100 text-blue-700',   label: 'Ready' },
    published:      { color: 'bg-green-100 text-green-700', label: 'Published' },
  }
  const s = map[status] || map.draft
  return <span className={`badge ${s.color}`}>{s.label}</span>
}

export default function DashboardPage() {
  const { user, isAdmin, isCoach } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'student') {
          const [pRes, prRes] = await Promise.allSettled([
            api.get('/profiles/me'),
            api.get('/projects/me'),
          ])
          if (pRes.status === 'fulfilled') setProfile(pRes.value.data)
          if (prRes.status === 'fulfilled') setProjects(prRes.value.data)
        }
        if (isAdmin()) {
          const { data } = await api.get('/admin/dashboard')
          setStats(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good day, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your portfolio progress</p>
      </div>

      {/* Student View */}
      {user?.role === 'student' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <User size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Profile Status</p>
                {profile
                  ? <StatusBadge status={profile.status} />
                  : <span className="text-sm text-gray-400">Not created</span>
                }
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FolderOpen size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Projects</p>
                <p className="text-xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Share2 size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Portfolio</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.is_public ? '🌐 Public' : '🔒 Private'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          {!profile ? (
            <div className="card text-center py-12 mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Portfolio</h3>
              <p className="text-gray-500 text-sm mb-6">
                Start building your professional portfolio to showcase your work.
              </p>
              <Link to="/profile/setup" className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Get Started
              </Link>
            </div>
          ) : (
            <div className="card mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                    {profile.user?.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{profile.user?.full_name}</h3>
                    <p className="text-gray-500 text-sm">{profile.headline}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={profile.status} />
                    </div>
                  </div>
                </div>
                <Link to="/profile/edit" className="btn-secondary text-sm">Edit Profile</Link>
              </div>

              {profile.skills?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.skills.slice(0, 8).map(s => (
                    <span key={s} className="badge bg-gray-100 text-gray-700">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Projects</h3>
                <Link to="/projects" className="text-sm text-primary-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.tech_stack?.slice(0, 3).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.is_featured && (
                        <span className="badge bg-yellow-100 text-yellow-700">Featured</span>
                      )}
                      <Link
                        to={`/projects/${p.id}/edit`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile && projects.length === 0 && (
            <div className="card text-center py-10">
              <FolderOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No projects yet. Add your first project!</p>
              <Link to="/projects/new" className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Add Project
              </Link>
            </div>
          )}
        </>
      )}

      {/* Admin View */}
      {isAdmin() && stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Profiles',   value: stats.total_profiles,     icon: User,        color: 'blue' },
            { label: 'Published',        value: stats.published_portfolios, icon: CheckCircle, color: 'green' },
            { label: 'Ready for Review', value: stats.ready_portfolios,   icon: TrendingUp,  color: 'indigo' },
            { label: 'Needs Revision',   value: stats.needs_revision,     icon: AlertCircle, color: 'yellow' },
            { label: 'Drafts',           value: stats.draft_portfolios,   icon: Clock,       color: 'gray' },
            { label: 'Total Projects',   value: stats.total_projects,     icon: FolderOpen,  color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                <Icon size={22} className={`text-${color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coach View */}
      {isCoach() && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Portfolio Reviews</h3>
          <Link to="/reviews" className="btn-primary inline-flex items-center gap-2">
            <ExternalLink size={16} /> Go to Reviews
          </Link>
        </div>
      )}
    </div>
  )
}
