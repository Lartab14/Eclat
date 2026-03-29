import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Undo,
    Redo,
    Save,
    Download,
    Edit3,
    Eraser,
    Circle,
    Square,
    Minus,
    Type,
    Layers,
    Eye,
    EyeOff,
    Copy,
    Trash2,
    Plus,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Move,
    Grid as GridIcon,
    Upload
} from 'lucide-react';
import './Workspace.css';
import LogoEclat from './img/EclatNegativo.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Workspace({ onBack, userData, draftDesign }) {
    const [activeTool, setActiveTool] = useState('pincel');
    const [brushSize, setBrushSize] = useState(3);
    const [currentColor, setCurrentColor] = useState('#667eea');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState('2d');

    const [isSaving, setIsSaving] = useState(false);
    const [saveTitle, setSaveTitle] = useState(draftDesign?.titulo || '');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [draftId, setDraftId] = useState(draftDesign?.id || null);

    const [layers, setLayers] = useState([
        { id: 1, name: 'Capa 1', opacity: 100, visible: true, canvasData: null }
    ]);
    const [activeLayerId, setActiveLayerId] = useState(1);

    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // ── Estado móvil ──
    const [mobileDrawer, setMobileDrawer] = useState(null); // null | 'tools' | 'colors' | 'layers' | 'actions'

    // ── Referencias ──
    const compositeCanvasRef = useRef(null);
    const layerCanvasRefs = useRef({});
    const previewCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    // Guardamos una ref sincrónica de layers para leerla en confirmSave sin stale closure
    const layersRef = useRef(layers);
    useEffect(() => { layersRef.current = layers; }, [layers]);

    const colorPalette = [
        '#000000', '#FFFFFF', '#667eea', '#764ba2', '#34d399', '#10b981',
        '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1'
    ];

    const tools = [
        { id: 'pincel', name: 'Pincel', icon: Edit3 },
        { id: 'borrador', name: 'Borrador', icon: Eraser },
        { id: 'linea', name: 'Línea', icon: Minus },
        { id: 'circulo', name: 'Círculo', icon: Circle },
        { id: 'rectangulo', name: 'Rectángulo', icon: Square },
        { id: 'texto', name: 'Texto', icon: Type }
    ];

    // ── Inicialización ─────────────────────────────────────────────────────────
    useEffect(() => {
        // Canvas de preview
        const preview = document.createElement('canvas');
        preview.width = 1200;
        preview.height = 800;
        previewCanvasRef.current = preview;

        // Composite
        const composite = compositeCanvasRef.current;
        if (!composite) return;
        const compositeCtx = composite.getContext('2d');
        compositeCtx.fillStyle = 'white';
        compositeCtx.fillRect(0, 0, composite.width, composite.height);

        // Canvas de Capa 1 base
        const layer1Canvas = document.createElement('canvas');
        layer1Canvas.width = 1200;
        layer1Canvas.height = 800;
        layerCanvasRefs.current[1] = layer1Canvas;

        if (draftDesign) {
            const rawUrl = draftDesign.imagen || draftDesign.imagen_url || draftDesign.image || draftDesign.url || '';
            const rawDesc = draftDesign.descripcion || '';

            // Restaurar capas desde JSON inline (LAYERS:...)
            const layersJson = rawDesc.startsWith('LAYERS:') ? rawDesc.replace('LAYERS:', '').trim() : null;

            if (layersJson) {
                const restoreFromJson = async () => {
                    try {
                        const savedLayers = JSON.parse(layersJson);
                        if (!Array.isArray(savedLayers) || savedLayers.length === 0) {
                            saveToHistory();
                            return;
                        }

                        const restoredLayers = savedLayers.map(l => ({
                            id: l.id,
                            name: l.name,
                            opacity: l.opacity ?? 100,
                            visible: l.visible ?? true,
                            canvasData: null
                        }));

                        // Cada capa tiene imageUrl (URL de Cloudinary) o canvasData legacy
                        const pending = { count: savedLayers.filter(l => l.imageUrl || l.canvasData).length };

                        if (pending.count === 0) {
                            setLayers(restoredLayers);
                            setActiveLayerId(restoredLayers[restoredLayers.length - 1].id);
                            saveToHistory();
                            return;
                        }

                        const finalize = () => {
                            compositeCtx.clearRect(0, 0, composite.width, composite.height);
                            compositeCtx.fillStyle = 'white';
                            compositeCtx.fillRect(0, 0, composite.width, composite.height);
                            restoredLayers.forEach(rl => {
                                if (!rl.visible) return;
                                const rlc = layerCanvasRefs.current[rl.id];
                                if (!rlc) return;
                                compositeCtx.globalAlpha = rl.opacity / 100;
                                compositeCtx.drawImage(rlc, 0, 0);
                            });
                            compositeCtx.globalAlpha = 1;
                            setLayers(restoredLayers);
                            setActiveLayerId(restoredLayers[restoredLayers.length - 1].id);
                            saveToHistory();
                        };

                        savedLayers.forEach((savedLayer, idx) => {
                            const lc = document.createElement('canvas');
                            lc.width = 1200;
                            lc.height = 800;
                            layerCanvasRefs.current[savedLayer.id] = lc;

                            const src = savedLayer.imageUrl || savedLayer.canvasData || null;
                            if (src) {
                                const loadImg = async () => {
                                    try {
                                        // Si es URL de Cloudinary, hacer fetch para evitar CORS tainted
                                        let imgSrc = src;
                                        if (src.startsWith('http')) {
                                            const r = await fetch(src);
                                            const b = await r.blob();
                                            imgSrc = URL.createObjectURL(b);
                                        }
                                        const img = new Image();
                                        img.onload = () => {
                                            lc.getContext('2d').drawImage(img, 0, 0);
                                            if (src.startsWith('http')) URL.revokeObjectURL(imgSrc);
                                            pending.count--;
                                            if (pending.count === 0) finalize();
                                        };
                                        img.onerror = () => {
                                            pending.count--;
                                            if (pending.count === 0) finalize();
                                        };
                                        img.src = imgSrc;
                                    } catch (e) {
                                        pending.count--;
                                        if (pending.count === 0) finalize();
                                    }
                                };
                                loadImg();
                            }
                        });
                    } catch (e) {
                        console.warn('Error restaurando capas:', e);
                        saveToHistory();
                    }
                };
                restoreFromJson();
                return;
            }

            // Fallback: cargar imagen simple (diseños subidos sin capas)
            if (rawUrl) {
                const fullUrl = rawUrl.startsWith('http') || rawUrl.startsWith('data:')
                    ? rawUrl
                    : `${API_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

                const loadViaFetch = async () => {
                    try {
                        const res = await fetch(fullUrl);
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const blob = await res.blob();
                        const objectUrl = URL.createObjectURL(blob);

                        const img = new Image();
                        img.onload = () => {
                            const ctx = layer1Canvas.getContext('2d');
                            // Sin escalar si la imagen ya es del tamaño del canvas
                            const scale = Math.min(layer1Canvas.width / img.width, layer1Canvas.height / img.height, 1);
                            const x = (layer1Canvas.width - img.width * scale) / 2;
                            const y = (layer1Canvas.height - img.height * scale) / 2;
                            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                            URL.revokeObjectURL(objectUrl);

                            const dataUrl = layer1Canvas.toDataURL('image/png');
                            setLayers(prev => prev.map(l =>
                                l.id === 1 ? { ...l, canvasData: dataUrl } : l
                            ));

                            compositeCtx.clearRect(0, 0, composite.width, composite.height);
                            compositeCtx.fillStyle = 'white';
                            compositeCtx.fillRect(0, 0, composite.width, composite.height);
                            compositeCtx.drawImage(layer1Canvas, 0, 0);
                            saveToHistory();
                        };
                        img.onerror = () => saveToHistory();
                        img.src = objectUrl;
                    } catch (err) {
                        console.warn('fetch falló, usando img directo:', err);
                        const img = new Image();
                        img.onload = () => {
                            const scale = Math.min(composite.width / img.width, composite.height / img.height, 1);
                            const x = (composite.width - img.width * scale) / 2;
                            const y = (composite.height - img.height * scale) / 2;
                            compositeCtx.clearRect(0, 0, composite.width, composite.height);
                            compositeCtx.fillStyle = 'white';
                            compositeCtx.fillRect(0, 0, composite.width, composite.height);
                            compositeCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
                            const ctx = layer1Canvas.getContext('2d');
                            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                            saveToHistory();
                        };
                        img.onerror = () => saveToHistory();
                        img.src = fullUrl;
                    }
                };
                loadViaFetch();
                return;
            }
        }

        saveToHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Recomponer al cambiar capas ──────────────────────────────────────────
    useEffect(() => {
        composeLayers();
    }, [layers]);

    const initializeCanvas = () => {
        const canvas = compositeCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const getActiveLayerCanvas = () => {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer) return null;

        if (!layerCanvasRefs.current[activeLayerId]) {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 800;
            layerCanvasRefs.current[activeLayerId] = canvas;

            if (activeLayer.canvasData) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = activeLayer.canvasData;
            }
        }

        return layerCanvasRefs.current[activeLayerId];
    };

    const composeLayers = useCallback(() => {
        const canvas = compositeCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        layersRef.current.forEach(layer => {
            if (!layer.visible) return;
            const lc = layerCanvasRefs.current[layer.id];
            if (!lc) return;
            ctx.globalAlpha = layer.opacity / 100;
            ctx.drawImage(lc, 0, 0);
        });
        ctx.globalAlpha = 1;
    }, []);

    const saveActiveLayerState = () => {
        const layerCanvas = getActiveLayerCanvas();
        if (!layerCanvas) return;
        const dataURL = layerCanvas.toDataURL();
        setLayers(prev => prev.map(layer =>
            layer.id === activeLayerId ? { ...layer, canvasData: dataURL } : layer
        ));
    };

    const getMousePos = (e) => {
        const canvas = compositeCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    // ── Touch helpers ─────────────────────────────────────────────────────────
    const getTouchPos = (e) => {
        const canvas = compositeCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            x: (touch.clientX - rect.left) * (canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (canvas.height / rect.height),
            clientX: touch.clientX,
            clientY: touch.clientY,
        };
    };

    const handleTouchStart = (e) => {
        if (mobileDrawer) { setMobileDrawer(null); return; }
        e.preventDefault();
        const touch = e.touches[0];
        const synthetic = { clientX: touch.clientX, clientY: touch.clientY };
        startDrawing(synthetic);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const synthetic = { clientX: touch.clientX, clientY: touch.clientY };
        draw(synthetic);
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const synthetic = { clientX: touch.clientX, clientY: touch.clientY };
        stopDrawing(synthetic);
    };

    const startDrawing = (e) => {
        if (activeTool === 'mover') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }
        const pos = getMousePos(e);
        setIsDrawing(true);
        setStartPos(pos);

        const layerCanvas = getActiveLayerCanvas();
        if (!layerCanvas) return;
        const ctx = layerCanvas.getContext('2d');

        if (activeTool === 'pincel') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        } else if (activeTool === 'borrador') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineWidth = brushSize * 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };

    const draw = (e) => {
        if (activeTool === 'mover' && isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }
        if (!isDrawing) return;
        const pos = getMousePos(e);
        const layerCanvas = getActiveLayerCanvas();
        if (!layerCanvas) return;

        if (activeTool === 'pincel' || activeTool === 'borrador') {
            const ctx = layerCanvas.getContext('2d');
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            composeLayers();
        } else if (['linea', 'circulo', 'rectangulo'].includes(activeTool)) {
            const previewCanvas = previewCanvasRef.current;
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            previewCtx.strokeStyle = currentColor;
            previewCtx.fillStyle = currentColor + '40';
            previewCtx.lineWidth = brushSize;

            if (activeTool === 'linea') {
                previewCtx.beginPath();
                previewCtx.moveTo(startPos.x, startPos.y);
                previewCtx.lineTo(pos.x, pos.y);
                previewCtx.stroke();
            } else if (activeTool === 'rectangulo') {
                previewCtx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
            } else if (activeTool === 'circulo') {
                const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
                previewCtx.beginPath();
                previewCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
                previewCtx.stroke();
            }

            const compositeCanvas = compositeCanvasRef.current;
            const compositeCtx = compositeCanvas.getContext('2d');
            compositeCtx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
            compositeCtx.fillStyle = 'white';
            compositeCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
            layersRef.current.forEach(layer => {
                if (!layer.visible) return;
                const lc = layerCanvasRefs.current[layer.id];
                if (!lc) return;
                compositeCtx.globalAlpha = layer.opacity / 100;
                compositeCtx.drawImage(lc, 0, 0);
            });
            compositeCtx.globalAlpha = 1;
            compositeCtx.drawImage(previewCanvas, 0, 0);
        }
    };

    const stopDrawing = (e) => {
        if (activeTool === 'mover') { setIsPanning(false); return; }
        if (!isDrawing) return;

        const pos = getMousePos(e);
        const layerCanvas = getActiveLayerCanvas();
        if (!layerCanvas) return;
        const ctx = layerCanvas.getContext('2d');

        if (activeTool === 'pincel') {
            ctx.closePath();
        } else if (activeTool === 'borrador') {
            ctx.closePath();
            ctx.globalCompositeOperation = 'source-over';
        } else if (activeTool === 'linea') {
            ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize;
            ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        } else if (activeTool === 'rectangulo') {
            ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize;
            ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
        } else if (activeTool === 'circulo') {
            ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize;
            const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
            ctx.beginPath(); ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI); ctx.stroke();
        } else if (activeTool === 'texto') {
            const text = prompt('Ingresa el texto:');
            if (text) {
                ctx.font = `${brushSize * 10}px Arial`;
                ctx.fillStyle = currentColor;
                ctx.fillText(text, pos.x, pos.y);
            }
        }

        setIsDrawing(false);
        saveActiveLayerState();
        composeLayers();
        saveToHistory();
    };

    // ── Gestión de capas ──────────────────────────────────────────────────────
    const addLayer = () => {
        const newId = Date.now();
        setLayers(prev => [...prev, { id: newId, name: `Capa ${prev.length + 1}`, opacity: 100, visible: true, canvasData: null }]);
        setActiveLayerId(newId);
    };

    const deleteLayer = (layerId) => {
        if (layers.length <= 1) return;
        delete layerCanvasRefs.current[layerId];
        const newLayers = layers.filter(l => l.id !== layerId);
        setLayers(newLayers);
        if (activeLayerId === layerId) setActiveLayerId(newLayers[0].id);
    };

    const toggleLayerVisibility = (layerId) => {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
    };

    const updateLayerOpacity = (layerId, opacity) => {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
    };

    const duplicateLayer = (layerId) => {
        const layerToDup = layers.find(l => l.id === layerId);
        if (!layerToDup) return;
        const newId = Date.now();
        const newLayer = { ...layerToDup, id: newId, name: `${layerToDup.name} (copia)` };

        if (layerCanvasRefs.current[layerId]) {
            const srcCanvas = layerCanvasRefs.current[layerId];
            const newCanvas = document.createElement('canvas');
            newCanvas.width = 1200; newCanvas.height = 800;
            newCanvas.getContext('2d').drawImage(srcCanvas, 0, 0);
            layerCanvasRefs.current[newId] = newCanvas;
        }
        setLayers(prev => [...prev, newLayer]);
        composeLayers();
    };

    // ── Historial ─────────────────────────────────────────────────────────────
    const saveToHistory = () => {
        const canvas = compositeCanvasRef.current;
        if (!canvas) return;
        const imageData = canvas.toDataURL();
        setHistory(prev => {
            const newHistory = prev.slice(0, historyStep + 1);
            newHistory.push(imageData);
            setHistoryStep(newHistory.length - 1);
            return newHistory;
        });
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const img = new Image();
            img.src = history[historyStep - 1];
            img.onload = () => {
                const canvas = compositeCanvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                setHistoryStep(prev => prev - 1);
            };
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const img = new Image();
            img.src = history[historyStep + 1];
            img.onload = () => {
                const canvas = compositeCanvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                setHistoryStep(prev => prev + 1);
            };
        }
    };

    // ── Limpiar capa ─────────────────────────────────────────────────────────
    const clearCanvas = () => {
        const layerCanvas = getActiveLayerCanvas();
        if (!layerCanvas) return;
        layerCanvas.getContext('2d').clearRect(0, 0, layerCanvas.width, layerCanvas.height);
        saveActiveLayerState();
        composeLayers();
        saveToHistory();
    };

    // ── Importar imagen ──────────────────────────────────────────────────────
    const handleImportImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const layerCanvas = getActiveLayerCanvas();
                if (!layerCanvas) return;
                const ctx = layerCanvas.getContext('2d');
                const scale = Math.min(layerCanvas.width / img.width, layerCanvas.height / img.height);
                const x = (layerCanvas.width - img.width * scale) / 2;
                const y = (layerCanvas.height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                saveActiveLayerState();
                composeLayers();
                saveToHistory();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // ── GUARDAR ── FIX: recomponer desde layerCanvasRefs ANTES del toBlob ──
    const handleSave = () => {
        if (!saveTitle) {
            setSaveTitle(draftDesign?.titulo || `Boceto ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`);
        }
        setShowSaveModal(true);
    };

    const confirmSave = async () => {
        if (!userData?.id_usuario) {
            alert('Debes iniciar sesión para guardar diseños.');
            return;
        }
        setIsSaving(true);
        try {
            const canvas = compositeCanvasRef.current;
            const ctx = canvas.getContext('2d');

            // FIX PIXELADO: dibujar 1:1 sin escalar
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            layersRef.current.forEach(layer => {
                if (!layer.visible) return;
                const lc = layerCanvasRefs.current[layer.id];
                if (!lc) return;
                ctx.globalAlpha = layer.opacity / 100;
                ctx.drawImage(lc, 0, 0);
            });
            ctx.globalAlpha = 1;

            // FIX CAPAS: subir cada capa como imagen PNG individual a Cloudinary
            // Así la descripcion solo guarda URLs (texto corto), no base64 pesado
            const layersSnapshot = await Promise.all(
                layersRef.current.map(async (layer) => {
                    const lc = layerCanvasRefs.current[layer.id];
                    let layerImageUrl = null;
                    if (lc) {
                        try {
                            const layerBlob = await new Promise(res => lc.toBlob(res, 'image/png', 1.0));
                            if (layerBlob && layerBlob.size > 500) {
                                const layerFile = new File([layerBlob], `layer-${layer.id}.png`, { type: 'image/png' });
                                const layerForm = new FormData();
                                layerForm.append('image', layerFile);
                                const layerUploadRes = await fetch(`${API_URL}/upload/image`, { method: 'POST', body: layerForm });
                                if (layerUploadRes.ok) {
                                    const layerUploadData = await layerUploadRes.json();
                                    layerImageUrl = layerUploadData.imageUrl;
                                }
                            }
                        } catch (e) {
                            console.warn(`Error subiendo capa ${layer.id}:`, e);
                        }
                    }
                    return {
                        id: layer.id,
                        name: layer.name,
                        opacity: layer.opacity,
                        visible: layer.visible,
                        imageUrl: layerImageUrl  // URL de Cloudinary, no base64
                    };
                })
            );

            // Imagen composite para previsualización
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
            if (!blob || blob.size < 500) {
                console.warn('⚠️ Blob vacío, tamaño:', blob?.size);
            }
            const file = new File([blob], `${saveTitle || 'boceto'}.png`, { type: 'image/png' });

            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await fetch(`${API_URL}/upload/image`, { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Error al subir la imagen');
            const uploadData = await uploadRes.json();
            const imageUrl = uploadData.imageUrl;

            // Guardar metadata de capas (solo URLs, texto corto) en descripcion
            const descripcion = `LAYERS:${JSON.stringify(layersSnapshot)}`;

            if (draftId) {
                try {
                    await fetch(`${API_URL}/designs/remove/${draftId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_usuario: userData.id_usuario }),
                    });
                } catch (_) {
                    console.warn('No se pudo eliminar el diseño anterior, continuando...');
                }
            }

            const designRes = await fetch(`${API_URL}/designs/with-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_usuario: userData.id_usuario,
                    titulo: saveTitle || 'Boceto sin título',
                    descripcion,
                    tipo_diseño: 'boceto',
                    visibilidad: 'privado',
                    imagen_url: imageUrl,
                }),
            });
            if (!designRes.ok) throw new Error('Error al guardar el diseño');

            const designData = await designRes.json();
            const newId = designData?.diseño?.id_diseño || designData?.diseño?.id || designData?.id || null;
            if (newId) setDraftId(newId);

            setShowSaveModal(false);
            alert(draftId ? '✅ ¡Boceto actualizado en tus diseños privados!' : '✅ ¡Boceto guardado en tus diseños privados!');
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('❌ No se pudo guardar el diseño. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = () => {
        const canvas = compositeCanvasRef.current;
        const link = document.createElement('a');
        link.download = `eclat-design-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="workspace-container">
            {/* Header */}
            <div className="workspace-header">
                <div className="workspace-header-left">
                    <button className="workspace-back-btn" onClick={onBack}>
                        <ArrowLeft size={18} /><span>Volver</span>
                    </button>
                    <div className="workspace-logo">
                        <img src={LogoEclat} alt="Logo" className="workspace-logo-icon" />
                        <span className="workspace-logo-text">Éclat Studio</span>
                    </div>
                    <h1 className="workspace-title">
                        {draftDesign ? `Editando: ${draftDesign.titulo || 'Boceto'}` : 'Lienzo de Diseño'}
                    </h1>
                </div>
                <div className="workspace-header-right">
                    <button className="workspace-action-btn" onClick={handleUndo} disabled={historyStep <= 0}>
                        <Undo size={18} />
                    </button>
                    <button className="workspace-action-btn" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                        <Redo size={18} />
                    </button>
                    <button className="workspace-action-btn workspace-save-btn" onClick={handleSave}>
                        <Save size={18} /><span>Guardar</span>
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="workspace-main">
                {/* Panel Izquierdo */}
                <div className="workspace-left-panel">
                    <div className="workspace-panel-section">
                        <h3 className="workspace-section-title">Herramientas</h3>
                        <div className="workspace-tools-grid">
                            {tools.map(tool => {
                                const Icon = tool.icon;
                                return (
                                    <button
                                        key={tool.id}
                                        className={`workspace-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                                        onClick={() => setActiveTool(tool.id)}
                                    >
                                        <Icon size={20} /><span>{tool.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="workspace-panel-section">
                        <h3 className="workspace-section-title">Tamaño</h3>
                        <div className="workspace-size-control">
                            <div className="workspace-size-header">
                                <span className="workspace-size-label">Grosor</span>
                                <span className="workspace-size-value">{brushSize}px</span>
                            </div>
                            <input type="range" min="1" max="50" value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="workspace-slider" />
                        </div>
                    </div>

                    <div className="workspace-panel-section">
                        <h3 className="workspace-section-title">Colores</h3>
                        <div className="workspace-color-preview">
                            <input type="color" value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                className="workspace-color-swatch" />
                            <div className="workspace-color-code">{currentColor.toUpperCase()}</div>
                        </div>
                        <div className="workspace-color-palette">
                            {colorPalette.map(color => (
                                <div key={color}
                                    className={`workspace-palette-color ${currentColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setCurrentColor(color)} />
                            ))}
                        </div>
                    </div>

                    <div className="workspace-panel-section">
                        <h3 className="workspace-section-title">Acciones</h3>
                        <div className="workspace-action-list">
                            <button className="workspace-action-item" onClick={clearCanvas}>
                                <Trash2 size={18} /><span>Limpiar Capa</span>
                            </button>
                            <button className="workspace-action-item" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={18} /><span>Importar Imagen</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*"
                                style={{ display: 'none' }} onChange={handleImportImage} />
                            <button className="workspace-action-item" onClick={handleExport}>
                                <Download size={18} /><span>Exportar PNG</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel Central */}
                <div className="workspace-center-panel">
                    <div className="workspace-canvas-header">
                        <div className="workspace-canvas-info">
                            <h2 className="workspace-canvas-title">Lienzo de Diseño</h2>
                            <span className="workspace-canvas-size">1200 × 800px</span>
                        </div>
                        <div className="workspace-view-modes">
                            <button className={`workspace-view-btn ${viewMode === '2d' ? 'active' : ''}`}
                                onClick={() => setViewMode('2d')}>
                                <Edit3 size={16} /><span>Editor 2D</span>
                            </button>
                        </div>
                    </div>

                    <div ref={containerRef} className="workspace-canvas-area">
                        <canvas
                            ref={compositeCanvasRef}
                            width={1200}
                            height={800}
                            className="workspace-canvas"
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                cursor: activeTool === 'mover' ? 'move'
                                    : activeTool === 'pincel' ? 'crosshair'
                                        : activeTool === 'borrador' ? 'cell' : 'default'
                            }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        />
                        <div className="workspace-canvas-controls">
                            <button className="workspace-control-btn" onClick={handleUndo} disabled={historyStep <= 0}>
                                <Undo size={18} />
                            </button>
                            <button className="workspace-control-btn" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                                <Redo size={18} />
                            </button>
                            <button className="workspace-control-btn" onClick={handleZoomIn}><ZoomIn size={18} /></button>
                            <button className="workspace-control-btn" onClick={handleZoomOut}><ZoomOut size={18} /></button>
                            <button className="workspace-control-btn" onClick={handleResetZoom}><RotateCcw size={18} /></button>
                            <button className={`workspace-control-btn ${activeTool === 'mover' ? 'active' : ''}`}
                                onClick={() => setActiveTool('mover')}>
                                <Move size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho */}
                <div className="workspace-right-panel">
                    <div className="workspace-layers-header">
                        <div className="workspace-layers-title"><Layers size={20} /><span>Capas</span></div>
                        <button className="workspace-add-layer-btn" onClick={addLayer}><Plus size={18} /></button>
                    </div>
                    <div className="workspace-layers-list">
                        {layers.slice().reverse().map((layer) => (
                            <div key={layer.id}
                                className={`workspace-layer-item ${activeLayerId === layer.id ? 'active' : ''}`}
                                onClick={() => setActiveLayerId(layer.id)}>
                                <div className="workspace-layer-header">
                                    <span className="workspace-layer-name">{layer.name}</span>
                                    <div className="workspace-layer-actions">
                                        <button className="workspace-layer-action-btn"
                                            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}>
                                            {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button className="workspace-layer-action-btn"
                                            onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}>
                                            <Copy size={16} />
                                        </button>
                                        <button className="workspace-layer-action-btn delete"
                                            onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                                            disabled={layers.length <= 1}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="workspace-layer-opacity">
                                    <div className="workspace-size-header">
                                        <span className="workspace-size-label">Opacidad</span>
                                        <span className="workspace-size-value">{layer.opacity}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={layer.opacity}
                                        onChange={(e) => updateLayerOpacity(layer.id, parseInt(e.target.value))}
                                        onClick={(e) => e.stopPropagation()}
                                        className="workspace-layer-opacity-slider" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── BARRA MÓVIL INFERIOR ── */}
            <div className="workspace-mobile-bar">
                {/* Herramienta activa a la izquierda */}
                <button
                    className="mobile-bar-tool-active"
                    onClick={() => setMobileDrawer(d => d === 'tools' ? null : 'tools')}
                >
                    {(() => { const t = tools.find(t => t.id === activeTool); return t ? <t.icon size={22} /> : <Edit3 size={22} />; })()}
                </button>

                {/* Color actual */}
                <button
                    className="mobile-bar-color"
                    style={{ background: currentColor }}
                    onClick={() => setMobileDrawer(d => d === 'colors' ? null : 'colors')}
                />

                {/* Controles rápidos */}
                <button className="mobile-bar-btn" onClick={handleUndo} disabled={historyStep <= 0}><Undo size={20} /></button>
                <button className="mobile-bar-btn" onClick={handleRedo} disabled={historyStep >= history.length - 1}><Redo size={20} /></button>
                <button className={`mobile-bar-btn ${activeTool === 'mover' ? 'active' : ''}`} onClick={() => setActiveTool('mover')}><Move size={20} /></button>

                {/* Capas y acciones */}
                <button className="mobile-bar-btn" onClick={() => setMobileDrawer(d => d === 'layers' ? null : 'layers')}><Layers size={20} /></button>
                <button className="mobile-bar-btn" onClick={() => setMobileDrawer(d => d === 'actions' ? null : 'actions')}><GridIcon size={20} /></button>

                {/* Guardar */}
                <button className="mobile-bar-save" onClick={handleSave}><Save size={20} /></button>
            </div>

            {/* ── DRAWERS MÓVIL ── */}
            {mobileDrawer && (
                <div className="mobile-drawer-backdrop" onClick={() => setMobileDrawer(null)} />
            )}

            {/* Drawer: Herramientas */}
            <div className={`mobile-drawer ${mobileDrawer === 'tools' ? 'open' : ''}`}>
                <div className="mobile-drawer-handle" />
                <p className="mobile-drawer-title">Herramientas</p>
                <div className="mobile-drawer-tools-grid">
                    {tools.map(tool => {
                        const Icon = tool.icon;
                        return (
                            <button
                                key={tool.id}
                                className={`mobile-drawer-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                                onClick={() => { setActiveTool(tool.id); setMobileDrawer(null); }}
                            >
                                <Icon size={24} />
                                <span>{tool.name}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="mobile-drawer-size">
                    <div className="workspace-size-header">
                        <span className="workspace-size-label">Grosor del trazo</span>
                        <span className="workspace-size-value">{brushSize}px</span>
                    </div>
                    <input type="range" min="1" max="50" value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="workspace-slider mobile-drawer-slider" />
                </div>
            </div>

            {/* Drawer: Colores */}
            <div className={`mobile-drawer ${mobileDrawer === 'colors' ? 'open' : ''}`}>
                <div className="mobile-drawer-handle" />
                <p className="mobile-drawer-title">Color</p>
                <div className="mobile-drawer-color-row">
                    <input type="color" value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="workspace-color-swatch mobile-color-picker" />
                    <span className="mobile-color-hex">{currentColor.toUpperCase()}</span>
                </div>
                <div className="mobile-drawer-palette">
                    {colorPalette.map(color => (
                        <div key={color}
                            className={`workspace-palette-color mobile-palette-dot ${currentColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => { setCurrentColor(color); setMobileDrawer(null); }} />
                    ))}
                </div>
            </div>

            {/* Drawer: Capas */}
            <div className={`mobile-drawer ${mobileDrawer === 'layers' ? 'open' : ''}`}>
                <div className="mobile-drawer-handle" />
                <div className="mobile-drawer-layers-header">
                    <p className="mobile-drawer-title" style={{ margin: 0 }}>Capas</p>
                    <button className="workspace-add-layer-btn" onClick={addLayer}><Plus size={18} /></button>
                </div>
                <div className="mobile-drawer-layers-list">
                    {layers.slice().reverse().map((layer) => (
                        <div key={layer.id}
                            className={`workspace-layer-item ${activeLayerId === layer.id ? 'active' : ''}`}
                            onClick={() => { setActiveLayerId(layer.id); setMobileDrawer(null); }}>
                            <div className="workspace-layer-header">
                                <span className="workspace-layer-name">{layer.name}</span>
                                <div className="workspace-layer-actions">
                                    <button className="workspace-layer-action-btn"
                                        onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}>
                                        {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                    <button className="workspace-layer-action-btn"
                                        onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}>
                                        <Copy size={16} />
                                    </button>
                                    <button className="workspace-layer-action-btn delete"
                                        onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                                        disabled={layers.length <= 1}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="workspace-layer-opacity">
                                <div className="workspace-size-header">
                                    <span className="workspace-size-label">Opacidad</span>
                                    <span className="workspace-size-value">{layer.opacity}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={layer.opacity}
                                    onChange={(e) => updateLayerOpacity(layer.id, parseInt(e.target.value))}
                                    onClick={(e) => e.stopPropagation()}
                                    className="workspace-layer-opacity-slider" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drawer: Acciones */}
            <div className={`mobile-drawer ${mobileDrawer === 'actions' ? 'open' : ''}`}>
                <div className="mobile-drawer-handle" />
                <p className="mobile-drawer-title">Acciones</p>
                <div className="mobile-drawer-actions-list">
                    <button className="workspace-action-item" onClick={() => { clearCanvas(); setMobileDrawer(null); }}>
                        <Trash2 size={20} /><span>Limpiar Capa</span>
                    </button>
                    <button className="workspace-action-item" onClick={() => { fileInputRef.current?.click(); setMobileDrawer(null); }}>
                        <Upload size={20} /><span>Importar Imagen</span>
                    </button>
                    <button className="workspace-action-item" onClick={() => { handleExport(); setMobileDrawer(null); }}>
                        <Download size={20} /><span>Exportar PNG</span>
                    </button>
                    <div className="mobile-drawer-zoom-row">
                        <button className="workspace-control-btn" onClick={handleZoomOut}><ZoomOut size={20} /></button>
                        <span className="mobile-zoom-label">{Math.round(zoom * 100)}%</span>
                        <button className="workspace-control-btn" onClick={handleZoomIn}><ZoomIn size={20} /></button>
                        <button className="workspace-control-btn" onClick={handleResetZoom}><RotateCcw size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Modal Guardar */}
            {showSaveModal && (
                <div className="workspace-modal-overlay" onClick={() => !isSaving && setShowSaveModal(false)}>
                    <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="workspace-modal-header">
                            <Save size={22} />
                            <h3>{draftId ? 'Actualizar boceto' : 'Guardar en diseños privados'}</h3>
                        </div>
                        <p className="workspace-modal-subtitle">
                            {draftId
                                ? 'Se actualizará el boceto existente con los cambios actuales.'
                                : 'El boceto se guardará en tu perfil como diseño privado.'}
                        </p>
                        <label className="workspace-modal-label">Título del diseño</label>
                        <input type="text" className="workspace-modal-input" value={saveTitle}
                            onChange={(e) => setSaveTitle(e.target.value)}
                            placeholder="Ej: Colección Primavera 2025" autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && !isSaving && confirmSave()} />
                        <div className="workspace-modal-actions">
                            <button className="workspace-modal-btn workspace-modal-btn-cancel"
                                onClick={() => setShowSaveModal(false)} disabled={isSaving}>
                                Cancelar
                            </button>
                            <button className="workspace-modal-btn workspace-modal-btn-save"
                                onClick={confirmSave} disabled={isSaving || !saveTitle.trim()}>
                                {isSaving
                                    ? <><div className="workspace-modal-spinner" />Guardando...</>
                                    : <><Save size={16} />Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}