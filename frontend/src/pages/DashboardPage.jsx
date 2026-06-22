import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import useAuth from '../hooks/useAuth'
import {
  FolderGit2, User, Share2, Star, ArrowRight, Plus,
  CheckCircle, Clock, AlertCircle, FileText, Users, Terminal,
} from 'lucide-react'

const STATUS = {
  draft:          { cls: 'status-draft',          label: 'Draft',          Icon: Clock },
  ready:          { cls: 'status-ready',          label: 'In Review',      Icon: Clock },
  needs_revision: { cls: 'status-needs_revision', label: 'Needs Revision', Icon: AlertCircle },
  published:      { cls: 'status-published',      label: 'Published',      Icon: CheckCircle },
}

function StatCard({ value, label, color, Icon }) {
  return (
    <div className="card p-5">
      <Icon size={16} className={`${color} mb-3`} />
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [profile, setProfile]   = useState(null)
  const [projects, setProjects] = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        if (isAdmin()) {
          const r = await api.get('/admin/dashboard')
          setStats(r.data)
        } else {
          const [p, pr] = await Promise.all([
            api.get('/profile/me'),
            api.get('/projects/me'),
          ])
          setProfile(p.data)
          setProjects(pr.data)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className="page-spinner"><div className="spinner" /></div>

  /* ── Admin ── */
  if (isAdmin() && stats) return (
    <div className="p-8 max-w-5xl">
      <p className="section-comment">// admin.dashboard()</p>
      <h1 className="page-title mb-8">Platform Overview</h1>
      <div className="grid grid-cols-5 gap-3 mb-8">
        <StatCard value={stats.total_profiles}    label="Portfolios"     color="text-blue-400"    Icon={User}      />
        <StatCard value={stats.published_profiles} label="Published"      color="text-emerald-400" Icon={CheckCircle}/>
        <StatCard value={stats.ready_profiles}    label="Ready"          color="text-amber-400"   Icon={Clock}     />
        <StatCard value={stats.needs_revision}    label="Needs Revision" color="text-red-400"     Icon={AlertCircle}/>
        <StatCard value={stats.total_projects}    label="Projects"       color="text-cyan-400"    Icon={FolderGit2}/>
      </div>
      <div className="flex gap-3">
        <Link to="/admin"   className="btn-primary"><Users size={14}/> All Portfolios</Link>
        <Link to="/reviews" className="btn-secondary"><Clock size={14}/> Review Queue</Link>
      </div>
    </div>
  )

  /* ── Student ── */
  const s = STATUS[profile?.review_status] || STATUS.draft
  const SIcon = s.Icon

  const checks = [
    { label: 'Headline set',      done: !!profile?.headline },
    { label: 'Bio written',       done: !!profile?.bio },
    { label: 'Resume uploaded',   done: !!profile?.resume },
    { label: 'At least 1 project',done: projects.length > 0 },
    { label: 'Social links',      done: (profile?.social_links?.length || 0) > 0 },
    { label: '3+ skills',         done: (profile?.skills?.length || 0) >= 3 },
  ]
  const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="section-comment"> dashboard</p>
          <h1 className="page-title">
            Welcome, <span className="text-blue-400 font-mono">{user?.username}</span>
          </h1>
        </div>
        <span className={s.cls}>
          <SIcon size={10} /> {s.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard value={projects.length}                     label="Projects"   color="text-blue-400"  Icon={FolderGit2} />
        <StatCard value={profile?.skills?.length || 0}        label="Skills"     color="text-cyan-400"  Icon={Terminal}   />
        <StatCard value={profile?.social_links?.length || 0}  label="Links"      color="text-emerald-400" Icon={Share2}   />
        <StatCard value={`${pct}%`}                           label="Complete"   color="text-amber-400" Icon={Star}       />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="card">
          <div className="card-head">
            <span className="card-comment"> quick_actions</span>
          </div>
          <div className="card-body space-y-2">
            <Link to="/projects/new"  className="btn-primary  w-full justify-center btn-sm"><Plus size={12}/>  New Project</Link>
            <Link to="/profile/edit"  className="btn-secondary w-full justify-center btn-sm"><User size={12}/>  Edit Profile</Link>
            <Link to="/share"         className="btn-secondary w-full justify-center btn-sm"><Share2 size={12}/>Share Link</Link>
            {profile?.resume && (
              <a href={profile.resume.file_url} target="_blank" rel="noopener noreferrer"
                className="btn-ghost w-full justify-center btn-sm">
                <FileText size={12}/> Resume
              </a>
            )}
          </div>
        </div>

        {/* Completion checklist */}
        <div className="card">
          <div className="card-head">
            <span className="card-comment"> profile_completion</span>
            <span className="text-[10px] font-mono text-blue-400">{pct}%</span>
          </div>
          <div className="card-body">
            <div className="w-full bg-gray-800 rounded-full h-0.5 mb-4">
              <div className="h-0.5 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="space-y-2.5">
              {checks.map(c => (
                <div key={c.label} className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    c.done ? 'bg-blue-600 border-blue-600' : 'border-gray-700'
                  }`}>
                    {c.done && <CheckCircle size={9} className="text-white" />}
                  </div>
                  <span className={`text-xs transition-colors ${c.done ? 'text-gray-400' : 'text-gray-700'}`}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent projects */}
        <div className="card">
          <div className="card-head">
            <span className="card-comment">recent_projects</span>
            <Link to="/projects" className="text-[10px] text-blue-500 hover:text-blue-400 font-mono transition-colors">
              all 
            </Link>
          </div>
          <div className="card-body space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-6">
                <FolderGit2 size={28} className="text-gray-800 mx-auto mb-2" />
                <p className="text-xs text-gray-700 mb-3">No projects yet</p>
                <Link to="/projects/new" className="btn-primary btn-xs">
                  <Plus size={11} /> Add first project
                </Link>
              </div>
            ) : projects.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-start gap-2.5 group">
                <FolderGit2 size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-gray-300 truncate group-hover:text-gray-100 transition-colors">
                      {p.title}
                    </p>
                    {p.is_featured && <Star size={9} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.tech_stack?.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
