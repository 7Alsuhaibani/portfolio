import { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ headline: '', bio: '', location: '', target_roles: '', contact_email: '', is_public: true });
  const [newLink, setNewLink] = useState({ link_type: 'linkedin', url: '', label: '' });
  const [newSkill, setNewSkill] = useState({ name: '', category: 'technical' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    profileAPI.getMe()
      .then(r => { setProfile(r.data); setForm({ headline: r.data.headline || '', bio: r.data.bio || '', location: r.data.location || '', target_roles: r.data.target_roles || '', contact_email: r.data.contact_email || '', is_public: r.data.is_public }); })
      .catch(() => {});
  }, []);

  const createOrUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      let res;
      if (profile) res = await profileAPI.update(form);
      else res = await profileAPI.create(form);
      setProfile(res.data); toast.success('Profile saved!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save'); }
    setSaving(false);
  };

  const onAvatarDrop = async (files) => {
    if (!files[0]) return;
    try {
      const res = await profileAPI.uploadAvatar(files[0]);
      setProfile(res.data); toast.success('Avatar updated!');
    } catch { toast.error('Avatar upload failed'); }
  };

  const onResumeDrop = async (files) => {
    if (!files[0]) return;
    try {
      await profileAPI.uploadResume(files[0]);
      const res = await profileAPI.getMe(); setProfile(res.data);
      toast.success('Resume uploaded!');
    } catch { toast.error('Resume upload failed'); }
  };

  const avatarDropzone = useDropzone({ onDrop: onAvatarDrop, accept: { 'image/*': [] }, multiple: false });
  const resumeDropzone = useDropzone({ onDrop: onResumeDrop, accept: { 'application/pdf': [], 'application/msword': [] }, multiple: false });

  const addLink = async () => {
    if (!newLink.url) return;
    try {
      const res = await profileAPI.addLink(newLink);
      setProfile(prev => ({ ...prev, social_links: [...(prev?.social_links || []), res.data] }));
      setNewLink({ link_type: 'linkedin', url: '', label: '' }); toast.success('Link added!');
    } catch { toast.error('Failed to add link'); }
  };

  const removeLink = async (id) => {
    try {
      await profileAPI.deleteLink(id);
      setProfile(prev => ({ ...prev, social_links: prev.social_links.filter(l => l.id !== id) }));
    } catch { toast.error('Failed to delete'); }
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    try {
      const res = await profileAPI.addSkill(newSkill);
      setProfile(prev => ({ ...prev, skills: [...(prev?.skills || []), res.data] }));
      setNewSkill({ name: '', category: 'technical' }); toast.success('Skill added!');
    } catch { toast.error('Failed to add skill'); }
  };

  const removeSkill = async (id) => {
    try {
      await profileAPI.deleteSkill(id);
      setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
    } catch { toast.error('Failed to delete'); }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 };
  const tabs = ['profile', 'avatar', 'resume', 'links', 'skills'];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>My Profile</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Build your professional portfolio profile</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? '#e94560' : 'rgba(255,255,255,0.07)',
              color: tab === t ? '#fff' : '#aaa', fontWeight: 600, textTransform: 'capitalize'
            }}>{t}</button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem' }}>

          {/* Profile Form */}
          {tab === 'profile' && (
            <form onSubmit={createOrUpdate}>
              <h2 style={{ color: '#fff', marginTop: 0 }}>Basic Information</h2>
              {[
                { label: 'Professional Headline', key: 'headline', placeholder: 'e.g. Data Scientist | Python & ML' },
                { label: 'Location', key: 'location', placeholder: 'e.g. Riyadh, Saudi Arabia' },
                { label: 'Target Roles', key: 'target_roles', placeholder: 'e.g. Data Scientist, ML Engineer' },
                { label: 'Contact Email', key: 'contact_email', placeholder: 'your@email.com', type: 'email' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>{label}</label>
                  <input type={type || 'text'} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={labelStyle}>Bio</label>
                <textarea rows={4} placeholder="Tell employers about yourself..." value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input type="checkbox" id="public" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
                <label htmlFor="public" style={{ color: '#ccc' }}>Make profile public</label>
              </div>
              <button type="submit" disabled={saving} style={{
                background: 'linear-gradient(135deg, #e94560, #533483)', color: '#fff',
                border: 'none', padding: '12px 32px', borderRadius: 10, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem'
              }}>{saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}</button>
            </form>
          )}

          {/* Avatar */}
          {tab === 'avatar' && (
            <div>
              <h2 style={{ color: '#fff', marginTop: 0 }}>Profile Photo</h2>
              {profile?.avatar_url && (
                <img src={`${API_BASE}${profile.avatar_url}`} alt="Avatar"
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '3px solid #e94560' }} />
              )}
              <div {...avatarDropzone.getRootProps()} style={{
                border: '2px dashed rgba(233,69,96,0.5)', borderRadius: 12, padding: '3rem',
                textAlign: 'center', cursor: 'pointer', color: '#aaa', background: 'rgba(233,69,96,0.05)'
              }}>
                <input {...avatarDropzone.getInputProps()} />
                <div style={{ fontSize: 40, marginBottom: '0.5rem' }}>📸</div>
                <p>Drop your photo here or click to browse</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>JPEG, PNG, WEBP (max 10MB)</p>
              </div>
            </div>
          )}

          {/* Resume */}
          {tab === 'resume' && (
            <div>
              <h2 style={{ color: '#fff', marginTop: 0 }}>Resume / CV</h2>
              {profile?.resume && (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>📄 {profile.resume.filename}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{profile.resume.file_size ? `${(profile.resume.file_size / 1024).toFixed(1)} KB` : ''}</div>
                  </div>
                  <a href={`${API_BASE}${profile.resume.file_url}`} target="_blank" rel="noreferrer"
                    style={{ color: '#e94560', textDecoration: 'none', fontWeight: 600 }}>Download ↓</a>
                </div>
              )}
              <div {...resumeDropzone.getRootProps()} style={{
                border: '2px dashed rgba(83,52,131,0.5)', borderRadius: 12, padding: '3rem',
                textAlign: 'center', cursor: 'pointer', color: '#aaa', background: 'rgba(83,52,131,0.05)'
              }}>
                <input {...resumeDropzone.getInputProps()} />
                <div style={{ fontSize: 40, marginBottom: '0.5rem' }}>📄</div>
                <p>{profile?.resume ? 'Drop new resume to replace' : 'Drop your resume here or click to browse'}</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>PDF or Word (max 10MB)</p>
              </div>
            </div>
          )}

          {/* Links */}
          {tab === 'links' && (
            <div>
              <h2 style={{ color: '#fff', marginTop: 0 }}>Social & External Links</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select value={newLink.link_type} onChange={e => setNewLink({ ...newLink, link_type: e.target.value })}
                  style={{ ...inputStyle, width: 'auto', flex: '0 0 130px' }}>
                  {['linkedin', 'github', 'website', 'youtube', 'blog'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder="URL" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
                <input placeholder="Label (optional)" value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                  style={{ ...inputStyle, flex: '0 0 150px' }} />
                <button onClick={addLink} style={{ background: '#e94560', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Add</button>
              </div>
              {profile?.social_links?.map(link => (
                <div key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ color: '#e94560', fontWeight: 600, marginRight: '0.5rem', textTransform: 'capitalize' }}>{link.link_type}</span>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: '0.9rem' }}>{link.url}</a>
                  </div>
                  <button onClick={() => removeLink(link.id)} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {tab === 'skills' && (
            <div>
              <h2 style={{ color: '#fff', marginTop: 0 }}>Skills</h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input placeholder="Skill name (e.g. Python)" value={newSkill.name}
                  onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                <select value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                  style={{ ...inputStyle, width: 'auto', flex: '0 0 150px' }}>
                  {['technical', 'programming', 'frameworks', 'tools', 'soft-skills', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={addSkill} style={{ background: '#533483', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile?.skills?.map(skill => (
                  <div key={skill.id} style={{ background: 'rgba(83,52,131,0.3)', border: '1px solid rgba(83,52,131,0.5)', borderRadius: 20, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#ccc' }}>{skill.name}</span>
                    <button onClick={() => removeSkill(skill.id)} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', lineHeight: 1, padding: 0, fontSize: '0.9rem' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
