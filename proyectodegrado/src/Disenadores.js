import React, { useState, useEffect } from 'react';
import { User, Users, Heart, MapPin, X } from 'lucide-react';
import SearchBar from './Searchbar';
import './Disenadores.css';

import LogoEclat from './img/LogoEclat.png';
import Eclat from './img/Eclat.png';
import HeroVideo from './img/Disenadores.mp4';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Disenadores({
  onNavigateHome,
  onOpenWorkspace,
  onOpenProfile,
  onOpenPublicProfile,
  onOpenCollections,
  onOpenTrends,
  userData
}) {
  const [designers, setDesigners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { cargarDisenadoresAleatorios(); }, []);

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formatNum = (n) => {
    const num = Number(n);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const cargarDisenadoresAleatorios = async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_URL}/usuarios/aleatorios?limit=12`);
      if (!response.ok) throw new Error('Error al cargar los diseñadores');
      const data = await response.json();
      if (data.success && data.usuarios) {
        const formateados = data.usuarios.map(d => {
          const rawAvatar = d.avatarImage || d.foto_perfil || d.avatar || '';
          const rawCover = d.coverImage || d.foto_portada || d.portada || '';
          const name = d.name || d.nombre_usuario || d.nombre || 'Diseñador';
          const username = d.username || d.usuario || name;
          const specialty = d.specialty || d.especialidad || d.rol || 'Diseñador de moda';
          const location = d.location || d.ubicacion || d.ciudad || 'Colombia';
          return {
            ...d,
            id: d.id || d.id_usuario,
            name, username: username.startsWith('@') ? username : `@${username}`,
            specialty, location,
            avatarImage: resolveUrl(rawAvatar),
            coverImage: resolveUrl(rawCover),
            followers: formatNum(d.followers ?? d.seguidores ?? d.num_seguidores ?? 0),
            projects: formatNum(d.projects ?? d.total_posts ?? d.num_posts ?? d.publicaciones ?? 0),
            likes: formatNum(d.likes ?? d.total_likes ?? d.num_likes ?? 0),
          };
        });
        setDesigners(formateados);
      } else { setDesigners([]); }
    } catch (err) {
      console.error('❌ Error al cargar diseñadores:', err);
      setError(err.message); setDesigners([]);
    } finally { setIsLoading(false); }
  };

  const handleFollowDesigner = async (designerId) => {
    const token = localStorage.getItem('authToken');
    if (!token) return alert('Debes iniciar sesión para seguir a un diseñador');
    const yaSigniendo = following[designerId];
    setFollowing(prev => ({ ...prev, [designerId]: !yaSigniendo }));
    try {
      await fetch(`${API_URL}/follows/${yaSigniendo ? 'unfollow' : 'follow'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ seguido_id: designerId })
      });
    } catch (err) {
      setFollowing(prev => ({ ...prev, [designerId]: yaSigniendo }));
      console.error('Error al seguir:', err);
    }
  };

  const handleViewProfile = (designerId) => {
    if (onOpenPublicProfile) onOpenPublicProfile(designerId);
  };

  return (
    <div className="designers-page">
      <header className="designers-header">
        <div className="header-content">
          <div className="logo-section" onClick={onNavigateHome} style={{ cursor: 'pointer' }}>
            <div className="logo-circle"><img src={LogoEclat} alt="Logo Éclat" className="logo-image" /></div>
            <h1 className="logo-title">Éclat</h1>
          </div>
          <nav className="nav-menu">
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>Explorar</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenCollections(); }}>Colecciones</a>
            <a href="#" className="nav-link active">Diseñadores</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenTrends(); }}>Tendencias</a>
          </nav>
          <div className="header-actions">
            {/* Botón hamburguesa — solo visible en móvil */}
            <button
              className="icon-button mobile-menu-btn"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Menú"
            >
              {mobileMenuOpen
                ? <X size={20} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              }
            </button>
            <SearchBar onOpenPublicProfile={onOpenPublicProfile} />
            <button className="upload-button" onClick={onOpenWorkspace}>Crear diseño</button>
            <button className="icon-button" onClick={onOpenProfile}><User /></button>
          </div>
        </div>
      </header>

      {/* Drawer móvil */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" onClick={() => setMobileMenuOpen(false)}>
          <a href="#" className="mobile-nav-link" onClick={e => { e.preventDefault(); onNavigateHome(); }}>Explorar</a>
          <a href="#" className="mobile-nav-link" onClick={e => { e.preventDefault(); onOpenCollections(); }}>Colecciones</a>
          <a href="#" className="mobile-nav-link active">Diseñadores</a>
          <a href="#" className="mobile-nav-link" onClick={e => { e.preventDefault(); onOpenTrends(); }}>Tendencias</a>
          <div className="mobile-nav-divider" />
          <button className="mobile-nav-link" onClick={() => { setMobileMenuOpen(false); onOpenProfile(); }}>Mi perfil</button>
        </div>
      )}

      <section className="designers-hero-section">
        <video className="hero-video-background" autoPlay loop muted playsInline>
          <source src={HeroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-text-overlay">
          <span className="hero-text-eyebrow">Comunidad Éclat</span>
          <h2 className="hero-text-title">Conoce las mentes <span className="hero-text-accent">detrás del diseño</span></h2>
          <p className="hero-text-subtitle">Descubre diseñadores emergentes que están redefiniendo la moda.</p>
        </div>
      </section>

      <section className="featured-designers-section">
        <div className="featured-container">
          <div className="featured-header">
            <h2 className="featured-title">Diseñadores <span className="highlight">Destacados</span></h2>
            <p className="featured-subtitle">Explora los perfiles de nuestros diseñadores más talentosos.</p>
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <div style={{ margin: '0 auto 1rem', width: '50px', height: '50px', border: '4px solid #f3f4f6', borderTopColor: '#9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p>Cargando diseñadores...</p>
            </div>
          )}
          {error && !isLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
              <p>❌ Error: {error}</p>
              <button onClick={cargarDisenadoresAleatorios} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#9333ea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Reintentar</button>
            </div>
          )}
          {!isLoading && !error && designers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p>No hay diseñadores disponibles en este momento.</p>
            </div>
          )}

          {!isLoading && !error && designers.length > 0 && (
            <div className="designers-grid">
              {designers.map((designer) => (
                <div key={designer.id} className="designer-card">
                  <div className="designer-cover" style={{ cursor: 'pointer' }} onClick={() => handleViewProfile(designer.id)}>
                    {designer.coverImage ? (
                      <img src={designer.coverImage} alt={`${designer.name} cover`} className="designer-cover-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML += '<div class="designer-cover-placeholder">🎨</div>';
                        }} />
                    ) : (
                      <div className="designer-cover-placeholder" style={{
                        background: `hsl(${(designer.name.charCodeAt(0) * 17) % 360}, 60%, 75%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', fontSize: '2rem'
                      }}>{designer.name[0].toUpperCase()}</div>
                    )}
                  </div>

                  <div className="designer-avatar-wrapper">
                    {designer.avatarImage ? (
                      <img src={designer.avatarImage} alt={designer.name} className="designer-avatar"
                        onError={(e) => {
                          e.target.outerHTML = `<div class="designer-avatar designer-avatar-placeholder" style="background:hsl(${(designer.name.charCodeAt(0) * 17) % 360},60%,65%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:1.2rem">${designer.name[0].toUpperCase()}</div>`;
                        }} />
                    ) : (
                      <div className="designer-avatar designer-avatar-placeholder" style={{
                        background: `hsl(${(designer.name.charCodeAt(0) * 17) % 360}, 60%, 65%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                      }}>{designer.name[0].toUpperCase()}</div>
                    )}
                  </div>

                  <div className="designer-info">
                    <h3 className="designer-name">{designer.name}</h3>
                    <p className="designer-username">{designer.username}</p>
                    <p className="designer-specialty">{designer.specialty}</p>
                    <div className="designer-location"><MapPin size={14} />{designer.location}</div>
                    <div className="designer-stats">
                      <div className="designer-stat">
                        <div className="designer-stat-value">{designer.followers}</div>
                        <div className="designer-stat-label">Seguidores</div>
                      </div>
                      <div className="designer-stat">
                        <div className="designer-stat-value">{designer.projects}</div>
                        <div className="designer-stat-label">Diseños</div>
                      </div>
                      <div className="designer-stat">
                        <div className="designer-stat-value">{designer.likes}</div>
                        <div className="designer-stat-label">Likes</div>
                      </div>
                    </div>
                    <div className="designer-actions">
                      <button
                        className={`btn-follow ${following[designer.id] ? 'following' : ''}`}
                        onClick={() => handleFollowDesigner(designer.id)}
                        style={{ background: following[designer.id] ? '#e5e7eb' : undefined, color: following[designer.id] ? '#374151' : undefined }}
                      >{following[designer.id] ? 'Siguiendo' : 'Seguir'}</button>
                      <button className="btn-profile" onClick={() => handleViewProfile(designer.id)}>Ver Perfil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="inspiration-section">
        <div className="section-container">
          <div className="inspiration-content">
            <div className="inspiration-mascot"><img src={Eclat} alt="Mascota Éclat" /></div>
            <div className="inspiration-text">
              <span className="inspiration-eyebrow">Tu espacio creativo</span>
              <h2 className="section-title">Tu próxima gran <span className="highlight">colección</span><br />empieza aquí</h2>
              <p>Construye tu portafolio, conecta con la comunidad y lleva tu visión creativa al siguiente nivel.</p>
              <div className="inspiration-actions">
                <button className="inspiration-cta-btn" onClick={onOpenProfile}>
                  <span className="inspiration-cta-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span>Ir a mi perfil</span>
                  <svg className="inspiration-cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-divider-top" />
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo"><img src={LogoEclat} alt="Logo Éclat" /><span>Éclat</span></div>
              <p className="footer-description">La plataforma para diseñadores de moda emergentes.</p>
            </div>
            <nav className="footer-nav">
              <button className="footer-nav-link" onClick={onNavigateHome}>Explorar</button>
              <button className="footer-nav-link" onClick={onOpenCollections}>Colecciones</button>
              <button className="footer-nav-link" onClick={onOpenTrends}>Tendencias</button>
            </nav>
            <div className="footer-divider" />
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2026 Éclat. Todos los derechos reservados.</p>
            <div className="footer-links">
              <a href="#">Términos</a><span className="footer-dot">·</span>
              <a href="#">Privacidad</a><span className="footer-dot">·</span>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}