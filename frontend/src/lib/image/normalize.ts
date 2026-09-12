import {
	ASPECT_H,
	ASPECT_W,
	FILL_TARGET,
	OUTPUT_PX_MIN
} from '../math/constants.js';

/**
 * Photo normalization geometry (TECH-SPEC §5 / TV-6 / TV-7).
 *
 * Pure math only — does not invent pixels. Callers supply slab bounding size
 * (and optionally source image size); we return the 3:4 crop that yields
 * 80% fill at the extremes, plus whether a retake is required because the
 * source cannot supply shorter side ≥ OUTPUT_PX_MIN without upscaling.
 */

export type SlabBoundsPx = {
	/** Slab axis-aligned width in source pixels (widest extent). */
	widthPx: number;
	/** Slab axis-aligned height in source pixels (tallest extent). */
	heightPx: number;
};

export type SourceImageSize = {
	widthPx: number;
	heightPx: number;
};

export type NormalizePlan = {
	/** Crop width in source pixels (3:4 portrait). */
	cropWidthPx: number;
	/** Crop height in source pixels. */
	cropHeightPx: number;
	/** Fill at slab widest point: slabW / cropW. */
	fillX: number;
	/** Fill at slab tallest point: slabH / cropH. */
	fillY: number;
	/** max(fillX, fillY) — equals FILL_TARGET (0.80) at extremes. */
	fillAtExtremes: number;
	/** Shorter side of the crop (portrait ⇒ width). */
	shorterSidePx: number;
	/** True when shorter side cannot reach OUTPUT_PX_MIN without upscaling. */
	requiresRetake: boolean;
	/** Reason string when requiresRetake, else null. */
	retakeReason: string | null;
	aspectW: number;
	aspectH: number;
	fillTarget: number;
	outputPxMin: number;
};

/**
 * Compute 3:4 crop sized so fill at extremes = FILL_TARGET (0.80).
 *
 * Solving: cropW/cropH = ASPECT_W/ASPECT_H and max(slabW/cropW, slabH/cropH) = FILL_TARGET.
 * Take the larger of the two aspect-locked candidates so both fills ≤ FILL_TARGET
 * with equality on the limiting axis.
 */
export function planNormalizeCrop(
	slab: SlabBoundsPx,
	source?: SourceImageSize
): NormalizePlan {
	if (!(slab.widthPx > 0) || !(slab.heightPx > 0)) {
		throw new RangeError('planNormalizeCrop: slab bounds must be > 0');
	}

	const fill = FILL_TARGET;
	// Candidate A: width is limiting (fillX = fill)
	const cropWFromWidth = slab.widthPx / fill;
	const cropHFromWidth = (cropWFromWidth * ASPECT_H) / ASPECT_W;
	// Candidate B: height is limiting (fillY = fill)
	const cropHFromHeight = slab.heightPx / fill;
	const cropWFromHeight = (cropHFromHeight * ASPECT_W) / ASPECT_H;

	// Larger crop wins so neither axis exceeds FILL_TARGET
	let cropWidthPx: number;
	let cropHeightPx: number;
	if (cropWFromWidth >= cropWFromHeight) {
		cropWidthPx = cropWFromWidth;
		cropHeightPx = cropHFromWidth;
	} else {
		cropWidthPx = cropWFromHeight;
		cropHeightPx = cropHFromHeight;
	}

	const fillX = slab.widthPx / cropWidthPx;
	const fillY = slab.heightPx / cropHeightPx;
	const fillAtExtremes = Math.max(fillX, fillY);
	const shorterSidePx = Math.min(cropWidthPx, cropHeightPx);

	let requiresRetake = false;
	let retakeReason: string | null = null;

	// TV-7: no inventing pixels / no upscale. If shorter side of the crop
	// (as sourced) cannot reach OUTPUT_PX_MIN, require retake.
	if (shorterSidePx + 1e-9 < OUTPUT_PX_MIN) {
		requiresRetake = true;
		retakeReason = `shorter side ${shorterSidePx.toFixed(1)}px < ${OUTPUT_PX_MIN}px after ${fill * 100}% fill crop; source cannot supply without upscaling`;
	}

	// Also retake if crop cannot fit inside the source image (when provided).
	if (source) {
		if (cropWidthPx > source.widthPx + 1e-9 || cropHeightPx > source.heightPx + 1e-9) {
			requiresRetake = true;
			retakeReason =
				retakeReason ??
				`crop ${cropWidthPx.toFixed(1)}×${cropHeightPx.toFixed(1)} exceeds source ${source.widthPx}×${source.heightPx}`;
		}
	}

	return {
		cropWidthPx,
		cropHeightPx,
		fillX,
		fillY,
		fillAtExtremes,
		shorterSidePx,
		requiresRetake,
		retakeReason,
		aspectW: ASPECT_W,
		aspectH: ASPECT_H,
		fillTarget: FILL_TARGET,
		outputPxMin: OUTPUT_PX_MIN
	};
}

/**
 * Output pixel size if we encode at source crop resolution (never upscale).
 * When requiresRetake, still reports the natural crop size for diagnostics.
 */
export function outputSizeFromPlan(plan: NormalizePlan): {
	widthPx: number;
	heightPx: number;
	publishable: boolean;
} {
	return {
		widthPx: plan.cropWidthPx,
		heightPx: plan.cropHeightPx,
		publishable: !plan.requiresRetake
	};
}
