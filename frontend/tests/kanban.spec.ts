import { test, expect } from '@playwright/test';

test.describe('Propio E2E - Kanban Leads CRM y Animaciones Táctiles', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Iniciar sesión como Agente a través de la interfaz web
    await page.goto('/login');
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
      'Lead Entrante',
      'Cita Agendada',
      'Visita Realizada',
      'Oferta / Negoc.',
      'Reserva',
      'Cierre / Liquid.'
    ];

    // Verificar que cada columna de etapa esté en pantalla
    for (const stageName of stages) {
      await expect(page.locator(`span.font-heading:has-text("${stageName}")`)).toBeVisible();
    }

    // Verificar widgets de analítica comercial en el CRM
    await expect(page.locator('text=Total Cartera')).toBeVisible();
    await expect(page.locator('text=Reservados')).toBeVisible();
    await expect(page.locator('text=Cerrados')).toBeVisible();
  });

  test('Debería soportar interacciones táctiles de avanzar y regresar etapa con los controles integrados', async ({ page }) => {
    // 1. Ubicar la tarjeta del primer lead ("Alejandro Camacho")
    const leadCard = page.locator('[data-testid="lead-card-lead-1"]');
    await expect(leadCard).toBeVisible();
    await expect(leadCard.locator('text=Alejandro Camacho')).toBeVisible();

    // 2. Avanzar el prospecto a la etapa "Cita Agendada" haciendo clic en el control
    const avanzarBtn = leadCard.locator('button:has-text("Avanzar ▶")');
    await avanzarBtn.click();

    // 3. Confirmar la aparición del Toast de éxito y comprobar la recolocación en la columna
    await expect(page.locator('text=Prospecto movido con éxito')).toBeVisible();
    const targetColumn = page.locator('[data-stage="CITA_AGENDADA"]');
    await expect(targetColumn.locator('[data-testid="lead-card-lead-1"]')).toBeVisible();

    // 4. Regresar el prospecto a la etapa original "Lead Entrante"
    const regresarBtn = leadCard.locator('button:has-text("◀ Regresar")');
    await regresarBtn.click();

    // 5. Confirmar que regresó con éxito
    await expect(page.locator('text=Prospecto movido con éxito')).toBeVisible();
    const sourceColumn = page.locator('[data-stage="LEAD_ENTRANTE"]');
    await expect(sourceColumn.locator('[data-testid="lead-card-lead-1"]')).toBeVisible();
  });

  test('Debería realizar una interacción de arrastre (drag-and-drop) nativa entre columnas', async ({ page }) => {
    // 1. Seleccionar la tarjeta de origen y la columna de destino
    const sourceCard = page.locator('[data-testid="lead-card-lead-1"]');
    const targetColumn = page.locator('[data-stage="CITA_AGENDADA"]');

    // 2. Ejecutar la acción nativa de drag-and-drop de Playwright
    await sourceCard.dragTo(targetColumn);

    // 3. Comprobar que el estado reactivo actualizó el backend mock y lanzó el Toast
    await expect(page.locator('text=Prospecto movido con éxito a la etapa: Cita Agendada')).toBeVisible();

    // 4. Verificar la presencia física de la tarjeta en el contenedor destino
    await expect(targetColumn.locator('[data-testid="lead-card-lead-1"]')).toBeVisible();
  });

  test('Debería activar la animación del Blackout Automático al arrastrar un Lead a RESERVA', async ({ page }) => {
    // 1. Seleccionar la tarjeta del lead "Alejandro Camacho"
    const sourceCard = page.locator('[data-testid="lead-card-lead-1"]');
    
    // 2. Seleccionar la columna de RESERVA
    const targetColumn = page.locator('[data-stage="RESERVA"]');

    // 3. Arrastrar el lead directamente a RESERVA para desencadenar el bloqueo simultáneo
    await sourceCard.dragTo(targetColumn);

    // 4. Validar el disparo de la animación de bloqueo de catálogo en tiempo real (Blackout Modal)
    await expect(page.locator('text=¡Blackout Comercial Activado!')).toBeVisible();
    await expect(page.locator('text=Inmueble Bloqueado Simultáneamente')).toBeVisible();
    await expect(page.locator('text="Penthouse de Lujo en Queru Queru"')).toBeVisible();

    // 5. Interactuar con el botón del modal para continuar con la gestión del CRM
    const dismissButton = page.locator('button:has-text("Entendido, Continuar CRM")');
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();

    // 6. Confirmar que el overlay animado se oculta correctamente
    await expect(page.locator('text=¡Blackout Comercial Activado!')).not.toBeVisible();

    // 7. Confirmar que la tarjeta muestra visualmente el indicador de bloqueo "🔒 RESERVADA (Blackout)"
    const activeLeadCard = page.locator('[data-testid="lead-card-lead-1"]');
    await expect(activeLeadCard.locator('text=🔒 RESERVADA (Blackout)')).toBeVisible();
  });
});
