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

// DELETE /api/local/contracts/[id]
export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    if (!id) {
      return NextResponse.json({ error: 'ID de contrato requerido.' }, { status: 400 });
    }

    const db = readDB();
    const before = db.contracts.length;
    db.contracts = db.contracts.filter((c: any) => c.id !== id);
    if (!db.deleted_contract_ids.includes(id)) {
      db.deleted_contract_ids.push(id);
    }
    writeDB(db);

    return NextResponse.json({ ok: true, deleted: before > db.contracts.length, id });
  } catch (err) {
    console.error('[API/local/contracts/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'Error al eliminar el contrato.' }, { status: 500 });
  }
}
