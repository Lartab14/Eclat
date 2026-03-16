import React, { useState, useRef, useEffect } from 'react';
import { 
  Pencil, Eraser, Square, Circle, Minus, 
  Undo2, Redo2, Trash2, Download, Upload, 
  Palette, Save, X, ZoomIn, ZoomOut, Move, ArrowLeft
} from 'lucide-react';

export default function DesignEditor({ onBack }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [currentDesign, setCurrentDesign] = useState(null);

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fondo blanco inicial
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      // Para formas, dibujamos preview mientras se arrastra
      restoreCanvas();
      drawShape(ctx, startPos.x, startPos.y, x, y);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      ctx.globalCompositeOperation = 'source-over';
      drawShape(ctx, startPos.x, startPos.y, x, y);
    }

    setIsDrawing(false);
    ctx.closePath();
    saveToHistory();
  };

  const drawShape = (ctx, x1, y1, x2, y2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    if (tool === 'line') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (tool === 'rectangle') {
      const width = x2 - x1;
      const height = y2 - y1;
      ctx.strokeRect(x1, y1, width, height);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const restoreCanvas = () => {
    if (historyStep >= 0 && history[historyStep]) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep + 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const clearCanvas = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar el canvas?')) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  };

  const uploadImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // Calcular escala para ajustar la imagen al canvas
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          saveToHistory();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveDesign = () => {
    const canvas = canvasRef.current;
    const designName = prompt('Nombre de tu diseño:') || 'Sin título';
    const newDesign = {
      id: Date.now(),
      name: designName,
      image: canvas.toDataURL(),
      date: new Date().toLocaleDateString()
    };
    setDesigns([newDesign, ...designs]);
    setCurrentDesign(newDesign);
    alert('¡Diseño guardado exitosamente!');
  };

  const downloadDesign = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `eclat-design-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const loadDesign = (design) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveToHistory();
    };
    img.src = design.image;
    setCurrentDesign(design);
    setShowGallery(false);
  };

  const deleteDesign = (id) => {
    if (window.confirm('¿Eliminar este diseño?')) {
      setDesigns(designs.filter(d => d.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              É
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Editor de Diseño</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Mis Diseños ({designs.length})
            </button>
            {currentDesign && (
              <span className="text-sm text-gray-600">
                Editando: <strong>{currentDesign.name}</strong>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">Mis Diseños</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {designs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl mb-2">No tienes diseños guardados</p>
                  <p>Crea tu primer diseño y guárdalo</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={design.image}
                        alt={design.name}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => loadDesign(design)}
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-1">{design.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{design.date}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadDesign(design)}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteDesign(design.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Toolbar Left */}
          <div className="col-span-12 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-4">
              <h3 className="font-semibold text-gray-700 mb-4 text-center">Herramientas</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setTool('pencil')}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    tool === 'pencil' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pencil size={20} />
                  <span className="text-sm font-medium">Lápiz</span>
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    tool === 'eraser' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eraser size={20} />
                  <span className="text-sm font-medium">Borrador</span>
                </button>
                <button
                  onClick={() => setTool('line')}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    tool === 'line' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Minus size={20} />
                  <span className="text-sm font-medium">Línea</span>
                </button>
                <button
                  onClick={() => setTool('rectangle')}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    tool === 'rectangle' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Square size={20} />
                  <span className="text-sm font-medium">Rectángulo</span>
                </button>
                <button
                  onClick={() => setTool('circle')}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    tool === 'circle' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Circle size={20} />
                  <span className="text-sm font-medium">Círculo</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Grosor del trazo</h4>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="text-center text-sm text-gray-600 mt-2">{lineWidth}px</div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={clearCanvas}
                  className="w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  <span className="text-sm font-medium">Limpiar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Top Controls */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <button
                    onClick={undo}
                    disabled={historyStep <= 0}
                    className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Deshacer"
                  >
                    <Undo2 size={20} />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyStep >= history.length - 1}
                    className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Rehacer"
                  >
                    <Redo2 size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 cursor-pointer transition-colors flex items-center gap-2">
                    <Upload size={20} />
                    <span className="text-sm font-medium">Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadImage}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={saveDesign}
                    className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Save size={20} />
                    <span className="text-sm font-medium">Guardar</span>
                  </button>
                  <button
                    onClick={downloadDesign}
                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={20} />
                    <span className="text-sm font-medium">Exportar</span>
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border-2 border-gray-200 rounded-xl cursor-crosshair shadow-inner"
                  style={{ touchAction: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="col-span-12 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-4">
              <h3 className="font-semibold text-gray-700 mb-4 text-center">Colores</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Color actual</label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-xl border-2 border-gray-300 cursor-pointer shadow-sm"
                    style={{ backgroundColor: color }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 h-12 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Paleta</label>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-full h-10 rounded-lg transition-all ${
                        color === c 
                          ? 'ring-2 ring-purple-600 ring-offset-2 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: c,
                        border: c === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Instrucciones</h4>
                <ul className="text-xs text-gray-600 space-y-2">
                  <li>• Selecciona una herramienta</li>
                  <li>• Elige tu color favorito</li>
                  <li>• Dibuja en el canvas</li>
                  <li>• Usa deshacer/rehacer</li>
                  <li>• Guarda tu diseño</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}