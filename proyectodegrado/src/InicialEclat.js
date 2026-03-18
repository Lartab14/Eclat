import React, { useState, useEffect } from 'react';
import {
  Sparkles, Search, Play, Palette, Grid, Users, TrendingUp, Code, Layers, Heart, Star, User, ChevronLeft, RotateCcw,
  RotateCw, Save, Pen, Eraser, Trash2, Plus, Eye, Lock, Copy, Minus, Circle, Square, Type
} from 'lucide-react';
import './InicialEclat.css';
import ShareDesignModal from './ShareDesignModal';
// Importar imágenes
import Eclat from './img/Eclat.png';
import LogoEclat from './img/LogoEclat.png';
import diseño1 from './img/Boceto.png';
import diseño2 from './img/Boceto2.png';
import diseño3 from './img/Boceto3.png';
import comparte1 from './img/vestido.jpg';
import comparte2 from './img/stwear.jpg';

// ❌ ELIMINADAS: importaciones de imágenes estáticas de diseños destacados

export default function InicialEclat({
  onLogout,
  isAuthenticated,
  onNavigateHome,
  onOpenEditor,
  onOpenProfile,
  onOpenPublicProfile,
  onOpenCollections,
  onOpenDesigners,
  onOpenTrends,
  onOpenWorkspace,
  onOpenUpload,
  userData
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTool, setActiveTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [layers, setLayers] = useState([
    { id: 1, name: 'Capa 1', opacity: 100, visible: true, locked: false },
    { id: 2, name: 'Capa 2', opacity: 100, visible: true, locked: false },
    { id: 3, name: 'Capa 3', opacity: 100, visible: true, locked: true }
  ]);
  const [activeLayer, setActiveLayer] = useState(3);

  // Estados de búsqueda
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // ✅ NUEVO: Estados para diseños destacados dinámicos
  const [featuredDesigns, setFeaturedDesigns] = useState([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const designs = [
    { id: 1, image: diseño1, className: 'design-card-blue' },
    { id: 2, image: diseño2, className: 'design-card-yellow' },
    { id: 3, image: diseño3, className: 'design-card-dark' }
  ];

  const colors = [
    '#000000', '#FFFFFF', '#8B83F5', '#A855F7',
    '#BBF7D0', '#FCA5A5', '#2DD4BF', '#FDE047',
    '#BAE6FD', '#FEF3C7', '#FCA5A5', '#5B9BD5'
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % designs.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + designs.length) % designs.length);
  };

  // Auto-advance carousel
  React.useEffect(() => {
    const timer = setInterval(nextSlide, 3500);
    return () => clearInterval(timer);
  }, []);

  // ✅ NUEVO: Cargar diseños destacados desde la API al montar
  useEffect(() => {
    const cargarDestacados = async () => {
      setIsLoadingFeatured(true);
      setErrorFeatured(null);
      try {
        const response = await fetch(`${API_URL}/designs/random?limit=6`);
        if (!response.ok) throw new Error('Error al cargar diseños destacados');
        const data = await response.json();
        console.log('Diseños destacados data:', data);
        if (data.success && data.designs) {
          setFeaturedDesigns(data.designs.map(post => ({
            ...post,
            image: post.image ?? null
          })));
        } else {
          setFeaturedDesigns([]);
        }
      } catch (err) {
        console.error('❌ Error al cargar destacados:', err);
        setErrorFeatured(err.message);
        setFeaturedDesigns([]);
      } finally {
        setIsLoadingFeatured(false);
      }
    };
    cargarDestacados();
  }, []);

  // Cerrar búsqueda al hacer clic fuera
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      try {
        const url = `${API_URL}/usuarios/buscar?q=${encodeURIComponent(searchQuery.trim())}`;
        console.log('🔍 Buscando en:', url);
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Error respuesta:', res.status, errorText);
          throw new Error(`Error ${res.status}`);
        }
        const data = await res.json();
        console.log('✅ Resultados:', data);
        setSearchResults(data.usuarios || []);
      } catch (err) {
        console.error('❌ Error fetch búsqueda:', err);
        setSearchError('No se pudo conectar al servidor');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleLayerVisibility = (layerId) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const toggleLayerLock = (layerId) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  };

  const updateLayerOpacity = (layerId, opacity) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
  };

  const duplicateLayer = (layerId) => {
    const layerToDuplicate = layers.find(l => l.id === layerId);
    if (layerToDuplicate) {
      const newLayer = {
        ...layerToDuplicate,
        id: Math.max(...layers.map(l => l.id)) + 1,
        name: `${layerToDuplicate.name} copia`
      };
      setLayers([...layers, newLayer]);
    }
  };

  const deleteLayer = (layerId) => {
    if (layers.length > 1) {
      setLayers(layers.filter(l => l.id !== layerId));
      if (activeLayer === layerId) {
        setActiveLayer(layers[0].id);
      }
    }
  };

  const addNewLayer = () => {
    const newId = Math.max(...layers.map(l => l.id)) + 1;
    setLayers([...layers, {
      id: newId,
      name: `Capa ${newId}`,
      opacity: 100,
      visible: true,
      locked: false
    }]);
  };

  return (
    <div className="eclat-container">
      {/* Header */}
      <header className="eclat-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-circle">
              <img src={LogoEclat} alt="Logo Éclat" className="logo-image" />
            </div>
            <h1 className="logo-title">Éclat</h1>
          </div>

          <nav className="nav-menu">
            <a href="#" className="nav-link">Explorar</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenCollections(); }}>Colecciones</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenDesigners(); }}>Diseñadores</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onOpenTrends(); }}>Tendencias</a>
          </nav>

          <div className="header-actions">
            {/* Buscador */}
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
            <button className="upload-button" onClick={onOpenWorkspace}>
              Crear diseño
            </button>

            <button className="icon-button" onClick={onOpenProfile}>
              <User />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-grid">
          {/* Left Side - Content */}
          <div className="left-content">

            {/* Mascota + Título en fila */}
            <div className="hero-brand-row">
              <div className="mascot-box">
                <img src={Eclat} alt="Mascota Éclat" className="mascot-image" />
              </div>
              <div className="hero-brand-text">
                <h2 className="main-title">Éclat</h2>
              </div>
            </div>

            <p className="description">
              Plataforma interactiva que combina animaciones 2D y modelados 3D para dar visibilidad a diseñadores emergentes. Comparte tus bocetos y colecciones con el mundo.
            </p>

            <div className="action-buttons">
              <button className="btn-primary" onClick={onOpenCollections}>
                Explorar colecciones
              </button>
              <button className="btn-secondary" onClick={onOpenDesigners}>
                <Play />
                <span>Ver diseñadores</span>
              </button>
            </div>

            <div className="stats">
              <div className="stat-item">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Diseñadores</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-number">5000+</div>
                <div className="stat-label">Bocetos</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-number">100+</div>
                <div className="stat-label">Colecciones</div>
              </div>
            </div>
          </div>

          {/* Right Side - Carousel */}
          <div className="carousel-container">
            <div className="carousel-wrapper">
              {designs.map((design, index) => {
                const total = designs.length;
                const offset = ((index - currentSlide) + total) % total;
                let posClass = '';
                if (offset === 0) posClass = 'carousel-slide--active';
                else if (offset === 1) posClass = 'carousel-slide--right';
                else posClass = 'carousel-slide--left';

                return (
                  <div
                    key={design.id}
                    className={`carousel-slide ${posClass}`}
                    onClick={() => setCurrentSlide(index)}
                  >
                    <div className="design-card-inner">
                      <img src={design.image} alt={`Diseño ${design.id}`} className="design-image" />
                      <div className="design-card-shimmer" />
                    </div>
                  </div>
                );
              })}

              <button className="carousel-arrow carousel-arrow-left" onClick={prevSlide}>
                <ChevronLeft />
              </button>
              <button className="carousel-arrow carousel-arrow-right" onClick={nextSlide}>
                <ChevronLeft style={{ transform: 'rotate(180deg)' }} />
              </button>

              <div className="carousel-dots">
                {designs.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>

            {/* Etiqueta flotante */}
            <div className="carousel-label">
              <span className="carousel-label-dot" />
              Colección destacada
            </div>
          </div>
        </div>
      </main>

      {/* Sección Editor Profesional */}
      <section className="editor-section">
        <div className="editor-section-header">
          <div className="editor-section-tag">Herramienta incluida</div>
          <h2 className="editor-section-title">Editor <span className="editor-section-highlight">Profesional</span></h2>
          <p className="editor-section-subtitle">Diseña directamente en Éclat con herramientas de bocetado, capas y paleta de colores</p>
        </div>

        <div className="ws-preview">
          {/* Header */}
          <div className="ws-preview-header">
            <div className="ws-preview-header-left">
              <div className="ws-preview-back"><ChevronLeft size={14} /><span>Volver</span></div>
              <div className="ws-preview-logo">
                <img src={LogoEclat} alt="Logo" className="ws-preview-logo-img" />
                <span>Éclat Studio</span>
              </div>
              <span className="ws-preview-doc-title">Lienzo de Diseño</span>
            </div>
            <div className="ws-preview-header-right">
              <div className="ws-preview-btn-ghost"><RotateCcw size={14} /></div>
              <div className="ws-preview-btn-ghost"><RotateCw size={14} /></div>
              <div className="ws-preview-btn-save"><Save size={14} /><span>Guardar</span></div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="ws-preview-body">

            {/* Panel izquierdo */}
            <div className="ws-preview-left">
              <div className="ws-preview-panel-section">
                <div className="ws-preview-section-label">HERRAMIENTAS</div>
                <div className="ws-preview-tools-grid">
                  {[
                    { icon: Pen, label: 'Pincel', active: true },
                    { icon: Eraser, label: 'Borrador', active: false },
                    { icon: Minus, label: 'Línea', active: false },
                    { icon: Circle, label: 'Círculo', active: false },
                    { icon: Square, label: 'Rect.', active: false },
                    { icon: Type, label: 'Texto', active: false },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} className={`ws-preview-tool ${active ? 'active' : ''}`}>
                      <Icon size={15} /><span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ws-preview-panel-section">
                <div className="ws-preview-section-label">TAMAÑO</div>
                <div className="ws-preview-size-row">
                  <span className="ws-preview-size-lbl">Grosor</span>
                  <span className="ws-preview-size-val">3px</span>
                </div>
                <div className="ws-preview-slider-track">
                  <div className="ws-preview-slider-fill" style={{ width: '18%' }} />
                  <div className="ws-preview-slider-thumb" style={{ left: '18%' }} />
                </div>
              </div>

              <div className="ws-preview-panel-section">
                <div className="ws-preview-section-label">COLORES</div>
                <div className="ws-preview-color-row">
                  <div className="ws-preview-color-swatch" style={{ background: '#667eea' }} />
                  <div className="ws-preview-color-code">#667EEA</div>
                </div>
                <div className="ws-preview-palette">
                  {['#000000', '#ffffff', '#667eea', '#764ba2', '#34d399', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1', '#f97316'].map(c => (
                    <div key={c} className="ws-preview-palette-dot" style={{ background: c }} />
                  ))}
                </div>
              </div>

              <div className="ws-preview-panel-section">
                <div className="ws-preview-section-label">ACCIONES</div>
                <div className="ws-preview-actions">
                  <div className="ws-preview-action-item"><Trash2 size={13} /><span>Limpiar Capa</span></div>
                  <div className="ws-preview-action-item"><Grid size={13} /><span>Importar Imagen</span></div>
                  <div className="ws-preview-action-item"><Save size={13} /><span>Exportar PNG</span></div>
                </div>
              </div>
            </div>

            {/* Canvas central */}
            <div className="ws-preview-center">
              <div className="ws-preview-canvas-header">
                <div className="ws-preview-canvas-info">
                  <span className="ws-preview-canvas-title">Lienzo de Diseño</span>
                  <span className="ws-preview-canvas-size">1200 × 800px</span>
                </div>
                <div className="ws-preview-view-mode"><Pen size={12} /><span>Editor 2D</span></div>
              </div>
              <div className="ws-preview-canvas-area">
                <div className="ws-preview-canvas">
                  <svg width="100%" height="100%" viewBox="0 0 480 280" preserveAspectRatio="xMidYMid meet">
                    <path d="M60 200 Q130 80 210 140 Q280 200 360 70 Q400 40 440 100" stroke="#667eea" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75" />
                    <path d="M50 230 Q120 180 190 210 Q270 240 340 170 Q390 130 450 160" stroke="#ac83f5" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
                    <path d="M80 250 Q160 200 230 230 Q300 255 380 200 Q420 175 460 195" stroke="#764ba2" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35" />
                    <circle cx="210" cy="130" r="32" stroke="#667eea" strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.4" />
                    <rect x="290" y="80" width="60" height="80" rx="5" stroke="#ac83f5" strokeWidth="1.5" fill="rgba(102,126,234,0.06)" opacity="0.5" />
                  </svg>
                </div>
                <div className="ws-preview-controls">
                  {[RotateCcw, RotateCw, Plus, Minus, Eye, Lock].map((Icon, i) => (
                    <div key={i} className="ws-preview-ctrl-btn"><Icon size={13} /></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel derecho - Capas */}
            <div className="ws-preview-right">
              <div className="ws-preview-layers-header">
                <div className="ws-preview-layers-title"><Layers size={15} /><span>Capas</span></div>
                <div className="ws-preview-add-layer"><Plus size={13} /></div>
              </div>
              <div className="ws-preview-layers-list">
                {[
                  { name: 'Capa 3', active: true, opacity: 100 },
                  { name: 'Capa 2', active: false, opacity: 80 },
                  { name: 'Capa 1', active: false, opacity: 100 },
                ].map(({ name, active, opacity }) => (
                  <div key={name} className={`ws-preview-layer-item ${active ? 'active' : ''}`}>
                    <div className="ws-preview-layer-row">
                      <span className="ws-preview-layer-name">{name}</span>
                      <div className="ws-preview-layer-btns"><Eye size={12} /><Copy size={12} /></div>
                    </div>
                    <div className="ws-preview-opacity-row">
                      <span>Opacidad</span>
                      <div className="ws-preview-opacity-track">
                        <div className="ws-preview-opacity-fill" style={{ width: `${opacity}%` }} />
                      </div>
                      <span>{opacity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA al hover */}
          <div className="ws-preview-cta">
            <button className="ws-preview-cta-btn" onClick={onOpenWorkspace}>
              <Pen size={20} />
              <span>Abrir Editor Completo</span>
            </button>
            <p className="ws-preview-cta-sub">Boceta, diseña y guarda en tu perfil</p>
          </div>
        </div>
      </section>

      {/* Sección Comparte con la Comunidad - MODERNIZADA */}
      <section className="share-section-modern">
        <div className="section-container">
          {/* Header */}
          <div className="share-modern-header">
            <div className="share-header-content">
              <h2 className="share-modern-title">
                Comparte tus <span className="highlight">diseños</span>
              </h2>
              <p className="share-modern-subtitle">
                Sube tus bocetos y compártelos con la comunidad. Elige entre modalidad pública
                para mostrar al mundo o privada para tu portafolio personal.
              </p>
            </div>
            <button className="share-cta-button" onClick={() => setShareModalOpen(true)}>
              <Plus size={20} />
              Subir Diseño
            </button>
          </div>

          {/* Cards Grid */}
          <div className="share-cards-grid">
            {/* Card 1 - Diseño Público */}
            <div className="share-feature-card">
              <div className="share-card-icon public">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="share-card-title">Comparte Públicamente</h3>
              <p className="share-card-description">
                Publica tus diseños y compártelos con miles de diseñadores.
                Recibe feedback, likes y comentarios de la comunidad.
              </p>
              <div className="share-card-stats">
                <div className="share-stat">
                  <Heart size={16} />
                  <span>234K Likes</span>
                </div>
                <div className="share-stat">
                  <Eye size={16} />
                  <span>1.2M Vistas</span>
                </div>
              </div>
            </div>

            {/* Card 2 - Portafolio Privado */}
            <div className="share-feature-card">
              <div className="share-card-icon private">
                <Lock size={24} />
              </div>
              <h3 className="share-card-title">Portafolio Privado</h3>
              <p className="share-card-description">
                Guarda tus diseños de forma privada. Perfecto para trabajos en progreso
                o proyectos que aún no quieres compartir.
              </p>
              <div className="share-card-features">
                <div className="share-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Solo visible para ti</span>
                </div>
                <div className="share-feature">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Almacenamiento seguro</span>
                </div>
              </div>
            </div>

            {/* Card 3 - Ejemplos */}
            <div className="share-feature-card highlight">
              <div className="share-examples-header">
                <Sparkles size={20} />
                <span>Inspiración de la comunidad</span>
              </div>
              <div className="share-example-images">
                <img src={comparte1} alt="Ejemplo 1" className="share-example-img" />
                <img src={comparte2} alt="Ejemplo 2" className="share-example-img" />
              </div>
              <p className="share-examples-text">
                Únete a más de <strong>10,000 diseñadores</strong> que ya comparten
                sus creaciones en Éclat
              </p>
              <button className="share-explore-button" onClick={onOpenCollections}>
                Explorar Diseños
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* CTA Bottom */}
          <div className="share-cta-bottom">
            <div className="share-cta-content">
              <img src={Eclat} alt="Éclat Mascota" className="share-mascot" />
              <div className="share-cta-text">
                <h3>¿Listo para mostrar tu talento?</h3>
                <p>Comparte tus diseños con la comunidad y comienza a crecer como diseñador</p>
              </div>
              <button className="share-cta-primary" onClick={() => setShareModalOpen(true)}>
                Comenzar Ahora
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        <ShareDesignModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          userData={userData}
          onPostCreated={() => {
            console.log('✅ Post creado exitosamente');
          }}
        />
      </section>

      {/* ✅ Sección Diseños Destacados — ahora con datos dinámicos de la API */}
      <section className="featured-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Diseños <span className="highlight">destacados</span></h2>
            <p className="section-subtitle">Descubre las creaciones más populares de nuestra comunidad de diseñadores</p>
          </div>

          {/* Estado de carga */}
          {isLoadingFeatured && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
              <div style={{
                margin: '0 auto 1rem',
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTopColor: '#9333ea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p>Cargando diseños...</p>
            </div>
          )}

          {/* Estado de error */}
          {errorFeatured && !isLoadingFeatured && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
              <p>❌ {errorFeatured}</p>
            </div>
          )}

          {/* Grid de diseños dinámicos */}
          {!isLoadingFeatured && !errorFeatured && (
            <div className="featured-grid">
              {featuredDesigns.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                  <p>No hay diseños disponibles en este momento.</p>
                </div>
              ) : (
                featuredDesigns.map((design) => (
                  <div key={design.id} className="featured-card">
                    <div className="featured-image">
                      {design.image ? (
                        <img
                          src={design.image}
                          alt={design.title}
                          className="featured-design-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML += '<div class="image-placeholder">🎨</div>';
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">🎨</div>
                      )}
                    </div>
                    <div className="featured-info">
                      <h4>{design.title}</h4>
                      {/* ✅ Usar "author" que es el campo que devuelve la API */}
                      <p>por {design.author}</p>
                      <div className="featured-stats">
                        <span>❤️ {design.likes ?? 0}</span>
                        <span>💬 {Math.floor((design.views ?? 0) / 50)}</span>
                      </div>
                      <button className="featured-follow-btn">Seguir</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sección CTA */}
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

      {/* Footer */}
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
              <button className="footer-nav-link" onClick={onOpenDesigners}>Diseñadores</button>
              <button className="footer-nav-link" onClick={onOpenTrends}>Tendencias</button>
            </nav>
            <div className="footer-divider" />
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2026 Éclat. Todos los dereccios reservados.</p>
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

      {/* Animación spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}