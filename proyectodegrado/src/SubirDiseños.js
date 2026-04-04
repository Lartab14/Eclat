import React, { useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, Upload, Image, Plus, CheckCircle, X,
  FileText, ChevronLeft, ChevronRight, Layers, Grid,
  Trash2, Globe, Lock
} from 'lucide-react';
import './SubirDiseños.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

let _nextId = 1;
const uid = () => `post_${_nextId++}`;

/* ─────────────────────────────────────────────────────────
   Mini carrusel de preview
───────────────────────────────────────────────────────── */
function CarouselPreview({ images, onRemoveImage, onRemovePost }) {
  const [current, setCurrent] = useState(0);
  const count = images.length;
  const safeIdx = Math.min(current, count - 1);

  const prev = (e) => { e.stopPropagation(); setCurrent(i => (i - 1 + count) % count); };
  const next = (e) => { e.stopPropagation(); setCurrent(i => (i + 1) % count); };

  return (
    <div className="carousel-card">
      <div className={`carousel-type-badge ${count > 1 ? 'carousel-type-badge--multi' : ''}`}>
        {count > 1 ? <><Layers size={11} />{count} fotos</> : <><Image size={11} />Foto</>}
      </div>

      <div className="carousel-image-wrap">
        <img src={images[safeIdx].preview} alt={images[safeIdx].name} className="profile-design-image" />

        <div className="profile-design-overlay">
          <button className="subir-remove-btn" onClick={e => { e.stopPropagation(); onRemovePost(); }} title="Eliminar post">
            <Trash2 size={14} />
          </button>
          <div className="subir-preview-info">
            <p className="subir-preview-name">{images[safeIdx].name}</p>
            <p className="subir-preview-size">{images[safeIdx].size} MB</p>
          </div>
        </div>

        {count > 1 && (
          <>
            <button className="carousel-nav carousel-nav--prev" onClick={prev}><ChevronLeft size={16} /></button>
            <button className="carousel-nav carousel-nav--next" onClick={next}><ChevronRight size={16} /></button>
            <div className="carousel-dots">
              {images.map((_, i) => (
                <button key={i} className={`carousel-dot ${i === safeIdx ? 'carousel-dot--active' : ''}`}
                  onClick={e => { e.stopPropagation(); setCurrent(i); }} />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="carousel-thumbs">
          {images.map((img, i) => (
            <div key={i} className={`carousel-thumb-wrap ${i === safeIdx ? 'carousel-thumb-wrap--active' : ''}`}
              onClick={() => setCurrent(i)}>
              <img src={img.preview} alt={img.name} className="carousel-thumb" />
              <button className="carousel-thumb-remove"
                onClick={e => { e.stopPropagation(); onRemoveImage(i); }}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Modal de publicación
───────────────────────────────────────────────────────── */
function PublishModal({ posts, onConfirm, onCancel, isUploading }) {
  const [forms, setForms] = useState(() =>
    posts.map(p => ({ id: p.id, titulo: '', descripcion: '', visibilidad: 'public' }))
  );
  const [error, setError] = useState('');

  const update = (postId, field, value) =>
    setForms(prev => prev.map(f => f.id === postId ? { ...f, [field]: value } : f));

  const handleSubmit = () => {
    if (forms.find(f => !f.titulo.trim())) { setError('Todos los posts necesitan un título.'); return; }
    setError('');
    onConfirm(forms);
  };

  return (
    <div className="publish-modal-backdrop" onClick={onCancel}>
      <div className="publish-modal" onClick={e => e.stopPropagation()}>

        <div className="publish-modal-header">
          <h2 className="publish-modal-title">
            {posts.length === 1 ? 'Detalles del post' : `Detalles de ${posts.length} posts`}
          </h2>
          <button className="publish-modal-close" onClick={onCancel}><X size={22} /></button>
        </div>

        <div className="publish-modal-body">
          {forms.map((form, idx) => {
            const post = posts.find(p => p.id === form.id);
            const isCarousel = post?.images.length > 1;

            return (
              <div key={form.id} className="publish-modal-post-block">
                {posts.length > 1 && (
                  <p className="publish-modal-post-label">
                    Post {idx + 1}
                    {isCarousel && <span className="publish-modal-carousel-tag"><Layers size={11} /> Carrusel</span>}
                  </p>
                )}

                <div className="publish-modal-row">
                  <div className="publish-modal-thumb">
                    {post?.images[0] && <img src={post.images[0].preview} alt="" />}
                    {isCarousel && <span className="publish-modal-thumb-count">+{post.images.length - 1}</span>}
                  </div>

                  <div className="publish-modal-fields">
                    <input className="publish-modal-input" type="text"
                      placeholder="Título del diseño *"
                      value={form.titulo} onChange={e => update(form.id, 'titulo', e.target.value)}
                      maxLength={100} />
                    <textarea className="publish-modal-textarea" placeholder="Descripción (opcional)..."
                      value={form.descripcion} onChange={e => update(form.id, 'descripcion', e.target.value)}
                      rows={2} maxLength={500} />
                    <div className="publish-modal-visibility">
                      <button type="button"
                        className={`publish-vis-btn ${form.visibilidad === 'public' ? 'active' : ''}`}
                        onClick={() => update(form.id, 'visibilidad', 'public')}>
                        <Globe size={14} /> Público
                      </button>
                      <button type="button"
                        className={`publish-vis-btn ${form.visibilidad === 'private' ? 'active' : ''}`}
                        onClick={() => update(form.id, 'visibilidad', 'private')}>
                        <Lock size={14} /> Privado
                      </button>
                    </div>
                  </div>
                </div>

                {idx < forms.length - 1 && <div className="publish-modal-divider" />}
              </div>
            );
          })}

          {error && <p className="publish-modal-error">⚠️ {error}</p>}
        </div>

        <div className="publish-modal-footer">
          <button className="publish-modal-cancel" onClick={onCancel} disabled={isUploading}>Cancelar</button>
          <button className="publish-modal-confirm" onClick={handleSubmit} disabled={isUploading}>
            {isUploading
              ? <><div className="spinner-small" /> Publicando...</>
              : <><Upload size={16} /> Publicar {posts.length > 1 ? `${posts.length} posts` : 'post'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────────────────── */
function SubirDiseños({ onBack, userData, onOpenWorkspace }) {
  const uploadInputRef = useRef(null);
  const carouselInputRef = useRef(null);
  const addToPostRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [targetPostId, setTargetPostId] = useState(null);

  const buildItems = (files) =>
    Array.from(files).map(file => ({
      file, name: file.name,
      preview: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2),
    }));

  const addAsSeparatePosts = useCallback((files) => {
    setPosts(prev => [...prev, ...Array.from(files).map(file => ({
      id: uid(),
      images: [{ file, name: file.name, preview: URL.createObjectURL(file), size: (file.size / 1024 / 1024).toFixed(2) }],
    }))]);
  }, []);

  const addAsCarousel = useCallback((files) => {
    if (!files.length) return;
    setPosts(prev => [...prev, { id: uid(), images: buildItems(files) }]);
  }, []);

  const addImagesToPost = useCallback((postId, files) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, images: [...p.images, ...buildItems(files)] } : p));
  }, []);

  const removeImageFromPost = useCallback((postId, imgIndex) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, images: p.images.filter((_, i) => i !== imgIndex) } : p)
      .filter(p => p.images.length > 0));
  }, []);

  const removePost = useCallback((postId) => setPosts(prev => prev.filter(p => p.id !== postId)), []);
  const mergeAllIntoCarousel = () => posts.length > 1 && setPosts([{ id: uid(), images: posts.flatMap(p => p.images) }]);
  const splitAllPosts = () => setPosts(posts.flatMap(p => p.images.map(img => ({ id: uid(), images: [img] }))));

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); addAsSeparatePosts(e.dataTransfer.files); };
  const handleInputChange = (e) => { addAsSeparatePosts(e.target.files); e.target.value = ''; };
  const handleInputCarousel = (e) => { addAsCarousel(e.target.files); e.target.value = ''; };
  const handleAddToPostInput = (e) => { if (targetPostId) { addImagesToPost(targetPostId, e.target.files); setTargetPostId(null); } e.target.value = ''; };

  const openAddToPost = (postId) => { setTargetPostId(postId); setTimeout(() => addToPostRef.current?.click(), 0); };

  /* ─────────────────────────────────────────────────────────
     Publicar — mismo flujo de 3 pasos que ShareDesignModal
     Paso 1: /upload/image      → Cloudinary → imageUrl
     Paso 2: /designs/with-file  (1 img) o /designs/with-carousel (N imgs) → BD
     Paso 3: /posts             → post público
  ───────────────────────────────────────────────────────── */
  const handleConfirmPublish = async (forms) => {
    setIsUploading(true);
    try {
      for (const form of forms) {
        const post = posts.find(p => p.id === form.id);
        if (!post) continue;

        const visibilidad = form.visibilidad === 'public' ? 'publico' : 'privado';

        // PASO 1 — subir cada imagen a Cloudinary
        const imageUrls = [];
        for (const img of post.images) {
          const fd = new FormData();
          fd.append('image', img.file);
          const res = await fetch(`${API_URL}/upload/image`, { method: 'POST', body: fd });
          if (!res.ok) throw new Error(`Error al subir imagen: ${img.name}`);
          const data = await res.json();
          imageUrls.push(data.imageUrl);
        }

        // PASO 2 — crear diseño en BD
        let diseñoId = null;

        if (imageUrls.length === 1) {
          // Ruta existente — imagen individual
          const res = await fetch(`${API_URL}/designs/with-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_usuario: userData.id_usuario,
              titulo: form.titulo.trim(),
              descripcion: form.descripcion || 'Compartido desde Éclat',
              tipo_diseño: 'imagen',
              visibilidad,
              imagen_url: imageUrls[0],
            }),
          });
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error al crear diseño'); }
          diseñoId = (await res.json()).diseño?.id_diseño;

        } else {
          // Ruta nueva — carrusel (1 diseño + N archivoDiseño)
          const res = await fetch(`${API_URL}/designs/with-carousel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_usuario: userData.id_usuario,
              titulo: form.titulo.trim(),
              descripcion: form.descripcion || 'Compartido desde Éclat',
              tipo_diseño: 'carrusel',
              visibilidad,
              imagenes: imageUrls,   // array de URLs de Cloudinary
            }),
          });
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error al crear carrusel'); }
          diseñoId = (await res.json()).diseño?.id_diseño;
        }

        // PASO 3 — crear post público
        if (visibilidad === 'publico' && diseñoId) {
          const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: userData.id_usuario, id_diseño: diseñoId, contenido: form.descripcion || form.titulo }),
          });
          if (!res.ok) console.warn('⚠️ Post no creado, pero diseño guardado.');
        }
      }

      setShowModal(false);
      setPosts([]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3500);
    } catch (err) {
      console.error('Error al publicar:', err);
      alert('Ocurrió un error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const totalImages = posts.reduce((acc, p) => acc + p.images.length, 0);

  return (
    <div className="subir-page">
      <div className="subir-header">
        <button className="subir-back-btn" onClick={onBack}>
          <ArrowLeft size={20} /><span>Volver</span>
        </button>
        <h1 className="subir-title">Subir Diseños</h1>
        <div style={{ width: 100 }} />
      </div>

      <div className="subir-content">
        {/* Zona de arrastre */}
        <div
          className={`profile-upload-section subir-drop-zone ${isDragging ? 'subir-drop-zone--dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="profile-upload-icon"><Upload size={36} /></div>
          <h3 className="profile-upload-title">Sube tus diseños</h3>
          <p className="profile-upload-subtitle">Arrastra archivos aquí, o elige cómo subirlos</p>

          <div className="profile-upload-buttons">
            <button className="profile-upload-btn" onClick={() => uploadInputRef.current?.click()} disabled={isUploading} title="Cada imagen = un post separado">
              <Grid size={20} /> Posts individuales
            </button>
            <button className="profile-upload-btn profile-upload-btn-secondary" onClick={() => carouselInputRef.current?.click()} disabled={isUploading} title="Varias imágenes en un solo post">
              <Layers size={20} /> Subir como carrusel
            </button>
            <button className="profile-upload-btn profile-upload-btn-secondary" onClick={() => onOpenWorkspace?.()} disabled={isUploading}>
              <Plus size={20} /> Crear Nuevo Lienzo
            </button>
          </div>

          <input ref={uploadInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleInputChange} />
          <input ref={carouselInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleInputCarousel} />
          <input ref={addToPostRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddToPostInput} />

          <p className="subir-formats-hint">Formatos aceptados: JPG, PNG, WEBP, SVG · Máximo 10 MB por archivo</p>
        </div>

        {uploadSuccess && (
          <div className="subir-success-banner">
            <CheckCircle size={20} /><span>¡Diseños publicados exitosamente!</span>
          </div>
        )}

        {posts.length > 0 && (
          <div className="subir-preview-section">
            <div className="subir-preview-header">
              <h3 className="subir-preview-title">
                <FileText size={20} />
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} · {totalImages} {totalImages === 1 ? 'imagen' : 'imágenes'}
              </h3>
              <div className="subir-preview-actions">
                {posts.length > 1 && (
                  <button className="subir-organize-btn" onClick={mergeAllIntoCarousel}>
                    <Layers size={15} /> Unir en carrusel
                  </button>
                )}
                {posts.some(p => p.images.length > 1) && (
                  <button className="subir-organize-btn subir-organize-btn--secondary" onClick={splitAllPosts}>
                    <Grid size={15} /> Separar todo
                  </button>
                )}
                <button className="profile-upload-btn subir-submit-btn" onClick={() => setShowModal(true)} disabled={isUploading}>
                  <Upload size={18} /> Siguiente
                </button>
              </div>
            </div>

            <div className="subir-preview-grid">
              {posts.map(post => (
                <div key={post.id} className="subir-carousel-item">
                  <CarouselPreview
                    images={post.images}
                    onRemoveImage={(idx) => removeImageFromPost(post.id, idx)}
                    onRemovePost={() => removePost(post.id)}
                  />
                  <button className="carousel-add-more-btn" onClick={() => openAddToPost(post.id)}>
                    <Plus size={14} /> Añadir al carrusel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <PublishModal
          posts={posts}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowModal(false)}
          isUploading={isUploading}
        />
      )}
    </div>
  );
}

export default SubirDiseños;