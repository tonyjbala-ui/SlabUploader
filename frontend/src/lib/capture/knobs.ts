import {
	DEFAULT_MASK_KNOBS,
	type MaskKnobs,
	type SheetMode
} from '$lib/image/mask.js';

export type { MaskKnobs, SheetMode };

/** UI persists Lane A MaskKnobs shape (localStorage OK per AGENTS §4). */
export type KnobState = MaskKnobs;

export const KNOB_DEFAULTS: KnobState = { ...DEFAULT_MASK_KNOBS };

const STORAGE_KEY = 'slabuploader.capture.knobs';

export function loadKnobs(): KnobState {
	if (typeof localStorage === 'undefined') return { ...KNOB_DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...KNOB_DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<KnobState> & {
			edgeOffset?: number;
			feather?: number;
		};
		const sheet: SheetMode =
			parsed.sheet === 'green' || parsed.sheet === 'black' || parsed.sheet === 'auto'
				? parsed.sheet
				: KNOB_DEFAULTS.sheet;
		return {
			sheet,
			sensitivity: clamp01(num(parsed.sensitivity, KNOB_DEFAULTS.sensitivity)),
			edgeOffsetPx: num(
				parsed.edgeOffsetPx ?? parsed.edgeOffset,
				KNOB_DEFAULTS.edgeOffsetPx
			),
			featherPx: Math.max(
				0,
				num(parsed.featherPx ?? parsed.feather, KNOB_DEFAULTS.featherPx)
			)
		};
	} catch {
		return { ...KNOB_DEFAULTS };
	}
}

export function saveKnobs(state: KnobState): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetKnobs(): KnobState {
	const next = { ...KNOB_DEFAULTS };
	saveKnobs(next);
	return next;
}

function num(v: unknown, fallback: number): number {
	return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clamp01(v: number): number {
	return Math.min(1, Math.max(0, v));
}
