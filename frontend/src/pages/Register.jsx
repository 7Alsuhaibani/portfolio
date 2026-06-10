import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Register() {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.access_token, res.data.user);
      toast.success('Account created successfully!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '3rem',
        width: '100%', maxWidth: 450, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 50, marginBottom: '0.5rem' }}>🚀</div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Create Account</h1>
          <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Build your professional portfolio</p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'John Doe' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]} required
                onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
            </div>
          ))}

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="student">Student</option>
              <option value="career_coach">Career Coach</option>
              <option value="employer">Employer / Recruiter</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', marginTop: '0.5rem',
            background: loading ? '#555' : 'linear-gradient(135deg, #e94560, #533483)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
          }}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>

        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: '#e94560' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
