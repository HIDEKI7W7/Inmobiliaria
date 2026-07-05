import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      properties: Array.isArray(parsed.properties) ? parsed.properties : [],
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
      deleted_property_ids: Array.isArray(parsed.deleted_property_ids) ? parsed.deleted_property_ids : [],
      deleted_contract_ids: Array.isArray(parsed.deleted_contract_ids) ? parsed.deleted_contract_ids : [],
      marketing_plans: Array.isArray(parsed.marketing_plans) ? parsed.marketing_plans : [],
    };
  } catch (_e) {
    return { properties: [], contracts: [], deleted_property_ids: [], deleted_contract_ids: [], marketing_plans: [] };
  }
}

function writeDB(data: object): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (writeErr) {
    console.error('[DB] Error writing db.json:', writeErr);
  }
}

// GET /api/local/marketing-plans
export async function GET(): Promise<NextResponse> {
  try {
    const db = readDB();
    const plans = db.marketing_plans || [];
    return NextResponse.json({ plans });
  } catch (err) {
    console.error('[API/local/marketing-plans] GET error:', err);
    return NextResponse.json({ plans: [] }, { status: 500 });
  }
}

// POST /api/local/marketing-plans
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body || !body.id || body.price === undefined) {
      return NextResponse.json({ error: 'Plan inválido: faltan campos id o price.' }, { status: 400 });
    }

    const db = readDB();
    if (!db.marketing_plans || db.marketing_plans.length === 0) {
      db.marketing_plans = [
        { id: 'plan-gratis', name: 'Plan Gratuito', price: '0', billingCycle: '', features: [{ text: '1 publicación activa', included: true }, { text: 'Fotos básicas (hasta 5)', included: true }, { text: 'Contacto directo por WhatsApp', included: true }] },
        { id: 'plan-contenidos', name: 'Plan Contenidos', price: '69', billingCycle: '/mes', features: [{ text: '1 propiedad', included: true }, { text: 'Fotos + Video optimizado', included: true }, { text: 'Contacto directo por WhatsApp', included: true }, { text: 'Mapa interactivo con radar', included: true }, { text: 'Alquiler de letrero físico', included: true }] },
        { id: 'plan-venta-pro', name: 'Plan Venta Pro', price: '199', billingCycle: '/mes', features: [{ text: '1 propiedad', included: true }, { text: 'Dron + Fotos Profesionales', included: true }, { text: 'Sello Oro + Mapa Premium', included: true }, { text: 'Alquiler de letrero físico', included: true }, { text: 'Estadísticas Avanzadas de Visitas', included: true }, { text: 'PUBLICIDAD PRIORITARIA', included: true }] },
        { id: 'plan-cierre-garantizado', name: 'Cierre Garantizado', price: '1.5', billingCycle: 'del valor de venta', features: [{ text: 'Gestión completa por Agente Experto', included: true }, { text: 'Visitas y Negociación delegadas', included: true }, { text: 'Alquiler de letrero físico', included: true }, { text: 'Auditoría Legal y Notarial', included: true }] },
      ];
    }

    const planIdx = db.marketing_plans.findIndex((p: any) => p.id === body.id);
    if (planIdx >= 0) {
      db.marketing_plans[planIdx].price = String(body.price);
    } else {
      db.marketing_plans.push({
        id: body.id,
        name: body.id.replace('plan-', '').toUpperCase(),
        price: String(body.price),
        billingCycle: '',
        features: []
      });
    }

    writeDB(db);
    return NextResponse.json({ ok: true, id: body.id });
  } catch (err) {
    console.error('[API/local/marketing-plans] POST error:', err);
    return NextResponse.json({ error: 'Error al guardar el plan de marketing.' }, { status: 500 });
  }
}
