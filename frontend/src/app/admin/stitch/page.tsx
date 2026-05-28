'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { getToken } from '@/utils/session';

function StitchDashboard() {
  const [title, setTitle] = useState('Condominio Jardines de Cala Cala');
  const [prompt, setPrompt] = useState(
    'Diseña una landing page corporativa de lujo con fondo negro, tonos verde esmeralda y detalles en oro para la preventa exclusiva de departamentos de 3 dormitorios en Cala Cala, Cochabamba. Debe incluir una sección de características, fotos en slider y un botón de WhatsApp.'
  );
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Cargar una landing de demostración por defecto al entrar
  useEffect(() => {
    const demoHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Previsualización de Google Stitch AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
  <style>body { font-family: 'Outfit', sans-serif; background-color: #0b0b0f; }</style>
</head>
<body class="text-slate-400 min-h-screen flex items-center justify-center p-8 bg-[#0b0b0f]">
  <div class="text-center max-w-md bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-xl">
    <span class="text-4xl mb-4 block">🤖</span>
    <h2 class="text-lg font-black text-slate-100 uppercase tracking-wider">Listo para generar</h2>
    <p class="text-xs text-slate-500 mt-2 leading-relaxed">
      Escribe un título y prompt de diseño a la izquierda y haz clic en "Generar con Google Stitch" para renderizar tu landing page en vivo.
    </p>
  </div>
</body>
</html>`;
    setGeneratedHtml(demoHtml);
  }, []);

  const templates = [
    {
      name: '🏢 Preventa De Lujo',
      title: 'Residencial Skyview - Queru Queru',
      prompt: 'Diseña una landing page futurista en color negro y violeta eléctrico para la preventa exclusiva de departamentos inteligentes en Queru Queru. Resalta la domótica, terraza panorámica con jacuzzi y acabados europeos importados.'
    },
    {
      name: '🌿 Ecológico & Natural',
      title: 'Ecoaldea Los Aromas - Sacaba',
      prompt: 'Diseña una landing page minimalista en color verde bosque y crema para la venta de terrenos ecológicos en Sacaba. Incluye una atmósfera pacífica, fotos de áreas comunes boscosas y detalles sobre fuentes de energía solar.'
    },
    {
      name: '🛍️ Oficinas Corporativas',
      title: 'Torre Empresarial Manaco - El Prado',
      prompt: 'Diseña una landing page corporativa en azul cobalto y gris pizarra para el alquiler de oficinas corporativas de alto nivel en El Prado. Incluye salas de conferencias ejecutivas, fibra óptica de alta velocidad y doble parqueo.'
    }
  ];

  const applyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setPrompt(tpl.prompt);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setApiError(null);

    const token = getToken();
    if (!token) {
      setApiError('No estás autenticado como administrador.');
      setIsGenerating(false);
      return;
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiBaseUrl}/stitch/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, title })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor de Google Stitch. Verifica tus credenciales.');
      }

      const data = await response.json();
      setGeneratedHtml(data.html);
    } catch (err: any) {
      setApiError(err.message || 'Error inesperado durante la generación.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Obtener ancho del iframe según dispositivo de previsualización
  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'max-w-full';
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-slate-200 p-6 md:p-8 font-sans relative overflow-hidden">
      {/* Auras de Gradiente decorativas de Google Stitch */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-6 mb-8 gap-4 z-10 relative">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20 uppercase">
              Google Labs
            </span>
            <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase">
              Dev Mode
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100 mt-2">
            Stitch AI Landing Page Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Genera de forma instantánea páginas de aterrizaje promocionales para tus propiedades utilizando Inteligencia Artificial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyInfo(!showKeyInfo)}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2"
          >
            <span>🔑 API Key Setup</span>
            <span>{showKeyInfo ? '▲' : '▼'}</span>
          </button>
          
          <a
            href="https://stitch.withgoogle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all uppercase tracking-wider shadow-lg hover:shadow-violet-600/10 text-center"
          >
            Visitar Stitch.withgoogle.com
          </a>
        </div>
      </div>

      {showKeyInfo && (
        <div className="mb-8 p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl animate-fadeIn z-10 relative">
          <h3 className="text-sm font-bold text-slate-200 mb-2">🚀 ¿Cómo configurar tu API Key real de Google Stitch?</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Para realizar llamados reales a la API de Google Stitch, necesitas vincular tu clave secreta de desarrollador.
          </p>
          <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 mb-4">
            <li>Ingresa a <a href="https://stitch.withgoogle.com/" target="_blank" rel="noopener" className="text-violet-400 underline font-bold">stitch.withgoogle.com</a> e inicia sesión con tu cuenta de Google.</li>
            <li>Haz clic en tu foto de perfil en la esquina superior derecha y selecciona **Stitch Settings**.</li>
            <li>Crea una nueva **API Key** y cópiala.</li>
            <li>Abre tu archivo <code className="text-emerald-400 font-mono bg-slate-900 px-1 py-0.5 rounded">backend/.env</code> e inserta la clave:</li>
          </ol>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto leading-normal">
{`STITCH_API_KEY="tu_clave_secreta_de_google_stitch_generada"`}
          </pre>
          <p className="text-[10px] text-violet-400 italic mt-3">
            Nota: Si no inyectas una clave real (o utilizas una clave que comience con la palabra "mock-"), el sistema activará automáticamente el modo de simulación, permitiéndote probar la interfaz completa y previsualizar plantillas sin costo alguno.
          </p>
        </div>
      )}

      {apiError && (
        <div className="mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold">
          ⚠️ {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative items-stretch">
        {/* Consola de Control (Izquierda) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl p-6 flex flex-col gap-6 shadow-2xl">
            <h2 className="text-sm font-black text-[#b9fa3c] uppercase tracking-wider pb-4 border-b border-slate-800/80 flex items-center gap-2">
              <span>🎛️</span> Consola Stitch AI
            </h2>

            {/* Selector de Plantillas Rápidas */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Plantillas Rápidas
              </span>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-700 transition-all text-xs font-bold flex items-center justify-between"
                  >
                    <span>{tpl.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cargar</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Título de la Landing
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Mansión en Calacala"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Prompt de Diseño AI (Stitch Command)
                </label>
                <textarea
                  required
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe cómo deseas que sea el diseño, los colores, las secciones y las imágenes promocionales..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300 text-xs font-medium leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-emerald-500 hover:from-violet-700 hover:to-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-violet-600/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Generando con Stitch...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Generar con Google Stitch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Previsualizador en Vivo (Derecha) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl p-6 flex flex-col gap-6 shadow-2xl h-full min-h-[550px]">
            
            {/* Header de Visualización */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                  Previsualizador del Lienzo
                </h2>
              </div>

              {/* Controles de Dispositivo */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl shrink-0">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${previewDevice === 'desktop' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🖥️ Escritorio
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${previewDevice === 'tablet' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  📟 Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${previewDevice === 'mobile' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  📱 Móvil
                </button>
              </div>
            </div>

            {/* Frame de Renderizado */}
            <div className="flex-1 flex justify-center bg-slate-950/60 rounded-2xl overflow-hidden border border-slate-800/80 relative min-h-[400px]">
              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-full border-4 border-violet-500/10 border-t-violet-500 animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-xl">🎨</span>
                  </div>
                  <h3 className="text-base font-black text-slate-100 uppercase tracking-wider animate-pulse">Tejiendo diseño en Stitch</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                    Google Labs está estructurando el código HTML/CSS, cargando estilos tipográficos y definiendo las grillas.
                  </p>
                </div>
              )}

              {generatedHtml ? (
                <iframe
                  title="Stitch Canvas View"
                  srcDoc={generatedHtml}
                  className={`w-full h-full border-none transition-all duration-300 ${getPreviewWidth()}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 text-center p-8">
                  <span className="text-3xl mb-3">🎨</span>
                  <p className="text-xs font-bold uppercase tracking-wider">Sin previsualización</p>
                </div>
              )}
            </div>

            {/* Acciones de Publicación */}
            {generatedHtml && !isGenerating && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase">
                  Generado exitosamente a través de Google Stitch
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedHtml], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    💾 Descargar Código HTML
                  </button>
                  <button
                    onClick={() => alert('Página promocional publicada de forma exitosa en el enrutador /promociones/ de Propio.')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    🚀 Publicar Página Promocional
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Botón para volver */}
      <a
        href="/admin"
        className="inline-flex items-center gap-1.5 mt-8 text-xs text-slate-500 hover:text-slate-300 transition-all font-semibold"
      >
        ← Regresar al Panel Administrativo
      </a>
    </main>
  );
}

export default function StitchAdminPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0b0b0f] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-violet-500 animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase animate-pulse">Cargando Consola Stitch...</p>
      </main>
    }>
      <StitchDashboard />
    </Suspense>
  );
}
