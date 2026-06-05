import { test, expect } from './fixtures';

test.describe('Propio E2E - Kanban Leads CRM y Animaciones Táctiles', () => {

  test.beforeEach(async ({ page, context }) => {
    // Limpiar cookies de la sesión
    await context.clearCookies();
    // Navegar a la página de login
    await page.goto('/login');
    // Limpiar local storage y session storage del navegador
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    // Recargar la página para iniciar en un estado completamente desautenticado
    await page.goto('/login');

    // 1. Iniciar sesión como Agente a través de la interfaz web
    await page.fill('#email', 'agent@propio.com.bo');
    await page.fill('#password', 'agent123');
    
    // Hacer submit y esperar navegación a la zona restringida
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    
    // 2. Verificar que se muestra la interfaz del CRM del Agente
    await expect(page.locator('text=El Radar de Cierre')).toBeVisible();
  });

  test('Debería renderizar las 6 columnas del embudo maestro de conversión con sus estadísticas', async ({ page }) => {
    const stages = [
      'Nuevos',
      'Contactados',
      'Visita Programada',
      'Negociación',
      'Reservados',
      'Cerrados'
    ];

    // Verificar que cada columna de etapa esté en pantalla
    for (const stageName of stages) {
      await expect(page.locator(`span.font-bold:has-text("${stageName}")`)).toBeVisible();
    }

    // Verificar widgets de analítica comercial en el CRM
    await expect(page.getByText('Prospectos', { exact: true })).toBeVisible();
    await expect(page.getByText('Reservas', { exact: true })).toBeVisible();
    await expect(page.getByText('Ventas', { exact: true })).toBeVisible();
  });

  test('Debería soportar interacciones de avanzar y regresar etapa con los controles integrados', async ({ page }) => {
    // 1. Ubicar la tarjeta del primer lead ("María Quispe")
    const leadCard = page.locator('div[draggable="true"]:has-text("María Quispe")');
    await expect(leadCard).toBeVisible();

    // 2. Avanzar el prospecto a la etapa "Contactados" haciendo clic en el control
    const avanzarBtn = leadCard.locator('button:has-text("Avanzar")');
    await avanzarBtn.click();

    // 3. Comprobar la recolocación en la columna "Contactados"
    const targetColumn = page.locator('div.w-80:has(span.font-bold:has-text("Contactados"))');
    await expect(targetColumn.locator('text=María Quispe')).toBeVisible();

    // 4. Regresar el prospecto a la etapa original "Nuevos"
    const regresarBtn = leadCard.locator('button:has-text("◀")');
    await regresarBtn.click();

    // 5. Confirmar que regresó con éxito
    const sourceColumn = page.locator('div.w-80:has(span.font-bold:has-text("Nuevos"))');
    await expect(sourceColumn.locator('text=María Quispe')).toBeVisible();
  });

  test('Debería realizar una interacción de arrastre (drag-and-drop) nativa entre columnas', async ({ page }) => {
    // 1. Seleccionar la tarjeta de origen y la columna de destino
    const sourceCard = page.locator('div[draggable="true"]:has-text("María Quispe")');
    const targetColumn = page.locator('div.w-80:has(span.font-bold:has-text("Contactados"))').locator('div.space-y-4');

    // 2. Ejecutar la acción nativa de drag-and-drop de Playwright
    await sourceCard.dragTo(targetColumn);

    // 3. Verificar la presencia física de la tarjeta en el contenedor destino
    await expect(targetColumn.locator('text=María Quispe')).toBeVisible();
  });
});
