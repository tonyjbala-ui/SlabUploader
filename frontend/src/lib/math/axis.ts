/**
 * Length-axis contracts (TECH-SPEC §4.1–4.2 / TV-5).
 * Full min-area rect / convex-hull CV can be wired later; interfaces are locked here.
 */

export type Point2 = { x: number; y: number };

export type AxisBox = {
	/** Center of the minimum-area bounding rectangle. */
	center: Point2;
	/** Long side length in pixels (prevailing length). */
	lengthPx: number;
	/** Short side length in pixels. */
	widthPx: number;
	/** Orientation of the length axis in radians (CCW from +x). */
	angleRad: number;
};

export type ConfirmedAxis = AxisBox & {
	/** User confirmed; may have been rotated from auto suggestion. */
	confirmed: true;
	/** Optional user rotation delta applied on top of auto angle. */
	userRotationRad: number;
};

/**
 * Choose prevailing length axis: long side of min-area box.
 * For nearly-square slabs the UI lets the user pick via forceSwap.
 */
export function pickLengthAxis(
	box: AxisBox,
	opts?: { forceSwap?: boolean }
): AxisBox {
	let { lengthPx, widthPx, angleRad, center } = box;
	const shouldSwap = opts?.forceSwap === true || widthPx > lengthPx;
	if (shouldSwap) {
		const tmp = lengthPx;
		lengthPx = widthPx;
		widthPx = tmp;
		angleRad = angleRad + Math.PI / 2;
	}
	return { center, lengthPx, widthPx, angleRad };
}

/**
 * Apply user rotate/confirm (TV-5: widths stay perpendicular after confirm).
 */
export function confirmAxis(box: AxisBox, userRotationRad: number = 0): ConfirmedAxis {
	return {
		...box,
		angleRad: box.angleRad + userRotationRad,
		userRotationRad,
		confirmed: true
	};
}

/**
 * Stub: angled-end / diagonal must NOT become the length axis.
 * Given two candidate orientations (prevailing vs diagonal), pick prevailing.
 * TV-5 locks this contract; real hull geometry comes later.
 */
export function preferPrevailingOverDiagonal(
	prevailing: AxisBox,
	_diagonalCandidate: AxisBox
): AxisBox {
	return prevailing;
}
