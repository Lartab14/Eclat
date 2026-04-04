import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

/**
 * DesignCarousel
 * Muestra una sola imagen o navega entre varias si el diseño es carrusel.
 *
 * Props:
 *  - design        : objeto con { imagen, imagen_url, image, imagenes[], tipo_diseño }
 *  - resolveUrl    : fn(rawUrl) => string  — resuelve URLs relativas
 *  - className     : clase CSS para el <img>
 *  - placeholderCls: clase CSS para el placeholder vacío
 */
export default function DesignCarousel({ design, resolveUrl, className = '', placeholderCls = '' }) {
    const [idx, setIdx] = useState(0);

    // Armar lista de URLs
    const urls = (() => {
        if (Array.isArray(design.imagenes) && design.imagenes.length > 0) {
            return design.imagenes.map(u => resolveUrl(u)).filter(Boolean);
        }
        const single = resolveUrl(design.imagen || design.imagen_url || design.image || '');
        return single ? [single] : [];
    })();

    const isCarousel = urls.length > 1;
    const safeIdx = urls.length > 0 ? Math.min(idx, urls.length - 1) : 0;

    const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + urls.length) % urls.length); };
    const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % urls.length); };

    if (urls.length === 0) {
        return <div className={placeholderCls}>🎨</div>;
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
                src={urls[safeIdx]}
                alt={design.titulo || design.title || 'Diseño'}
                className={className}
                onError={(e) => { e.target.style.display = 'none'; }}
            />

            {isCarousel && (
                <>
                    {/* Badge */}
                    <div style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: 'rgba(0,0,0,0.55)', borderRadius: '20px',
                        padding: '3px 8px', display: 'flex', alignItems: 'center',
                        gap: '4px', color: 'white', fontSize: '11px', fontWeight: 600,
                        backdropFilter: 'blur(4px)', zIndex: 2, pointerEvents: 'none'
                    }}>
                        <Layers size={11} />{urls.length} fotos
                    </div>

                    {/* Flechas */}
                    <button onClick={prev} style={arrowStyle('left')}>&#8249;</button>
                    <button onClick={next} style={arrowStyle('right')}>&#8250;</button>

                    {/* Dots */}
                    <div style={{
                        position: 'absolute', bottom: '8px', left: '50%',
                        transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 2
                    }}>
                        {urls.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                                style={{
                                    width: i === safeIdx ? '18px' : '6px',
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: i === safeIdx ? 'white' : 'rgba(255,255,255,0.5)',
                                    border: 'none', cursor: 'pointer', padding: 0,
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const arrowStyle = (side) => ({
    position: 'absolute',
    top: '50%', [side]: '6px',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.45)',
    color: 'white', border: 'none', borderRadius: '50%',
    width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '18px', lineHeight: 1,
    zIndex: 2, backdropFilter: 'blur(4px)',
    transition: 'background 0.2s'
});