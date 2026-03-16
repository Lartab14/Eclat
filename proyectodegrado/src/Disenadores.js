import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Users, Heart, Eye, MapPin, Sparkles } from 'lucide-react';
import SearchBar from './Searchbar';  // ← NUEVO
import './Disenadores.css';

// Importar imágenes
import LogoEclat from './img/LogoEclat.png';
import Eclat from './img/Eclat.png';

// Importar VIDEO del hero (en lugar de imagen)
import HeroVideo from './img/Disenadores.mp4'; 

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Disenadores({
  onNavigateHome,
  onOpenEditor,
  onOpenProfile,
  onOpenPublicProfile,  
  onOpenCollections,
  onOpenTrends
}) {
  const [email, setEmail] = useState('');
  const [designers, setDesigners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar diseñadores aleatorios al montar el componente
  useEffect(() => {
    cargarDisenadoresAleatorios();
  }, []);

  const cargarDisenadoresAleatorios = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/usuarios/aleatorios?limit=12`);

      if (!response.ok) {
        throw new Error('Error al cargar los diseñadores');
      }

      const data = await response.json();

      if (data.success && data.usuarios) {
        // Log para depuración — ver qué campos llegan realmente del backend
        console.log('🔍 Primer usuario recibido:', data.usuarios[0]);

        const disenadoresFormateados = data.usuarios.map(designer => {

          // ── Imágenes ──────────────────────────────────────────────────────
          // El backend puede devolver la URL ya completa o una ruta relativa
          const rawAvatar = designer.avatarImage  || designer.foto_perfil   || designer.avatar   || '';
          const rawCover  = designer.coverImage   || designer.foto_portada  || designer.portada  || '';

          const resolveUrl = (url) => {
            if (!url) return null;
            if (url.startsWith('http')) return url;           // URL ya completa
            return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
          };

          // ── Campos de texto ───────────────────────────────────────────────
          const name      = designer.name           || designer.nombre_usuario  || designer.nombre   || 'Diseñador';
          const username  = designer.username       || designer.usuario         || (`@${name}`);
          const specialty = designer.specialty      || designer.especialidad    || designer.rol      || 'Diseñador de moda';
          const location  = designer.location       || designer.ubicacion       || designer.ciudad   || 'Colombia';

          // ── Estadísticas ──────────────────────────────────────────────────
          const rawFollowers = designer.followers   ?? designer.seguidores      ?? designer.num_seguidores ?? 0;
          const rawProjects  = designer.projects    ?? designer.total_posts     ?? designer.num_posts      ?? designer.publicaciones ?? 0;
          const rawLikes     = designer.likes       ?? designer.total_likes     ?? designer.num_likes      ?? 0;

          const formatNum = (n) => {
            const num = Number(n);
            if (isNaN(num)) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000)    return (num / 1000).toFixed(1) + 'K';
            return num.toString();
          };

          return {
            ...designer,
            // Sobrescribir con valores resueltos
            name,
            username,
            specialty,
            location,
            avatarImage: resolveUrl(rawAvatar),
            coverImage:  resolveUrl(rawCover),
            followers:   formatNum(rawFollowers),
            projects:    formatNum(rawProjects),
            likes:       formatNum(rawLikes),
          };
        });

        setDesigners(disenadoresFormateados);
      } else {
        setDesigners([]);
      }

    } catch (error) {
      console.error('❌ Error al cargar diseñadores:', error);
      setError(error.message);
      setDesigners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log('Email suscrito:', email);
    setEmail('');
  };

  const handleFollowDesigner = (designerId) => {
    console.log('Siguiendo a diseñador:', designerId);
  };

  const handleViewProfile = (designerId) => {
    console.log('Ver perfil del diseñador:', designerId);
  };

  return (
    <div className="designers-page">
      {/* Header */}
      <header className="designers-header">
        <div className="header-content">
          <div className="logo-section" onClick={onNavigateHome}>
            <div className="logo-circle">
              <img src={LogoEclat} alt="Logo Éclat" className="logo-image" />
            </div>
            <h1 className="logo-title">Éclat</h1>
          </div>

          <nav className="nav-menu">
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>Explorar</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenCollections(); }}>Colecciones</a>
            <a href="#" className="nav-link active">Diseñadores</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenTrends(); }}>Tendencias</a>
          </nav>

          <div className="header-actions">
            {/* ← CAMBIO: SearchBar reemplaza al botón Search */}
            <SearchBar onOpenPublicProfile={onOpenPublicProfile} />
            <button className="upload-button" onClick={onOpenEditor}>
              Crear diseño
            </button>
            <button className="icon-button">
              <Bell />
            </button>
            <button className="icon-button" onClick={onOpenProfile}>
              <User />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section con VIDEO */}
      <section className="designers-hero-section">
        {/* VIDEO BACKGROUND */}
        <video
          className="hero-video-background"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={HeroVideo} type="video/mp4" />
          Tu navegador no soporta video HTML5.
        </video>

        <div className="hero-overlay"></div>

        {/* Texto inferior izquierda */}
        <div className="hero-text-overlay">
          <span className="hero-text-eyebrow">Comunidad Éclat</span>
          <h2 className="hero-text-title">
            Conoce las mentes <span className="hero-text-accent">detrás del diseño</span>
          </h2>
          <p className="hero-text-subtitle">
            Descubre diseñadores emergentes que están redefiniendo la moda. Síguelos, inspírate y sé parte de su historia.
          </p>
        </div>

        <div className="hero-content">
        </div>
      </section>

      {/* Featured Designers Section */}
      <section className="featured-designers-section">
        <div className="featured-container">
          <div className="featured-header">
            <h2 className="featured-title">
              Diseñadores <span className="highlight">Destacados</span>
            </h2>
            <p className="featured-subtitle">
              Explora los perfiles de nuestros diseñadores más talentosos. Sigue a tus
              favoritos para no perderte sus nuevas creaciones.
            </p>
          </div>

          {/* Estado de carga */}
          {isLoading && (
            <div style={{
              textAlign: 'center',
              padding: '4rem',
              color: '#6b7280'
            }}>
              <div style={{
                margin: '0 auto 1rem',
                width: '50px',
                height: '50px',
                border: '4px solid #f3f4f6',
                borderTopColor: '#9333ea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Cargando diseñadores...</p>
            </div>
          )}

          {/* Estado de error */}
          {error && !isLoading && (
            <div style={{
              textAlign: 'center',
              padding: '4rem',
              color: '#ef4444'
            }}>
              <p>❌ Error: {error}</p>
              <button
                onClick={cargarDisenadoresAleatorios}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: '#9333ea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Sin resultados */}
          {!isLoading && !error && designers.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '4rem',
              color: '#6b7280'
            }}>
              <p>No hay diseñadores disponibles en este momento.</p>
            </div>
          )}

          {/* Grid de Diseñadores */}
          {!isLoading && !error && designers.length > 0 && (
            <div className="designers-grid">
              {designers.map((designer) => (
                <div key={designer.id} className="designer-card">
                  {/* Imagen de Portada */}
                  <div className="designer-cover">
                    {designer.badge && (
                      <span className="designer-badge">{designer.badge}</span>
                    )}
                    {designer.coverImage ? (
                      <img
                        src={designer.coverImage}
                        alt={`${designer.name} cover`}
                        className="designer-cover-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'designer-cover-placeholder';
                          placeholder.textContent = '🎨';
                          e.target.parentElement.appendChild(placeholder);
                        }}
                      />
                    ) : (
                      <div className="designer-cover-placeholder">🎨</div>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="designer-avatar-wrapper">
                    {designer.avatarImage ? (
                      <img
                        src={designer.avatarImage}
                        alt={designer.name}
                        className="designer-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'designer-avatar designer-avatar-placeholder';
                          placeholder.textContent = '👤';
                          e.target.parentElement.appendChild(placeholder);
                        }}
                      />
                    ) : (
                      <div className="designer-avatar designer-avatar-placeholder">👤</div>
                    )}
                  </div>

                  {/* Información */}
                  <div className="designer-info">
                    <h3 className="designer-name">{designer.name}</h3>
                    <p className="designer-username">
                      {designer.username?.startsWith('@') ? designer.username : `@${designer.username}`}
                    </p>
                    <p className="designer-specialty">{designer.specialty}</p>
                    <div className="designer-location">
                      <MapPin size={14} />
                      {designer.location}
                    </div>

                    {/* Estadísticas */}
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

                    {/* Botones de Acción */}
                    <div className="designer-actions">
                      <button
                        className="btn-follow"
                        onClick={() => handleFollowDesigner(designer.id)}
                      >
                        Seguir
                      </button>
                      <button
                        className="btn-profile"
                        onClick={() => handleViewProfile(designer.id)}
                      >
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sección CTA - MODERNIZADA */}
      <section className="inspiration-section">
        <div className="section-container">
          <div className="inspiration-content">

            <div className="inspiration-mascot">
              <img src={Eclat} alt="Mascota Éclat" />
            </div>

            <div className="inspiration-text">
              <span className="inspiration-eyebrow">Tu espacio creativo</span>
              <h2 className="section-title">
                Tu próxima gran <span className="highlight">colección</span><br />empieza aquí
              </h2>
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

      {/* Footer - MODERNIZADO */}
      <footer className="footer">
        <div className="footer-divider-top" />

        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={LogoEclat} alt="Logo Éclat" />
                <span>Éclat</span>
              </div>
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
              <a href="#">Términos</a>
              <span className="footer-dot">·</span>
              <a href="#">Privacidad</a>
              <span className="footer-dot">·</span>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Estilos para la animación de carga */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}