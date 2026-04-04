import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Users, Heart, MessageCircle } from 'lucide-react';
import './UserProfile.css';
import DesignCarousel from './DesignCarousel';
import DesignModal from './DesignModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PublicProfile({ userId, onBack, loggedUserId }) {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('public');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);

    const [selectedDesign, setSelectedDesign] = useState(null);
    const [modalLikes, setModalLikes] = useState({ total: 0, liked: false });
    const [modalComments, setModalComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    const [publicDesigns, setPublicDesigns] = useState([]);
    const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);

    const resolveUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
        if (url.startsWith('uploads/')) return `${API_URL}/${url}`;
        return null;
    };

    // Cargar datos del perfil
    useEffect(() => {
        if (!userId) return;
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/usuarios/${userId}`);
                if (!response.ok) throw new Error('Error al cargar perfil');
                const data = await response.json();

                console.log('📋 Datos del perfil:', data);

                let infoAdicional = {};
                try {
                    infoAdicional = typeof data.informacion_adicional === 'string'
                        ? JSON.parse(data.informacion_adicional)
                        : data.informacion_adicional || {};
                } catch (e) { }

                // Intentar todas las variantes posibles del campo de foto
                const fotoPerfilRaw = data.foto_perfil || data.avatarImage || data.avatar || infoAdicional.foto_perfil || null;
                const fotoPortadaRaw = data.foto_portada || data.coverImage || infoAdicional.foto_portada || infoAdicional.coverImage || null;

                const avatarImage = resolveUrl(fotoPerfilRaw) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
                const coverImage = resolveUrl(fotoPortadaRaw) || 'https://images.unsplash.com/photo-1558769132-cb1aea3c9239?w=1200';

                setProfileData({
                    id_usuario: data.id_usuario,
                    name: data.nombre_usuario,
                    username: '@' + data.nombre_usuario.toLowerCase().replace(/\s+/g, ''),
                    email: data.correo,
                    bio: data.descripcion || infoAdicional.bio || 'Diseñador de moda',
                    location: infoAdicional.ubicacion || data.ubicacion || 'Sin ubicación',
                    joinDate: new Date(data.fecha_creacion).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long'
                    }),
                    age: infoAdicional.edad || '',
                    verified: infoAdicional.verificado || false,
                    topCreator: infoAdicional.top_creator || false,
                    avatarImage,
                    coverImage,
                    stats: data.stats || { posts: 0, likes: 0, followers: 0, following: 0 },
                });
            } catch (error) {
                console.error('Error al cargar perfil:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    // Cargar diseños públicos 
    useEffect(() => {
        if (!userId) return;
        const cargarDiseños = async () => {
            setIsLoadingDesigns(true);
            try {
                const res = await fetch(`${API_URL}/designs/usuario/${userId}?visibilidad=publico`);
                const data = await res.json();
                if (data.success) setPublicDesigns(data.diseños || []);
            } catch (error) {
                console.error('Error al cargar diseños:', error);
            } finally {
                setIsLoadingDesigns(false);
            }
        };
        cargarDiseños();
    }, [userId]);

    // Verificar si ya sigue 
    useEffect(() => {
        if (!userId || !loggedUserId) return;
        const checkIfFollowing = async () => {
            try {
                const response = await fetch(`${API_URL}/follows/followers/${userId}`);
                const data = await response.json();
                const yaSigue = Array.isArray(data) && data.some(f => f.id_usuario_seguidor === loggedUserId);
                setIsFollowing(yaSigue);
            } catch (error) {
                console.error("Error al verificar follow:", error);
            }
        };
        checkIfFollowing();
    }, [userId, loggedUserId]);

    const handleFollow = async () => {
        if (!loggedUserId) {
            alert("Debes iniciar sesión para seguir a alguien");
            return;
        }
        setIsLoadingFollow(true);
        try {
            if (isFollowing) {
                const response = await fetch(`${API_URL}/follows/followers/${userId}`);
                const data = await response.json();
                const followRecord = Array.isArray(data) && data.find(f => f.id_usuario_seguidor === loggedUserId);
                if (followRecord) {
                    await fetch(`${API_URL}/follows/${followRecord.id_seguir}`, { method: "DELETE" });
                    setIsFollowing(false);
                }
            } else {
                await fetch(`${API_URL}/follows`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id_usuario_seguidor: loggedUserId,
                        id_usuario_seguido: profileData.id_usuario,
                    }),
                });
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Error al seguir/dejar de seguir:", error);
            alert("Error al procesar la acción");
        } finally {
            setIsLoadingFollow(false);
        }
    };

    const resolveImageUrl = (rawOrDesign) => {
        const raw = typeof rawOrDesign === 'string'
            ? rawOrDesign
            : (rawOrDesign?.imagen || rawOrDesign?.imagen_url || rawOrDesign?.image || '');
        if (!raw) return null;
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
        return `${API_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
    };

    // Abrir modal 
    const handleOpenDesignModal = async (design) => {
        setSelectedDesign(design);
        setModalComments([]);
        setModalLikes({ total: design.likes || 0, liked: false });

        try {
            const [likesRes, commentsRes] = await Promise.all([
                fetch(`${API_URL}/likes/design/${design.id}${loggedUserId ? `?id_usuario=${loggedUserId}` : ''}`),
                fetch(`${API_URL}/comments/design/${design.id}`)
            ]);

            const likesData = await likesRes.json();
            const commentsData = await commentsRes.json();

            if (likesData.success) setModalLikes({ total: likesData.total, liked: likesData.liked });
            if (commentsData.success) setModalComments(commentsData.comentarios || []);
        } catch (error) {
            console.error('Error al cargar likes/comentarios:', error);
        }
    };

    // Toggle like 
    const handleToggleLike = async () => {
        if (!loggedUserId) {
            alert('Debes iniciar sesión para dar like');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/likes/design/${selectedDesign.id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: loggedUserId })
            });
            const data = await res.json();
            if (data.success) {
                setModalLikes(prev => ({
                    liked: data.liked,
                    total: data.liked ? prev.total + 1 : prev.total - 1
                }));
                setPublicDesigns(prev => prev.map(d =>
                    d.id === selectedDesign.id
                        ? { ...d, likes: data.liked ? (d.likes || 0) + 1 : (d.likes || 1) - 1 }
                        : d
                ));
            }
        } catch (error) {
            console.error('Error al dar like:', error);
        }
    };

    // Publicar comentario 
    const handlePostComment = async () => {
        if (!newComment.trim() || !loggedUserId) return;
        setIsPostingComment(true);
        try {
            const res = await fetch(`${API_URL}/comments/design/${selectedDesign.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: loggedUserId, contenido: newComment })
            });
            const data = await res.json();
            if (data.success) {
                setModalComments(prev => [data.comentario, ...prev]);
                setNewComment('');
            }
        } catch (error) {
            console.error('Error al comentar:', error);
        } finally {
            setIsPostingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p style={{ color: '#6b7280' }}>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="profile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>😕</div>
                    <p style={{ color: '#6b7280' }}>No se pudo cargar el perfil</p>
                    <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Header */}
            <div className="profile-header">
                <div className="profile-cover-container">
                    <img src={profileData.coverImage} alt="Cover" className="profile-cover-image"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558769132-cb1aea3c9239?w=1200'; }} />
                    <div className="profile-header-overlay">
                        <button className="profile-back-button" onClick={onBack}>
                            <ArrowLeft size={20} />
                            <span>Volver</span>
                        </button>
                        <div></div>
                    </div>
                </div>
            </div>

            {/* Contenedor principal */}
            <div className="profile-main-content">

                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-container">
                            <img
                                src={profileData.avatarImage}
                                alt={profileData.name}
                                className="profile-avatar"
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'; }}
                            />
                        </div>
                    </div>

                    <h2 className="profile-name">{profileData.name}</h2>
                    <p className="profile-username">{profileData.username}</p>

                    <div className="profile-badges">
                        {profileData.verified && (
                            <span className="profile-badge profile-badge-verified">✓ Diseñador Verificado</span>
                        )}
                        {profileData.topCreator && (
                            <span className="profile-badge profile-badge-top">⭐ Top Creator</span>
                        )}
                    </div>

                    <p className="profile-bio">{profileData.bio}</p>

                    <div className="profile-info-list">
                        <div className="profile-info-item">
                            <MapPin size={16} className="profile-info-icon" />
                            <span>{profileData.location}</span>
                        </div>
                        <div className="profile-info-item">
                            <Calendar size={16} className="profile-info-icon" />
                            <span>Unido en {profileData.joinDate}</span>
                        </div>
                        {profileData.age && (
                            <div className="profile-info-item">
                                <Users size={16} className="profile-info-icon" />
                                <span>{profileData.age}</span>
                            </div>
                        )}
                    </div>

                    <div className="profile-stats-container">
                        <div className="profile-stat-item">
                            <div className="profile-stat-number">{profileData.stats?.posts || 0}</div>
                            <div className="profile-stat-label">Posts</div>
                        </div>
                        <div className="profile-stat-item">
                            <div className="profile-stat-number">
                                {publicDesigns.reduce((sum, d) => sum + (d.likes || 0), 0).toLocaleString()}
                            </div>
                            <div className="profile-stat-label">Likes</div>
                        </div>
                        <div className="profile-stat-item">
                            <div className="profile-stat-number">{(profileData.stats?.followers || 0).toLocaleString()}</div>
                            <div className="profile-stat-label">Seguidores</div>
                        </div>
                        <div className="profile-stat-item">
                            <div className="profile-stat-number">{profileData.stats?.following || 0}</div>
                            <div className="profile-stat-label">Siguiendo</div>
                        </div>
                    </div>

                    <div className="profile-action-buttons">
                        <button
                            className={`profile-follow-button ${isFollowing ? 'profile-follow-button--following' : ''}`}
                            onClick={handleFollow}
                            disabled={isLoadingFollow}
                        >
                            {isLoadingFollow ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
                        </button>
                    </div>
                </div>

                {/* Contenido - Diseños */}
                <div className="profile-content">
                    <div className="profile-tabs">
                        <button
                            className={`profile-tab ${activeTab === 'public' ? 'profile-tab-active' : ''}`}
                            onClick={() => setActiveTab('public')}
                        >
                            Diseños Públicos ({publicDesigns.length})
                        </button>
                    </div>

                    <div className="profile-tab-content">
                        {isLoadingDesigns ? (
                            <div className="profile-empty-state">
                                <p style={{ color: '#6b7280' }}>Cargando diseños...</p>
                            </div>
                        ) : publicDesigns.length === 0 ? (
                            <div className="profile-empty-state">
                                <p style={{ color: '#6b7280' }}>Este diseñador no tiene diseños públicos aún.</p>
                            </div>
                        ) : (
                            <div className="profile-designs-grid">
                                {publicDesigns.map((design) => {
                                    return (
                                        <div
                                            key={design.id}
                                            className="profile-design-card"
                                            onClick={() => handleOpenDesignModal(design)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <DesignCarousel
                                                design={design}
                                                resolveUrl={resolveImageUrl}
                                                className="profile-design-image"
                                                placeholderCls="profile-design-placeholder"
                                            />
                                            <div className="profile-design-overlay">
                                                <span className="profile-design-status">{design.status || 'Público'}</span>
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
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de diseño */}
            {selectedDesign && (
                <DesignModal
                    design={selectedDesign}
                    resolveUrl={resolveImageUrl}
                    likes={modalLikes}
                    comments={modalComments}
                    newComment={newComment}
                    isPostingComment={isPostingComment}
                    canComment={!!loggedUserId}
                    onClose={() => { setSelectedDesign(null); setNewComment(''); }}
                    onToggleLike={handleToggleLike}
                    onCommentChange={setNewComment}
                    onPostComment={handlePostComment}
                />
            )}
        </div>
    );
}