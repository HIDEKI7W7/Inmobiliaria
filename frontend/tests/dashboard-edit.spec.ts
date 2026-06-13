import { test, expect } from './fixtures';

test.describe('Propio E2E - Edición de Propiedad en Dashboard', () => {

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

    // 3. Ir al dashboard
    await page.goto('/propietario/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Debería abrir el modal de edición, modificar campos y reflejar los cambios en el dashboard', async ({ page }) => {
    // 1. Asegurar que las propiedades se listan
    await expect(page.locator('text=Mis Propiedades Publicadas')).toBeVisible();
    
    // Obtener la primera tarjeta de propiedad
    const firstCard = page.locator('div.bg-white.rounded-2xl.border.overflow-hidden').first();
    await expect(firstCard).toBeVisible();

    // Guardar el título anterior para asegurar que cambia
    const oldTitle = await firstCard.locator('h3').textContent();

    // 2. Hacer clic en "Editar Anuncio"
    const editBtn = firstCard.locator('button:has-text("Editar Anuncio")');
    await editBtn.click();

    // 3. Verificar que se abre el modal
    await expect(page.locator('text=Editar Anuncio Activo')).toBeVisible();

    // 4. Modificar el título comercial
    const newTitle = `Inmueble Editado - ${Date.now()}`;
    await page.fill('label:has-text("Título Comercial") + input', newTitle);

    // 5. Modificar el precio en Bolivianos y verificar conversión automática
    await page.fill('label:has-text("Precio (Bs.)") + input', '950000');
    
    // Verificar que el campo USD se actualizó
    const usdInput = page.locator('label:has-text("Precio (USD)") + input');
    const usdValue = await usdInput.inputValue();
    expect(parseFloat(usdValue)).toBeCloseTo(950000 / 6.96, 1);

    // 6. Cambiar zona
    await page.fill('label:has-text("Zona / Barrio") + input', 'Zona Norte Muyurina');

    // 7. Modificar atributos de valor (Marcar Sauna)
    await page.click('button:has-text("Sauna")');

    // 8. Guardar Cambios
    await page.click('button:has-text("Guardar Cambios")');

    // 9. Verificar que el modal se cerró y los cambios se muestran en la tarjeta del dashboard
    await expect(page.locator('text=Editar Anuncio Activo')).not.toBeVisible();
    
    // Comprobar título actualizado
    await expect(firstCard.locator('h3')).toHaveText(newTitle);

    // Comprobar precio actualizado en Bolivianos
    await expect(firstCard.locator('text=950.000 Bs.')).toBeVisible();
  });
});
