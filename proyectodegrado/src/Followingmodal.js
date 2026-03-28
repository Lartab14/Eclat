// Followingmodal.js - Modal para mostrar usuarios que sigues
import React, { useState, useEffect } from 'react';
import { X, Users, Search } from 'lucide-react';
import './Followingmodal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Followingmodal({ isOpen, onClose, userId, onOpenPublicProfile }) {
    const [following, setFollowing] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && userId) {
            cargarSeguidos();
        }
    }, [isOpen, userId]);

    const cargarSeguidos = async () => {
        setIsLoading(true);
        try {
            // Obtener la lista de usuarios seguidos
            const response = await fetch(`${API_URL}/follows/following/${userId}`);
            const data = await response.json();

            console.log('📋 Usuarios seguidos:', data);

            // Formatear los datos
            const formattedFollowing = Array.isArray(data) ? data.map(follow => {
                const usuario = follow.usuario_seguido || follow.usuario || {};
                return {
                    id: usuario.id_usuario,
                    nombre: usuario.nombre_usuario,
                    email: usuario.correo,
                    avatar: usuario.foto_perfil || usuario.avatarImage || null,
                    bio: usuario.descripcion || '',
                };
            }) : [];

            setFollowing(formattedFollowing);
        } catch (error) {
            console.error('❌ Error al cargar seguidos:', error);
            setFollowing([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = (followedUserId) => {
        if (onOpenPublicProfile) {
            onOpenPublicProfile(followedUserId);
            onClose();
        }
    };

    const resolveAvatarUrl = (avatar) => {
        if (!avatar) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
        return `${API_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    // Filtrar usuarios por búsqueda
    const filteredFollowing = following.filter(user =>
        user.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="following-modal-overlay" onClick={onClose}>
            <div className="following-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="following-modal-header">
                    <div className="following-modal-title-section">
                        <Users size={24} className="following-modal-icon" />
                        <h2 className="following-modal-title">Siguiendo</h2>
                        <span className="following-modal-count">{following.length}</span>
                    </div>
                    <button className="following-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="following-modal-search">
                    <Search size={18} className="following-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar en siguiendo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="following-search-input"
                    />
                    {searchQuery && (
                        <button
                            className="following-search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="following-modal-body">
                    {isLoading ? (
                        <div className="following-loading">
                            <div className="following-spinner"></div>
                            <p>Cargando...</p>
                        </div>
                    ) : filteredFollowing.length === 0 ? (
                        <div className="following-empty">
                            {searchQuery ? (
                                <>
                                    <Users size={48} className="following-empty-icon" />
                                    <p className="following-empty-title">No se encontraron resultados</p>
                                    <p className="following-empty-text">
                                        Intenta buscar con otro nombre
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Users size={48} className="following-empty-icon" />
                                    <p className="following-empty-title">No sigues a nadie aún</p>
                                    <p className="following-empty-text">
                                        Explora diseñadores y comienza a seguir a otros usuarios
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="following-list">
                            {filteredFollowing.map((user) => (
                                <div
                                    key={user.id}
                                    className="following-user-item"
                                    onClick={() => handleUserClick(user.id)}
                                >
                                    <div className="following-user-avatar">
                                        <img
                                            src={resolveAvatarUrl(user.avatar)}
                                            alt={user.nombre}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
                                            }}
                                        />
                                    </div>
                                    <div className="following-user-info">
                                        <h3 className="following-user-name">{user.nombre}</h3>
                                        {user.bio && (
                                            <p className="following-user-bio">{user.bio}</p>
                                        )}
                                    </div>
                                    <button className="following-user-arrow">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con stats */}
                {!isLoading && following.length > 0 && (
                    <div className="following-modal-footer">
                        <p className="following-footer-text">
                            {searchQuery
                                ? `${filteredFollowing.length} de ${following.length} usuarios`
                                : `Total: ${following.length} ${following.length === 1 ? 'usuario' : 'usuarios'}`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}