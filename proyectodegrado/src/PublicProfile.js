import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Users, Heart, MessageCircle, X } from 'lucide-react';
import './UserProfile.css';

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
                } catch (e) {}

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

    // Cargar diseños públicos — ✅ rutas SIN /api
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

    // Verificar si ya sigue — ✅ rutas SIN /api
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
                // ✅ rutas SIN /api
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

    const resolveImageUrl = (design) => {
        const raw = design.imagen || design.imagen_url || design.image || '';
        if (!raw) return null;
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
        return `${API_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
    };

    // Abrir modal — ✅ rutas SIN /api
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

    // Toggle like — ✅ rutas SIN /api
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

    // Publicar comentario — ✅ rutas SIN /api
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
                                    const imgSrc = resolveImageUrl(design);
                                    return (
                                        <div
                                            key={design.id}
                                            className="profile-design-card"
                                            onClick={() => handleOpenDesignModal(design)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {imgSrc ? (
                                                <img
                                                    src={imgSrc}
                                                    alt={design.titulo}
                                                    className="profile-design-image"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="profile-design-placeholder">🎨</div>
                                            )}
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
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setSelectedDesign(null)}
                >
                    <div
                        style={{
                            background: 'white', borderRadius: '1rem', maxWidth: '800px',
                            width: '100%', maxHeight: '90vh', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            position: 'relative', backgroundColor: '#f3f4f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            maxHeight: '500px', overflow: 'hidden'
                        }}>
                            <img
                                src={resolveImageUrl(selectedDesign)}
                                alt={selectedDesign.titulo}
                                style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain', display: 'block' }}
                            />
                            <button
                                onClick={() => setSelectedDesign(null)}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                                    width: '36px', height: '36px', color: 'white', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
                            <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{selectedDesign.titulo}</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button
                                    onClick={handleToggleLike}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: modalLikes.liked ? '#ef4444' : '#6b7280',
                                        fontWeight: '600', fontSize: '1rem'
                                    }}
                                >
                                    <Heart size={22} fill={modalLikes.liked ? '#ef4444' : 'none'} />
                                    {modalLikes.total}
                                </button>
                                <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageCircle size={22} />
                                    {modalComments.length}
                                </span>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                            {loggedUserId ? (
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                        placeholder="Escribe un comentario..."
                                        style={{
                                            flex: 1, padding: '0.6rem 1rem', border: '1px solid #e5e7eb',
                                            borderRadius: '2rem', outline: 'none', fontSize: '0.9rem'
                                        }}
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        disabled={isPostingComment || !newComment.trim()}
                                        style={{
                                            padding: '0.6rem 1.2rem', background: '#9333ea', color: 'white',
                                            border: 'none', borderRadius: '2rem', cursor: 'pointer',
                                            opacity: (!newComment.trim() || isPostingComment) ? 0.5 : 1
                                        }}
                                    >
                                        Enviar
                                    </button>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '1rem' }}>
                                    Inicia sesión para comentar y dar likes
                                </p>
                            )}

                            {modalComments.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#9ca3af' }}>Sin comentarios aún. ¡Sé el primero!</p>
                            ) : (
                                modalComments.map(c => (
                                    <div key={c.id_comentario} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <img
                                            src={c.usuario?.foto_perfil || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                                            alt={c.usuario?.nombre_usuario}
                                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'; }}
                                        />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>
                                                {c.usuario?.nombre_usuario}
                                            </p>
                                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#374151' }}>
                                                {c.contenido}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}