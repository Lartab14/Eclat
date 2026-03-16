// SearchBar.js - Componente reutilizable de búsqueda
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function SearchBar({ onOpenPublicProfile }) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);

    // Cerrar búsqueda al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Abrir búsqueda y hacer foco
    const handleOpenSearch = () => {
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
    };

    // Buscar usuarios con debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setSearchError('');
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            setSearchError('');
            try {
                const res = await fetch(`${API_URL}/api/usuarios/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
                if (!res.ok) throw new Error('Error al buscar');
                const data = await res.json();
                setSearchResults(data.usuarios || []);
            } catch (err) {
                setSearchError('No se pudo conectar al servidor');
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="search-wrapper" ref={searchRef}>
            <button className="icon-button" onClick={handleOpenSearch}>
                <Search />
            </button>

            {searchOpen && (
                <div className="search-dropdown">
                    <div className="search-input-row">
                        <Search size={16} className="search-icon-inner" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="search-input"
                            placeholder="Buscar diseñadores..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>✕</button>
                        )}
                    </div>

                    <div className="search-results">
                        {isSearching && (
                            <div className="search-state">
                                <div className="search-spinner" />
                                <span>Buscando...</span>
                            </div>
                        )}
                        {!isSearching && searchError && (
                            <div className="search-state search-state--error">{searchError}</div>
                        )}
                        {!isSearching && !searchError && searchQuery && searchResults.length === 0 && (
                            <div className="search-state">No se encontraron usuarios</div>
                        )}
                        {!isSearching && searchResults.map((user) => {
                            const avatar = user.avatarImage || user.foto_perfil || '';
                            const fullAvatar = avatar
                                ? (avatar.startsWith('http') ? avatar : `${API_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`)
                                : null;
                            return (
                                <div
                                    key={user.id || user.id_usuario}
                                    className="search-result-item"
                                    onClick={() => {
                                        const userId = user.id || user.id_usuario;
                                        console.log('🔍 Click en usuario:', userId, user);
                                        if (userId && onOpenPublicProfile) {
                                            onOpenPublicProfile(userId);
                                            setSearchOpen(false);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="search-result-avatar">
                                        {fullAvatar
                                            ? <img src={fullAvatar} alt={user.name || user.nombre_usuario} />
                                            : <span>{(user.name || user.nombre_usuario || '?')[0].toUpperCase()}</span>
                                        }
                                    </div>
                                    <div className="search-result-info">
                                        <span className="search-result-name">{user.name || user.nombre_usuario}</span>
                                        <span className="search-result-role">{user.rol || 'Diseñador'}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {!searchQuery && (
                            <div className="search-state search-state--hint">Escribe para buscar usuarios</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}