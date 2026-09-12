import { describe, expect, it } from 'vitest';
import {
	classifySheetFromHsv,
	countMaskPixels,
	floodFillRemoveBorderSheet,
	isMaskContiguous,
	runMask,
	type ImageDataLike,
	type MaskKnobs
} from './mask.js';

/** Paint a solid RGBA rect into ImageDataLike. */
function fillRect(
	img: ImageDataLike,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	r: number,
	g: number,
	b: number
) {
	const { data, width } = img;
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const i = (y * width + x) * 4;
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
			data[i + 3] = 255;
		}
	}
}

function makeImage(width: number, height: number, r = 0, g = 0, b = 0): ImageDataLike {
	const data = new Uint8ClampedArray(width * height * 4);
	const img = { data, width, height };
	fillRect(img, 0, 0, width, height, r, g, b);
	return img;
}

const defaultKnobs = (over: Partial<MaskKnobs> = {}): MaskKnobs => ({
	sheet: 'auto',
	sensitivity: 0.5,
	edgeOffsetPx: 0,
	featherPx: 0,
	...over
});

describe('TV-1 / TV-2 mask flood-fill contracts', () => {
	it('TV-1: interior green-ish island not touching border stays in mask', () => {
		const w = 7;
		const h = 7;
		const sheet = new Uint8Array(w * h);
		// Border all sheet-colored
		for (let x = 0; x < w; x++) {
			sheet[x] = 1;
			sheet[(h - 1) * w + x] = 1;
		}
		for (let y = 0; y < h; y++) {
			sheet[y * w] = 1;
			sheet[y * w + (w - 1)] = 1;
		}
		// Interior island at (3,3) sheet-colored but not border-connected
		sheet[3 * w + 3] = 1;
		// Mid-ring non-sheet (wood) separates island from border
		const mask = floodFillRemoveBorderSheet(sheet, w, h);
		expect(mask[3 * w + 3]).toBe(1); // interior island preserved
		expect(mask[0]).toBe(0); // border removed
		expect(classifySheetFromHsv({ h: 60, s: 50, v: 50 })).toBe('green');
	});

	it('TV-2: black border removed; dark interior preserved', () => {
		expect(classifySheetFromHsv({ h: 0, s: 5, v: 20 })).toBe('black');
		const w = 5;
		const h = 5;
		const sheet = new Uint8Array(w * h);
		for (let i = 0; i < sheet.length; i++) sheet[i] = 0;
		// Only outer ring is sheet
		for (let x = 0; x < w; x++) {
			sheet[x] = 1;
			sheet[(h - 1) * w + x] = 1;
		}
		for (let y = 0; y < h; y++) {
			sheet[y * w] = 1;
			sheet[y * w + (w - 1)] = 1;
		}
		// Center dark wood = not sheet color
		sheet[2 * w + 2] = 0;
		const mask = floodFillRemoveBorderSheet(sheet, w, h);
		expect(mask[2 * w + 2]).toBe(1);
		expect(countMaskPixels(mask)).toBe(9); // 3x3 interior
	});
});

describe('runMask Gate B pipeline', () => {
	it('green sheet border removed, interior wood kept (+ green-ish island)', () => {
		const w = 32;
		const h = 32;
		// Green sheet: high G, mid R/B → hue ~120? Wait — yellow-green ~60 needs R≈G > B.
		// Factory green hue [35,85]: use lime-ish RGB (140, 200, 40) → hue around 80.
		const img = makeImage(w, h, 140, 200, 40);
		// Interior wood rectangle (brown)
		fillRect(img, 6, 6, 26, 26, 160, 110, 60);
		// Interior green-ish island not touching border (grain) — should stay as slab
		fillRect(img, 14, 14, 18, 18, 140, 200, 40); // same green as sheet, interior-only

		const result = runMask(img, defaultKnobs({ sheet: 'green' }));

		console.log('runMask green fixture:', {
			sheetUsed: result.sheetUsed,
			pixelCount: result.pixelCount,
			contiguous: result.contiguous,
			borderMask0: result.mask[0],
			woodCenter: result.mask[16 * w + 16],
			interiorGreenIsland: result.mask[15 * w + 15],
			size: `${result.width}x${result.height}`
		});

		expect(result.sheetUsed).toBe('green');
		expect(result.mask[0]).toBe(0); // border sheet removed
		expect(result.mask[16 * w + 16]).toBe(1); // wood kept
		expect(result.mask[15 * w + 15]).toBe(1); // interior green island kept
		expect(result.contiguous).toBe(true);
		expect(result.pixelCount).toBe(countMaskPixels(result.mask));
		expect(result.pixelCount).toBeGreaterThan(0);
	});

	it('black sheet border removed; mid-tone wood kept', () => {
		const w = 24;
		const h = 24;
		// Near-black sheet
		const img = makeImage(w, h, 8, 8, 8);
		// Mid-tone wood interior
		fillRect(img, 4, 4, 20, 20, 120, 90, 55);

		const result = runMask(img, defaultKnobs({ sheet: 'black' }));

		console.log('runMask black fixture:', {
			sheetUsed: result.sheetUsed,
			pixelCount: result.pixelCount,
			contiguous: result.contiguous,
			borderMask0: result.mask[0],
			woodCenter: result.mask[12 * w + 12]
		});

		expect(result.sheetUsed).toBe('black');
		expect(result.mask[0]).toBe(0);
		expect(result.mask[12 * w + 12]).toBe(1);
		expect(result.contiguous).toBe(true);
		expect(result.pixelCount).toBe(16 * 16);
	});

	it('auto classifies green border sheet', () => {
		const w = 20;
		const h = 20;
		const img = makeImage(w, h, 140, 200, 40);
		fillRect(img, 3, 3, 17, 17, 150, 100, 50);
		const result = runMask(img, defaultKnobs({ sheet: 'auto' }));
		console.log('runMask auto-green fixture:', {
			sheetUsed: result.sheetUsed,
			pixelCount: result.pixelCount,
			contiguous: result.contiguous
		});
		expect(result.sheetUsed).toBe('green');
		expect(result.contiguous).toBe(true);
	});

	it('broken / non-contiguous slab → contiguous:false', () => {
		const w = 30;
		const h = 20;
		// Green sheet
		const img = makeImage(w, h, 140, 200, 40);
		// Two disconnected wood blobs
		fillRect(img, 2, 2, 10, 10, 160, 110, 60);
		fillRect(img, 20, 10, 28, 18, 160, 110, 60);

		const result = runMask(img, defaultKnobs({ sheet: 'green' }));

		console.log('runMask broken fixture:', {
			sheetUsed: result.sheetUsed,
			pixelCount: result.pixelCount,
			contiguous: result.contiguous,
			blobA: result.mask[5 * w + 5],
			blobB: result.mask[14 * w + 24],
			gap: result.mask[10 * w + 15]
		});

		expect(result.mask[5 * w + 5]).toBe(1);
		expect(result.mask[14 * w + 24]).toBe(1);
		expect(result.mask[10 * w + 15]).toBe(0); // sheet gap between blobs
		expect(isMaskContiguous(result.mask, w, h)).toBe(false);
		expect(result.contiguous).toBe(false);
		expect(result.pixelCount).toBe(8 * 8 + 8 * 8);
	});

	it('edgeOffsetPx positive erodes slab inward', () => {
		const w = 16;
		const h = 16;
		const img = makeImage(w, h, 140, 200, 40);
		fillRect(img, 2, 2, 14, 14, 160, 110, 60);
		const base = runMask(img, defaultKnobs({ sheet: 'green', edgeOffsetPx: 0 }));
		const eroded = runMask(img, defaultKnobs({ sheet: 'green', edgeOffsetPx: 1 }));
		expect(eroded.pixelCount).toBeLessThan(base.pixelCount);
		expect(eroded.mask[2 * w + 2]).toBe(0); // outer wood ring eroded away
		expect(eroded.mask[8 * w + 8]).toBe(1);
	});
});