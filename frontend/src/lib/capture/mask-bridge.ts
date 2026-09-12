/**
 * UI-layer bridge for live mask re-run (UX: four knobs -> immediate overlay refresh).
 * Imports Lane A $lib/image/mask contracts. Calls runMask when Lane A exports it;
 * otherwise keeps the provisional chrome path (no CV reimplementation here).
 */
import * as maskMod from '$lib/image/mask.js';
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

type RunMaskFn = (source: ImageData, knobs: MaskKnobs) => MaskResult;

/** Resolve Lane A runMask if present without hard-failing when still stubbed. */
function getRunMask(): RunMaskFn | null {
	const candidate = (maskMod as Record<string, unknown>)['runMask'];
	return typeof candidate === 'function' ? (candidate as RunMaskFn) : null;
}

/**
 * Live re-run hook. Uses Lane A runMask(imageData, knobs) when exported;
 * otherwise echoes knobs / source state for overlay chrome.
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

	const runMask = getRunMask();
	if (runMask) {
		try {
			const result = runMask(source, knobs);
			const pixels =
				typeof result.pixelCount === 'number' ? result.pixelCount : countMaskPixels(result.mask);
			return {
				live: true,
				message:
					'Mask live (' +
					pixels +
					' px, sheet=' +
					result.sheetUsed +
					', contiguous=' +
					String(result.contiguous) +
					').',
				maskPixelCount: pixels,
				result
			};
		} catch (err) {
			const detail = err instanceof Error ? err.message : 'runMask failed';
			return {
				live: false,
				message: 'runMask error: ' + detail,
				maskPixelCount: null,
				result: null
			};
		}
	}

	// Lane A has not exported runMask yet — keep provisional path.
	return {
		live: false,
		message: 'Source present; Lane A runMask not exported yet. Overlay not updated.',
		maskPixelCount: null,
		result: null
	};
}