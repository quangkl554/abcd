import { NextResponse } from 'next/server';

export function jsonOk(value: unknown, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...asObject(value) }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

function asObject(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return { data: value };
}
