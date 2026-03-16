import React, { useRef, useState } from 'react';
import { ArrowLeft, Upload, Image, Plus, CheckCircle, X, FileText } from 'lucide-react';
import './SubirDiseños.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function SubirDiseños({ onBack, userData, onOpenWorkspace }) {
  const uploadInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files);
    const previews = fileArray.map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      size: (file.size / 1024 / 1024).toFixed(2),
    }));
    setUploadedFiles((prev) => [...prev, ...previews]);
  };

  const handleInputChange = (e) => {
    handleFileUpload(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCanvas = () => {
    if (onOpenWorkspace) onOpenWorkspace();
  };

  const handleSubmitUploads = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const item of uploadedFiles) {
        const formData = new FormData();
        formData.append('image', item.file);
        if (userData?.id_usuario) {
          formData.append('id_usuario', userData.id_usuario);
        }

        const response = await fetch(`${API_URL}/upload/image`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error al subir archivo: ' + item.name);
        }
      }

      setUploadSuccess(true);
      setUploadedFiles([]);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error al subir diseños:', error);
      alert('Ocurrió un error al subir los diseños. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

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

      {/* Contenido principal */}
      <div className="subir-content">

        {/* Zona de arrastre */}
        <div
          className={`profile-upload-section subir-drop-zone ${isDragging ? 'subir-drop-zone--dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="profile-upload-icon">
            <Upload size={36} />
          </div>

          <h3 className="profile-upload-title">Sube tus diseños</h3>

          <p className="profile-upload-subtitle">
            Arrastra y suelta archivos aquí o haz clic en los botones
          </p>

          <div className="profile-upload-buttons">
            <button
              className="profile-upload-btn"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
            >
              <Image size={20} />
              Subir Archivos
            </button>

            <button
              className="profile-upload-btn profile-upload-btn-secondary"
              onClick={handleCreateCanvas}
              disabled={isUploading}
            >
              <Plus size={20} />
              Crear Nuevo Lienzo
            </button>
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />

          <p className="subir-formats-hint">
            Formatos aceptados: JPG, PNG, WEBP, SVG · Máximo 10 MB por archivo
          </p>
        </div>

        {/* Mensaje de éxito */}
        {uploadSuccess && (
          <div className="subir-success-banner">
            <CheckCircle size={20} />
            <span>¡Diseños subidos exitosamente!</span>
          </div>
        )}

        {/* Vista previa de archivos seleccionados */}
        {uploadedFiles.length > 0 && (
          <div className="subir-preview-section">
            <div className="subir-preview-header">
              <h3 className="subir-preview-title">
                <FileText size={20} />
                Archivos seleccionados ({uploadedFiles.length})
              </h3>
              {uploadedFiles.length > 0 && (
                <button
                  className="profile-upload-btn subir-submit-btn"
                  onClick={handleSubmitUploads}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="spinner-small" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Publicar diseños
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="subir-preview-grid">
              {uploadedFiles.map((item, index) => (
                <div key={index} className="subir-preview-card profile-design-card">
                  <img
                    src={item.preview}
                    alt={item.name}
                    className="profile-design-image"
                  />
                  <div className="profile-design-overlay">
                    <button
                      className="subir-remove-btn"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X size={16} />
                    </button>
                    <div className="subir-preview-info">
                      <p className="subir-preview-name">{item.name}</p>
                      <p className="subir-preview-size">{item.size} MB</p>
                    </div>
                  </div>
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