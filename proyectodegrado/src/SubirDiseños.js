import React, { useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, Upload, Image, Plus, CheckCircle, X,
  FileText, ChevronLeft, ChevronRight, Layers, Grid, Trash2
} from 'lucide-react';
import './SubirDiseños.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/* ─────────────────────────────────────────────────────────
   Genera un id único para cada post/carrusel local
───────────────────────────────────────────────────────── */
let _nextId = 1;
const uid = () => `post_${_nextId++}`;

/* ─────────────────────────────────────────────────────────
   Mini carrusel de preview (navegación entre slides)
───────────────────────────────────────────────────────── */
function CarouselPreview({ images, onRemoveImage, onRemovePost, postIndex, totalPosts }) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const prev = (e) => { e.stopPropagation(); setCurrent(i => (i - 1 + count) % count); };
  const next = (e) => { e.stopPropagation(); setCurrent(i => (i + 1) % count); };

  return (
    <div className="carousel-card">
      {/* Badge tipo de post */}
      <div className={`carousel-type-badge ${count > 1 ? 'carousel-type-badge--multi' : ''}`}>
        {count > 1 ? <><Layers size={11} />{count} fotos</> : <><Image size={11} />Foto</>}
      </div>

      {/* Imagen activa */}
      <div className="carousel-image-wrap">
        <img
          src={images[current].preview}
          alt={images[current].name}
          className="profile-design-image"
        />

        {/* Overlay con acciones */}
        <div className="profile-design-overlay">
          {/* Botón eliminar post completo */}
          <button
            className="subir-remove-btn carousel-remove-post-btn"
            onClick={e => { e.stopPropagation(); onRemovePost(); }}
            title="Eliminar este post"
          >
            <Trash2 size={14} />
          </button>

          {/* Info de la imagen actual */}
          <div className="subir-preview-info">
            <p className="subir-preview-name">{images[current].name}</p>
            <p className="subir-preview-size">{images[current].size} MB</p>
          </div>
        </div>

        {/* Controles de navegación — solo si hay más de 1 imagen */}
        {count > 1 && (
          <>
            <button className="carousel-nav carousel-nav--prev" onClick={prev}>
              <ChevronLeft size={16} />
            </button>
            <button className="carousel-nav carousel-nav--next" onClick={next}>
              <ChevronRight size={16} />
            </button>

            {/* Dots */}
            <div className="carousel-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot ${i === current ? 'carousel-dot--active' : ''}`}
                  onClick={e => { e.stopPropagation(); setCurrent(i); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails strip — solo si hay más de 1 imagen */}
      {count > 1 && (
        <div className="carousel-thumbs">
          {images.map((img, i) => (
            <div
              key={i}
              className={`carousel-thumb-wrap ${i === current ? 'carousel-thumb-wrap--active' : ''}`}
              onClick={() => setCurrent(i)}
            >
              <img src={img.preview} alt={img.name} className="carousel-thumb" />
              <button
                className="carousel-thumb-remove"
                onClick={e => { e.stopPropagation(); onRemoveImage(i); }}
                title="Quitar imagen"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────────────────── */
function SubirDiseños({ onBack, userData, onOpenWorkspace }) {
  const uploadInputRef = useRef(null);
  const addToPostRef = useRef(null);       // input para añadir fotos a un post existente

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  /*
    posts: Array de { id, images: [{ file, name, preview, size }] }
    Cada elemento es un post independiente (puede ser carrusel o imagen individual).
  */
  const [posts, setPosts] = useState([]);
  const [targetPostId, setTargetPostId] = useState(null); // id del post al que se añadirán imgs

  /* ── Helpers ── */
  const buildItems = (files) =>
    Array.from(files).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2),
    }));

  /* Añadir archivos como posts individuales (comportamiento por defecto) */
  const addAsSeparatePosts = useCallback((files) => {
    const newPosts = Array.from(files).map((file) => ({
      id: uid(),
      images: [buildItems([file])[0]],
    }));
    setPosts((prev) => [...prev, ...newPosts]);
  }, []);

  /* Añadir archivos como un único carrusel nuevo */
  const addAsCarousel = useCallback((files) => {
    if (!files.length) return;
    const newPost = { id: uid(), images: buildItems(files) };
    setPosts((prev) => [...prev, newPost]);
  }, []);

  /* Añadir imágenes a un post existente (ampliar carrusel) */
  const addImagesToPost = useCallback((postId, files) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, images: [...p.images, ...buildItems(files)] }
          : p
      )
    );
  }, []);

  /* Eliminar una imagen de un post; si queda vacío, elimina el post */
  const removeImageFromPost = useCallback((postId, imgIndex) => {
    setPosts((prev) =>
      prev
        .map((p) =>
          p.id === postId
            ? { ...p, images: p.images.filter((_, i) => i !== imgIndex) }
            : p
        )
        .filter((p) => p.images.length > 0)
    );
  }, []);

  /* Eliminar un post completo */
  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  /* Fusionar todos los posts seleccionados en uno solo (carrusel) */
  const mergeAllIntoCarousel = () => {
    if (posts.length < 2) return;
    const allImages = posts.flatMap((p) => p.images);
    setPosts([{ id: uid(), images: allImages }]);
  };

  /* Separar todos los posts en imágenes individuales */
  const splitAllPosts = () => {
    const separated = posts.flatMap((p) =>
      p.images.map((img) => ({ id: uid(), images: [img] }))
    );
    setPosts(separated);
  };

  /* ── Drag & drop ── */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addAsSeparatePosts(e.dataTransfer.files);
  };

  /* ── Input changes ── */
  const handleInputChange = (e) => {
    addAsSeparatePosts(e.target.files);
    e.target.value = '';
  };

  const handleInputCarousel = (e) => {
    addAsCarousel(e.target.files);
    e.target.value = '';
  };

  const handleAddToPostInput = (e) => {
    if (targetPostId) {
      addImagesToPost(targetPostId, e.target.files);
      setTargetPostId(null);
    }
    e.target.value = '';
  };

  const openAddToPost = (postId) => {
    setTargetPostId(postId);
    setTimeout(() => addToPostRef.current?.click(), 0);
  };

  /* ── Publicar ── */
  const handleSubmitUploads = async () => {
    if (posts.length === 0) return;
    setIsUploading(true);

    try {
      for (const post of posts) {
        if (post.images.length === 1) {
          // Post de imagen individual — comportamiento original
          const formData = new FormData();
          formData.append('image', post.images[0].file);
          if (userData?.id_usuario) formData.append('id_usuario', userData.id_usuario);

          const res = await fetch(`${API_URL}/upload/image`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error('Error al subir: ' + post.images[0].name);
        } else {
          // Carrusel — enviar como FormData con múltiples imágenes
          const formData = new FormData();
          post.images.forEach((img) => formData.append('images', img.file));
          if (userData?.id_usuario) formData.append('id_usuario', userData.id_usuario);

          const res = await fetch(`${API_URL}/upload/carousel`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error('Error al subir carrusel');
        }
      }

      setUploadSuccess(true);
      setPosts([]);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error al subir diseños:', error);
      alert('Ocurrió un error al subir los diseños. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalImages = posts.reduce((acc, p) => acc + p.images.length, 0);

  return (
    <div className="subir-page">

      {/* Header */}
      <div className="subir-header">
        <button className="subir-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <h1 className="subir-title">Subir Diseños</h1>
        <div style={{ width: 100 }} />
      </div>

      {/* Contenido */}
      <div className="subir-content">

        {/* Zona de arrastre */}
        <div
          className={`profile-upload-section subir-drop-zone ${isDragging ? 'subir-drop-zone--dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="profile-upload-icon">
            <Upload size={36} />
          </div>

          <h3 className="profile-upload-title">Sube tus diseños</h3>
          <p className="profile-upload-subtitle">
            Arrastra y suelta archivos, o elige cómo quieres subirlos
          </p>

          <div className="profile-upload-buttons">
            {/* Subir como posts individuales */}
            <button
              className="profile-upload-btn"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
              title="Cada imagen se convierte en un post separado"
            >
              <Grid size={20} />
              Posts individuales
            </button>

            {/* Subir como carrusel */}
            <button
              className="profile-upload-btn profile-upload-btn-secondary"
              onClick={() => document.getElementById('carousel-input')?.click()}
              disabled={isUploading}
              title="Todas las imágenes en un solo post con carrusel"
            >
              <Layers size={20} />
              Subir como carrusel
            </button>

            {/* Crear lienzo */}
            <button
              className="profile-upload-btn profile-upload-btn-secondary"
              onClick={() => onOpenWorkspace?.()}
              disabled={isUploading}
            >
              <Plus size={20} />
              Crear Nuevo Lienzo
            </button>
          </div>

          {/* Inputs ocultos */}
          <input ref={uploadInputRef} id="individual-input" type="file"
            accept="image/*" multiple style={{ display: 'none' }}
            onChange={handleInputChange} />

          <input id="carousel-input" type="file"
            accept="image/*" multiple style={{ display: 'none' }}
            onChange={handleInputCarousel} />

          <input ref={addToPostRef} id="add-to-post-input" type="file"
            accept="image/*" multiple style={{ display: 'none' }}
            onChange={handleAddToPostInput} />

          <p className="subir-formats-hint">
            Formatos aceptados: JPG, PNG, WEBP, SVG · Máximo 10 MB por archivo
          </p>
        </div>

        {/* Banner de éxito */}
        {uploadSuccess && (
          <div className="subir-success-banner">
            <CheckCircle size={20} />
            <span>¡Diseños publicados exitosamente!</span>
          </div>
        )}

        {/* Vista previa de posts */}
        {posts.length > 0 && (
          <div className="subir-preview-section">

            {/* Header de la sección */}
            <div className="subir-preview-header">
              <h3 className="subir-preview-title">
                <FileText size={20} />
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} · {totalImages} {totalImages === 1 ? 'imagen' : 'imágenes'}
              </h3>

              <div className="subir-preview-actions">
                {/* Acciones de organización */}
                {posts.length > 1 && (
                  <button
                    className="subir-organize-btn"
                    onClick={mergeAllIntoCarousel}
                    title="Unir todos en un solo carrusel"
                  >
                    <Layers size={15} />
                    Unir en carrusel
                  </button>
                )}
                {posts.some(p => p.images.length > 1) && (
                  <button
                    className="subir-organize-btn subir-organize-btn--secondary"
                    onClick={splitAllPosts}
                    title="Separar todas las imágenes en posts individuales"
                  >
                    <Grid size={15} />
                    Separar todo
                  </button>
                )}

                {/* Botón publicar */}
                <button
                  className="profile-upload-btn subir-submit-btn"
                  onClick={handleSubmitUploads}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <><div className="spinner-small" />Subiendo...</>
                  ) : (
                    <><Upload size={18} />Publicar {posts.length > 1 ? `${posts.length} posts` : 'post'}</>
                  )}
                </button>
              </div>
            </div>

            {/* Grid de posts / carruseles */}
            <div className="subir-preview-grid">
              {posts.map((post) => (
                <div key={post.id} className="subir-carousel-item">
                  <CarouselPreview
                    images={post.images}
                    onRemoveImage={(imgIdx) => removeImageFromPost(post.id, imgIdx)}
                    onRemovePost={() => removePost(post.id)}
                    postIndex={posts.indexOf(post)}
                    totalPosts={posts.length}
                  />

                  {/* Botón para añadir más imágenes a este post (ampliar carrusel) */}
                  <button
                    className="carousel-add-more-btn"
                    onClick={() => openAddToPost(post.id)}
                    title="Añadir más imágenes a este carrusel"
                  >
                    <Plus size={14} />
                    Añadir al carrusel
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default SubirDiseños;