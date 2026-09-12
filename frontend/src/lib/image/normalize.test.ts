import { describe, expect, it } from 'vitest';
import { ASPECT_H, ASPECT_W, FILL_TARGET, OUTPUT_PX_MIN } from '../math/constants.js';
import { outputSizeFromPlan, planNormalizeCrop } from './normalize.js';

describe('TV-6 3:4 crop @ 80% fill', () => {
	it('centers slab geometry: fill at extremes = 0.80, aspect 3:4', () => {
		// Slab 1280 × 2000 — width-limiting after aspect lock
		const slab = { widthPx: 1280, heightPx: 2000 };
		const plan = planNormalizeCrop(slab, { widthPx: 4000, heightPx: 6000 });

		console.log('TV-6 fixture:', {
			slab,
			crop: { w: plan.cropWidthPx, h: plan.cropHeightPx },
			fillX: plan.fillX,
			fillY: plan.fillY,
			fillAtExtremes: plan.fillAtExtremes,
			shorterSidePx: plan.shorterSidePx,
			requiresRetake: plan.requiresRetake,
			aspect: `${plan.aspectW}:${plan.aspectH}`
		});

		expect(plan.aspectW).toBe(ASPECT_W);
		expect(plan.aspectH).toBe(ASPECT_H);
		expect(plan.fillTarget).toBe(FILL_TARGET);
		// Aspect exact
		expect(plan.cropWidthPx / plan.cropHeightPx).toBeCloseTo(ASPECT_W / ASPECT_H, 10);
		// Extremes fill = 0.80 (max of fillX/fillY)
		expect(plan.fillAtExtremes).toBeCloseTo(FILL_TARGET, 10);
		expect(Math.max(plan.fillX, plan.fillY)).toBeCloseTo(0.8, 10);
		expect(Math.min(plan.fillX, plan.fillY)).toBeLessThanOrEqual(0.8 + 1e-9);
		// Source allows ≥1600 on shorter side
		expect(plan.shorterSidePx).toBeGreaterThanOrEqual(OUTPUT_PX_MIN);
		expect(plan.requiresRetake).toBe(false);
		expect(outputSizeFromPlan(plan).publishable).toBe(true);
	});

	it('height-limiting slab still hits 80% on the tall extreme', () => {
		const slab = { widthPx: 900, heightPx: 2400 };
		const plan = planNormalizeCrop(slab);
		expect(plan.fillAtExtremes).toBeCloseTo(0.8, 10);
		expect(plan.cropWidthPx / plan.cropHeightPx).toBeCloseTo(3 / 4, 10);
	});
});

describe('TV-7 Too-small source / no upscale', () => {
	it('requiresRetake when shorter side would be < 1600; does not invent pixels', () => {
		// After 80% fill: cropW = slabW/0.8. Choose slabW so cropW < 1600.
		// e.g. slabW=1000 ⇒ cropW=1250 < 1600
		const slab = { widthPx: 1000, heightPx: 1400 };
		const plan = planNormalizeCrop(slab, { widthPx: 2000, heightPx: 3000 });

		console.log('TV-7 fixture:', {
			slab,
			crop: { w: plan.cropWidthPx, h: plan.cropHeightPx },
			shorterSidePx: plan.shorterSidePx,
			outputPxMin: plan.outputPxMin,
			requiresRetake: plan.requiresRetake,
			retakeReason: plan.retakeReason,
			note: 'no upscaling; photo not publishable until retake'
		});

		expect(plan.shorterSidePx).toBeLessThan(OUTPUT_PX_MIN);
		expect(plan.requiresRetake).toBe(true);
		expect(plan.retakeReason).toMatch(/upscal|1600|retake/i);
		expect(outputSizeFromPlan(plan).publishable).toBe(false);
		// Natural crop size is reported — we do not bump it to 1600
		expect(plan.cropWidthPx).toBeLessThan(OUTPUT_PX_MIN);
	});

	it('large enough source is publishable', () => {
		const slab = { widthPx: 1600, heightPx: 2200 };
		const plan = planNormalizeCrop(slab);
		// cropW = 1600/0.8 = 2000 ≥ 1600
		expect(plan.shorterSidePx).toBeGreaterThanOrEqual(OUTPUT_PX_MIN);
		expect(plan.requiresRetake).toBe(false);
	});
});
