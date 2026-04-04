import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Lock, Globe, ChevronLeft, ChevronRight, Layers, Plus, Trash2 } from 'lucide-react';
import './ShareDesignModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ShareDesignModal({ isOpen, onClose, userData, initialFiles = [], onPostCreated }) {
    const [formData, setFormData] = useState({ title: '', description: '', visibility: 'public' });
    const [images, setImages] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const addMoreRef = useRef(null);

    useEffect(() => {
        if (isOpen && initialFiles.length > 0) {
            const items = initialFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
            setImages(items);
            setCurrentIdx(0);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => { images.forEach(img => URL.revokeObjectURL(img.preview)); };
    }, [images]);

    const addFiles = (files) => {
        const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!valid.length) { setError('Solo se aceptan imágenes'); return; }
        setError('');
        const newItems = valid.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setImages(prev => {
            const updated = [...prev, ...newItems];
            setCurrentIdx(updated.length - 1);
            return updated;
        });
    };

    const removeImage = (idx) => {
        URL.revokeObjectURL(images[idx].preview);
        setImages(prev => {
            const updated = prev.filter((_, i) => i !== idx);
            setCurrentIdx(i => Math.min(i, Math.max(0, updated.length - 1)));
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userData?.id_usuario) { setError('Debes iniciar sesión para publicar'); return; }
        if (!images.length) { setError('Por favor selecciona al menos una imagen'); return; }
        if (!formData.title.trim()) { setError('Por favor ingresa un título'); return; }

        setIsUploading(true);
        setError('');

        try {
            const imageUrls = [];
            for (const img of images) {
                const fd = new FormData();
                fd.append('image', img.file);
                const res = await fetch(`${API_URL}/upload/image`, { method: 'POST', body: fd });
                if (!res.ok) throw new Error(`Error al subir imagen: ${img.file.name}`);
                const data = await res.json();
                imageUrls.push(data.imageUrl);
            }

            const visibilidad = formData.visibility === 'public' ? 'publico' : 'privado';
            let diseñoId = null;

            if (imageUrls.length === 1) {
                const res = await fetch(`${API_URL}/designs/with-file`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_usuario: userData.id_usuario,
                        titulo: formData.title.trim(),
                        descripcion: formData.description || 'Compartido desde Éclat',
                        tipo_diseño: 'imagen',
                        visibilidad,
                        imagen_url: imageUrls[0]
                    })
                });
                if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error al crear el diseño'); }
                diseñoId = (await res.json()).diseño?.id_diseño;
            } else {
                const res = await fetch(`${API_URL}/designs/with-carousel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_usuario: userData.id_usuario,
                        titulo: formData.title.trim(),
                        descripcion: formData.description || 'Compartido desde Éclat',
                        tipo_diseño: 'carrusel',
                        visibilidad,
                        imagenes: imageUrls
                    })
                });
                if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error al crear el carrusel'); }
                diseñoId = (await res.json()).diseño?.id_diseño;
            }

            if (visibilidad === 'publico' && diseñoId) {
                await fetch(`${API_URL}/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_usuario: userData.id_usuario, id_diseño: diseñoId, contenido: formData.description || formData.title })
                }).catch(() => console.warn('⚠️ Post no creado, pero diseño guardado.'));
            }

            handleClose();
            if (onPostCreated) onPostCreated();
            alert(formData.visibility === 'public' ? '✅ ¡Diseño publicado exitosamente!' : '✅ ¡Diseño guardado en privado!');

        } catch (err) {
            console.error('Error al publicar:', err);
            setError(err.message || 'No se pudo publicar el diseño. Intenta de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
        setCurrentIdx(0);
        setFormData({ title: '', description: '', visibility: 'public' });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    const isCarousel = images.length > 1;
    const safeIdx = images.length > 0 ? Math.min(currentIdx, images.length - 1) : 0;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                <div className="modal-header">
                    <h2 className="modal-title">
                        {isCarousel
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={20} />Carrusel ({images.length} fotos)</span>
                            : 'Compartir Diseño'}
                    </h2>
                    <button className="modal-close" onClick={handleClose}><X size={24} /></button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>

                    {images.length === 0 ? (
                        <div className="upload-zone"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}>
                            <div className="upload-placeholder">
                                <Upload size={48} className="upload-icon" />
                                <p className="upload-text">Arrastra tus imágenes aquí</p>
                                <p className="upload-subtext">Selecciona varias para crear un carrusel</p>
                                <button type="button" className="upload-btn">
                                    <ImageIcon size={20} />Seleccionar Imágenes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sdm-carousel"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
                            <div className="sdm-carousel-main">
                                <img src={images[safeIdx].preview} alt={`Imagen ${safeIdx + 1}`} className="sdm-carousel-img" />
                                {isCarousel && (
                                    <div className="sdm-badge"><Layers size={12} /> {safeIdx + 1} / {images.length}</div>
                                )}
                                {isCarousel && (
                                    <>
                                        <button type="button" className="sdm-arrow sdm-arrow--left"
                                            onClick={() => setCurrentIdx(i => (i - 1 + images.length) % images.length)}>
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button type="button" className="sdm-arrow sdm-arrow--right"
                                            onClick={() => setCurrentIdx(i => (i + 1) % images.length)}>
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                )}
                                <button type="button" className="sdm-remove" onClick={() => removeImage(safeIdx)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="sdm-thumbs">
                                {images.map((img, i) => (
                                    <button key={i} type="button"
                                        className={`sdm-thumb ${i === safeIdx ? 'sdm-thumb--active' : ''}`}
                                        onClick={() => setCurrentIdx(i)}>
                                        <img src={img.preview} alt="" />
                                    </button>
                                ))}
                                <button type="button" className="sdm-thumb sdm-thumb--add"
                                    onClick={() => addMoreRef.current?.click()} title="Añadir más imágenes">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                    <input ref={addMoreRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />

                    <div className="form-field">
                        <label className="form-label"><FileText size={18} />Título</label>
                        <input type="text" className="form-input" placeholder="Dale un nombre a tu diseño..."
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} maxLength={100} />
                    </div>

                    <div className="form-field">
                        <label className="form-label"><FileText size={18} />Descripción (opcional)</label>
                        <textarea className="form-textarea" placeholder="Cuéntanos sobre tu diseño..."
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3} maxLength={500} />
                    </div>

                    <div className="visibility-selector">
                        <button type="button" className={`visibility-option ${formData.visibility === 'public' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, visibility: 'public' })}>
                            <Globe size={20} />
                            <div className="visibility-info">
                                <span className="visibility-title">Público</span>
                                <span className="visibility-desc">Visible para toda la comunidad</span>
                            </div>
                        </button>
                        <button type="button" className={`visibility-option ${formData.visibility === 'private' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, visibility: 'private' })}>
                            <Lock size={20} />
                            <div className="visibility-info">
                                <span className="visibility-title">Privado</span>
                                <span className="visibility-desc">Solo visible para ti</span>
                            </div>
                        </button>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={handleClose} disabled={isUploading}>Cancelar</button>
                        <button type="submit" className="btn-publish" disabled={isUploading || !images.length}>
                            {isUploading
                                ? `Publicando${isCarousel ? ' carrusel' : ''}...`
                                : formData.visibility === 'public'
                                    ? isCarousel ? `Publicar carrusel (${images.length})` : 'Publicar Diseño'
                                    : 'Guardar Privado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}