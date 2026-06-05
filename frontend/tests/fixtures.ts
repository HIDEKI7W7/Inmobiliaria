import { test as base, chromium, expect, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';

// Directorio base persistente en el disco local para almacenar perfiles de usuario, cookies y cache.
// Usamos el índice de worker de Playwright para evitar conflictos de bloqueo de archivos al ejecutar en paralelo.
const WORKER_INDEX = process.env.TEST_WORKER_INDEX || '0';
const USER_DATA_DIR = path.join(process.cwd(), '.playwright-user-data', `profile-worker-${WORKER_INDEX}`);

// Extendemos los fixtures base de Playwright para inyectar la configuración automatizada autónoma
export const test = base.extend<{
  context: BrowserContext;
  page: Page;
}>({
  // 1 y 3. Configuración de perfiles persistentes, supresión de alertas y auto-aprobación de permisos
  context: async ({ browserName, browser }, use) => {
    if (browserName === 'chromium') {
      // Lanzamos un contexto de navegación persistente en disco
      const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: true, // Ejecución autónoma y silenciosa
        args: [
          '--disable-infobars',             // Oculta barras de información (Chrome is being controlled...)
          '--no-sandbox',                    // Deshabilita el entorno de pruebas para entornos CI/headless
          '--disable-setuid-sandbox',
          '--disable-popup-blocking',        // Deshabilita el bloqueo de ventanas emergentes
          '--disable-notifications',         // Deshabilita solicitudes de notificación HTML5
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        // Auto-aprobación nativa de permisos desde el arranque
        permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
        geolocation: { latitude: -17.3680, longitude: -66.1590 }, // Ubicación Cala Cala, Cochabamba, Bolivia
        viewport: { width: 1280, height: 720 },
      });

      await use(context);
      await context.close();
    } else {
      // Fallback para otros navegadores si se especifican
      const context = await browser.newContext();
      await use(context);
    }
  },

  // 2. Interceptación silenciosa de diálogos y confirmaciones en tiempo de ejecución
  page: async ({ context }, use) => {
    const page = await context.newPage();

    // Registrar interceptor de diálogos globales (alert, confirm, prompt, beforeunload)
    page.on('dialog', async (dialog) => {
      console.log(`[AUTOMATIZACIÓN SILENCIOSA] Diálogo detectado: [${dialog.type().toUpperCase()}] - "${dialog.message()}"`);
      
      // Auto-aceptar diálogos respondiendo afirmativamente sin bloquear el hilo principal
      await dialog.accept();
    });

    await use(page);
  },
});

export { expect };
