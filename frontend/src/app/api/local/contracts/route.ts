import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

function readDB(): { properties: any[]; contracts: any[]; deleted_property_ids: string[]; deleted_contract_ids: string[] } {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      properties: Array.isArray(parsed.properties) ? parsed.properties : [],
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
      deleted_property_ids: Array.isArray(parsed.deleted_property_ids) ? parsed.deleted_property_ids : [],
      deleted_contract_ids: Array.isArray(parsed.deleted_contract_ids) ? parsed.deleted_contract_ids : [],
    };
  } catch (_e) {
    return { properties: [], contracts: [], deleted_property_ids: [], deleted_contract_ids: [] };
  }
}

function writeDB(data: object): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (writeErr) {
    console.error('[DB] Error writing db.json:', writeErr);
  }
}

// GET /api/local/contracts
export async function GET(): Promise<NextResponse> {
  try {
    const db = readDB();
    const deletedIds = db.deleted_contract_ids;
    const contracts = db.contracts
      .filter((c: any) => c && c.id && !deletedIds.includes(c.id))
      .sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    return NextResponse.json({ contracts, total: contracts.length, deleted_contract_ids: deletedIds });
  } catch (err) {
    console.error('[API/local/contracts] GET error:', err);
    return NextResponse.json({ contracts: [], total: 0, deleted_contract_ids: [] }, { status: 500 });
  }
}

// POST /api/local/contracts
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Contrato inválido: falta campo id.' }, { status: 400 });
    }

    const db = readDB();
    const exists = db.contracts.some((c: any) => c.id === body.id);
    if (!exists) {
      db.contracts.unshift({
        ...body,
        createdAt: body.createdAt || new Date().toISOString(),
      });
      writeDB(db);
    }

    return NextResponse.json({ ok: true, id: body.id });
  } catch (err) {
    console.error('[API/local/contracts] POST error:', err);
    return NextResponse.json({ error: 'Error al guardar el contrato.' }, { status: 500 });
  }
}
