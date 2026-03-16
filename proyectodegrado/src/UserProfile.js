import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Settings, MapPin, Calendar, Users, Heart, MessageCircle, Camera, Edit2, Upload, Plus, Image, FileText, X, Save, Trash2 } from 'lucide-react';
import './UserProfile.css';

const API_URL = 'http://localhost:3001/api';

export default function UserProfile({ onBack, onLogout, userData: userDataProp, onOpenWorkspace, onUpdateProfile }) {
  const [activeTab, setActiveTab] = useState('public');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);

  const [coverImage, setCoverImage] = useState(userDataProp?.coverImage || 'https://images.unsplash.com/photo-1558769132-cb1aea3c9239?w=1200');
  const [avatarImage, setAvatarImage] = useState(userDataProp?.avatarImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400');

  const [editData, setEditData] = useState({
    name: userDataProp?.name || 'Millie Mendes',
    bio: userDataProp?.bio || 'Diseñadora de moda emergente apasionada por la sostenibilidad y las texturas innovadoras.',
    location: userDataProp?.location || 'Barcelona, España',
    age: userDataProp?.age || '26 años',
  });

  const [publicDesigns, setPublicDesigns] = useState([]);
  const [privateDesigns, setPrivateDesigns] = useState([]);

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const generateUsername = (name) => {
    if (!name) return '@usuario';
    return '@' + name.toLowerCase().replace(/\s+/g, '');
  };

  console.log('User data prop: ', userDataProp)

  const userData = {
    name: editData.name,
    username: generateUsername(editData.name),
    email: userDataProp?.email || '',
    bio: editData.bio,
    location: editData.location,
    joinDate: userDataProp?.joinDate || 'Marzo 2024',
    age: editData.age,
    verified: userDataProp?.verified || true,
    topCreator: userDataProp?.topCreator || true,
    stats: userDataProp?.stats,
  };

  useEffect(() => {
    cargarDiseños();
  }, [userDataProp?.id_usuario]);

  const cargarDiseños = async () => {
    if (!userDataProp?.id_usuario) return;

    setIsLoadingDesigns(true);
    try {
      const responsePublic = await fetch(
        `${API_URL}/designs/usuario/${userDataProp.id_usuario}?visibilidad=publico`
      );
      const dataPublic = await responsePublic.json();

      const responsePrivate = await fetch(
        `${API_URL}/designs/usuario/${userDataProp.id_usuario}?visibilidad=privado`
      );
      const dataPrivate = await responsePrivate.json();

      if (dataPublic.success) {
        setPublicDesigns(dataPublic.diseños || []);
      }

      if (dataPrivate.success) {
        setPrivateDesigns(dataPrivate.diseños || []);
      }

    } catch (error) {
      console.error("❌ Error al cargar diseños:", error);
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  const uploadImageToServer = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      return `http://localhost:3001${data.imageUrl}`;
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      throw error;
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingCover(true);
      try {
        const imageUrl = await uploadImageToServer(file);
        setCoverImage(imageUrl);
      } catch (error) {
        alert('Error al subir la imagen de portada');
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const imageUrl = await uploadImageToServer(file);
        setAvatarImage(imageUrl);
      } catch (error) {
        alert('Error al subir la imagen de perfil');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setEditData({
        name: userDataProp?.name || 'Millie Mendes',
        bio: userDataProp?.bio || 'Diseñadora de moda emergente.',
        location: userDataProp?.location || 'Barcelona, España',
        age: userDataProp?.age || '26 años',
      });
      setCoverImage(userDataProp?.coverImage || 'https://images.unsplash.com/photo-1558769132-cb1aea3c9239?w=1200');
      setAvatarImage(userDataProp?.avatarImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400');
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const updatedProfile = {
        name: editData.name,
        bio: editData.bio,
        location: editData.location,
        age: editData.age,
        coverImage: coverImage,
        avatarImage: avatarImage,
        email: userDataProp?.email,
        username: generateUsername(editData.name)
      };

      if (onUpdateProfile) {
        await onUpdateProfile(updatedProfile);
      }

      setIsEditMode(false);
      alert('Perfil actualizado exitosamente ✅');
    } catch (error) {
      console.error('❌ Error al guardar el perfil:', error);
      alert(`Error al guardar los cambios: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!userDataProp?.id_usuario) {
      alert('Error: Usuario no autenticado');
      return;
    }

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const imageUrl = await uploadImageToServer(file);
        const visibilidad = activeTab === 'public' ? 'publico' : 'privado';

        const response = await fetch(`${API_URL}/designs/with-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: userDataProp.id_usuario,
            titulo: file.name.replace(/\.[^/.]+$/, ""),
            descripcion: '',
            tipo_diseño: 'imagen',
            visibilidad: visibilidad,
            imagen_url: imageUrl
          })
        });

        if (!response.ok) {
          throw new Error('Error al guardar el diseño');
        }

        const data = await response.json();
        return data.diseño;
      });

      await Promise.all(uploadPromises);
      await cargarDiseños();
      alert('Diseños subidos exitosamente ✅');

    } catch (error) {
      console.error('❌ Error al subir archivos:', error);
      alert('Error al subir los archivos: ' + error.message);
    }
  };

  const handleDeleteDesign = async (designId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este diseño?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/designs/remove/${designId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userDataProp.id_usuario })
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el diseño');
      }

      await cargarDiseños();
      alert('Diseño eliminado exitosamente ✅');

    } catch (error) {
      console.error('❌ Error al eliminar diseño:', error);
      alert('Error al eliminar el diseño: ' + error.message);
    }
  };

  const handleCreateCanvas = () => {
    if (onOpenWorkspace) {
      onOpenWorkspace();
    }
  };

  const handleEditDraft = (design) => {
    if (onOpenWorkspace) {
      onOpenWorkspace(design);
    }
  };

  const currentDesigns = activeTab === 'public' ? publicDesigns : privateDesigns;

  const currentUserId = userDataProp?.id_usuario;

  const resolveImageUrl = (design) => {
    const raw = design.imagen || design.imagen_url || design.image || design.url || '';
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
      return raw;
    }
    return `http://localhost:3001${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  return (
    <div className="profile-container">
      {/* Header con imagen de portada */}
      <div className="profile-header">
        <div className="profile-cover-container">
          <img src={coverImage} alt="Cover" className="profile-cover-image" />

          {isUploadingCover && (
            <div className="upload-overlay">
              <div className="spinner"></div>
              <p>Subiendo imagen...</p>
            </div>
          )}

          {isEditMode && !isUploadingCover && (
            <button
              className="profile-change-cover-button"
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera size={20} />
              <span>Cambiar portada</span>
            </button>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverChange}
          />

          <div className="profile-header-overlay">
            <button className="profile-back-button" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>

            {!isEditMode ? (
              <button className="profile-edit-button" onClick={toggleEditMode}>
                <Settings size={18} />
                <span>Editar Perfil</span>
              </button>
            ) : (
              <div className="profile-edit-actions">
                <button
                  className="profile-cancel-button"
                  onClick={toggleEditMode}
                  disabled={isSaving}
                >
                  <X size={18} />
                  <span>Cancelar</span>
                </button>
                <button
                  className="profile-save-button"
                  onClick={handleSaveProfile}
                  disabled={isSaving || isUploadingCover || isUploadingAvatar}
                >
                  <Save size={18} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="profile-main-content">

        {/* Sidebar - Información del usuario */}
        <div className="profile-sidebar">

          {/* Avatar con botón de edición */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-container">
              <img src={avatarImage} alt={userData.name} className="profile-avatar" />

              {isUploadingAvatar && (
                <div className="avatar-upload-overlay">
                  <div className="spinner-small"></div>
                </div>
              )}

              {isEditMode && !isUploadingAvatar && (
                <button
                  className="profile-change-avatar-button"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Edit2 size={16} />
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Nombre y username */}
          {isEditMode ? (
            <input
              type="text"
              className="profile-edit-input profile-name-input"
              value={editData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nombre"
            />
          ) : (
            <h2 className="profile-name">{userData.name}</h2>
          )}
          <p className="profile-username">{userData.username}</p>

          {/* Badges */}
          <div className="profile-badges">
            {userData.verified && (
              <span className="profile-badge profile-badge-verified">
                ✓ Diseñador Verificado
              </span>
            )}
            {userData.topCreator && (
              <span className="profile-badge profile-badge-top">
                ⭐ Top Creator
              </span>
            )}
          </div>

          {/* Biografía */}
          {isEditMode ? (
            <textarea
              className="profile-edit-textarea"
              value={editData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Biografía"
              rows={4}
            />
          ) : (
            <p className="profile-bio">{userData.bio}</p>
          )}

          {/* Información adicional */}
          <div className="profile-info-list">
            <div className="profile-info-item">
              <MapPin size={16} className="profile-info-icon" />
              {isEditMode ? (
                <input
                  type="text"
                  className="profile-edit-input-inline"
                  value={editData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ubicación"
                />
              ) : (
                <span>{userData.location}</span>
              )}
            </div>
            <div className="profile-info-item">
              <Calendar size={16} className="profile-info-icon" />
              <span>Unido en {userData.joinDate}</span>
            </div>
            <div className="profile-info-item">
              <Users size={16} className="profile-info-icon" />
              {isEditMode ? (
                <input
                  type="text"
                  className="profile-edit-input-inline"
                  value={editData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Edad"
                />
              ) : (
                <span>{userData.age}</span>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="profile-stats-container">
            <div className="profile-stat-item">
              <div className="profile-stat-number">{userData.stats.posts}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">{userData.stats.likes.toLocaleString()}</div>
              <div className="profile-stat-label">Likes</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">{userData.stats.followers.toLocaleString()}</div>
              <div className="profile-stat-label">Seguidores</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">{userData.stats.following}</div>
              <div className="profile-stat-label">Siguiendo</div>
            </div>
          </div>
        </div> {/* END profile-sidebar */}

        {/* Contenido principal - Diseños */}
        <div className="profile-content">
          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'public' ? 'profile-tab-active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              Diseños Públicos ({publicDesigns.length})
            </button>
            <button
              className={`profile-tab ${activeTab === 'private' ? 'profile-tab-active' : ''}`}
              onClick={() => setActiveTab('private')}
            >
              Diseños Privados ({privateDesigns.length})
            </button>
          </div>

          {/* Contenido de los tabs */}
          <div className="profile-tab-content">
            {isLoadingDesigns ? (
              <div className="profile-empty-state">
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando diseños...</p>
              </div>
            ) : currentDesigns.length > 0 ? (
              <>
                <div className="profile-designs-grid">
                  {currentDesigns.map((design) => {
                    const imgSrc = resolveImageUrl(design);
                    const isPrivate = activeTab === 'private';
                    return (
                      <div
                        key={design.id}
                        className={`profile-design-card ${isPrivate ? 'profile-design-card--editable' : ''}`}
                        onClick={isPrivate ? () => handleEditDraft(design) : undefined}
                        title={isPrivate ? 'Haz clic para editar en Workspace' : ''}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={design.titulo || 'Diseño'}
                            className="profile-design-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                        ) : null}
                        <div
                          className="profile-design-placeholder"
                          style={{ display: imgSrc ? 'none' : 'flex' }}
                        >
                          <FileText size={40} color="#d1d5db" />
                          <span>{design.titulo || 'Sin imagen'}</span>
                        </div>
                        <div className="profile-design-overlay">
                          {isPrivate && (
                            <div className="profile-design-edit-badge">
                              <Edit2 size={14} />
                              <span>Editar en Workspace</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            <span className="profile-design-status">{design.status || (design.visibilidad === 'privado' ? 'Privado' : 'Público')}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteDesign(design.id); }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.9)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="profile-design-info">
                            <p className="profile-design-title">{design.titulo}</p>
                          </div>
                          <div className="profile-design-stats">
                            <span className="profile-design-stat">
                              <Heart size={16} fill="white" />
                              {design.likes || 0}
                            </span>
                            <span className="profile-design-stat">
                              <MessageCircle size={16} />
                              {design.comments || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="profile-upload-section">
                  <div className="profile-upload-icon">
                    <Upload size={32} />
                  </div>
                  <h3 className="profile-upload-title">Sube tus diseños</h3>
                  <p className="profile-upload-subtitle">
                    Arrastra y suelta archivos aquí o haz clic en los botones
                  </p>
                  <div className="profile-upload-buttons">
                    <button
                      className="profile-upload-btn"
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      <Image size={20} />
                      Subir Archivos
                    </button>
                    <button
                      className="profile-upload-btn profile-upload-btn-secondary"
                      onClick={handleCreateCanvas}
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
                    onChange={handleFileUpload}
                  />
                </div>
              </>
            ) : (
              <div className="profile-empty-state">
                <FileText className="profile-empty-icon" size={80} />
                <h3 className="profile-empty-title">No hay diseños aún</h3>
                <p className="profile-empty-text">
                  Comienza subiendo tus primeros diseños o crea un nuevo lienzo
                </p>

                <div className="profile-upload-section" style={{ marginTop: '2rem' }}>
                  <div className="profile-upload-icon">
                    <Upload size={32} />
                  </div>
                  <h3 className="profile-upload-title">Sube tus diseños</h3>
                  <p className="profile-upload-subtitle">
                    Arrastra y suelta archivos aquí o haz clic en los botones
                  </p>
                  <div className="profile-upload-buttons">
                    <button
                      className="profile-upload-btn"
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      <Image size={20} />
                      Subir Archivos
                    </button>
                    <button
                      className="profile-upload-btn profile-upload-btn-secondary"
                      onClick={handleCreateCanvas}
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
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}
          </div>
        </div> {/* END profile-content */}

      </div> {/* END profile-main-content */}
    </div> // END profile-container
  );
}