import { test, expect } from '@playwright/test';

test.describe('Propio E2E - Autenticación y Proxy BFF', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de login del sistema antes de cada prueba
    await page.goto('/login');
  });

  test('Debería cargar la interfaz de login con todos sus elementos principales y demo buttons', async ({ page }) => {
    // Comprobar la presencia del logotipo premium de Propio
    await expect(page.locator('text=Propio.')).toBeVisible();
    await expect(page.locator('text=Ingresa a tu cuenta')).toBeVisible();
    
    // Verificar campos requeridos del formulario
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verificar botones de acceso rápido de demostración
    await expect(page.locator('button:has-text("Admin")')).toBeVisible();
    await expect(page.locator('button:has-text("Agente")')).toBeVisible();
    await expect(page.locator('button:has-text("Propietario")')).toBeVisible();
    await expect(page.locator('button:has-text("Cliente")')).toBeVisible();
  });

  test('Debería iniciar sesión como AGENTE, inyectar cookie HTTP-Only segura y redirigir al Kanban', async ({ page, context }) => {
    // 1. Completar credenciales automáticas
    await page.fill('#email', 'agent@propio.com.bo');
    await page.fill('#password', 'agent123');

    // 2. Enviar formulario y esperar la navegación controlada por la redirección de roles
    // El envío POST impacta en el proxy BFF (/api/auth/login) que inyecta la cookie httpOnly
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // 3. Comprobar la redirección exitosa. El agente debe ser llevado al embudo Kanban de leads.
    const currentUrl = page.url();
    expect(currentUrl).toContain('/agente/kanban'); 

    // 4. Extraer y verificar la cookie de sesión "propio_token" inyectada por el BFF.
    // Al ser una cookie HTTP-Only no es accesible mediante JavaScript del navegador (document.cookie)
    // por seguridad contra ataques XSS, pero el contexto de Playwright puede auditarla con éxito.
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'propio_token');
    
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).not.toBeNull();
    expect(sessionCookie?.path).toBe('/');
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('Strict');
  });

  test('Debería iniciar sesión como CLIENTE y redirigir a su área de búsquedas y ofertas', async ({ page }) => {
    // 1. Completar credenciales automáticas
    await page.fill('#email', 'client@propio.com.bo');
    await page.fill('#password', 'client123');

    // 2. Iniciar sesión
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // 3. Verificar redirección a la zona del cliente
    expect(page.url()).toContain('/cliente');
  });

  test('Debería iniciar sesión como PROPIETARIO y redirigir a su panel de gestión', async ({ page }) => {
    // 1. Completar credenciales automáticas
    await page.fill('#email', 'owner@propio.com.bo');
    await page.fill('#password', 'owner123');

    // 2. Iniciar sesión
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // 3. Verificar redirección a su panel
    expect(page.url()).toContain('/propietario/dashboard');
  });
});
