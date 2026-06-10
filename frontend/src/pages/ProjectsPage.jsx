import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { title: '', summary: '', description: '', tech_stack: '', skills_used: '', role: '', duration: '', github_url: '', demo_url: '', results: '', is_featured: false, order_index: 0 };
  }

  useEffect(() => {
    projectsAPI.getAll().then(r => setProjects(r.data)).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await projectsAPI.update(editingId, form);
        setProjects(prev => prev.map(p => p.id === editingId ? res.data : p));
        toast.success('Project updated!');
      } else {
        const res = await projectsAPI.create(form);
        setProjects(prev => [...prev, res.data]);
        toast.success('Project created!');
      }
      setShowForm(false); setEditingId(null); setForm(emptyForm());
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save'); }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const startEdit = (project) => {
    setForm({ title: project.title, summary: project.summary || '', description: project.description || '',
      tech_stack: project.tech_stack || '', skills_used: project.skills_used || '', role: project.role || '',
      duration: project.duration || '', github_url: project.github_url || '', demo_url: project.demo_url || '',
      results: project.results || '', is_featured: project.is_featured, order_index: project.order_index });
    setEditingId(project.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>My Projects</h1>
            <p style={{ color: '#888', margin: '0.3rem 0 0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm()); }}
            style={{ background: 'linear-gradient(135deg, #e94560, #533483)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Project Form */}
        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#e94560' }}>{editingId ? 'Edit Project' : 'New Project'}</h2>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>Project Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Sales Forecasting Dashboard" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>Summary (one line)</label>
                  <input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief description for preview cards" style={inputStyle} />
                </div>
                {[
                  { label: 'Tech Stack', key: 'tech_stack', placeholder: 'Python, React, PostgreSQL' },
                  { label: 'Skills Used', key: 'skills_used', placeholder: 'Machine Learning, REST APIs' },
                  { label: 'Your Role', key: 'role', placeholder: 'Lead Developer' },
                  { label: 'Duration', key: 'duration', placeholder: '3 months (Jan–Mar 2024)' },
                  { label: 'GitHub URL', key: 'github_url', placeholder: 'https://github.com/...' },
                  { label: 'Demo URL', key: 'demo_url', placeholder: 'https://demo.example.com' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>Description (Markdown supported)</label>
                  <textarea rows={8} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="## Overview&#10;Describe your project in detail...&#10;&#10;## Business Problem&#10;What problem did you solve?&#10;&#10;## Results&#10;- Achievement 1&#10;- Achievement 2"
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>Key Results</label>
                  <textarea rows={3} value={form.results} onChange={e => setForm({ ...form, results: e.target.value })}
                    placeholder="Achieved 94% accuracy, reduced costs by 30%..." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccc', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                  ⭐ Feature this project
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #e94560, #533483)', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                  {editingId ? 'Update Project' : 'Create Project'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm()); }}
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#aaa', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 24px', borderRadius: 10, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <div style={{ fontSize: 64, marginBottom: '1rem' }}>📁</div>
            <h2 style={{ color: '#888' }}>No projects yet</h2>
            <p>Add your first project to showcase your work to employers.</p>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', borderLeft: p.is_featured ? '4px solid #e94560' : '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{p.title}</h3>
                    {p.is_featured && <span style={{ background: '#e94560', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem' }}>Featured</span>}
                  </div>
                  {p.summary && <p style={{ color: '#888', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{p.summary}</p>}
                  {p.tech_stack && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {p.tech_stack.split(',').map(t => t.trim()).filter(Boolean).map(tech => (
                        <span key={tech} style={{ background: 'rgba(83,52,131,0.3)', color: '#ccc', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>{tech}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: '0.85rem', textDecoration: 'none' }}>🐱 GitHub</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: '0.85rem', textDecoration: 'none' }}>🚀 Demo</a>}
                    {p.role && <span style={{ color: '#666', fontSize: '0.85rem' }}>Role: {p.role}</span>}
                    {p.duration && <span style={{ color: '#666', fontSize: '0.85rem' }}>⏱ {p.duration}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <Link to={`/projects/${p.id}`} style={{ background: 'rgba(83,52,131,0.3)', color: '#ccc', padding: '7px 14px', borderRadius: 7, textDecoration: 'none', fontSize: '0.85rem' }}>View</Link>
                  <button onClick={() => startEdit(p)} style={{ background: 'rgba(15,52,96,0.4)', color: '#ccc', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' }}>Edit</button>
                  <button onClick={() => deleteProject(p.id)} style={{ background: 'rgba(233,69,96,0.2)', color: '#e94560', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
