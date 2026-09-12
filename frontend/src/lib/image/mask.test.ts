import { describe, expect, it } from 'vitest';
import {
	classifySheetFromHsv,
	countMaskPixels,
	floodFillRemoveBorderSheet
} from './mask.js';

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
