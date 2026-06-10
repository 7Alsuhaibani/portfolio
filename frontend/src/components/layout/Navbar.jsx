import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin, isCoach } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '0 2rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '64px', boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #e94560, #0f3460)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px' }}>PortfolioHub</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/sharing">Sharing</NavLink>
            {(isAdmin || isCoach) && <NavLink to="/admin">Admin</NavLink>}
            <button onClick={handleLogout} style={{
              background: 'rgba(233,69,96,0.2)', border: '1px solid #e94560',
              color: '#e94560', padding: '6px 16px', borderRadius: 6,
              cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
            }}>Logout</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e94560, #533483)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              {user.full_name?.[0]?.toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <Link to="/register" style={{
              background: 'linear-gradient(135deg, #e94560, #533483)',
              color: '#fff', padding: '8px 20px', borderRadius: 6,
              textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
            }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem',
      padding: '6px 12px', borderRadius: 6, transition: 'all 0.2s',
      ':hover': { background: 'rgba(255,255,255,0.1)', color: '#fff' }
    }}
    onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }}
    onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ccc'; }}>
      {children}
    </Link>
  );
}
