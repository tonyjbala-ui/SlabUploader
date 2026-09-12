/**
 * Draw a cheap alpha tint from Lane A's binary mask onto the overlay canvas.
 * UI chrome only — no CV.
 */
export type OverlayMask = {
	mask: Uint8Array;
	width: number;
	height: number;
};

export function drawMaskOverlay(
	canvas: HTMLCanvasElement | null,
	result: OverlayMask | null
): void {
	if (!canvas) return;
	if (!result || result.width < 1 || result.height < 1) {
		if (canvas.width !== 1 || canvas.height !== 1) {
			canvas.width = 1;
			canvas.height = 1;
		}
		const empty = canvas.getContext('2d');
		empty?.clearRect(0, 0, 1, 1);
		return;
	}

	if (canvas.width !== result.width || canvas.height !== result.height) {
		canvas.width = result.width;
		canvas.height = result.height;
	}
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return;

	const image = ctx.createImageData(result.width, result.height);
	const dest = image.data;
	const mask = result.mask;
	const n = Math.min(mask.length, result.width * result.height);
	for (let i = 0; i < n; i++) {
		if (!mask[i]) continue;
		const o = i * 4;
		dest[o] = 124;
		dest[o + 1] = 179;
		dest[o + 2] = 255;
		dest[o + 3] = 96;
	}
	ctx.putImageData(image, 0, 0);
}
