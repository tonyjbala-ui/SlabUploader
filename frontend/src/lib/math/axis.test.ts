import { describe, expect, it } from 'vitest';
import { confirmAxis, pickLengthAxis, preferPrevailingOverDiagonal } from './axis.js';

describe('TV-5 Angled end / prevailing axis contract', () => {
	it('pickLengthAxis keeps longer side as length', () => {
		const box = pickLengthAxis({
			center: { x: 0, y: 0 },
			lengthPx: 100,
			widthPx: 400,
			angleRad: 0
		});
		expect(box.lengthPx).toBe(400);
		expect(box.widthPx).toBe(100);
	});

	it('prefer prevailing over diagonal (TV-5)', () => {
		const prevailing = {
			center: { x: 0, y: 0 },
			lengthPx: 960,
			widthPx: 200,
			angleRad: 0
		};
		const diagonal = {
			center: { x: 0, y: 0 },
			lengthPx: 980,
			widthPx: 180,
			angleRad: Math.PI / 4
		};
		const chosen = preferPrevailingOverDiagonal(prevailing, diagonal);
		expect(chosen.angleRad).toBe(0);
		expect(chosen.lengthPx).toBe(960);
	});

	it('confirmAxis applies user rotation', () => {
		const confirmed = confirmAxis(
			{ center: { x: 1, y: 2 }, lengthPx: 10, widthPx: 3, angleRad: 0.1 },
			0.2
		);
		expect(confirmed.confirmed).toBe(true);
		expect(confirmed.angleRad).toBeCloseTo(0.3, 10);
	});
});
