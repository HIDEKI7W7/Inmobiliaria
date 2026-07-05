/**
 * localDb.ts — Helper cliente para la API de persistencia local (db.json)
 *
 * Todas las llamadas a /api/local/* pasan por aquí.
 * Blindaje: valida response.ok + Content-Type antes de parsear JSON.
 * Jamás lanza "Unexpected token < ... is not valid JSON".
 */

const BASE = '/api/local';

/** Parsea la respuesta solo si es JSON válido. */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '(unreadable)');
    console.warn(`[localDb] Respuesta no-JSON (${res.status}) — probablemente la API route aún no compiló:`, text.slice(0, 200));
    return null;
  }
  return res.json() as Promise<T>;
}

/** Fetch genérico con guard de errores completo. */
async function apiFetch<T = any>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    // ponytail: force-bypass Windows browser cache on every request
    const res = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache', ...(init?.headers as object) },
      ...init,
    } as any);
    if (!res.ok) {
      const body = await safeJson(res);
      console.warn(`[localDb] ${init?.method || 'GET'} ${url} → ${res.status}`, body);
      return null;
    }
    return safeJson<T>(res);
  } catch (err) {
    console.warn(`[localDb] fetch error en ${url}:`, err);
    return null;
  }
}

// ── PROPIEDADES ──────────────────────────────────────────────────────────────

/** Carga todas las propiedades persistidas desde db.json. Retorna [] en caso de error. */
export async function fetchLocalProperties(): Promise<any[]> {
  const data = await apiFetch<{ properties: any[] }>(`${BASE}/properties`);
  return data?.properties ?? [];
}

/** Persiste una propiedad en db.json. Fire-and-forget seguro. */
export async function persistProperty(prop: object): Promise<void> {
  const result = await apiFetch(`${BASE}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prop),
  });
  if (result?.ok) {
    console.info('[localDb] Propiedad persistida en db.json:', (prop as any).id);
  }
}

/** Borra permanentemente una propiedad de db.json. */
export async function deleteLocalProperty(id: string): Promise<void> {
  const result = await apiFetch(`${BASE}/properties/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (result?.ok) {
    console.info('[localDb] Propiedad eliminada de db.json:', id);
  }
}

// ── CONTRATOS ────────────────────────────────────────────────────────────────

/** Carga todos los contratos persistidos desde db.json. Retorna [] en caso de error. */
export async function fetchLocalContracts(): Promise<any[]> {
  const data = await apiFetch<{ contracts: any[] }>(`${BASE}/contracts`);
  return data?.contracts ?? [];
}

/** Persiste un contrato en db.json. Fire-and-forget seguro. */
export async function persistContract(contract: object): Promise<void> {
  const result = await apiFetch(`${BASE}/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contract),
  });
  if (result?.ok) {
    console.info('[localDb] Contrato persistido en db.json:', (contract as any).id);
  }
}

/** Borra permanentemente un contrato de db.json. */
export async function deleteLocalContract(id: string): Promise<void> {
  const result = await apiFetch(`${BASE}/contracts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (result?.ok) {
    console.info('[localDb] Contrato eliminado de db.json:', id);
  }
}

// ── MARKETING PLANS ──────────────────────────────────────────────────────────

/** Carga todos los planes de marketing persistidos desde db.json. */
export async function fetchLocalMarketingPlans(): Promise<any[]> {
  const data = await apiFetch<{ plans: any[] }>(`${BASE}/marketing-plans`);
  return data?.plans ?? [];
}

/** Persiste el precio de un plan de marketing en db.json. */
export async function persistLocalMarketingPlan(id: string, price: string): Promise<void> {
  const result = await apiFetch(`${BASE}/marketing-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, price }),
  });
  if (result?.ok) {
    console.info('[localDb] Plan de marketing persistido en db.json:', id, price);
  }
}
