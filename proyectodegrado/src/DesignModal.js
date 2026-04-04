import React, { useState } from 'react';
import { Heart, MessageCircle, X, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

/**
 * DesignModal
 * Modal de detalle de diseño con soporte de carrusel, likes y comentarios.
 *
 * Props:
 *  - design           : objeto completo del diseño (con imagenes[])
 *  - resolveUrl       : fn(rawUrl) => string
 *  - likes            : { total: number, liked: boolean }
 *  - comments         : array de comentarios
 *  - newComment       : string (controlled)
 *  - isPostingComment : boolean
 *  - canComment       : boolean — si el usuario está autenticado
 *  - onClose          : fn()
 *  - onToggleLike     : fn()
 *  - onCommentChange  : fn(value)
 *  - onPostComment    : fn()
 */
export default function DesignModal({
    design,
    resolveUrl,
    likes,
    comments,
    newComment,
    isPostingComment,
    canComment = true,
    onClose,
    onToggleLike,
    onCommentChange,
    onPostComment,
}) {
    const [imgIdx, setImgIdx] = useState(0);

    if (!design) return null;

    // Construir lista de URLs
    const urls = (() => {
        if (Array.isArray(design.imagenes) && design.imagenes.length > 0) {
            return design.imagenes.map(u => resolveUrl(u)).filter(Boolean);
        }
        const single = resolveUrl(design.imagen || design.imagen_url || design.image || '');
        return single ? [single] : [];
    })();

    const isCarousel = urls.length > 1;
    const safeIdx = urls.length > 0 ? Math.min(imgIdx, urls.length - 1) : 0;

    const prev = (e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + urls.length) % urls.length); };
    const next = (e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % urls.length); };

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={onClose}
        >
            <div
                style={{ background: 'white', borderRadius: '1rem', maxWidth: '860px', width: '100%', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Imagen / Carrusel ── */}
                <div style={{ position: 'relative', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', maxHeight: '480px', overflow: 'hidden', flexShrink: 0 }}>
                    {urls.length > 0 ? (
                        <img
                            src={urls[safeIdx]}
                            alt={design.titulo || design.title || 'Diseño'}
                            style={{ width: '100%', height: 'auto', maxHeight: '480px', objectFit: 'contain', display: 'block' }}
                        />
                    ) : (
                        <div style={{ color: '#6b7280', fontSize: '3rem' }}>🎨</div>
                    )}

                    {/* Cerrar */}
                    <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                        <X size={18} />
                    </button>

                    {isCarousel && (
                        <>
                            {/* Badge */}
                            <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.55)', borderRadius: '20px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px', color: 'white', fontSize: '12px', fontWeight: 600, zIndex: 3 }}>
                                <Layers size={13} /> {safeIdx + 1} / {urls.length}
                            </div>

                            {/* Flechas */}
                            <button onClick={prev} style={arrowStyle('left')}><ChevronLeft size={22} /></button>
                            <button onClick={next} style={arrowStyle('right')}><ChevronRight size={22} /></button>

                            {/* Thumbnails */}
                            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 3 }}>
                                {urls.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                                        style={{
                                            width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden',
                                            border: i === safeIdx ? '2px solid white' : '2px solid transparent',
                                            padding: 0, cursor: 'pointer', flexShrink: 0, background: 'none'
                                        }}
                                    >
                                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Info + likes ── */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                        {design.titulo || design.title}
                    </h3>
                    {design.author && <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#9333ea', fontWeight: 600 }}>por {design.author}</p>}
                    {design.descripcion && design.descripcion !== 'Compartido desde Éclat' && (
                        <p style={{ margin: '0 0 0.875rem', fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>{design.descripcion}</p>
                    )}
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <button onClick={onToggleLike} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: likes.liked ? '#ef4444' : '#6b7280', fontWeight: 600, fontSize: '1rem' }}>
                            <Heart size={22} fill={likes.liked ? '#ef4444' : 'none'} />{likes.total}
                        </button>
                        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageCircle size={22} />{comments.length}
                        </span>
                    </div>
                </div>

                {/* ── Comentarios ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                    {canComment ? (
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => onCommentChange(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && onPostComment()}
                                placeholder="Escribe un comentario..."
                                style={{ flex: 1, padding: '0.6rem 1rem', border: '1px solid #e5e7eb', borderRadius: '2rem', outline: 'none', fontSize: '0.9rem' }}
                            />
                            <button
                                onClick={onPostComment}
                                disabled={isPostingComment || !newComment.trim()}
                                style={{ padding: '0.6rem 1.2rem', background: '#9333ea', color: 'white', border: 'none', borderRadius: '2rem', cursor: 'pointer', opacity: (!newComment.trim() || isPostingComment) ? 0.5 : 1 }}
                            >
                                Enviar
                            </button>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '1rem' }}>Inicia sesión para comentar y dar likes</p>
                    )}

                    {comments.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#9ca3af' }}>Sin comentarios aún. ¡Sé el primero!</p>
                    ) : comments.map(c => (
                        <div key={c.id_comentario} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <img
                                src={c.usuario?.foto_perfil || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                                alt={c.usuario?.nombre_usuario}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'; }}
                            />
                            <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>{c.usuario?.nombre_usuario}</p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#374151' }}>{c.contenido}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const arrowStyle = (side) => ({
    position: 'absolute',
    top: '50%', [side]: '12px',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)',
    color: 'white', border: 'none', borderRadius: '50%',
    width: '38px', height: '38px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 3,
    transition: 'background 0.2s'
});