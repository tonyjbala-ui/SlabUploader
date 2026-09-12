/**
 * Background-removal / mask pipeline (TECH-SPEC §3 / TV-1 / TV-2).
 * Pure TypeScript — no native CV libs. Deterministic for identical inputs.
 *
 * Pipeline (`runMask`):
 * 1. Classify sheet (auto → border HSV; or forced green/black).
 * 2. Build sheet-color binary using sensitivity-scaled thresholds.
 * 3. `floodFillRemoveBorderSheet` — only border-connected sheet is removed.
 * 4. `edgeOffsetPx`: positive erodes slab (pull edge inward onto wood);
 *    negative dilates slab (push outward into sheet). Integer pixel steps.
 * 5. `featherPx`: morphological close (dilate then erode) of that radius to
 *    clean jagged edges. Binary mask stays hard-cut for area math; soft alpha
 *    blend for PNG export is a later encode step using the same radius.
 * 6. `contiguous` via 4-connected component count; `pixelCount` via countMaskPixels.
 */

import {
	BLACK_THRESH,
	GREEN_HUE_HI,
	GREEN_HUE_LO,
	GREEN_SAT_MIN,
	GREEN_VAL_MIN
} from '../math/constants.js';

export type SheetMode = 'auto' | 'green' | 'black';

export type MaskKnobs = {
	sheet: SheetMode;
	/** 0..1 — tighter (0) vs looser (1) detection. 0.5 = factory thresholds. */
	sensitivity: number;
	/** Pull mask in (+) / out (−) a few pixels. */
	edgeOffsetPx: number;
	/** Morphological close radius (px); soft PNG alpha uses same idea later. */
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

/** Browser canvas ImageData-compatible input (RGBA). */
export type ImageDataLike = {
	data: Uint8ClampedArray | Uint8Array;
	width: number;
	height: number;
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
 * Sample ~3% border strips on all four sides; mean HSV (arithmetic).
 * Used for sheet=auto (§3.1).
 */
export function averageBorderHsv(image: ImageDataLike): { h: number; s: number; v: number } {
	const { data, width, height } = image;
	if (width < 1 || height < 1) {
		throw new RangeError('averageBorderHsv: empty image');
	}
	const strip = Math.max(1, Math.floor(Math.min(width, height) * 0.03));
	let sumH = 0;
	let sumS = 0;
	let sumV = 0;
	let n = 0;

	const sample = (x: number, y: number) => {
		const i = (y * width + x) * 4;
		const hsv = rgbToHsv({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
		sumH += hsv.h;
		sumS += hsv.s;
		sumV += hsv.v;
		n++;
	};

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (y < strip || y >= height - strip || x < strip || x >= width - strip) {
				sample(x, y);
			}
		}
	}

	if (n === 0) {
		return { h: 0, s: 0, v: 0 };
	}
	return { h: sumH / n, s: sumS / n, v: sumV / n };
}

export type SheetThresholds = {
	hueLo: number;
	hueHi: number;
	satMin: number;
	valMin: number;
	blackThresh: number;
	blackSatMax: number;
};

/**
 * Map sensitivity ∈ [0,1] onto HSV / black cutoffs.
 * At 0.5 → factory constants. Higher → looser (more sheet); lower → tighter.
 */
export function thresholdsForSensitivity(sensitivity: number): SheetThresholds {
	const s = Math.min(1, Math.max(0, sensitivity));
	const d = s - 0.5; // −0.5 .. +0.5
	return {
		hueLo: GREEN_HUE_LO - d * 20,
		hueHi: GREEN_HUE_HI + d * 20,
		satMin: GREEN_SAT_MIN - d * 40,
		valMin: GREEN_VAL_MIN - d * 40,
		blackThresh: BLACK_THRESH + d * 40,
		blackSatMax: 20 + d * 20
	};
}

function isSheetPixel(
	hsv: { h: number; s: number; v: number },
	sheet: 'green' | 'black',
	t: SheetThresholds
): boolean {
	if (sheet === 'green') {
		return hsv.h >= t.hueLo && hsv.h <= t.hueHi && hsv.s >= t.satMin && hsv.v >= t.valMin;
	}
	return hsv.v <= t.blackThresh && hsv.s <= t.blackSatMax;
}

/** Build row-major isSheetColor map (1 = sheet-colored). */
export function buildSheetColorMap(
	image: ImageDataLike,
	sheet: 'green' | 'black',
	sensitivity: number
): Uint8Array {
	const { data, width, height } = image;
	const n = width * height;
	const expected = n * 4;
	if (data.length < expected) {
		throw new RangeError(
			`buildSheetColorMap: data length ${data.length} < width*height*4 (${expected})`
		);
	}
	const t = thresholdsForSensitivity(sensitivity);
	const out = new Uint8Array(n);
	for (let i = 0; i < n; i++) {
		const o = i * 4;
		const hsv = rgbToHsv({ r: data[o]!, g: data[o + 1]!, b: data[o + 2]! });
		out[i] = isSheetPixel(hsv, sheet, t) ? 1 : 0;
	}
	return out;
}

/**
 * TV-1 / TV-2: interior patches that do NOT touch the border
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
		const x = qx[qh]!;
		const y = qy[qh]!;
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

/** 4-connected morphological dilate (slab grows by 1 px). */
export function dilateMask(mask: Uint8Array, width: number, height: number): Uint8Array {
	const n = width * height;
	const out = new Uint8Array(n);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (mask[i]) {
				out[i] = 1;
				continue;
			}
			if (
				(x > 0 && mask[i - 1]) ||
				(x + 1 < width && mask[i + 1]) ||
				(y > 0 && mask[i - width]) ||
				(y + 1 < height && mask[i + width])
			) {
				out[i] = 1;
			}
		}
	}
	return out;
}

/** 4-connected morphological erode (slab shrinks by 1 px). */
export function erodeMask(mask: Uint8Array, width: number, height: number): Uint8Array {
	const n = width * height;
	const out = new Uint8Array(n);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			if (!mask[i]) continue;
			if (
				x > 0 &&
				mask[i - 1] &&
				x + 1 < width &&
				mask[i + 1] &&
				y > 0 &&
				mask[i - width] &&
				y + 1 < height &&
				mask[i + width]
			) {
				out[i] = 1;
			}
		}
	}
	return out;
}

/**
 * Apply signed edge offset then feather close.
 * edgeOffsetPx > 0 → erode; < 0 → dilate. featherPx → close radius.
 */
export function applyMaskKnobsGeometry(
	mask: Uint8Array,
	width: number,
	height: number,
	edgeOffsetPx: number,
	featherPx: number
): Uint8Array {
	let m = mask;
	const edge = Math.trunc(edgeOffsetPx);
	if (edge > 0) {
		for (let k = 0; k < edge; k++) m = erodeMask(m, width, height);
	} else if (edge < 0) {
		for (let k = 0; k < -edge; k++) m = dilateMask(m, width, height);
	}
	const feather = Math.max(0, Math.trunc(featherPx));
	for (let k = 0; k < feather; k++) m = dilateMask(m, width, height);
	for (let k = 0; k < feather; k++) m = erodeMask(m, width, height);
	return m;
}

/**
 * True iff all slab pixels form a single 4-connected component (or empty → false).
 */
export function isMaskContiguous(mask: Uint8Array, width: number, height: number): boolean {
	const n = width * height;
	if (mask.length !== n) {
		throw new RangeError('isMaskContiguous: length mismatch');
	}
	let total = 0;
	let start = -1;
	for (let i = 0; i < n; i++) {
		if (mask[i]) {
			total++;
			if (start < 0) start = i;
		}
	}
	if (total === 0) return false;

	const visited = new Uint8Array(n);
	const qx = new Int32Array(n);
	const qy = new Int32Array(n);
	let qh = 0;
	let qt = 0;
	const sx = start % width;
	const sy = (start / width) | 0;
	qx[0] = sx;
	qy[0] = sy;
	visited[start] = 1;
	qt = 1;
	let reached = 0;

	while (qh < qt) {
		const x = qx[qh]!;
		const y = qy[qh]!;
		qh++;
		reached++;
		const tryPush = (nx: number, ny: number) => {
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
			const ni = ny * width + nx;
			if (visited[ni] || !mask[ni]) return;
			visited[ni] = 1;
			qx[qt] = nx;
			qy[qt] = ny;
			qt++;
		};
		tryPush(x - 1, y);
		tryPush(x + 1, y);
		tryPush(x, y - 1);
		tryPush(x, y + 1);
	}

	return reached === total;
}

function resolveSheet(image: ImageDataLike, mode: SheetMode): 'green' | 'black' {
	if (mode === 'green' || mode === 'black') return mode;
	const avg = averageBorderHsv(image);
	const c = classifySheetFromHsv(avg);
	if (c === 'green' || c === 'black') return c;
	// Auto unknown (§3.1 prompt path): heuristic fallback for pure API.
	return avg.v <= 40 ? 'black' : 'green';
}

/**
 * Full Gate B mask entrypoint for UI / mask-bridge.
 * Accepts canvas ImageData-like RGBA buffers.
 */
export function runMask(
	imageData: ImageDataLike,
	knobs: MaskKnobs = DEFAULT_MASK_KNOBS
): MaskResult {
	const { width, height } = imageData;
	if (!(width > 0) || !(height > 0)) {
		throw new RangeError('runMask: width/height must be > 0');
	}
	const sheetUsed = resolveSheet(imageData, knobs.sheet);
	const isSheet = buildSheetColorMap(imageData, sheetUsed, knobs.sensitivity);
	let mask = floodFillRemoveBorderSheet(isSheet, width, height);
	mask = applyMaskKnobsGeometry(mask, width, height, knobs.edgeOffsetPx, knobs.featherPx);
	const pixelCount = countMaskPixels(mask);
	const contiguous = isMaskContiguous(mask, width, height);
	return { mask, width, height, pixelCount, contiguous, sheetUsed };
}