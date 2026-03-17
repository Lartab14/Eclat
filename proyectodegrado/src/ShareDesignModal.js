// ShareDesignModal.js - Modal moderno para subir diseños/posts
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Lock, Globe } from 'lucide-react';
import './ShareDesignModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ShareDesignModal({ isOpen, onClose, userData, onPostCreated }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibility: 'public'
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Por favor selecciona una imagen válida');
                return;
            }
            setSelectedFile(file);
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userData?.id_usuario) {
            setError('Debes iniciar sesión para publicar');
            return;
        }

        if (!selectedFile) {
            setError('Por favor selecciona una imagen');
            return;
        }

        if (!formData.title.trim()) {
            setError('Por favor ingresa un título');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // 1. Subir imagen a Cloudinary
            const imageFormData = new FormData();
            imageFormData.append('image', selectedFile);

            const uploadRes = await fetch(`${API_URL}/upload/image`, {
                method: 'POST',
                body: imageFormData
            });

            if (!uploadRes.ok) throw new Error('Error al subir la imagen');
            const uploadData = await uploadRes.json();

            // ✅ Cloudinary devuelve URL completa directamente
            const imageUrl = uploadData.imageUrl;

            // 2. Crear diseño — rutas SIN /api ya que API_URL lo incluye
            const designRes = await fetch(`${API_URL}/designs/with-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: userData.id_usuario,
                    titulo: formData.title.trim(),
                    descripcion: formData.description || 'Compartido desde Éclat',
                    tipo_diseño: 'imagen',
                    visibilidad: formData.visibility === 'public' ? 'publico' : 'privado',
                    imagen_url: imageUrl
                })
            });

            if (!designRes.ok) {
                const errData = await designRes.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al crear el diseño');
            }
            const designData = await designRes.json();

            // 3. Crear post si es público
            if (formData.visibility === 'public' && designData.diseño?.id_diseño) {
                const postRes = await fetch(`${API_URL}/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_usuario: userData.id_usuario,
                        id_diseño: designData.diseño.id_diseño,
                        contenido: formData.description || formData.title
                    })
                });

                if (!postRes.ok) console.warn('⚠️ Error al crear post, pero diseño guardado');
            }

            // Reset y cerrar
            setFormData({ title: '', description: '', visibility: 'public' });
            setSelectedFile(null);
            setPreview(null);

            if (onPostCreated) onPostCreated();
            onClose();

            alert(formData.visibility === 'public'
                ? '✅ ¡Diseño publicado exitosamente!'
                : '✅ ¡Diseño guardado en privado!');

        } catch (err) {
            console.error('Error al publicar:', err);
            setError(err.message || 'No se pudo publicar el diseño. Intenta de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFormData({ title: '', description: '', visibility: 'public' });
        setSelectedFile(null);
        setPreview(null);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Compartir Diseño</h2>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form className="modal-body" onSubmit={handleSubmit}>
                    {/* Upload Area */}
                    <div
                        className={`upload-zone ${preview ? 'has-image' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => !preview && fileInputRef.current?.click()}
                    >
                        {preview ? (
                            <div className="preview-container">
                                <img src={preview} alt="Preview" className="preview-image" />
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreview(null);
                                        setSelectedFile(null);
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <Upload size={48} className="upload-icon" />
                                <p className="upload-text">Arrastra tu diseño aquí</p>
                                <p className="upload-subtext">o haz clic para seleccionar</p>
                                <button type="button" className="upload-btn">
                                    <ImageIcon size={20} />
                                    Seleccionar Imagen
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Title */}
                    <div className="form-field">
                        <label className="form-label">
                            <FileText size={18} />
                            Título
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Dale un nombre a tu diseño..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={100}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-field">
                        <label className="form-label">
                            <FileText size={18} />
                            Descripción (opcional)
                        </label>
                        <textarea
                            className="form-textarea"
                            placeholder="Cuéntanos sobre tu diseño, inspiración, técnicas..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    {/* Visibility Toggle */}
                    <div className="visibility-selector">
                        <button
                            type="button"
                            className={`visibility-option ${formData.visibility === 'public' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, visibility: 'public' })}
                        >
                            <Globe size={20} />
                            <div className="visibility-info">
                                <span className="visibility-title">Público</span>
                                <span className="visibility-desc">Visible para toda la comunidad</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`visibility-option ${formData.visibility === 'private' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, visibility: 'private' })}
                        >
                            <Lock size={20} />
                            <div className="visibility-info">
                                <span className="visibility-title">Privado</span>
                                <span className="visibility-desc">Solo visible para ti</span>
                            </div>
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="error-message">⚠️ {error}</div>
                    )}

                    {/* Actions */}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={handleClose} disabled={isUploading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-publish" disabled={isUploading || !selectedFile}>
                            {isUploading ? 'Publicando...' : formData.visibility === 'public' ? 'Publicar Diseño' : 'Guardar Privado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}