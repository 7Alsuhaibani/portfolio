import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, seedAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.access_token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const seedDB = async () => {
    try {
      const res = await seedAPI.run();
      toast.success('Demo data loaded! ' + JSON.stringify(res.data.accounts?.admin));
    } catch { toast.info('Demo data may already exist'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '3rem',
        width: '100%', maxWidth: 420, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 50, marginBottom: '0.5rem' }}>🎓</div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Welcome Back</h1>
          <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Sign in to your portfolio</p>
        </div>

        <form onSubmit={handleSubmit}>
          <FormField label="Email" type="email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" />
          <FormField label="Password" type="password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', marginTop: '1rem',
            background: loading ? '#555' : 'linear-gradient(135deg, #e94560, #533483)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s'
          }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>

        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#e94560' }}>Create one</Link>
        </p>

        <hr style={{ border: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />
        <button onClick={seedDB} style={{
          width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
          color: '#aaa', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
          cursor: 'pointer', fontSize: '0.85rem'
        }}>🌱 Load Demo Data (Dev Only)</button>
        <p style={{ color: '#666', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
          Demo: admin@demo.com / admin123
        </p>
      </div>
    </div>
  );
}

function FormField({ label, ...props }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</label>
      <input {...props} required style={{
        width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff',
        fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.2s'
      }} />
    </div>
  );
}
