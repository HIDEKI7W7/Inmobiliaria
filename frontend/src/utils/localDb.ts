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

// ── GENERIC DB PERSISTENCE (PHYSICAL DISK WRITE FALLBACK) ───────────────────

/** Fetches the entire db.json file contents from local API. */
export async function fetchLocalDb(): Promise<any> {
  const data = await apiFetch<any>(`${BASE}/db`);
  return data || {};
}

/** Updates a specific key array in db.json. */
export async function saveLocalDb(key: string, data: any[]): Promise<void> {
  await apiFetch(`${BASE}/db`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: data }),
  });
}

// ── CONSTRUCTORAS / DEVELOPERS ───────────────────────────────────────────────

/** Carga las constructoras locales persistidas en db.json. */
export async function fetchLocalDevelopers(): Promise<any[]> {
  const db = await fetchLocalDb();
  return Array.isArray(db.developers) ? db.developers : [];
}

/** Guarda una constructora local en db.json. */
export async function persistLocalDeveloper(dev: any): Promise<void> {
  try {
    const devs = await fetchLocalDevelopers();
    const filtered = devs.filter((d: any) => d.id !== dev.id);
    filtered.unshift(dev);
    await saveLocalDb('developers', filtered);
    console.info('[localDb] Constructora local persistida en db.json:', dev.id);
  } catch (e) {
    console.error('[localDb] Error persistiendo local developer:', e);
  }
}

/** Borra una constructora local de db.json. */
export async function deleteLocalDeveloper(id: string): Promise<void> {
  try {
    const devs = await fetchLocalDevelopers();
    const filtered = devs.filter((d: any) => d.id !== id);
    await saveLocalDb('developers', filtered);
    console.info('[localDb] Constructora local eliminada de db.json:', id);
  } catch (e) {
    console.error('[localDb] Error eliminando local developer:', e);
  }
}

// ── AGENTES / AGENTS ─────────────────────────────────────────────────────────

/** Carga los agentes locales de db.json. */
export async function fetchLocalAgents(): Promise<any[]> {
  const db = await fetchLocalDb();
  return Array.isArray(db.agents) ? db.agents : [];
}

/** Guarda un agente local en db.json. */
export async function persistLocalAgent(agent: any): Promise<void> {
  try {
    const agents = await fetchLocalAgents();
    const filtered = agents.filter((a: any) => a.id !== agent.id);
    filtered.unshift(agent);
    await saveLocalDb('agents', filtered);
    console.info('[localDb] Agente persistido en db.json:', agent.id);
  } catch (e) {
    console.error('[localDb] Error persistiendo local agent:', e);
  }
}

/** Borra un agente local de db.json. */
export async function deleteLocalAgent(id: string): Promise<void> {
  try {
    const agents = await fetchLocalAgents();
    const filtered = agents.filter((a: any) => a.id !== id);
    await saveLocalDb('agents', filtered);
    console.info('[localDb] Agente eliminado de db.json:', id);
  } catch (e) {
    console.error('[localDb] Error eliminando local agent:', e);
  }
}

// ── PROSPECTOS / LEADS ───────────────────────────────────────────────────────

/** Carga los prospectos locales de db.json. */
export async function fetchLocalLeads(): Promise<any[]> {
  const db = await fetchLocalDb();
  return Array.isArray(db.leads) ? db.leads : [];
}

/** Guarda un prospecto local en db.json. */
export async function persistLocalLead(lead: any): Promise<void> {
  try {
    const leads = await fetchLocalLeads();
    const filtered = leads.filter((l: any) => l.id !== lead.id);
    filtered.unshift(lead);
    await saveLocalDb('leads', filtered);
    console.info('[localDb] Lead persistido en db.json:', lead.id);
  } catch (e) {
    console.error('[localDb] Error persistiendo local lead:', e);
  }
}

/** Borra un prospecto local de db.json. */
export async function deleteLocalLead(id: string): Promise<void> {
  try {
    const leads = await fetchLocalLeads();
    const filtered = leads.filter((l: any) => l.id !== id);
    await saveLocalDb('leads', filtered);
    console.info('[localDb] Lead eliminado de db.json:', id);
  } catch (e) {
    console.error('[localDb] Error eliminando local lead:', e);
  }
}

// ── PROPIETARIOS / OWNERS ────────────────────────────────────────────────────

/** Carga los propietarios locales de db.json. */
export async function fetchLocalOwners(): Promise<any[]> {
  const db = await fetchLocalDb();
  return Array.isArray(db.owners) ? db.owners : [];
}

/** Guarda un propietario local en db.json. */
export async function persistLocalOwner(owner: any): Promise<void> {
  try {
    const owners = await fetchLocalOwners();
    const filtered = owners.filter((o: any) => o.id !== owner.id);
    filtered.unshift(owner);
    await saveLocalDb('owners', filtered);
    console.info('[localDb] Propietario persistido en db.json:', owner.id);
  } catch (e) {
    console.error('[localDb] Error persistiendo local owner:', e);
  }
}

/** Borra un propietario local de db.json. */
export async function deleteLocalOwner(id: string): Promise<void> {
  try {
    const owners = await fetchLocalOwners();
    const filtered = owners.filter((o: any) => o.id !== id);
    await saveLocalDb('owners', filtered);
    console.info('[localDb] Propietario eliminado de db.json:', id);
  } catch (e) {
    console.error('[localDb] Error eliminando local owner:', e);
  }
}

// ── INGRESOS / PAYMENTS ──────────────────────────────────────────────────────

/** Carga los pagos locales de db.json. */
export async function fetchLocalPayments(): Promise<any[]> {
  const db = await fetchLocalDb();
  return Array.isArray(db.payments) ? db.payments : [];
}

/** Guarda un pago local en db.json. */
export async function persistLocalPayment(payment: any): Promise<void> {
  try {
    const payments = await fetchLocalPayments();
    const filtered = payments.filter((p: any) => p.id !== payment.id);
    filtered.unshift(payment);
    await saveLocalDb('payments', filtered);
    console.info('[localDb] Pago persistido en db.json:', payment.id);
  } catch (e) {
    console.error('[localDb] Error persistiendo local payment:', e);
  }
}

/** Borra un pago local de db.json. */
export async function deleteLocalPayment(id: string): Promise<void> {
  try {
    const payments = await fetchLocalPayments();
    const filtered = payments.filter((p: any) => p.id !== id);
    await saveLocalDb('payments', filtered);
    console.info('[localDb] Pago eliminado de db.json:', id);
  } catch (e) {
    console.error('[localDb] Error eliminando local payment:', e);
  }
}

// ── GASTOS / EXPENSES ────────────────────────────────────────────────────────

/** Carga los gastos locales de db.json. */
export async function fetchLocalExpenses(): Promise<any[]> {
  const db = await fetchLocalDb();
  return Array.isArray(db.expenses) ? db.expenses : [];
}

/** Guarda un gasto local en db.json. */
export async function persistLocalExpense(expense: any): Promise<void> {
  try {
    const expenses = await fetchLocalExpenses();
    const filtered = expenses.filter((e: any) => e.id !== expense.id);
    filtered.unshift(expense);
    await saveLocalDb('expenses', filtered);
    console.info('[localDb] Gasto persistido en db.json:', expense.id);
  } catch (e) {
    console.error('[localDb] Error persistiendo local expense:', e);
  }
}

/** Borra un gasto local de db.json. */
export async function deleteLocalExpense(id: string): Promise<void> {
  try {
    const expenses = await fetchLocalExpenses();
    const filtered = expenses.filter((e: any) => e.id !== id);
    await saveLocalDb('expenses', filtered);
    console.info('[localDb] Gasto eliminado de db.json:', id);
  } catch (e) {
    console.error('[localDb] Error eliminando local expense:', e);
  }
}

