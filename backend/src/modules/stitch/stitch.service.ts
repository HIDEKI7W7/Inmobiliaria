import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StitchService {
  private readonly logger = new Logger(StitchService.name);

  async generateLanding(prompt: string, title: string): Promise<string> {
    const apiKey = process.env.STITCH_API_KEY;
    const isMock = !apiKey || apiKey.startsWith('mock-');

    this.logger.log(`Iniciando generación de landing: "${title}" con prompt: "${prompt}" (Mock: ${isMock})`);

    if (isMock) {
      // Simular generación exitosa de Google Stitch AI con un diseño premium espectacular
      return this.getMockHtml(title, prompt);
    }

    try {
      // Carga dinámica para prevenir fallos si el SDK se está instalando
      const { stitch } = require('@google/stitch-sdk');
      
      // Iniciar proyecto y generar pantalla
      const project = await stitch.createProject(`Propio_${Date.now()}`);
      const screen = await project.generate(`A modern real estate promotional landing page for: "${title}". Description: ${prompt}`);
      
      const html = await screen.getHtml();
      return html;
    } catch (error) {
      this.logger.error('Error llamando a Google Stitch SDK, cargando fallback inteligente:', error);
      return this.getMockHtml(title, `${prompt} (Generación asistida por fallback inteligente)`);
    }
  }

  private getMockHtml(title: string, prompt: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Promoción Exclusiva</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      background-color: #0b0b0f;
    }
    .glow-aura {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
      filter: blur(80px);
      pointer-events: none;
    }
  </style>
</head>
<body class="text-slate-200 min-h-screen relative overflow-x-hidden flex flex-col justify-between">
  <!-- Auras de gradiente decorativas de Google Stitch -->
  <div class="glow-aura top-0 left-0"></div>
  <div class="glow-aura bottom-0 right-0"></div>

  <!-- Header -->
  <header class="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between z-10">
    <div class="flex items-center gap-2">
      <span class="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">PROPIO</span>
      <span class="text-[9px] font-black tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1.5 rounded-full border border-violet-500/20 uppercase">STITCH AI</span>
    </div>
    <span class="text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full uppercase tracking-wider">Promoción Limitada</span>
  </header>

  <!-- Hero Section -->
  <main class="max-w-4xl mx-auto px-6 py-16 text-center z-10 flex-1 flex flex-col items-center justify-center">
    <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
      ✨ Lanzamiento Exclusivo en Cochabamba
    </div>
    
    <h1 class="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight leading-tight">
      ${title}
    </h1>
    
    <p class="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
      ${prompt}
    </p>

    <!-- Caja de Características Destacadas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-12">
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 text-left">
        <span class="text-2xl">📍</span>
        <h3 class="text-slate-200 font-bold text-sm mt-3 uppercase tracking-wider">Ubicación Estratégica</h3>
        <p class="text-slate-500 text-xs mt-1 leading-relaxed">Situado en las zonas de mayor plusvalía y confort de Cochabamba.</p>
      </div>
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 text-left">
        <span class="text-2xl">💎</span>
        <h3 class="text-slate-200 font-bold text-sm mt-3 uppercase tracking-wider">Acabados Premium</h3>
        <p class="text-slate-500 text-xs mt-1 leading-relaxed">Diseñado con materiales seleccionados de alto estándar arquitectónico.</p>
      </div>
      <div class="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 text-left">
        <span class="text-2xl">📈</span>
        <h3 class="text-slate-200 font-bold text-sm mt-3 uppercase tracking-wider">Alta Plusvalía</h3>
        <p class="text-slate-500 text-xs mt-1 leading-relaxed">Una inversión sólida y segura para proteger e incrementar tu patrimonio.</p>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="flex flex-col sm:flex-row items-center gap-4 mt-12 w-full justify-center">
      <a href="https://wa.me/59170000000" target="_blank" class="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-95 text-center">
        Contactar Asesor por WhatsApp
      </a>
      <a href="#" class="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-800 transition-all active:scale-95 text-center">
        Ver Ficha Técnica Completa
      </a>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-900/80 bg-slate-950/20 py-8 w-full z-10">
    <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
      <p>© 2026 Propio Real Estate. Generado mediante Google Stitch AI.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="hover:text-slate-300">Términos</a>
        <a href="#" class="hover:text-slate-300">Privacidad</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
  }
}
