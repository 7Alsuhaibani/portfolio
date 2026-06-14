import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import {
  LayoutDashboard, User, FolderGit2, Share2,
  Eye, LogOut, Users, ChevronRight, Terminal, ClipboardList,
} from 'lucide-react'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const doLogout = () => { logout(); navigate('/login') }

  const links = isAdmin()
    ? [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/reviews',   icon: ClipboardList,   label: 'Review Queue' },
        { to: '/admin',     icon: Users,            label: 'All Portfolios' },
      ]
    : [
        { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/profile/edit', icon: User,            label: 'Profile' },
        { to: '/projects',     icon: FolderGit2,      label: 'Projects' },
        { to: '/share',        icon: Share2,           label: 'Share' },
        { to: '/preview',      icon: Eye,              label: 'Preview' },
      ]

  const roleColor = { admin: 'text-red-400', coach: 'text-amber-400', student: 'text-blue-400' }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Terminal size={13} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100 leading-none">PortfolioHub</p>
              <p className="text-[9px] font-mono text-gray-600 mt-0.5">WeCloudData</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-2 mb-2 text-[9px] font-mono font-semibold text-gray-700 uppercase tracking-widest">
            Navigation
          </p>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Icon size={14} />
                  <span className="flex-1 text-sm">{label}</span>
                  {isActive && <ChevronRight size={11} className="text-blue-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">{user?.username}</p>
              <p className={`text-[10px] font-mono ${roleColor[user?.role] || 'text-gray-500'}`}>
                {user?.role}
              </p>
            </div>
            <button
              onClick={doLogout}
              title="Logout"
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
