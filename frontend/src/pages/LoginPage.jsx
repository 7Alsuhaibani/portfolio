import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth'
import { ArrowRight, Loader2 } from 'lucide-react'

const DEMOS = [
  { label: 'student',  email: 'alice@student.com',     pass: 'student123' },
  { label: 'coach',    email: 'coach@weclouddata.com', pass: 'coach123'   },
  { label: 'admin',    email: 'admin@weclouddata.com', pass: 'admin123'   },
]

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login }           = useAuth()
  const navigate            = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Authenticated')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const fill = (email, pass) => setForm({ email, password: pass })

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-gray-900 border-r border-gray-800 p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Georgia, serif' }}>N</span>
          </div>
          <span className="text-gray-100 font-semibold text-sm">NSTEP</span>
        </div>

        {/* What is NSTEP */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 font-mono text-xs leading-relaxed">
          <p className="text-gray-600 mb-3"></p>
          <p className="text-gray-300 mb-1">
            <span className="text-blue-400">NSTEP</span> helps students build a
          </p>
          <p className="text-gray-300 mb-3">professional portfolio, get it reviewed</p>
          <p className="text-gray-300 mb-4">by a coach, and share it with employers.</p>
          <p className="text-gray-300 mb-1">--This project was built by</p>
          <div className="space-y-1.5 border-t border-gray-800 pt-3">
            <p className="text-gray-500"><span className="text-emerald-400">1.</span> alice ALSUHAIBANI</p>
            <p className="text-gray-500"><span className="text-emerald-400">2.</span> ABDULMAJEED MAGHRABI</p>
            <p className="text-gray-500"><span className="text-emerald-400">3.</span> KHALID ALQAHTANI</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {[
            '',
            '',
            '',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-blue-500 font-mono"></span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="section-comment mb-1"></p>
          <h1 className="page-title mb-8">Sign In</h1>

          <form onSubmit={submit} className="space-y-4 mb-6">
            <div>
              <label className="field-label">Email</label>
              <input type="email" className="field-input" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required autoFocus />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" className="field-input" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading
                ? <Loader2 size={14} className="animate-spin" />
                : <ArrowRight size={14} />}
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-900">
            <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest mb-3">
              // demo_accounts
            </p>
            <div className="space-y-1.5">
              {DEMOS.map(d => (
                <button
                  key={d.label}
                  onClick={() => fill(d.email, d.pass)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`badge ${
                      d.label === 'admin'  ? 'badge-red'    :
                      d.label === 'coach'  ? 'badge-yellow' : 'badge-blue'
                    }`}>{d.label}</span>
                    <span className="text-xs text-gray-500 font-mono">{d.email}</span>
                  </div>
                  <ArrowRight size={11} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            No account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              Register →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}