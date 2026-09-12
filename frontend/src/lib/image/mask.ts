/**
 * Background-removal / mask contracts (TECH-SPEC §3 / TV-1 / TV-2).
 * Full chroma-key + flood-fill CV can be wired later; interfaces + pure helpers
 * lock the Gate B contracts.
 */

import {
	BLACK_THRESH,
	GREEN_HUE_HI,
	GREEN_HUE_LO,
	GREEN_SAT_MIN
} from '../math/constants.js';

export type SheetMode = 'auto' | 'green' | 'black';

export type MaskKnobs = {
	sheet: SheetMode;
	/** 0..1 — tighter vs looser detection. */
	sensitivity: number;
	/** Pull mask in/out a few pixels. */
	edgeOffsetPx: number;
	/** Soft alpha blend width in pixels. */
	featherPx: number;
};

export const DEFAULT_MASK_KNOBS: MaskKnobs = {
	sheet: 'auto',
	sensitivity: 0.5,
	edgeOffsetPx: 0,
	featherPx: 0
};

export type MaskResult = {
	/** Row-major binary mask: 1 = slab, 0 = background. */
	mask: Uint8Array;
	width: number;
	height: number;
	/** Count of slab pixels (1s). */
	pixelCount: number;
	/** Contiguous slab assumed when true; broken → retake. */
	contiguous: boolean;
	sheetUsed: 'green' | 'black';
};

export type RgbPixel = { r: number; g: number; b: number };

/** Approximate HSV from 0–255 RGB (TECH-SPEC §3.1 thresholds use H∈[0,360), S/V∈[0,100]). */
export function rgbToHsv(p: RgbPixel): { h: number; s: number; v: number } {
	const r = p.r / 255;
	const g = p.g / 255;
	const b = p.b / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	let h = 0;
	if (d !== 0) {
		if (max === r) h = ((g - b) / d) % 6;
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	const s = max === 0 ? 0 : (d / max) * 100;
	const v = max * 100;
	return { h, s, v };
}

/** §3.1 side classification from average HSV. */
export function classifySheetFromHsv(avg: {
	h: number;
	s: number;
	v: number;
}): 'green' | 'black' | 'unknown' {
	if (avg.h >= GREEN_HUE_LO && avg.h <= GREEN_HUE_HI && avg.s >= GREEN_SAT_MIN) {
		return 'green';
	}
	if (avg.v <= BLACK_THRESH && avg.s <= 20) {
		return 'black';
	}
	return 'unknown';
}

/**
 * TV-1 / TV-2 contract stub: interior patches that do NOT touch the border
 * must be preserved (flood-fill only removes edge-connected sheet pixels).
 *
 * Given a binary "isSheetColor" map, mark background only for sheet pixels
 * reachable from the image border. Interior sheet-colored islands stay as slab.
 */
export function floodFillRemoveBorderSheet(
	isSheetColor: Uint8Array,
	width: number,
	height: number
): Uint8Array {
	const n = width * height;
	if (isSheetColor.length !== n) {
		throw new RangeError('floodFillRemoveBorderSheet: length mismatch');
	}
	const removed = new Uint8Array(n);
	const visited = new Uint8Array(n);
	const qx = new Int32Array(n);
	const qy = new Int32Array(n);
	let qh = 0;
	let qt = 0;

	const push = (x: number, y: number) => {
		const i = y * width + x;
		if (visited[i]) return;
		if (!isSheetColor[i]) return;
		visited[i] = 1;
		removed[i] = 1;
		qx[qt] = x;
		qy[qt] = y;
		qt++;
	};

	for (let x = 0; x < width; x++) {
		push(x, 0);
		push(x, height - 1);
	}
	for (let y = 0; y < height; y++) {
		push(0, y);
		push(width - 1, y);
	}

	while (qh < qt) {
		const x = qx[qh];
		const y = qy[qh];
		qh++;
		if (x > 0) push(x - 1, y);
		if (x + 1 < width) push(x + 1, y);
		if (y > 0) push(x, y - 1);
		if (y + 1 < height) push(x, y + 1);
	}

	const mask = new Uint8Array(n);
	for (let i = 0; i < n; i++) {
		mask[i] = removed[i] ? 0 : 1;
	}
	return mask;
}

export function countMaskPixels(mask: Uint8Array): number {
	let c = 0;
	for (let i = 0; i < mask.length; i++) if (mask[i]) c++;
	return c;
}
