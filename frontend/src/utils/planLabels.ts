/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PLAN LABELS — Centralized Plan Dictionary
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all 4 canonical marketing plan types.
 * Backend stores keys in snake_case, UI renders them as formal labels.
 *
 * Backend enum values: 'gratis' | 'contenidos' | 'venta_pro' | 'cierre_garantizado'
 * UI display labels:   'Gratis' | 'Contenidos' | 'Venta Pro' | 'Cierre Garantizado'
 */

export type PlanKey = 'gratis' | 'contenidos' | 'venta_pro' | 'cierre_garantizado';

/** Maps backend enum keys → formal UI display strings. */
export const PLAN_LABELS: Record<PlanKey, string> = {
  gratis: 'Gratis',
  contenidos: 'Contenidos',
  venta_pro: 'Venta Pro',
  cierre_garantizado: 'Cierre Garantizado',
};

/** Ordered list of all valid plan keys (no "all" option). */
export const PLAN_KEYS: PlanKey[] = ['gratis', 'contenidos', 'venta_pro', 'cierre_garantizado'];

/** Ordered UI labels for display in selects / dropdowns. */
export const PLAN_UI_LABELS: string[] = PLAN_KEYS.map((k) => PLAN_LABELS[k]);

/**
 * Converts any plan string (raw key OR legacy UI label) → canonical backend key.
 * Used before sending API calls to ensure strict enum compliance.
 * Examples: 'Venta Pro' → 'venta_pro', 'venta_pro' → 'venta_pro'
 */
export function toPlanKey(raw: string | null | undefined): PlanKey {
  if (!raw) return 'gratis';
  const normalized = raw.toLowerCase().trim().replace(/\s+/g, '_');
  if (PLAN_KEYS.includes(normalized as PlanKey)) return normalized as PlanKey;
  // Handle legacy UI labels passed directly (e.g. 'Venta Pro')
  const entry = Object.entries(PLAN_LABELS).find(
    ([, label]) => label.toLowerCase() === raw.toLowerCase().trim()
  );
  if (entry) return entry[0] as PlanKey;
  return 'gratis';
}

/**
 * Converts any plan string (raw key OR UI label) → formal UI display string.
 * Used everywhere we render plan text in the interface.
 * Examples: 'venta_pro' → 'Venta Pro', 'Cierre Garantizado' → 'Cierre Garantizado'
 */
export function toPlanLabel(raw: string | null | undefined): string {
  if (!raw) return PLAN_LABELS.gratis;
  return PLAN_LABELS[toPlanKey(raw)];
}

/**
 * Returns the Tailwind CSS badge classes for a given plan value.
 * Accepts raw keys or UI labels — always returns consistent styling.
 */
export function getPlanBadgeClass(raw: string | null | undefined): string {
  switch (toPlanKey(raw)) {
    case 'cierre_garantizado':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'venta_pro':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'contenidos':
      return 'bg-violet-100 text-violet-800 border-violet-300';
    case 'gratis':
    default:
      return 'bg-slate-100 text-slate-600 border-slate-300';
  }
}

// ─── Compatibility aliases and helpers (used by admin/page.tsx) ───────────

/** Alias for toPlanLabel — converts any plan string to the formal UI label. */
export const getPlanLabel = toPlanLabel;

/** Alias for toPlanKey — converts any plan string to the canonical backend key. */
export const normalizePlanKey = toPlanKey;

/**
 * Deriva el PlanKey a partir del campo legacy isVerified de la DB.
 */
export function planFromIsVerified(isVerified: boolean): PlanKey {
  return isVerified ? 'venta_pro' : 'gratis';
}

/**
 * Extrae el PlanKey desde observationNotes con formato "PLAN: <name>"
 * o desde el campo plan directo. Para compatibilidad hacia atrás.
 */
export function parsePlanFromProperty(p: {
  plan?: string | null;
  isVerified?: boolean;
  observationNotes?: string | null;
}): PlanKey {
  if (p?.plan) return toPlanKey(p.plan);
  if (p?.observationNotes) {
    const match = p.observationNotes.match(/^PLAN:\s*(.+)$/i);
    if (match) return toPlanKey(match[1]);
  }
  return planFromIsVerified(p?.isVerified ?? false);
}

/** Static badge class map for inline Tailwind usage. */
export const PLAN_BADGE_CLASS: Record<PlanKey, string> = {
  gratis: 'bg-slate-100 text-slate-600 border-slate-300',
  contenidos: 'bg-violet-100 text-violet-800 border-violet-300',
  venta_pro: 'bg-blue-100 text-blue-800 border-blue-300',
  cierre_garantizado: 'bg-amber-100 text-amber-800 border-amber-300',
};
