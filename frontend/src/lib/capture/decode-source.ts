/**
 * Decode a capture photo (File / Blob / object URL) to ImageData for mask-bridge.
 * UI chrome only — no CV. Downscales so the long edge is at most MAX_LIVE_EDGE
 * so knob drags stay interactive on phone / PC camera shots.
 */
export const MAX_LIVE_EDGE = 1280;

export async function decodeSourceToImageData(
	source: File | Blob | string
): Promise<ImageData> {
	if (typeof createImageBitmap === 'function') {
		const bitmap = await bitmapFrom(source);
		try {
			return rasterize(bitmap, bitmap.width, bitmap.height);
		} finally {
			bitmap.close();
		}
	}
	return decodeViaHtmlImage(source);
}

async function bitmapFrom(source: File | Blob | string): Promise<ImageBitmap> {
	if (typeof source !== 'string') {
		return createImageBitmap(source);
	}
	const img = await loadHtmlImage(source);
	return createImageBitmap(img);
}

async function decodeViaHtmlImage(source: File | Blob | string): Promise<ImageData> {
	const url = typeof source === 'string' ? source : URL.createObjectURL(source);
	const revoke = typeof source !== 'string';
	try {
		const img = await loadHtmlImage(url);
		return rasterize(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
	} finally {
		if (revoke) URL.revokeObjectURL(url);
	}
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to decode photo'));
		img.src = url;
	});
}

function fitSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
	const edge = Math.max(width, height);
	if (!(width > 0) || !(height > 0)) {
		throw new RangeError('decodeSourceToImageData: empty image');
	}
	if (edge <= maxEdge) return { width, height };
	const scale = maxEdge / edge;
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
}

function rasterize(source: CanvasImageSource, srcW: number, srcH: number): ImageData {
	const { width, height } = fitSize(srcW, srcH, MAX_LIVE_EDGE);
	if (typeof OffscreenCanvas !== 'undefined') {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.drawImage(source, 0, 0, width, height);
			return ctx.getImageData(0, 0, width, height);
		}
	}
	if (typeof document === 'undefined') {
		throw new Error('decodeSourceToImageData: no canvas in this environment');
	}
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('decodeSourceToImageData: 2d context unavailable');
	ctx.drawImage(source, 0, 0, width, height);
	return ctx.getImageData(0, 0, width, height);
}
