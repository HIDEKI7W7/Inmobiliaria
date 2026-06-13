import { test, expect } from './fixtures';

test.describe('Propio E2E - Asistente de Publicación (Wizard)', () => {

  test.beforeEach(async ({ page, context }) => {
    // 1. Limpiar cookies y localStorage
    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');

    // 2. Iniciar sesión como Propietario
    await page.fill('#email', 'owner@propio.com.bo');
    await page.fill('#password', 'owner123');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // 3. Navegar al Wizard
    await page.goto('/propietario/publicar');
    await page.waitForLoadState('networkidle');
  });

  test('Debería completar el wizard de 4 pasos con conversión de divisa, áreas separadas y validación legal', async ({ page }) => {
    // === PASO 1: DATOS BÁSICOS ===
    // Verificar título comercial
    await page.fill('input[placeholder="Ej. Departamento de lujo con acabados importados"]', 'Finca Campestre Premium en Muyurina');

    // Cambiar moneda a USD y configurar tipo de cambio
    await page.selectOption('select:has-text("Bolivianos")', 'USD');
    
    // El input de tipo de cambio debería estar visible
    const rateInput = page.locator('input[placeholder="Ej. 6.96"]');
    await expect(rateInput).toBeVisible();
    await rateInput.fill('7.00');

    // Llenar precio en USD
    await page.fill('input[placeholder="Ej. 100000"]', '150000');

    // Verificar el equivalente calculado en Bolivianos (150,000 * 7 = 1,050,000)
    const eqInput = page.locator('input[readonly]');
    await expect(eqInput).toHaveValue(/1.050.000/);

    // Llenar áreas separadas
    await page.fill('input[placeholder="Ej. 300"]', '1000'); // Terreno
    await page.fill('input[placeholder="Ej. 180"]', '250');  // Construida

    // Llenar habitaciones
    await page.fill('label:has-text("Dormitorios") + input', '5');
    await page.fill('label:has-text("Baños") + input', '4');

    // Llenar descripción
    await page.fill('textarea[placeholder*="Agrega comodidades"]', 'Hermosa finca de campo con frutales, piscina privada y churrasquera. Ubicación espectacular y clima cálido.');

    // Seleccionar atributos de alto valor
    await page.click('button:has-text("Jardín")');
    await page.click('button:has-text("Churrasquera/Parrillero")');
    await page.click('button:has-text("Piscina Privada")');
    await page.click('button:has-text("Seguridad 24/7")');

    // Avanzar al Paso 2
    await page.click('button[type="submit"]');

    // === PASO 2: UBICACIÓN ===
    await expect(page.locator('text=Ubicación y Geolocalización')).toBeVisible();

    // Seleccionar Ciudad/Departamento
    await page.selectOption('select:has-text("Cochabamba")', 'Santa Cruz');

    // Zona/Barrio y Dirección
    await page.fill('input[placeholder="Ej. Queru Queru"]', 'Muyurina');
    await page.fill('input[placeholder="Ej. Calle Aniceto Padilla #456"]', 'Km 5 Doble Vía a Cotoca');

    // Avanzar al Paso 3
    await page.click('button[type="submit"]');

    // === PASO 3: VALIDACIÓN LEGAL ===
    await expect(page.locator('text=Checklist de Validación Legal')).toBeVisible();

    // Como es Venta (por defecto), debemos marcar todos los documentos para tener Sello Oro
    await page.click('text=Folio Real Actualizado');
    await page.click('text=Certificado Catastral Al Día');
    await page.click('text=Testimonio de Escritura Pública');
    await page.click('text=Impuestos Municipales Al Día');
    await page.click('text=Plano de Uso de Suelo Aprobado');

    // Avanzar al Paso 4
    await page.click('button[type="submit"]');

    // === PASO 4: FOTOS Y SUBMIT ===
    await expect(page.locator('text=Subir fotografías').first()).toBeVisible();


    // Verificar que la carpeta legal está completa y sale el mensaje de éxito preliminar
    await expect(page.locator('text=¡Carpeta Legal Completa!')).toBeVisible();

    // Hacer click en Finalizar publicación
    await page.click('button[type="submit"]');


    // === VERIFICACIÓN DE ÉXITO ===
    await expect(page.locator('text=¡Propiedad Recibida con Éxito!')).toBeVisible();
    await expect(page.locator('text=Sello Oro: Aprobado Preliminar')).toBeVisible();

    // El enlace al panel de propietario de producción de Vercel debe estar configurado
    const panelLink = page.locator('text=Ir a mi Panel de Propietario');
    await expect(panelLink).toHaveAttribute('href', 'https://frontend-olzedn7qe-hidekiiiii.vercel.app/propietario/dashboard');
  });
});
