/**
 * Thin client for Phase 0 calibrated-draft upload + optional health.
 * All URLs are relative `/api` — expect Vite (dev) or Caddy (prod) to proxy to FastAPI.
 */

export type PhotoMeta = {
	kind: 'inventory';
	role: 'topdown' | 'extra';
	seq: number;
};

/** OPENAPI SlabCreate subset for calibrated draft (Phase 0). */
export type CalibratedDraftData = {
	id: string;
	sku: string;
	length_in: number;
	thickness_in: number;
	sqft: number;
	bdft: number;
	width_min_in: number;
	width_max_in: number;
	width_avg_in: number;
	client_rev: number;
};

export type HealthResponse = {
	status: string;
	version?: string;
	woo_reachable?: boolean;
};

export type ApiErrorBody = {
	error?: { code?: string; message?: string; detail?: unknown };
};

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
	const res = await fetch('/api/health', { method: 'GET', signal });
	if (!res.ok) {
		throw new Error(`health ${res.status}`);
	}
	return (await res.json()) as HealthResponse;
}

/**
 * POST /api/v1/slabs — multipart per OPENAPI:
 * - `data`: SlabCreate JSON
 * - `files[]`: original inventory images
 * - `meta[]`: JSON strings { kind, role, seq }
 */
export async function postCalibratedDraft(args: {
	data: CalibratedDraftData;
	files: File[];
	meta: PhotoMeta[];
	signal?: AbortSignal;
}): Promise<{ ok: true; status: number; body: unknown } | { ok: false; status: number; body: unknown }> {
	const form = new FormData();
	form.append('data', JSON.stringify(args.data));

	args.files.forEach((file, i) => {
		form.append('files[]', file, file.name || `photo-${i + 1}.jpg`);
	});
	args.meta.forEach((m) => {
		form.append('meta[]', JSON.stringify(m));
	});

	const res = await fetch('/api/v1/slabs', {
		method: 'POST',
		body: form,
		signal: args.signal
	});

	let body: unknown = null;
	const text = await res.text();
	if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			body = { raw: text };
		}
	}

	if (res.status === 201 || res.ok) {
		return { ok: true, status: res.status, body };
	}
	return { ok: false, status: res.status, body };
}

export function newClientId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `00000000-0000-4000-8${Date.now().toString(16).slice(-3)}-${Math.random().toString(16).slice(2, 14)}`;
}

export const SKU_PATTERN = /^[A-Z0-9-]{3,24}$/;

export function normalizeSku(raw: string): string {
	return raw.trim().toUpperCase();
}

export function isValidSku(sku: string): boolean {
	return SKU_PATTERN.test(sku);
}
