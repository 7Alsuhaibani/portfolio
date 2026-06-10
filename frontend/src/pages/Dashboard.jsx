import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI, projectsAPI, portfolioAPI } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    profileAPI.getMe().then(r => setProfile(r.data)).catch(() => {});
    projectsAPI.getAll().then(r => setProjects(r.data)).catch(() => {});
    portfolioAPI.getLinks().then(r => setLinks(r.data)).catch(() => {});
    portfolioAPI.getMyReviews().then(r => setReviews(r.data)).catch(() => {});
  }, []);

  const latestReview = reviews[reviews.length - 1];
  const statusColors = { draft: '#888', needs_revision: '#ff6b6b', ready: '#51cf66', published: '#339af0' };

  const cards = [
    { icon: '👤', label: 'Profile', value: profile ? 'Complete' : 'Not Created', color: '#533483', link: '/profile' },
    { icon: '📁', label: 'Projects', value: projects.length, color: '#e94560', link: '/projects' },
    { icon: '🔗', label: 'Share Links', value: links.filter(l => l.is_active).length, color: '#0f3460', link: '/sharing' },
    { icon: '⭐', label: 'Status', value: latestReview?.status || 'Draft', color: statusColors[latestReview?.status] || '#888', link: '/sharing' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            Welcome back, <span style={{ color: '#e94560' }}>{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Here's your portfolio overview</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {cards.map(card => (
            <Link to={card.link} key={card.label} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s',
                borderLeft: `4px solid ${card.color}` }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: 32, marginBottom: '0.5rem' }}>{card.icon}</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.3rem' }}>{card.label}</div>
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '1.5rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: '+ Add Project', link: '/projects', color: '#e94560' },
              { label: '✏️ Edit Profile', link: '/profile', color: '#533483' },
              { label: '🔗 Share Portfolio', link: '/sharing', color: '#0f3460' },
              { label: '📄 Upload Resume', link: '/profile', color: '#2d6a4f' },
            ].map(action => (
              <Link key={action.label} to={action.link} style={{
                background: action.color, color: '#fff', padding: '10px 20px',
                borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
              }}>{action.label}</Link>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem' }}>
            <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '1.5rem' }}>Recent Projects</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {projects.slice(0, 3).map(p => (
                <Link to={`/projects/${p.id}`} key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1rem',
                  textDecoration: 'none', border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10,
                    background: 'linear-gradient(135deg, #e94560, #533483)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📁</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{p.title}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{p.summary || p.tech_stack}</div>
                  </div>
                  {p.is_featured && <span style={{ marginLeft: 'auto', background: '#e94560', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem' }}>Featured</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem' }}>
            <h2 style={{ color: '#fff', marginTop: 0 }}>Latest Review</h2>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 10, borderLeft: `4px solid ${statusColors[latestReview.status]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#ccc', fontWeight: 600 }}>By {latestReview.reviewer_name}</span>
                <span style={{ color: statusColors[latestReview.status], fontWeight: 700, textTransform: 'capitalize' }}>{latestReview.status?.replace('_', ' ')}</span>
              </div>
              {latestReview.feedback && <p style={{ color: '#aaa', margin: 0 }}>{latestReview.feedback}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
