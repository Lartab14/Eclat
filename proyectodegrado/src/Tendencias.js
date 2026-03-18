import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Sparkles, Layers, Download, X, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';
import SearchBar from './Searchbar';
import './Tendencias.css';

// Importar imágenes
import LogoEclat from './img/LogoEclat.png';
import Eclat from './img/Eclat.png';

// Importar VIDEO del hero 
import HeroVideo from './img/Tendencias.mp4';

// Importar texturas (16 imágenes) 
import Texture1 from './img/Text1.png';
import Texture2 from './img/Text2.png';
import Texture3 from './img/Text3.png';
import Texture4 from './img/Text4.png';
import Texture5 from './img/Text5.png';
import Texture6 from './img/Text6.png';
import Texture7 from './img/Text7.png';
import Texture8 from './img/Text8.png';
import Texture9 from './img/Text9.png';
import Texture10 from './img/Text10.png';
import Texture11 from './img/Text11.png';
import Texture12 from './img/Text12.png';
import Texture13 from './img/Text13.png';
import Texture14 from './img/Text14.jpg';
import Texture15 from './img/Text15.jpg';
import Texture16 from './img/Text16.jpg';

// ─── Modelos 3D (.glb) ────────────────────────────────────────────────────────
// Descomenta cada línea cuando tengas el archivo .glb en src/models/
// ─────────────────────────────────────────────────────────────────────────────
import Model1  from './models/Seda.glb';
// import Model2  from './models/terciopelo-premium.glb';
// import Model3  from './models/metal-brushed.glb';
// import Model4  from './models/cuero-sintetico.glb';
// import Model5  from './models/pelo-sintetico.glb';
// import Model6  from './models/algodon-natural.glb';
// import Model7  from './models/lino-organico.glb';
// import Model8  from './models/cuero-colores.glb';
// import Model9  from './models/organza-transparente.glb';
// import Model10 from './models/lana-tejida.glb';
// import Model11 from './models/punto-jersey.glb';
// import Model12 from './models/patron-geometrico.glb';
// import Model13 from './models/tejido-multicolor.glb';
// import Model14 from './models/denim-clasico.glb';
// import Model15 from './models/corrugado-industrial.glb';
// import Model16 from './models/malla-deportiva.glb';

// ─── Carga scripts de Three.js + GLTFLoader desde CDN ────────────────────────
let threeLoadPromise = null;
function loadThreeWithGLTF() {
    if (threeLoadPromise) return threeLoadPromise;
    threeLoadPromise = new Promise((resolve) => {
        const loadScript = (src) => new Promise((res) => {
            if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
            const s = document.createElement('script');
            s.src = src;
            s.onload = res;
            document.head.appendChild(s);
        });

        const threeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        // GLTFLoader r128 — hosted on unpkg since cdnjs doesn't bundle it separately
        const loaderUrl = 'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js';

        if (typeof window.THREE !== 'undefined' && window.THREE.GLTFLoader) {
            resolve(); return;
        }
        loadScript(threeUrl)
            .then(() => loadScript(loaderUrl))
            .then(resolve);
    });
    return threeLoadPromise;
}

// ─── Viewer 3D — soporta .glb propio O esfera generada como fallback ─────────
//   Props:
//     modelUrl   — ruta al .glb  (import MiModelo from './models/tela.glb')
//     textureUrl — imagen 2D de la textura (fallback si no hay modelo)
//     size       — 'card' | 'modal'
//     autoRotate — boolean
function FabricViewer3D({ modelUrl = null, textureUrl, size = 'card', autoRotate = true }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const rootRef = useRef(null);   // objeto raíz que se rota (modelo o mesh)
    const animFrameRef = useRef(null);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const lastTouch = useRef(null);
    const zoomLevel = useRef(size === 'modal' ? 3.2 : 2.8);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;
        let cancelled = false;

        setLoading(true);
        setLoadError(false);

        loadThreeWithGLTF().then(() => {
            if (cancelled) return;
            const THREE = window.THREE;
            const w = el.clientWidth || 300;
            const h = el.clientHeight || 300;

            // ── Renderer ──────────────────────────────────────────────────────
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            el.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // ── Scene ─────────────────────────────────────────────────────────
            const scene = new THREE.Scene();

            // ── Camera ────────────────────────────────────────────────────────
            const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
            camera.position.set(0, 0.3, zoomLevel.current);
            cameraRef.current = camera;

            // ── Luces ─────────────────────────────────────────────────────────
            scene.add(new THREE.AmbientLight(0xffffff, 0.7));
            const key = new THREE.DirectionalLight(0xffffff, 1.4);
            key.position.set(3, 5, 4);
            key.castShadow = true;
            scene.add(key);
            const fill = new THREE.DirectionalLight(0xc8d8e4, 0.5);
            fill.position.set(-4, -2, -3);
            scene.add(fill);
            const rim = new THREE.DirectionalLight(0xac83f5, 0.3);
            rim.position.set(0, -3, -4);
            scene.add(rim);

            // ── Loop de animación ─────────────────────────────────────────────
            const animate = () => {
                animFrameRef.current = requestAnimationFrame(animate);
                if (autoRotate && !isDragging.current && rootRef.current) {
                    rootRef.current.rotation.y += 0.006;
                }
                renderer.render(scene, camera);
            };

            // ── Función que centra y escala cualquier objeto al frustum ───────
            const fitToView = (object) => {
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                const sizeV = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(sizeV.x, sizeV.y, sizeV.z);
                // Escalar para que quepa en ~1.8 unidades de alto
                const scale = 1.8 / maxDim;
                object.scale.setScalar(scale);
                // Centrar
                box.setFromObject(object);
                box.getCenter(center);
                object.position.sub(center);
            };

            // ── RAMA A: cargar .glb ────────────────────────────────────────────
            if (modelUrl) {
                const loader = new THREE.GLTFLoader();
                loader.load(
                    modelUrl,
                    (gltf) => {
                        if (cancelled) return;
                        const model = gltf.scene;

                        // Asegurarse de que los materiales reciban sombras
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                // Preservar los materiales originales del .glb
                                if (child.material) {
                                    child.material.needsUpdate = true;
                                }
                            }
                        });

                        fitToView(model);
                        scene.add(model);
                        rootRef.current = model;
                        setLoading(false);
                        animate();
                    },
                    // Progreso (opcional)
                    undefined,
                    (err) => {
                        console.warn('GLB load error, usando fallback:', err);
                        if (cancelled) return;
                        buildFallbackDrape(THREE, scene, animate);
                    }
                );
            } else {
                // ── RAMA B: esfera drapeada generada (fallback sin .glb) ───────
                buildFallbackDrape(THREE, scene, animate);
            }

            // ── Fallback: esfera deformada con textura 2D ─────────────────────
            function buildFallbackDrape(THREE, scene, animate) {
                const geo = new THREE.SphereGeometry(1, 64, 64);
                const pos = geo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                    if (y < 0) {
                        const angle = Math.atan2(z, x);
                        const wave = Math.sin(angle * 6) * Math.abs(y) * 0.35 * 0.22;
                        pos.setX(i, x * (1 + wave));
                        pos.setZ(i, z * (1 + wave));
                        pos.setY(i, y * (1 + Math.abs(y) * 0.4));
                    }
                }
                geo.computeVertexNormals();

                const mat = new THREE.MeshStandardMaterial({
                    color: 0xd4c4a8, roughness: 0.75, metalness: 0.05,
                    side: THREE.DoubleSide,
                });

                // Intentar cargar la textura 2D como mapa de color
                if (textureUrl) {
                    new THREE.TextureLoader().load(textureUrl, (tex) => {
                        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                        tex.repeat.set(2, 2);
                        mat.map = tex;
                        mat.needsUpdate = true;
                    });
                }

                const mesh = new THREE.Mesh(geo, mat);
                mesh.rotation.x = 0.3;
                mesh.castShadow = true;
                scene.add(mesh);
                rootRef.current = mesh;
                setLoading(false);
                animate();
            }
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(animFrameRef.current);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                const canvas = rendererRef.current.domElement;
                if (el.contains(canvas)) el.removeChild(canvas);
                rendererRef.current = null;
            }
            rootRef.current = null;
        };
    }, [modelUrl, textureUrl, size, autoRotate]);

    // ── Interacción: drag para rotar (modal), wheel para zoom ────────────────
    const onMouseDown = useCallback((e) => {
        if (size !== 'modal') return;
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    }, [size]);

    const onMouseMove = useCallback((e) => {
        if (!isDragging.current || !rootRef.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        rootRef.current.rotation.y += dx * 0.01;
        rootRef.current.rotation.x += dy * 0.01;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    }, []);

    const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

    const onWheel = useCallback((e) => {
        if (size !== 'modal' || !cameraRef.current) return;
        e.preventDefault();
        zoomLevel.current = Math.max(1.2, Math.min(7, zoomLevel.current + e.deltaY * 0.005));
        cameraRef.current.position.z = zoomLevel.current;
    }, [size]);

    const onTouchStart = useCallback((e) => {
        if (size !== 'modal') return;
        isDragging.current = true;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, [size]);
    const onTouchMove = useCallback((e) => {
        if (!isDragging.current || !rootRef.current || !lastTouch.current) return;
        const dx = e.touches[0].clientX - lastTouch.current.x;
        const dy = e.touches[0].clientY - lastTouch.current.y;
        rootRef.current.rotation.y += dx * 0.01;
        rootRef.current.rotation.x += dy * 0.01;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);
    const onTouchEnd = useCallback(() => { isDragging.current = false; }, []);

    const handleZoom = (dir) => {
        if (!cameraRef.current) return;
        zoomLevel.current = Math.max(1.2, Math.min(7, zoomLevel.current + dir * 0.5));
        cameraRef.current.position.z = zoomLevel.current;
    };

    const handleReset = () => {
        if (!rootRef.current || !cameraRef.current) return;
        rootRef.current.rotation.set(0, 0, 0);
        zoomLevel.current = size === 'modal' ? 3.2 : 2.8;
        cameraRef.current.position.z = zoomLevel.current;
    };

    return (
        <div className={`fabric-viewer-3d fabric-viewer-3d--${size}`}>
            {/* Spinner mientras carga */}
            {loading && (
                <div className="viewer-loading">
                    <div className="viewer-spinner" />
                    <span>{modelUrl ? 'Cargando modelo…' : 'Preparando vista…'}</span>
                </div>
            )}

            <div
                ref={mountRef}
                className="fabric-viewer-canvas"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{ cursor: size === 'modal' ? 'grab' : 'default', opacity: loading ? 0 : 1, transition: 'opacity 0.4s' }}
            />

            {/* Controles flotantes — solo en modal */}
            {size === 'modal' && !loading && (
                <div className="viewer-controls">
                    <button className="viewer-ctrl-btn" onClick={() => handleZoom(-1)} title="Acercar"><ZoomIn size={16} /></button>
                    <button className="viewer-ctrl-btn" onClick={() => handleZoom(1)} title="Alejar"><ZoomOut size={16} /></button>
                    <button className="viewer-ctrl-btn" onClick={handleReset} title="Resetear"><RotateCcw size={16} /></button>
                </div>
            )}

            {/* Badge si es modelo real */}
            {modelUrl && !loading && (
                <span className="viewer-glb-badge">● 3D Real</span>
            )}
        </div>
    );
}

// ─── Modal de detalle de tela ──────────────────────────────────────────────────
function FabricModal({ fabric, onClose }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    if (!fabric) return null;

    return (
        <div className="fabric-modal-backdrop" onClick={onClose}>
            <div className="fabric-modal" onClick={(e) => e.stopPropagation()}>
                {/* Botón cerrar */}
                <button className="fabric-modal-close" onClick={onClose}><X size={20} /></button>

                <div className="fabric-modal-body">
                    {/* Viewer 3D grande */}
                    <div className="fabric-modal-viewer">
                        <FabricViewer3D modelUrl={fabric.model || null} textureUrl={fabric.image} size="modal" autoRotate={false} />
                        <p className="fabric-modal-hint">
                            <RotateCcw size={12} /> Arrastra para rotar · Rueda para hacer zoom
                        </p>
                    </div>

                    {/* Info panel */}
                    <div className="fabric-modal-info">
                        {fabric.badge && (
                            <span className={`texture-badge ${fabric.badge.toLowerCase()} fabric-modal-badge`}>{fabric.badge}</span>
                        )}
                        <h2 className="fabric-modal-title">{fabric.name}</h2>
                        <p className="fabric-modal-category">{fabric.category} · {fabric.format}</p>

                        <div className="fabric-modal-divider" />

                        <div className="fabric-modal-section">
                            <h4><Info size={14} /> Descripción</h4>
                            <p>{fabric.description}</p>
                        </div>

                        <div className="fabric-modal-section">
                            <h4>✦ Características</h4>
                            <ul className="fabric-modal-tags">
                                {fabric.properties.map((p, i) => (
                                    <li key={i} className="fabric-modal-tag">{p}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="fabric-modal-section">
                            <h4>✂ Usos principales</h4>
                            <p>{fabric.uses}</p>
                        </div>

                        <div className="fabric-modal-section">
                            <h4>◈ Cuidado</h4>
                            <p>{fabric.care}</p>
                        </div>

                        <div className="fabric-modal-section">
                            <h4>◉ Temporadas ideales</h4>
                            <div className="fabric-modal-seasons">
                                {fabric.seasons.map((s, i) => (
                                    <span key={i} className="fabric-season-chip">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function Tendencias({
    onNavigateHome,
    onOpenEditor,
  onOpenWorkspace,
    onOpenProfile,
    onOpenPublicProfile,
    onOpenCollections,
    onOpenDesigners
}) {
    const [email, setEmail] = useState('');
    const [selectedFabric, setSelectedFabric] = useState(null);

    // Datos enriquecidos de telas
    const textures = [
        {
            id: 1, model: null, /* Model1  */ image: Texture1, name: 'Seda Fluida', category: 'Seda', format: '2D/3D', badge: 'Destacado',
            description: 'La seda fluida es uno de los tejidos más apreciados en la alta costura por su suavidad excepcional y su brillo natural. Obtenida del capullo del gusano de seda, cada hilo es continuo y extremadamente fino.',
            properties: ['Muy suave al tacto', 'Brillo natural', 'Transpirable', 'Hipoalergénica', 'Ligera'],
            uses: 'Vestidos de noche, blusas de lujo, pañuelos, lencería fina y forro de prendas de alta costura.',
            care: 'Lavado a mano en agua fría. No retorcer. Planchar a baja temperatura con paño protector.',
            seasons: ['Primavera', 'Verano', 'Otoño'],
        },
        {
            id: 2, model: null, /* Model2  */ image: Texture2, name: 'Terciopelo Premium', category: 'Terciopelo', format: '3D', badge: null,
            description: 'El terciopelo premium es un tejido de pelo corto y denso que crea una superficie aterciopelada con profundidad visual única. Su estructura de doble cara le otorga una riqueza táctil inconfundible.',
            properties: ['Pelo corto denso', 'Cuerpo y estructura', 'Absorbe la luz', 'Efecto espejo', 'Resistente'],
            uses: 'Blazers, vestidos de noche, tapizados, accesorios de lujo y trajes de ceremonias.',
            care: 'Tintorería recomendada. Guardar colgado para preservar el pelo. No doblar ni prensar.',
            seasons: ['Otoño', 'Invierno'],
        },
        {
            id: 3, model: null, /* Model3  */ image: Texture3, name: 'Metal Brushed', category: 'Metálico', format: '3D', badge: 'Premium',
            description: 'Tejido metálico cepillado que combina fibras metalizadas con hilos sintéticos de alta tenacidad. Refleja la luz de manera direccional creando un efecto bruñido sofisticado.',
            properties: ['Alto reflejo', 'Rigidez media', 'Efecto espejo', 'Resistente a arrugas', 'Impermeable leve'],
            uses: 'Prendas de pasarela, tops futuristas, trajes de gala, accesorios y complementos.',
            care: 'Lavado en seco únicamente. No retorcer. Guardar extendido para evitar marcas.',
            seasons: ['Otoño', 'Invierno', 'Eventos especiales'],
        },
        {
            id: 4, model: null, /* Model4  */ image: Texture4, name: 'Cuero Sintético', category: 'Cuero', format: '2D/3D', badge: null,
            description: 'Alternativa vegana al cuero natural fabricada con poliuretano o PVC sobre base textil. Ofrece aspecto idéntico al cuero genuino con mayor versatilidad de colores y menor impacto ambiental.',
            properties: ['Fácil limpieza', 'Resistente al agua', 'Vegano', 'Variedad de acabados', 'Duradero'],
            uses: 'Chaquetas, pantalones, bolsos, calzado, cinturones y accesorios urbanos.',
            care: 'Limpiar con paño húmedo. Aplicar acondicionador específico. Guardar alejado del calor directo.',
            seasons: ['Primavera', 'Otoño', 'Invierno'],
        },
        {
            id: 5, model: null, /* Model5  */ image: Texture5, name: 'Pelo Sintético', category: 'Pelo', format: '3D', badge: 'Destacado',
            description: 'Felpilla sintética que imita el aspecto y tacto de pieles naturales. Fabricada con microfibras de acrílico o poliéster, es completamente cruelty-free y viene en múltiples largos de pelo.',
            properties: ['Cruelty-free', 'Pelo largo suave', 'Cálido', 'Fácil coloración', 'Voluminoso'],
            uses: 'Abrigos de invierno, chalecos, cuellos, puños, bordados decorativos y calzado.',
            care: 'Lavado delicado en frío. Secar al aire. Cepillar suavemente cuando esté seco.',
            seasons: ['Otoño', 'Invierno'],
        },
        {
            id: 6, model: null, /* Model6  */ image: Texture6, name: 'Algodón Natural', category: 'Algodón', format: '2D', badge: null,
            description: 'El algodón natural es la fibra textil más utilizada en el mundo por su comodidad, transpirabilidad y versatilidad. En su variante orgánica, se cultiva sin pesticidas respetando el ecosistema.',
            properties: ['Muy transpirable', 'Suave', 'Hipoalergénico', 'Biodegradable', 'Fácil lavado'],
            uses: 'Camisetas, camisas, vestidos casuales, pantalones, ropa interior y ropa deportiva ligera.',
            care: 'Lavado a máquina 30-40°C. Puede encogerse ligeramente. Planchar a temperatura media.',
            seasons: ['Primavera', 'Verano'],
        },
        {
            id: 7, model: null, /* Model7  */ image: Texture7, name: 'Lino Orgánico', category: 'Lino', format: '2D/3D', badge: null,
            description: 'El lino es una de las fibras naturales más antiguas de la humanidad, obtenida del tallo de la planta de lino. En su versión orgánica garantiza el máximo respeto medioambiental.',
            properties: ['Muy transpirable', 'Textura rústica', 'Se ablanda con el uso', 'Ecológico', 'Antibacteriano'],
            uses: 'Prendas de verano, vestidos étnicos, pantalones relajados, camisas y complementos boho.',
            care: 'Lavado a mano o ciclo delicado. Planchar ligeramente húmedo. Acepta arrugado natural.',
            seasons: ['Primavera', 'Verano'],
        },
        {
            id: 8, model: null, /* Model8  */ image: Texture8, name: 'Cuero Colores', category: 'Cuero', format: '3D', badge: 'Featured',
            description: 'Cuero sintético pigmentado en paleta expandida que desafía los tonos neutros tradicionales. Acabado semi-mate con alto poder cubriente que mantiene la flexibilidad del material base.',
            properties: ['Color vivo duradero', 'Semi-mate', 'Flexible', 'Resistente a rayaduras', 'Sin decoloración UV'],
            uses: 'Accesorios statement, calzado colorido, bolsos de diseñador, detalles en prendas y joyería de moda.',
            care: 'Limpiar con paño seco. Evitar exposición prolongada al sol para preservar el color.',
            seasons: ['Todo el año'],
        },
        {
            id: 9, model: null, /* Model9  */ image: Texture9, name: 'Organza Transparente', category: 'Especial', format: '3D', badge: 'Premium',
            description: 'La organza es un tejido ligero, translúcido y ligeramente rígido originariamente fabricado en seda. Su característica transparencia lo convierte en un material de superposición inigualable en alta costura.',
            properties: ['Translúcido', 'Ligero', 'Semi-rígido', 'Cruje suavemente', 'Mantiene forma'],
            uses: 'Capas sobre vestidos, mangas voluminosas, faldas estructuradas, velos y prendas avant-garde.',
            care: 'Lavado a mano muy delicado en frío. Planchar a temperatura muy baja. Guardar en bolsa de tela.',
            seasons: ['Primavera', 'Verano', 'Eventos'],
        },
        {
            id: 10, model: null, /* Model10 */ image: Texture10, name: 'Lana Tejida', category: 'Lana', format: '2D/3D', badge: null,
            description: 'Lana de oveja merina tejida en punto abierto, que equilibra el abrigo natural de la fibra animal con una ligereza sorprendente. El punto grande crea relieves táctiles muy expresivos.',
            properties: ['Muy cálida', 'Elástica', 'Aislante', 'Punto visible', 'Textura tridimensional'],
            uses: 'Suéteres, cardigans, cháles, bufandas, gorros y chaquetas de punto de temporada fría.',
            care: 'Lavado a mano en agua fría con jabón neutro. Secar extendido horizontalmente. No retorcer.',
            seasons: ['Otoño', 'Invierno'],
        },
        {
            id: 11, model: null, /* Model11 */ image: Texture11, name: 'Punto de Jersey', category: 'Tejido', format: '2D', badge: null,
            description: 'El jersey es el tejido de punto más versátil de la industria. Su estructura elástica de malla sencilla se adapta perfectamente al cuerpo, resultando en prendas cómodas con excelente recuperación.',
            properties: ['Alta elasticidad', 'Cómodo', 'Se adapta al cuerpo', 'Ligero', 'Fácil confección'],
            uses: 'Camisetas básicas, vestidos casuales, leggins, ropa deportiva y capas base.',
            care: 'Lavado a máquina ciclo delicado 30°C. Secar a baja temperatura. No exprimir en exceso.',
            seasons: ['Todo el año'],
        },
        {
            id: 12, model: null, /* Model12 */ image: Texture12, name: 'Patrón Geométrico', category: 'Patrón', format: '2D/3D', badge: 'Destacado',
            description: 'Tejido jacquard con motivos geométricos incorporados en la estructura del tejido, no estampados. Cada geometría es parte del entramado, garantizando durabilidad del patrón y textura en relieve.',
            properties: ['Relieve táctil', 'Patrón estructural', 'Resistente', 'Reversible', 'Efecto tridimensional'],
            uses: 'Blazers, vestidos cóctel, tapizados de lujo, bolsos estructurados y trajes de diseñador.',
            care: 'Lavado en seco para piezas confeccionadas. Planchar por el revés con temperatura media.',
            seasons: ['Otoño', 'Invierno', 'Primavera'],
        },
        {
            id: 13, model: null, /* Model13 */ image: Texture13, name: 'Tejido Multicolor', category: 'Tejido', format: '3D', badge: null,
            description: 'Tejido de inspiración artesanal con hilos de múltiples colores entrelazados en patrones irregulares. Cada metro presenta variaciones únicas resultado del proceso de teñido artesanal.',
            properties: ['Unicidad garantizada', 'Colores vibrantes', 'Artesanal', 'Texturizado', 'Sostenible'],
            uses: 'Vestidos étnicos, bolsos artesanales, accesorios boho, pareos y prendas de autor.',
            care: 'Primera lavada a mano para fijar colores. Posteriormente lavado a máquina suave en frío.',
            seasons: ['Primavera', 'Verano'],
        },
        {
            id: 14, model: null, /* Model14 */ image: Texture14, name: 'Denim Clásico', category: 'Denim', format: '2D/3D', badge: null,
            description: 'El denim es el tejido de sarga de algodón más icónico de la historia de la moda, nacido en el siglo XIX. Su dureza inicial evoluciona con el uso hacia una comodidad personalizada única.',
            properties: ['Muy resistente', 'Mejora con el uso', 'Icónico', 'Versátil', 'Alta durabilidad'],
            uses: 'Vaqueros, chaquetas, faldas, monos, accesorios y prendas urbanas de todo tipo.',
            care: 'Lavado al revés en frío para preservar color. Lavar con poca frecuencia. Secar al aire.',
            seasons: ['Todo el año'],
        },
        {
            id: 15, model: null, /* Model15 */ image: Texture15, name: 'Corrugado Industrial', category: 'Especial', format: '3D', badge: 'Premium',
            description: 'Tejido técnico con superficie corrugada creada por tratamiento térmico posterior al tejido. Las ondulaciones regulares no son decorativas sino funcionales, aportando mayor elasticidad transversal.',
            properties: ['Ondulaciones permanentes', 'Alta elasticidad', 'Efecto óptico', 'Técnico', 'Innovador'],
            uses: 'Ropa deportiva de alto rendimiento, prendas futuristas, trajes de escena y diseños avant-garde.',
            care: 'Lavado a máquina ciclo sport 30°C. No usar suavizante. Secar al aire manteniendo la forma.',
            seasons: ['Todo el año', 'Deportivo'],
        },
        {
            id: 16, model: null, /* Model16 */ image: Texture16, name: 'Malla Deportiva', category: 'Sintético', format: '2D/3D', badge: null,
            description: 'Tejido técnico de punto abierto fabricado en poliéster reciclado con tratamiento de gestión de la humedad. Sus microperforaciones garantizan ventilación activa durante la práctica deportiva.',
            properties: ['Muy transpirable', 'Gestión de humedad', 'Ligero', 'Elástico 4 vías', 'Reciclado'],
            uses: 'Ropa de entrenamiento, camisetas deportivas, conjuntos de yoga, ropa activa y casualwear deportivo.',
            care: 'Lavado a máquina 30°C. No usar suavizante (obstruye poros). Secar rápido al aire.',
            seasons: ['Todo el año', 'Deportivo'],
        },
    ];

    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        setEmail('');
    };

    return (
        <div className="trends-page">
            {/* Modal de tela seleccionada */}
            {selectedFabric && (
                <FabricModal fabric={selectedFabric} onClose={() => setSelectedFabric(null)} />
            )}
            {/* Header */}
            <header className="trends-header">
                <div className="header-content">
                    <div className="logo-section" onClick={onNavigateHome}>
                        <div className="logo-circle">
                            <img src={LogoEclat} alt="Logo Éclat" className="logo-image" />
                        </div>
                        <h1 className="logo-title">Éclat</h1>
                    </div>

                    <nav className="nav-menu">
                        <span className="nav-link" onClick={onNavigateHome}>Explorar</span>
                        <span className="nav-link" onClick={onOpenCollections}>Colecciones</span>
                        <span className="nav-link" onClick={onOpenDesigners}>Diseñadores</span>
                        <span className="nav-link active">Tendencias</span>
                    </nav>

                    <div className="header-actions">
                        <SearchBar onOpenPublicProfile={onOpenPublicProfile} />
                        <button className="upload-button" onClick={onOpenWorkspace}>
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
            <section className="trends-hero-section">
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
                    <span className="hero-text-eyebrow">Temporada 2025</span>
                    <h2 className="hero-text-title">
                        Descubre las texturas que <span className="hero-text-accent">definen la moda</span> de hoy
                    </h2>
                    <p className="hero-text-subtitle">
                        Explora materiales únicos, encuentra tu inspiración y da vida a creaciones que trascienden tendencias.
                    </p>
                </div>
            </section>

            {/* Texture Library Section */}
            <section className="texture-library-section">
                <div className="library-container">
                    <div className="library-header">
                        <h2 className="library-title">
                            Modelados de <span className="highlight">Telas en 3D</span>
                        </h2>
                        <p className="library-subtitle">
                            Explora nuestra colección de telas con modelados tridimensionales interactivos.
                            Haz clic en cualquier tela para rotarla, hacer zoom y leer su ficha completa.
                        </p>
                    </div>

                    {/* Grid de tarjetas 3D */}
                    <div className="textures-masonry">
                        {textures.map((texture) => (
                            <div
                                key={texture.id}
                                className="texture-item texture-item--3d"
                                onClick={() => setSelectedFabric(texture)}
                            >
                                {texture.badge && (
                                    <span className={`texture-badge ${texture.badge.toLowerCase()}`}>
                                        {texture.badge}
                                    </span>
                                )}

                                {/* Mini viewer 3D */}
                                <FabricViewer3D modelUrl={texture.model || null} textureUrl={texture.image} size="card" autoRotate={true} />

                                {/* Info footer de la tarjeta */}
                                <div className="texture-card-footer">
                                    <div className="texture-card-info">
                                        <span className="texture-card-name">{texture.name}</span>
                                        <span className="texture-card-cat">{texture.category}</span>
                                    </div>
                                    <span className="texture-card-cta">Ver detalle →</span>
                                </div>
                            </div>
                        ))}
                    </div>
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

                    {/* Cuerpo centrado: logo + nav */}
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
                        </nav>

                        <div className="footer-divider" />

                    </div>

                    {/* Bottom */}
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
        </div>
    );
}