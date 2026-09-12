/**
 * UI-layer bridge for live mask re-run (UX: four knobs -> immediate overlay refresh).
 * Imports Lane A $lib/image/mask contracts. Full image->mask CV still pending in Lane A;
 * until a run entrypoint exists, we echo knobs and keep overlay chrome ready.
 */
import {
	countMaskPixels,
	type MaskKnobs,
	type MaskResult
} from '$lib/image/mask.js';

export type MaskRunResult = {
	live: boolean;
	message: string;
	maskPixelCount: number | null;
	result: MaskResult | null;
};

/**
 * Live re-run hook. When Lane A adds a runMask(imageData, knobs) (or similar),
 * call it here. For now, contracts are imported; no pixel pipeline yet.
 */
export function rerunMask(knobs: MaskKnobs, source: ImageData | null): MaskRunResult {
	if (!source) {
		return {
			live: false,
			message:
				'Knobs ready (sheet=' +
				knobs.sheet +
				', sens=' +
				knobs.sensitivity.toFixed(2) +
				', edge=' +
				knobs.edgeOffsetPx +
				', feather=' +
				knobs.featherPx +
				'). Awaiting source pixels + Lane A runMask.',
			maskPixelCount: null,
			result: null
		};
	}

	// We intentionally do not implement chroma-key here (Lane A owns $lib/image).
	void countMaskPixels;
	return {
		live: false,
		message: 'Source present; wire Lane A runMask when exported. Overlay not updated.',
		maskPixelCount: null,
		result: null
	};
}
