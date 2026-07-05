import { test, expect } from './fixtures';

test.describe('Propio E2E - Edición de Propiedad en Dashboard', () => {

  test.setTimeout(45000);

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
    await page.click('button[type="submit"]');
    // Esperar a que la URL cambie tras el login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    // 3. Ir al dashboard
    await page.goto('/propietario/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('Debería abrir el modal de edición, modificar campos y reflejar los cambios en el dashboard', async ({ page }) => {
    // 1. Asegurar que las propiedades se listan
    await expect(page.locator('text=Mis Propiedades Publicadas')).toBeVisible({ timeout: 15000 });
    
    // Obtener la primera tarjeta de propiedad
    const firstCard = page.locator('div.bg-white.rounded-2xl.border.overflow-hidden').first();
    await expect(firstCard).toBeVisible();

    // 2. Hacer clic en "Editar Anuncio"
    const editBtn = firstCard.locator('button:has-text("Editar Anuncio")');
    await editBtn.click();

    // 3. Verificar que se abre el modal
    await expect(page.locator('text=Editar Anuncio Activo')).toBeVisible({ timeout: 8000 });

    // 4. Modificar el título comercial (el label real es más largo)
    const newTitle = `Inmueble Editado - ${Date.now()}`;
    await page.locator('label:has-text("Título Comercial") + input').fill(newTitle);

    // Seleccionar moneda BOB para habilitar la edición de Precio (Bs.)
    const currencySelect = page.locator('label:has-text("Moneda") + select');
    if (await currencySelect.isVisible()) {
      await currencySelect.selectOption('BOB');
    }

    // 5. Modificar el precio en Bolivianos y verificar conversión automática
    await page.locator('label:has-text("Precio (Bs.)") + input').fill('950000');
    
    // Verificar que el campo USD se actualizó
    const usdInput = page.locator('label:has-text("Precio (USD)") + input');
    const usdValue = await usdInput.inputValue();

    // Obtener la tasa de cambio actual del input de tasa
    const rateInput = page.locator('input[readOnly][value*="Bs."]');
    let rate = 6.96;
    if (await rateInput.isVisible()) {
      const rateText = await rateInput.inputValue();
      rate = parseFloat(rateText) || 6.96;
    }
    
    expect(parseFloat(usdValue)).toBeCloseTo(950000 / rate, 1);

    // 6. Cambiar zona — es un <select>, no un <input>
    await page.locator('label:has-text("Zona / Barrio") + select').selectOption({ index: 0 });

    // 7. Modificar atributos de valor (Marcar Sauna)
    const saunaBtn = page.locator('button:has-text("Sauna")');
    if (await saunaBtn.count() > 0) {
      await saunaBtn.first().click();
    }

    // 8. Guardar Cambios
    await page.click('button:has-text("Guardar Cambios")');

    // 9. Verificar que el modal se cerró
    await expect(page.locator('text=Editar Anuncio Activo')).not.toBeVisible({ timeout: 8000 });
    
    // Comprobar título actualizado en la tarjeta
    await expect(firstCard.locator('h3')).toHaveText(newTitle, { timeout: 8000 });
  });
});
