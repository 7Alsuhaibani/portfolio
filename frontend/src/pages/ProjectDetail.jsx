import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { projectsAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    projectsAPI.get(id).then(r => setProject(r.data)).catch(() => navigate('/projects'));
  }, [id]);

  const onImageDrop = async (files) => {
    if (!files[0]) return;
    setUploading(true);
    try {
      await projectsAPI.uploadImage(id, files[0]);
      const res = await projectsAPI.get(id); setProject(res.data);
      toast.success('Image uploaded!');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const deleteImage = async (imageId) => {
    try {
      await projectsAPI.deleteImage(id, imageId);
      const res = await projectsAPI.get(id); setProject(res.data);
      toast.success('Image removed');
    } catch { toast.error('Failed to remove'); }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop: onImageDrop, accept: { 'image/*': [] }, multiple: false });

  if (!project) return <div style={{ minHeight: '100vh', background: '#0a0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}>← Back to Projects</button>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{project.title}</h1>
            {project.is_featured && <span style={{ background: '#e94560', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: '0.85rem' }}>⭐ Featured</span>}
          </div>
          {project.summary && <p style={{ color: '#888', fontSize: '1.05rem', margin: '0 0 1rem' }}>{project.summary}</p>}

          {/* Meta */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {project.role && <div><span style={{ color: '#666', fontSize: '0.8rem' }}>ROLE</span><div style={{ color: '#ccc' }}>{project.role}</div></div>}
            {project.duration && <div><span style={{ color: '#666', fontSize: '0.8rem' }}>DURATION</span><div style={{ color: '#ccc' }}>{project.duration}</div></div>}
          </div>

          {/* Tech Stack */}
          {project.tech_stack && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.5rem' }}>TECH STACK</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {project.tech_stack.split(',').map(t => t.trim()).filter(Boolean).map(tech => (
                  <span key={tech} style={{ background: 'rgba(83,52,131,0.4)', border: '1px solid rgba(83,52,131,0.6)', color: '#ccc', padding: '4px 14px', borderRadius: 20, fontSize: '0.85rem' }}>{tech}</span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.07)', color: '#ccc', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                🐱 View on GitHub
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(233,69,96,0.2)', border: '1px solid #e94560', color: '#e94560', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
                🚀 Live Demo
              </a>
            )}
          </div>
        </div>

        {/* Images */}
        {project.images?.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {project.images.map(img => (
                <div key={img.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#1a1a2e' }}>
                  <img src={`${API_BASE}${img.image_url}`} alt={img.caption || 'Project image'}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  {img.caption && <div style={{ padding: '0.5rem', color: '#aaa', fontSize: '0.8rem' }}>{img.caption}</div>}
                  <button onClick={() => deleteImage(img.id)} style={{
                    position: 'absolute', top: 8, right: 8, background: 'rgba(233,69,96,0.9)',
                    border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%',
                    cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Image */}
        <div {...getRootProps()} style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', color: '#666', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
          <input {...getInputProps()} />
          {uploading ? <span>Uploading...</span> : <span>📸 Drop screenshot here or click to add project image</span>}
        </div>

        {/* Description */}
        {project.description && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ color: '#fff', lineHeight: 1.8 }}
              className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.description}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Results */}
        {project.results && (
          <div style={{ background: 'rgba(82,207,80,0.05)', border: '1px solid rgba(82,207,80,0.2)', borderRadius: 16, padding: '1.5rem' }}>
            <h3 style={{ color: '#51cf66', marginTop: 0 }}>🏆 Key Results</h3>
            <p style={{ color: '#ccc', margin: 0, lineHeight: 1.7 }}>{project.results}</p>
          </div>
        )}
      </div>
    </div>
  );
}
