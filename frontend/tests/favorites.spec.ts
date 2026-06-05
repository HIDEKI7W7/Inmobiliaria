import { test, expect } from './fixtures';

test.describe('Propio E2E - Persistencia de Favoritos al Refrescar', () => {

  test.beforeEach(async ({ page, context }) => {
    // Limpiar cookies de la sesión
    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
  });

  test('Debería persistir el estado de favorito (corazón rojo) al refrescar (F5)', async ({ page }) => {
    // 1. Iniciar sesión como cliente
    await page.fill('#email', 'client@propio.com.bo');
    await page.fill('#password', 'client123');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // 2. Navegar a la página de detalle de la propiedad
    await page.goto('/properties/prop-1-cala-cala');
    await page.waitForLoadState('networkidle');

    // 3. Localizar el botón del corazón
    const heartBtn = page.locator('button.absolute.top-4.right-4');
    await expect(heartBtn).toBeVisible();

    const heartSvg = heartBtn.locator('svg');
    
    // Verificamos el fill inicial. Si es rojo, hacemos un toggle para quitarlo, luego otro para ponerlo.
    let fill = await heartSvg.getAttribute('fill');
    if (fill === '#ef4444') {
      await heartBtn.click();
      await page.waitForTimeout(500);
    }

    // Ahora nos aseguramos de marcarlo como favorito
    await heartBtn.click();
    await page.waitForTimeout(500);

    // Debería tener el fill rojo (#ef4444)
    await expect(heartSvg).toHaveAttribute('fill', '#ef4444');

    // 4. Refrescar la página (F5)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Dar un momento para la hidratación y carga

    // 5. Verificar si el corazón sigue rojo
    const refreshedHeartSvg = page.locator('button.absolute.top-4.right-4 svg');
    await expect(refreshedHeartSvg).toHaveAttribute('fill', '#ef4444');
  });
});
