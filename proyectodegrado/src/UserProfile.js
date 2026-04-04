import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, MapPin, Calendar, Users, Heart, MessageCircle, Camera, Edit2, Upload, Plus, Image, FileText, X, Save, Trash2, LogOut } from 'lucide-react';
import './UserProfile.css';
import ShareDesignModal from './ShareDesignModal';
import DesignCarousel from './DesignCarousel';
import DesignModal from './DesignModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function UserProfile({ onBack, onLogout, userData: userDataProp, onOpenWorkspace, onUpdateProfile, onOpenPublicProfile }) {
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

  // Modal de "Siguiendo"
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  // Modal de "Seguidores"
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  // Modal de diseño propio (likes/comentarios)
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [modalLikes, setModalLikes] = useState({ total: 0, liked: false });
  const [modalComments, setModalComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  // File input oculto para seleccionar archivo antes de abrir el modal
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

  // Al seleccionar archivo, guardar y abrir el ShareDesignModal
  const handleFileSelected = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!userDataProp?.id_usuario) { alert('Error: Usuario no autenticado'); return; }
    setPendingFiles(Array.from(files));
    setShareModalOpen(true);
    e.target.value = ''; // limpiar para permitir re-selección
  };

  // Callback cuando el post se crea exitosamente
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

  const handleOpenFollowing = async () => {
    setFollowingModalOpen(true);
    setIsLoadingFollowing(true);
    try {
      const res = await fetch(`${API_URL}/follows/following/${userDataProp.id_usuario}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : (data.following || data.usuarios || []);

      // Si cada registro ya trae nombre_usuario, usarlo directo
      // Si solo trae id_usuario_seguido, hacer fetch de cada perfil
      const normalizada = await Promise.all(
        lista.map(async (item) => {
          const nombre = item.nombre_usuario || item.seguido?.nombre_usuario || item.name;
          const foto = item.foto_perfil || item.seguido?.foto_perfil || item.avatarImage;
          const id = item.id_usuario_seguido || item.id_usuario || item.id;

          if (nombre) {
            // Ya tenemos los datos del usuario
            return {
              id_usuario: id,
              nombre_usuario: nombre,
              foto_perfil: foto || null,
              username: item.username || ('@' + nombre.toLowerCase().replace(/\s+/g, '')),
            };
          }

          // Solo tenemos el id — buscar el perfil
          try {
            const userRes = await fetch(`${API_URL}/usuarios/${id}`);
            const userData = await userRes.json();
            let infoAdicional = {};
            try { infoAdicional = typeof userData.informacion_adicional === 'string' ? JSON.parse(userData.informacion_adicional) : userData.informacion_adicional || {}; } catch (_) { }
            return {
              id_usuario: userData.id_usuario || id,
              nombre_usuario: userData.nombre_usuario || 'Usuario',
              foto_perfil: userData.foto_perfil || infoAdicional.foto_perfil || null,
              username: '@' + (userData.nombre_usuario || 'usuario').toLowerCase().replace(/\s+/g, ''),
            };
          } catch (_) {
            return { id_usuario: id, nombre_usuario: 'Usuario', foto_perfil: null, username: '@usuario' };
          }
        })
      );

      setFollowingList(normalizada);
    } catch (e) {
      console.error('Error cargando siguiendo:', e);
      setFollowingList([]);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const handleOpenFollowers = async () => {
    setFollowersModalOpen(true);
    setIsLoadingFollowers(true);
    try {
      const res = await fetch(`${API_URL}/follows/followers/${userDataProp.id_usuario}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : (data.followers || data.usuarios || []);

      const normalizada = await Promise.all(
        lista.map(async (item) => {
          const nombre = item.nombre_usuario || item.seguidor?.nombre_usuario || item.name;
          const foto = item.foto_perfil || item.seguidor?.foto_perfil || item.avatarImage;
          const id = item.id_usuario_seguidor || item.id_usuario || item.id;

          if (nombre) {
            return {
              id_usuario: id,
              nombre_usuario: nombre,
              foto_perfil: foto || null,
              username: item.username || ('@' + nombre.toLowerCase().replace(/\s+/g, '')),
            };
          }

          try {
            const userRes = await fetch(`${API_URL}/usuarios/${id}`);
            const userData = await userRes.json();
            let infoAdicional = {};
            try { infoAdicional = typeof userData.informacion_adicional === 'string' ? JSON.parse(userData.informacion_adicional) : userData.informacion_adicional || {}; } catch (_) { }
            return {
              id_usuario: userData.id_usuario || id,
              nombre_usuario: userData.nombre_usuario || 'Usuario',
              foto_perfil: userData.foto_perfil || infoAdicional.foto_perfil || null,
              username: '@' + (userData.nombre_usuario || 'usuario').toLowerCase().replace(/\s+/g, ''),
            };
          } catch (_) {
            return { id_usuario: id, nombre_usuario: 'Usuario', foto_perfil: null, username: '@usuario' };
          }
        })
      );

      setFollowersList(normalizada);
    } catch (e) {
      console.error('Error cargando seguidores:', e);
      setFollowersList([]);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleCreateCanvas = () => { if (onOpenWorkspace) onOpenWorkspace(); };
  const handleEditDraft = (design) => { if (onOpenWorkspace) onOpenWorkspace(design); };
  const currentDesigns = activeTab === 'public' ? publicDesigns : privateDesigns;

  const resolveImageUrl = (rawOrDesign) => {
    const raw = typeof rawOrDesign === 'string'
      ? rawOrDesign
      : (rawOrDesign?.imagen || rawOrDesign?.imagen_url || rawOrDesign?.image || rawOrDesign?.url || '');
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    return `${API_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  // Botones de upload reutilizables
  const UploadButtons = () => (
    <div className="profile-upload-buttons">
      <button className="profile-upload-btn" onClick={() => setShareModalOpen(true)}>
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
            <div className="profile-stat-item profile-stat-item--clickable" onClick={handleOpenFollowers}>
              <div className="profile-stat-number">{liveStats?.followers?.toLocaleString() || 0}</div>
              <div className="profile-stat-label">Seguidores</div>
            </div>
            <div className="profile-stat-item profile-stat-item--clickable" onClick={handleOpenFollowing}>
              <div className="profile-stat-number">{liveStats?.following || 0}</div>
              <div className="profile-stat-label">Siguiendo</div>
            </div>
          </div>

          {/* Botón cerrar sesión */}
          <div className="profile-sidebar-divider" />
          <button
            className="profile-logout-btn"
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
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
                    const isPrivate = activeTab === 'private';
                    return (
                      <div
                        key={design.id}
                        className={`profile-design-card ${isPrivate ? 'profile-design-card--editable' : ''}`}
                        onClick={isPrivate ? () => handleEditDraft(design) : () => handleOpenDesignModal(design)}
                        style={{ cursor: 'pointer' }}
                        title={isPrivate ? 'Haz clic para editar en Workspace' : 'Ver likes y comentarios'}
                      >
                        <DesignCarousel
                          design={design}
                          resolveUrl={resolveImageUrl}
                          className="profile-design-image"
                          placeholderCls="profile-design-placeholder"
                        />
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

      {/* Modal de Siguiendo */}
      {followingModalOpen && (
        <div
          className="following-modal-backdrop"
          onClick={() => setFollowingModalOpen(false)}
        >
          <div
            className="following-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="following-modal-header">
              <h3 className="following-modal-title">Siguiendo</h3>
              <button
                className="following-modal-close"
                onClick={() => setFollowingModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="following-modal-body">
              {isLoadingFollowing ? (
                <div className="following-modal-loading">
                  <div className="spinner"></div>
                  <p>Cargando...</p>
                </div>
              ) : followingList.length === 0 ? (
                <div className="following-modal-empty">
                  <Users size={48} color="#d1d5db" />
                  <p>Aún no sigues a nadie</p>
                </div>
              ) : (
                <ul className="following-list">
                  {followingList.map((user) => {
                    const avatar =
                      user.foto_perfil ||
                      user.avatarImage ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
                    const name =
                      user.nombre_usuario || user.name || 'Usuario';
                    const username =
                      user.username || '@' + name.toLowerCase().replace(/\s+/g, '');
                    return (
                      <li key={user.id_usuario || user.id} className="following-list-item">
                        <img
                          src={avatar}
                          alt={name}
                          className="following-avatar"
                          onError={e => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
                          }}
                        />
                        <div className="following-user-info">
                          <span className="following-user-name">{name}</span>
                          <span className="following-user-username">{username}</span>
                        </div>
                        <button
                          className="following-visit-btn"
                          onClick={() => {
                            setFollowingModalOpen(false);
                            if (typeof onOpenPublicProfile === 'function') {
                              onOpenPublicProfile(user.id_usuario);
                            }
                          }}
                        >
                          Ver perfil
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seguidores */}
      {followersModalOpen && (
        <div
          className="following-modal-backdrop"
          onClick={() => setFollowersModalOpen(false)}
        >
          <div
            className="following-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="following-modal-header">
              <h3 className="following-modal-title">Seguidores</h3>
              <button
                className="following-modal-close"
                onClick={() => setFollowersModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="following-modal-body">
              {isLoadingFollowers ? (
                <div className="following-modal-loading">
                  <div className="spinner"></div>
                  <p>Cargando...</p>
                </div>
              ) : followersList.length === 0 ? (
                <div className="following-modal-empty">
                  <Users size={48} color="#d1d5db" />
                  <p>Aún no tienes seguidores</p>
                </div>
              ) : (
                <ul className="following-list">
                  {followersList.map((user) => {
                    const avatar =
                      user.foto_perfil ||
                      user.avatarImage ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
                    const name = user.nombre_usuario || user.name || 'Usuario';
                    const username = user.username || '@' + name.toLowerCase().replace(/\s+/g, '');
                    return (
                      <li key={user.id_usuario || user.id} className="following-list-item">
                        <img
                          src={avatar}
                          alt={name}
                          className="following-avatar"
                          onError={e => {
                            e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100';
                          }}
                        />
                        <div className="following-user-info">
                          <span className="following-user-name">{name}</span>
                          <span className="following-user-username">{username}</span>
                        </div>
                        <button
                          className="following-visit-btn"
                          onClick={() => {
                            setFollowersModalOpen(false);
                            if (typeof onOpenPublicProfile === 'function') {
                              onOpenPublicProfile(user.id_usuario);
                            }
                          }}
                        >
                          Ver perfil
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File input oculto — dispara el ShareDesignModal */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* ShareDesignModal con los archivos seleccionados */}
      <ShareDesignModal
        isOpen={shareModalOpen}
        onClose={() => { setShareModalOpen(false); setPendingFiles([]); }}
        userData={userDataProp}
        initialFiles={pendingFiles}
        onPostCreated={handlePostCreated}
      />

      {/* Modal de diseño propio (likes y comentarios) */}
      {selectedDesign && (
        <DesignModal
          design={selectedDesign}
          resolveUrl={resolveImageUrl}
          likes={modalLikes}
          comments={modalComments}
          newComment={newComment}
          isPostingComment={isPostingComment}
          canComment={true}
          onClose={() => setSelectedDesign(null)}
          onToggleLike={handleToggleLike}
          onCommentChange={setNewComment}
          onPostComment={handlePostComment}
        />
      )}
    </div>
  );
}