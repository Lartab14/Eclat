import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, MapPin, Calendar, Users, Heart, MessageCircle, Camera, Edit2, Upload, Plus, Image, FileText, X, Save, Trash2 } from 'lucide-react';
import './UserProfile.css';
import ShareDesignModal from './ShareDesignModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    name: userDataProp?.name || userDataProp?.nombre_usuario || 'Usuario',
    bio: userDataProp?.bio || userDataProp?.descripcion || '',
    location: userDataProp?.location || userDataProp?.ubicacion || '',
    age: userDataProp?.age || '',
  });

  const [publicDesigns, setPublicDesigns] = useState([]);
  const [privateDesigns, setPrivateDesigns] = useState([]);
  const [liveStats, setLiveStats] = useState(userDataProp?.stats || { posts: 0, likes: 0, followers: 0, following: 0 });

  // Modal de compartir diseño
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  // Modal de diseño propio (likes/comentarios)
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [modalLikes, setModalLikes] = useState({ total: 0, liked: false });
  const [modalComments, setModalComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  // ✅ File input oculto para seleccionar archivo antes de abrir el modal
  const uploadInputRef = useRef(null);

  const generateUsername = (name) => {
    if (!name) return '@usuario';
    return '@' + name.toLowerCase().replace(/\s+/g, '');
  };

  const userData = {
    name: editData.name,
    username: generateUsername(editData.name),
    email: userDataProp?.email || userDataProp?.correo || '',
    bio: editData.bio,
    location: editData.location,
    joinDate: userDataProp?.joinDate || 'Marzo 2024',
    age: editData.age,
    verified: userDataProp?.verified || false,
    topCreator: userDataProp?.topCreator || false,
    stats: liveStats,
  };

  const cargarStats = useCallback(async () => {
    if (!userDataProp?.id_usuario) return;
    try {
      const res = await fetch(`${API_URL}/usuarios/${userDataProp.id_usuario}`);
      const data = await res.json();
      if (data.stats) setLiveStats(data.stats);
    } catch (e) {
      console.error('Error cargando stats:', e);
    }
  }, [userDataProp?.id_usuario]);

  const cargarDiseños = useCallback(async () => {
    if (!userDataProp?.id_usuario) return;
    setIsLoadingDesigns(true);
    try {
      const [resPublic, resPrivate] = await Promise.all([
        fetch(`${API_URL}/designs/usuario/${userDataProp.id_usuario}?visibilidad=publico`),
        fetch(`${API_URL}/designs/usuario/${userDataProp.id_usuario}?visibilidad=privado`)
      ]);
      const dataPublic = await resPublic.json();
      const dataPrivate = await resPrivate.json();
      if (dataPublic.success) setPublicDesigns(dataPublic.diseños || []);
      if (dataPrivate.success) setPrivateDesigns(dataPrivate.diseños || []);
    } catch (error) {
      console.error("❌ Error al cargar diseños:", error);
    } finally {
      setIsLoadingDesigns(false);
    }
  }, [userDataProp?.id_usuario]);

  useEffect(() => {
    cargarDiseños();
    cargarStats();
  }, [userDataProp?.id_usuario]);

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingCover(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`${API_URL}/upload/${userDataProp.id_usuario}/cover`, { method: 'POST', body: formData });
        const data = await response.json();
        setCoverImage(data.imageUrl);
      } catch { alert('Error al subir la imagen de portada'); }
      finally { setIsUploadingCover(false); }
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`${API_URL}/upload/${userDataProp.id_usuario}/avatar`, { method: 'POST', body: formData });
        const data = await response.json();
        setAvatarImage(data.imageUrl);
      } catch { alert('Error al subir la imagen de perfil'); }
      finally { setIsUploadingAvatar(false); }
    }
  };

  const handleInputChange = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));

  const toggleEditMode = () => {
    if (isEditMode) {
      setEditData({
        name: userDataProp?.name || userDataProp?.nombre_usuario || 'Usuario',
        bio: userDataProp?.bio || userDataProp?.descripcion || '',
        location: userDataProp?.location || userDataProp?.ubicacion || '',
        age: userDataProp?.age || '',
      });
      setCoverImage(userDataProp?.coverImage || 'https://images.unsplash.com/photo-1558769132-cb1aea3c9239?w=1200');
      setAvatarImage(userDataProp?.avatarImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400');
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const userId = userDataProp?.id_usuario;
      if (!userId) throw new Error('Usuario no autenticado');
      const response = await fetch(`${API_URL}/usuarios/perfil/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editData.name, bio: editData.bio, location: editData.location, age: editData.age, avatarImage, coverImage })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al guardar el perfil');
      }
      const updatedProfile = {
        ...userDataProp,
        name: editData.name, nombre_usuario: editData.name,
        bio: editData.bio, descripcion: editData.bio,
        location: editData.location, ubicacion: editData.location,
        age: editData.age,
        avatarImage, foto_perfil: avatarImage,
        coverImage, foto_portada: coverImage,
      };
      if (onUpdateProfile) await onUpdateProfile(updatedProfile);
      setIsEditMode(false);
      alert('Perfil actualizado exitosamente ✅');
    } catch (error) {
      alert(`Error al guardar los cambios: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Al seleccionar archivo, guardar y abrir el ShareDesignModal
  const handleFileSelected = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!userDataProp?.id_usuario) { alert('Error: Usuario no autenticado'); return; }
    setPendingFiles(Array.from(files));
    setShareModalOpen(true);
    e.target.value = ''; // limpiar para permitir re-selección
  };

  // ✅ Callback cuando el post se crea exitosamente
  const handlePostCreated = async () => {
    setPendingFiles([]);
    await cargarDiseños();
    await cargarStats();
  };

  const handleDeleteDesign = async (designId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este diseño?')) return;
    try {
      const response = await fetch(`${API_URL}/designs/remove/${designId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userDataProp.id_usuario })
      });
      if (!response.ok) throw new Error('Error al eliminar el diseño');
      await cargarDiseños();
      await cargarStats();
      alert('Diseño eliminado exitosamente ✅');
    } catch (error) {
      alert('Error al eliminar el diseño: ' + error.message);
    }
  };

  const handleOpenDesignModal = async (design) => {
    setSelectedDesign(design);
    setModalComments([]);
    setModalLikes({ total: design.likes || 0, liked: false });
    try {
      const [likesRes, commentsRes] = await Promise.all([
        fetch(`${API_URL}/likes/design/${design.id}?id_usuario=${userDataProp.id_usuario}`),
        fetch(`${API_URL}/comments/design/${design.id}`)
      ]);
      const likesData = await likesRes.json();
      const commentsData = await commentsRes.json();
      if (likesData.success) setModalLikes({ total: likesData.total, liked: likesData.liked });
      if (commentsData.success) setModalComments(commentsData.comentarios || []);
    } catch (error) {
      console.error('Error cargando likes/comentarios:', error);
    }
  };

  const handleToggleLike = async () => {
    try {
      const res = await fetch(`${API_URL}/likes/design/${selectedDesign.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userDataProp.id_usuario })
      });
      const data = await res.json();
      if (data.success) {
        setModalLikes(prev => ({ liked: data.liked, total: data.liked ? prev.total + 1 : prev.total - 1 }));
        setPublicDesigns(prev => prev.map(d =>
          d.id === selectedDesign.id
            ? { ...d, likes: data.liked ? (d.likes || 0) + 1 : Math.max((d.likes || 1) - 1, 0) }
            : d
        ));
        await cargarStats();
      }
    } catch (error) { console.error('Error al dar like:', error); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPostingComment(true);
    try {
      const res = await fetch(`${API_URL}/comments/design/${selectedDesign.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userDataProp.id_usuario, contenido: newComment })
      });
      const data = await res.json();
      if (data.success) { setModalComments(prev => [data.comentario, ...prev]); setNewComment(''); }
    } catch (error) { console.error('Error al comentar:', error); }
    finally { setIsPostingComment(false); }
  };

  const handleCreateCanvas = () => { if (onOpenWorkspace) onOpenWorkspace(); };
  const handleEditDraft = (design) => { if (onOpenWorkspace) onOpenWorkspace(design); };
  const currentDesigns = activeTab === 'public' ? publicDesigns : privateDesigns;

  const resolveImageUrl = (design) => {
    const raw = design.imagen || design.imagen_url || design.image || design.url || '';
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    return `${API_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  // ✅ Botones de upload reutilizables
  const UploadButtons = () => (
    <div className="profile-upload-buttons">
      <button className="profile-upload-btn" onClick={() => uploadInputRef.current?.click()}>
        <Image size={20} />Subir Archivos
      </button>
      <button className="profile-upload-btn profile-upload-btn-secondary" onClick={handleCreateCanvas}>
        <Plus size={20} />Crear Nuevo Lienzo
      </button>
    </div>
  );

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-cover-container">
          <img src={coverImage} alt="Cover" className="profile-cover-image" />
          {isUploadingCover && <div className="upload-overlay"><div className="spinner"></div><p>Subiendo imagen...</p></div>}
          {isEditMode && !isUploadingCover && (
            <button className="profile-change-cover-button" onClick={() => coverInputRef.current?.click()}>
              <Camera size={20} /><span>Cambiar portada</span>
            </button>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
          <div className="profile-header-overlay">
            <button className="profile-back-button" onClick={onBack}>
              <ArrowLeft size={20} /><span>Volver</span>
            </button>
            {!isEditMode ? (
              <button className="profile-edit-button" onClick={toggleEditMode}>
                <Settings size={18} /><span>Editar Perfil</span>
              </button>
            ) : (
              <div className="profile-edit-actions">
                <button className="profile-cancel-button" onClick={toggleEditMode} disabled={isSaving}>
                  <X size={18} /><span>Cancelar</span>
                </button>
                <button className="profile-save-button" onClick={handleSaveProfile} disabled={isSaving || isUploadingCover || isUploadingAvatar}>
                  <Save size={18} /><span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-main-content">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-container">
              <img src={avatarImage} alt={userData.name} className="profile-avatar" />
              {isUploadingAvatar && <div className="avatar-upload-overlay"><div className="spinner-small"></div></div>}
              {isEditMode && !isUploadingAvatar && (
                <button className="profile-change-avatar-button" onClick={() => avatarInputRef.current?.click()}>
                  <Edit2 size={16} />
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
          </div>

          {isEditMode ? (
            <input type="text" className="profile-edit-input profile-name-input" value={editData.name}
              onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Nombre" />
          ) : <h2 className="profile-name">{userData.name}</h2>}
          <p className="profile-username">{userData.username}</p>

          <div className="profile-badges">
            {userData.verified && <span className="profile-badge profile-badge-verified">✓ Diseñador Verificado</span>}
            {userData.topCreator && <span className="profile-badge profile-badge-top">⭐ Top Creator</span>}
          </div>

          {isEditMode ? (
            <textarea className="profile-edit-textarea" value={editData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Biografía" rows={4} />
          ) : <p className="profile-bio">{userData.bio}</p>}

          <div className="profile-info-list">
            <div className="profile-info-item">
              <MapPin size={16} className="profile-info-icon" />
              {isEditMode ? (
                <input type="text" className="profile-edit-input-inline" value={editData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)} placeholder="Ubicación" />
              ) : <span>{userData.location}</span>}
            </div>
            <div className="profile-info-item">
              <Calendar size={16} className="profile-info-icon" />
              <span>Unido en {userData.joinDate}</span>
            </div>
            <div className="profile-info-item">
              <Users size={16} className="profile-info-icon" />
              {isEditMode ? (
                <input type="text" className="profile-edit-input-inline" value={editData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)} placeholder="Edad" />
              ) : <span>{userData.age}</span>}
            </div>
          </div>

          <div className="profile-stats-container">
            <div className="profile-stat-item">
              <div className="profile-stat-number">{liveStats?.posts || 0}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">{liveStats?.likes?.toLocaleString() || 0}</div>
              <div className="profile-stat-label">Likes</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">{liveStats?.followers?.toLocaleString() || 0}</div>
              <div className="profile-stat-label">Seguidores</div>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-number">{liveStats?.following || 0}</div>
              <div className="profile-stat-label">Siguiendo</div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="profile-content">
          <div className="profile-tabs">
            <button className={`profile-tab ${activeTab === 'public' ? 'profile-tab-active' : ''}`} onClick={() => setActiveTab('public')}>
              Diseños Públicos ({publicDesigns.length})
            </button>
            <button className={`profile-tab ${activeTab === 'private' ? 'profile-tab-active' : ''}`} onClick={() => setActiveTab('private')}>
              Diseños Privados ({privateDesigns.length})
            </button>
          </div>

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
                        onClick={isPrivate ? () => handleEditDraft(design) : () => handleOpenDesignModal(design)}
                        style={{ cursor: 'pointer' }}
                        title={isPrivate ? 'Haz clic para editar en Workspace' : 'Ver likes y comentarios'}
                      >
                        {imgSrc ? (
                          <img src={imgSrc} alt={design.titulo || 'Diseño'} className="profile-design-image"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
                        ) : null}
                        <div className="profile-design-placeholder" style={{ display: imgSrc ? 'none' : 'flex' }}>
                          <FileText size={40} color="#d1d5db" /><span>{design.titulo || 'Sin imagen'}</span>
                        </div>
                        <div className="profile-design-overlay">
                          {isPrivate && <div className="profile-design-edit-badge"><Edit2 size={14} /><span>Editar en Workspace</span></div>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                            <span className="profile-design-status">{design.status || (design.visibilidad === 'privado' ? 'Privado' : 'Público')}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteDesign(design.id); }}
                              style={{ background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="profile-design-info"><p className="profile-design-title">{design.titulo}</p></div>
                          <div className="profile-design-stats">
                            <span className="profile-design-stat"><Heart size={16} fill="white" />{design.likes || 0}</span>
                            <span className="profile-design-stat"><MessageCircle size={16} />{design.comments || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                
                <div className="profile-upload-section">
                  <div className="profile-upload-icon"><Upload size={32} /></div>
                  <h3 className="profile-upload-title">Sube tus diseños</h3>
                  <p className="profile-upload-subtitle">Arrastra y suelta archivos aquí o haz clic en los botones</p>
                  <UploadButtons />
                </div>
              </>
            ) : (
              <div className="profile-empty-state">
                <FileText className="profile-empty-icon" size={80} />
                <h3 className="profile-empty-title">No hay diseños aún</h3>
                <p className="profile-empty-text">Comienza subiendo tus primeros diseños o crea un nuevo lienzo</p>
                <div className="profile-upload-section" style={{ marginTop: '2rem' }}>
                  <div className="profile-upload-icon"><Upload size={32} /></div>
                  <h3 className="profile-upload-title">Sube tus diseños</h3>
                  <p className="profile-upload-subtitle">Arrastra y suelta archivos aquí o haz clic en los botones</p>
                  <UploadButtons />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      

      {/* ✅ ShareDesignModal con los archivos seleccionados */}
      <ShareDesignModal
        isOpen={shareModalOpen}
        onClose={() => { setShareModalOpen(false); setPendingFiles([]); }}
        userData={userDataProp}
        initialFiles={pendingFiles}
        onPostCreated={handlePostCreated}
      />

      {/* Modal de diseño propio (likes y comentarios) */}
      {selectedDesign && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setSelectedDesign(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '1rem', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '450px', overflow: 'hidden' }}>
              <img src={resolveImageUrl(selectedDesign)} alt={selectedDesign.titulo}
                style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'contain', display: 'block' }} />
              <button onClick={() => setSelectedDesign(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>
                {selectedDesign.titulo}
              </h3>
              {selectedDesign.descripcion && selectedDesign.descripcion !== 'Compartido desde Éclat' && (
                <p style={{ margin: '0 0 0.875rem', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
                  {selectedDesign.descripcion}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <button onClick={handleToggleLike} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: modalLikes.liked ? '#ef4444' : '#6b7280', fontWeight: '600', fontSize: '1rem' }}>
                  <Heart size={22} fill={modalLikes.liked ? '#ef4444' : 'none'} />{modalLikes.total}
                </button>
                <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageCircle size={22} />{modalComments.length}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                  placeholder="Escribe un comentario..."
                  style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid #e5e7eb', borderRadius: '2rem', outline: 'none', fontSize: '0.9rem' }} />
                <button onClick={handlePostComment} disabled={isPostingComment || !newComment.trim()}
                  style={{ padding: '0.6rem 1.2rem', background: '#9333ea', color: 'white', border: 'none', borderRadius: '2rem', cursor: 'pointer', opacity: (!newComment.trim() || isPostingComment) ? 0.5 : 1 }}>
                  Enviar
                </button>
              </div>

              {modalComments.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af' }}>Sin comentarios aún. ¡Sé el primero!</p>
              ) : modalComments.map(c => (
                <div key={c.id_comentario} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img src={c.usuario?.foto_perfil || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                    alt={c.usuario?.nombre_usuario}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'; }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>{c.usuario?.nombre_usuario}</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#374151' }}>{c.contenido}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}