import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuth from '../hooks/useAuth'
import { Terminal, ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm]     = useState({ email: '', password: '', username: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const { register }        = useAuth()
  const navigate            = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password min 6 chars'); return }
    setLoading(true)
    try {
      await register(form.email, form.password, form.username, form.role)
      toast.success('Account created')
      navigate('/profile/setup')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Terminal size={15} className="text-white" />
          </div>
          <span className="text-gray-100 font-semibold text-sm">PortfolioHub</span>
        </div>

        <p className="section-comment mb-1">// register()</p>
        <h1 className="page-title mb-8">Create Account</h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">Username</label>
            <input type="text" className="field-input mono" placeholder="ahmed_ml"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="field-input" placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" className="field-input" placeholder="Min 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required />
          </div>
          <div>
            <label className="field-label">Role</label>
            <select className="field-select"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="student">Student</option>
              <option value="coach">Career Coach</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
