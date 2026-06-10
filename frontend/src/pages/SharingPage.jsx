import { useState, useEffect } from 'react';
import { portfolioAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function SharingPage() {
  const [links, setLinks] = useState([]);
  const [expireDays, setExpireDays] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    portfolioAPI.getLinks().then(r => setLinks(r.data)).catch(() => {});
  }, []);

  const createLink = async () => {
    setCreating(true);
    try {
      const res = await portfolioAPI.createLink({ expires_days: expireDays ? parseInt(expireDays) : null });
      setLinks(prev => [...prev, res.data]);
      setExpireDays('');
      toast.success('Shareable link created!');
    } catch { toast.error('Failed to create link'); }
    setCreating(false);
  };

  const deactivate = async (id) => {
    try {
      await portfolioAPI.deactivateLink(id);
      setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: false } : l));
      toast.success('Link deactivated');
    } catch { toast.error('Failed to deactivate'); }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/view/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const getViewUrl = (token) => `${window.location.origin}/view/${token}`;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Share Portfolio</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Generate private links to share your portfolio with employers</p>

        {/* Create Link */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', marginTop: 0 }}>Generate New Link</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Expiration (optional)</label>
              <select value={expireDays} onChange={e => setExpireDays(e.target.value)} style={{
                width: '100%', padding: '10px', background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', outline: 'none'
              }}>
                <option value="">No expiration</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            <button onClick={createLink} disabled={creating} style={{
              background: 'linear-gradient(135deg, #e94560, #533483)', color: '#fff', border: 'none',
              padding: '10px 28px', borderRadius: 10, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem', whiteSpace: 'nowrap'
            }}>
              {creating ? 'Creating...' : '🔗 Create Link'}
            </button>
          </div>
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '1rem', marginBottom: 0 }}>
            Links are private — only people with the exact URL can view your portfolio.
          </p>
        </div>

        {/* Links List */}
        <div>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Your Links ({links.filter(l => l.is_active).length} active)</h2>
          {links.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: '0.5rem' }}>🔗</div>
              <p>No links created yet. Create your first shareable link above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {links.map(link => (
                <div key={link.id} style={{
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${link.is_active ? 'rgba(82,207,80,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: '1.25rem', opacity: link.is_active ? 1 : 0.5
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: link.is_active ? '#51cf66' : '#888', fontWeight: 700, fontSize: '0.85rem' }}>
                          {link.is_active ? '● Active' : '○ Inactive'}
                        </span>
                        {link.expires_at && (
                          <span style={{ color: '#888', fontSize: '0.8rem' }}>
                            Expires: {new Date(link.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>
                          Created: {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {link.is_active && (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#aaa', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, wordBreak: 'break-all' }}>
                          {getViewUrl(link.token)}
                        </div>
                      )}
                    </div>
                    {link.is_active && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button onClick={() => copyLink(link.token)} style={{ background: 'rgba(82,207,80,0.2)', border: '1px solid rgba(82,207,80,0.4)', color: '#51cf66', padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                          📋 Copy
                        </button>
                        <a href={getViewUrl(link.token)} target="_blank" rel="noreferrer" style={{ background: 'rgba(15,52,96,0.4)', border: '1px solid rgba(15,52,96,0.6)', color: '#74b9ff', padding: '7px 14px', borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                          👁 Preview
                        </a>
                        <button onClick={() => deactivate(link.id)} style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.3)', color: '#e94560', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' }}>
                          Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
