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

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// DELETE /api/local/properties/[id]
export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    if (!id) {
      return NextResponse.json({ error: 'ID de propiedad requerido.' }, { status: 400 });
    }

    const db = readDB();
    const before = db.properties.length;
    db.properties = db.properties.filter((p: any) => p.id !== id);
    if (!db.deleted_property_ids.includes(id)) {
      db.deleted_property_ids.push(id);
    }
    writeDB(db);

    return NextResponse.json({ ok: true, deleted: before > db.properties.length, id }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[API/local/properties/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Error al eliminar la propiedad.' }, { status: 500 });
  }
}

// GET /api/local/properties/[id]
export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    const db = readDB();
    const prop = db.properties.find((p: any) => p.id === id);
    if (!prop) {
      return NextResponse.json({ error: 'Propiedad no encontrada.' }, { status: 404, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json(prop, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[API/local/properties/[id]] GET error:', err);
    return NextResponse.json({ error: 'Error al leer la propiedad.' }, { status: 500 });
  }
}

// PUT /api/local/properties/[id] — UPSERT: crea si no existe (mocks estaticos)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    if (!id) {
      return NextResponse.json({ error: 'ID de propiedad requerido.' }, { status: 400 });
    }
    const body = await request.json();
    const db = readDB();
    const idx = db.properties.findIndex((p: any) => p.id === id);

    if (idx === -1) {
      // UPSERT: propiedad no estaba en db.json (origen mock estatico).
      // La insertamos para que los cambios del admin persistan despues de F5.
      db.properties.unshift({
        ...body,
        id,
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // MERGE completo preservando documentos y estados de auditoria.
      db.properties[idx] = {
        ...db.properties[idx],
        ...body,
        id,
        updatedAt: new Date().toISOString(),
      };
    }

    writeDB(db);
    const saved = db.properties.find((p: any) => p.id === id);
    return NextResponse.json({ ok: true, property: saved }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[API/local/properties/[id]] PUT error:', err);
    return NextResponse.json({ error: 'Error al actualizar la propiedad.' }, { status: 500 });
  }
}

// PATCH /api/local/properties/[id] — Actualizacion parcial (documentos, status, etc.)
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    if (!id) {
      return NextResponse.json({ error: 'ID de propiedad requerido.' }, { status: 400 });
    }
    const patch = await request.json();
    const db = readDB();
    const idx = db.properties.findIndex((p: any) => p.id === id);

    if (idx === -1) {
      // Upsert: crea un stub minimo con el parche
      db.properties.unshift({
        id,
        ...patch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      db.properties[idx] = {
        ...db.properties[idx],
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      };
    }

    writeDB(db);
    const saved = db.properties.find((p: any) => p.id === id);
    return NextResponse.json({ ok: true, property: saved }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[API/local/properties/[id]] PATCH error:', err);
    return NextResponse.json({ error: 'Error al parchear la propiedad.' }, { status: 500 });
  }
}
