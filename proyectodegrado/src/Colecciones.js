import React, { useState, useEffect } from 'react';
import { Search, User, Users, Heart, MessageCircle, X } from 'lucide-react';
import SearchBar from './Searchbar';
import './Colecciones.css';

import LogoEclat from './img/LogoEclat.png';
import Eclat from './img/Eclat.png';
import HeroVideo from './img/Colección Aesir.mp4';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Colecciones({
  onNavigateHome,
  onOpenWorkspace,
  onOpenProfile,
  onOpenPublicProfile,
  onOpenDesigners,
  onOpenTrends,
  isAuthenticated,
  userData
}) {
  const [email, setEmail] = useState('');
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalLikes, setModalLikes] = useState({ total: 0, liked: false });
  const [modalComments, setModalComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => { cargarPostsAleatorios(); }, []);

  const cargarPostsAleatorios = async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_URL}/designs/random?limit=16`);
      if (!response.ok) throw new Error('Error al cargar las colecciones');
      const data = await response.json();
      if (data.success && data.designs) {
        setGalleryItems(data.designs.map(post => ({ ...post, image: post.image ?? null })));
      } else { setGalleryItems([]); }
    } catch (error) {
      console.error('❌ Error al cargar designs:', error);
      setError(error.message); setGalleryItems([]);
    } finally { setIsLoading(false); }
  };

  const resolveImageUrl = (item) => {
    const raw = item.imagen || item.imagen_url || item.image || item.url || '';
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) return raw;
    return `${API_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  const handleOpenModal = async (item) => {
    setSelectedItem(item); setModalComments([]);
    setModalLikes({ total: item.likes || 0, liked: false });
    try {
      const userId = userData?.id_usuario || '';
      const [likesRes, commentsRes] = await Promise.all([
        fetch(`${API_URL}/likes/design/${item.id}?id_usuario=${userId}`),
        fetch(`${API_URL}/comments/design/${item.id}`)
      ]);
      const likesData = await likesRes.json();
      const commentsData = await commentsRes.json();
      if (likesData.success) setModalLikes({ total: likesData.total, liked: likesData.liked });
      if (commentsData.success) setModalComments(commentsData.comentarios || []);
    } catch (err) { console.error('Error cargando likes/comentarios:', err); }
  };

  const handleToggleLike = async () => {
    if (!selectedItem || !userData?.id_usuario) return;
    try {
      const res = await fetch(`${API_URL}/likes/design/${selectedItem.id}/toggle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userData.id_usuario })
      });
      const data = await res.json();
      if (data.success) {
        setModalLikes(prev => ({ liked: data.liked, total: data.liked ? prev.total + 1 : prev.total - 1 }));
        setGalleryItems(prev => prev.map(d =>
          d.id === selectedItem.id
            ? { ...d, likes: data.liked ? (d.likes || 0) + 1 : Math.max((d.likes || 1) - 1, 0) }
            : d
        ));
      }
    } catch (err) { console.error('Error al dar like:', err); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedItem) return;
    setIsPostingComment(true);
    try {
      const res = await fetch(`${API_URL}/comments/design/${selectedItem.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: userData?.id_usuario, contenido: newComment })
      });
      const data = await res.json();
      if (data.success) { setModalComments(prev => [data.comentario, ...prev]); setNewComment(''); }
    } catch (err) { console.error('Error al comentar:', err); }
    finally { setIsPostingComment(false); }
  };

  return (
    <div className="collections-page">
      <header className="collections-header">
        <div className="header-content">
          <div className="logo-section" onClick={onNavigateHome}>
            <div className="logo-circle">
              <img src={LogoEclat} alt="Logo Éclat" className="logo-image" />
            </div>
            <h1 className="logo-title">Éclat</h1>
          </div>
          <nav className="nav-menu">
            <a href="#" className="nav-link" onClick={onNavigateHome}>Explorar</a>
            <a href="#" className="nav-link active">Colecciones</a>
            <a href="#" className="nav-link" onClick={onOpenDesigners}>Diseñadores</a>
            <a href="#" className="nav-link" onClick={onOpenTrends}>Tendencias</a>
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
          <a href="#" className="mobile-nav-link active">Colecciones</a>
          <a href="#" className="mobile-nav-link" onClick={e => { e.preventDefault(); onOpenDesigners(); }}>Diseñadores</a>
          <a href="#" className="mobile-nav-link" onClick={e => { e.preventDefault(); onOpenTrends(); }}>Tendencias</a>
          <div className="mobile-nav-divider" />
          <button className="mobile-nav-link" onClick={() => { setMobileMenuOpen(false); onOpenProfile(); }}>Mi perfil</button>
        </div>
      )}

      <section className="hero-section">
        <video className="hero-video-background" autoPlay loop muted playsInline>
          <source src={HeroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-text-overlay">
          <span className="hero-text-eyebrow">Colecciones Éclat</span>
          <h2 className="hero-text-title">Diseños que cuentan <span className="hero-text-accent">historias únicas</span></h2>
          <p className="hero-text-subtitle">Explora colecciones curadas por talento emergente. Cada pieza, una expresión de identidad y visión creativa.</p>
        </div>
      </section>

      <section className="gallery-section">
        <div className="gallery-container">
          <div className="gallery-header">
            <h2 className="gallery-title">Descubre <span className="highlight">Inspiración</span></h2>
            <p className="gallery-subtitle">Explora miles de diseños organizados por estilo, tendencia y diseñador.</p>
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <div style={{ margin: '0 auto 1rem', width: '50px', height: '50px', border: '4px solid #f3f4f6', borderTopColor: '#9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p>Cargando colecciones...</p>
            </div>
          )}

          {error && !isLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
              <p>❌ Error: {error}</p>
              <button onClick={cargarPostsAleatorios} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#9333ea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Reintentar</button>
            </div>
          )}

          {!isLoading && !error && galleryItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <p>No hay colecciones disponibles en este momento.</p>
            </div>
          )}

          {!isLoading && !error && galleryItems.length > 0 && (
            <div className="masonry-grid">
              {galleryItems.map((item) => (
                <div key={item.id} className="masonry-item" onClick={() => handleOpenModal(item)} style={{ cursor: 'pointer' }}>
                  {item.category && <span className="category-badge">{item.category}</span>}
                  <div className="item-image-wrapper">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="item-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const p = document.createElement('div');
                          p.className = 'item-placeholder'; p.textContent = '🎨';
                          e.target.parentElement.appendChild(p);
                        }} />
                    ) : (<div className="item-placeholder">🎨</div>)}
                    <div className="item-overlay">
                      <div className="item-info">
                        <h3 className="item-title">{item.title}</h3>
                        <p className="item-author">{item.author}</p>
                        <div className="item-stats-row">
                          <span className="item-stat-chip"><Heart size={13} fill="white" />{item.likes || 0}</span>
                          <span className="item-stat-chip"><MessageCircle size={13} />{item.comments || 0}</span>
                        </div>
                      </div>
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
              <button className="footer-nav-link" onClick={onOpenDesigners}>Diseñadores</button>
              <button className="footer-nav-link" onClick={onOpenTrends}>Tendencias</button>
            </nav>
            <div className="footer-divider" />
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2026 Éclat. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {selectedItem && (
        <div className="col-modal-backdrop" onClick={() => { setSelectedItem(null); setNewComment(''); }}>
          <div className="col-modal" onClick={e => e.stopPropagation()}>
            <div className="col-modal-image-wrap">
              <img src={resolveImageUrl(selectedItem) || selectedItem.image} alt={selectedItem.titulo || selectedItem.title} className="col-modal-image" />
              <button className="col-modal-close" onClick={() => { setSelectedItem(null); setNewComment(''); }}><X size={18} /></button>
            </div>
            <div className="col-modal-body">
              <div className="col-modal-header">
                <h3 className="col-modal-title">{selectedItem.titulo || selectedItem.title}</h3>
                {selectedItem.author && <p className="col-modal-author">por {selectedItem.author}</p>}
                {selectedItem.descripcion && selectedItem.descripcion !== 'Compartido desde Éclat' && (
                  <p className="col-modal-desc">{selectedItem.descripcion}</p>
                )}
              </div>
              <div className="col-modal-actions">
                <button className={`col-modal-like-btn ${modalLikes.liked ? 'liked' : ''}`} onClick={handleToggleLike}>
                  <Heart size={20} fill={modalLikes.liked ? '#ef4444' : 'none'} /><span>{modalLikes.total}</span>
                </button>
                <span className="col-modal-comments-count"><MessageCircle size={20} /><span>{modalComments.length}</span></span>
              </div>
              <div className="col-modal-comments">
                <div className="col-modal-comment-input-row">
                  <input type="text" className="col-modal-comment-input" placeholder="Escribe un comentario..."
                    value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePostComment()} />
                  <button className="col-modal-comment-send" onClick={handlePostComment} disabled={isPostingComment || !newComment.trim()}>Enviar</button>
                </div>
                {modalComments.length === 0 ? (
                  <p className="col-modal-no-comments">Sin comentarios aún. ¡Sé el primero!</p>
                ) : modalComments.map(c => (
                  <div key={c.id_comentario} className="col-modal-comment-item">
                    <img src={c.usuario?.foto_perfil || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                      alt={c.usuario?.nombre_usuario} className="col-modal-comment-avatar"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'; }} />
                    <div>
                      <p className="col-modal-comment-user">{c.usuario?.nombre_usuario}</p>
                      <p className="col-modal-comment-text">{c.contenido}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}