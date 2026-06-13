import { test, expect } from './fixtures';

// ─────────────────────────────────────────────────────────────────────────────
// Suite: Autenticación y Proxy BFF
// Tag: @auth-flow  (ejecutar con: npx playwright test --grep @auth-flow)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('@auth-flow Propio E2E — Autenticación y Proxy BFF', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
  });

  // ── UI básica ──────────────────────────────────────────────────────────────

  test('@auth-flow [UI] Debería cargar el login con todos sus elementos principales y demo buttons', async ({ page }) => {
    await expect(page.locator('text=Propio.')).toBeVisible();
    await expect(page.locator('text=Ingresa a tu cuenta')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Demo quick-access buttons
    await expect(page.locator('button:has-text("Admin")')).toBeVisible();
    await expect(page.locator('button:has-text("Agente")')).toBeVisible();
    await expect(page.locator('button:has-text("Propietario")')).toBeVisible();
    await expect(page.locator('button:has-text("Cliente")')).toBeVisible();
  });

  // ── OAuth social buttons ────────────────────────────────────────────────────

  test('@auth-flow [UI] Debería mostrar los botones de acceso social (Google, Apple, Facebook)', async ({ page }) => {
    // Los tres botones de OAuth deben estar presentes y ser clicables
    const googleBtn = page.locator('a[title="Google"]');
    const appleBtn  = page.locator('a[title="Apple"]');
    const fbBtn     = page.locator('a[title="Facebook"]');

    await expect(googleBtn).toBeVisible();
    await expect(appleBtn).toBeVisible();
    await expect(fbBtn).toBeVisible();

    // Verificar que apuntan al backend real (no al simulador)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    await expect(googleBtn).toHaveAttribute('href', `${baseUrl}/auth/google`);
    await expect(appleBtn).toHaveAttribute('href',  `${baseUrl}/auth/apple`);
    await expect(fbBtn).toHaveAttribute('href',     `${baseUrl}/auth/facebook`);
  });

  test('@auth-flow [SECURITY] El botón de Google NO debe apuntar al simulador /auth/social-simulator', async ({ page }) => {
    const googleBtn = page.locator('a[title="Google"]');
    const href = await googleBtn.getAttribute('href');
    expect(href).not.toContain('social-simulator');
    expect(href).not.toContain('social-mock');
  });

  test('@auth-flow [SECURITY] La ruta /auth/social-simulator NO debe servir el simulador antiguo', async ({ page }) => {
    await page.goto('/auth/social-simulator');
    // Wait for full client-side hydration
    await page.waitForLoadState('networkidle');
    // Also wait a moment for any useEffect redirects to fire
    await page.waitForTimeout(1000);

    const finalUrl = page.url();

    // Scenario A: Page rendered the deprecation notice
    const isDeprecationVisible = await page
      .locator('h1:has-text("Simulador Desactivado")')
      .isVisible()
      .catch(() => false);

    // Scenario B: Middleware or useEffect redirected away from the simulator route
    const isRedirectedAway = !finalUrl.includes('/auth/social-simulator');

    // Either is a valid passing state — the simulator is gone
    expect(isDeprecationVisible || isRedirectedAway).toBe(true);

    // Critical: old simulator form MUST NOT be visible under any circumstance
    await expect(page.locator('text=Continuar con Google Simulador')).not.toBeVisible();
    await expect(page.locator('text=Continuar con Facebook Simulador')).not.toBeVisible();
  });

  // ── Flujos de login por rol ─────────────────────────────────────────────────

  test('@auth-flow [LOGIN] Debería iniciar sesión como AGENTE, inyectar cookie HTTP-Only y redirigir al Kanban', async ({ page, context }) => {
    await page.fill('#email', 'agent@propio.com.bo');
    await page.fill('#password', 'agent123');

    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    expect(page.url()).toContain('/agente/kanban');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'propio_token');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).not.toBeNull();
    expect(sessionCookie?.path).toBe('/');
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('Strict');
  });

  test('@auth-flow [LOGIN] Debería iniciar sesión como CLIENTE y redirigir a su área', async ({ page }) => {
    await page.fill('#email', 'client@propio.com.bo');
    await page.fill('#password', 'client123');

    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    expect(page.url()).toContain('/cliente');
  });

  test('@auth-flow [LOGIN] Debería iniciar sesión como PROPIETARIO y redirigir a su panel', async ({ page }) => {
    await page.fill('#email', 'owner@propio.com.bo');
    await page.fill('#password', 'owner123');

    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    expect(page.url()).toContain('/propietario/dashboard');
  });

  // ── Registro con validaciones ───────────────────────────────────────────────

  test('@auth-flow [REGISTER] Debería registrar nuevo usuario con WhatsApp obligatorio y redirigir a Onboarding', async ({ page }) => {
    await page.click('button:has-text("Registrarse")');

    await page.fill('#name', 'Nuevo Propietario Test');
    await page.fill('#email', `test_register_${Date.now()}@test.com`);
    await page.fill('#password', 'register123');
    await page.click('button[type="submit"]');

    // Validación local: WhatsApp requerido
    await expect(page.locator('text=El número de WhatsApp es requerido')).toBeVisible();

    // WhatsApp demasiado corto
    await page.fill('#whatsappPhone', '123456');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Ingresa un número válido de al menos 7 dígitos')).toBeVisible();

    // Registro válido
    await page.fill('#whatsappPhone', '76543210');

    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    expect(page.url()).toContain('/onboarding');
  });

  // ── OAuth sin credenciales → Backend debe devolver 503 ────────────────────

  test('@auth-flow [OAUTH-GUARD] GET /api/auth/google debe devolver 503 si no hay credenciales reales', async ({ request }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    // Las credenciales del .env de dev son placeholders → debe devolver 503
    const response = await request.get(`${apiBase}/auth/google`, { maxRedirects: 0 });
    // Puede ser 503 (ServiceUnavailable) o 302 si ya hay creds reales
    // Nunca debe ser 200 con HTML del simulador
    expect([302, 401, 503]).toContain(response.status());
  });
});
