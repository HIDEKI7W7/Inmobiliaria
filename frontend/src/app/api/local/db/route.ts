import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}

function writeDB(data: object): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (writeErr) {
    console.error('[DB] Error writing db.json:', writeErr);
  }
}

// GET /api/local/db
export async function GET(): Promise<NextResponse> {
  try {
    const db = readDB();
    return NextResponse.json(db);
  } catch (err) {
    console.error('[API/local/db] GET error:', err);
    return NextResponse.json({ error: 'Error al leer la base de datos local.' }, { status: 500 });
  }
}

// POST /api/local/db
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const db = readDB();
    const updatedDb = {
      ...db,
      ...body
    };

    writeDB(updatedDb);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API/local/db] POST error:', err);
    return NextResponse.json({ error: 'Error al actualizar la base de datos local.' }, { status: 500 });
  }
}
