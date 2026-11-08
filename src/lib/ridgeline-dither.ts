export interface RidgelinePalette {
	/** The footer background, and the colour the mist dissolves into. */
	paper: string;
	/** Body text and the logo. */
	ink: string;
	/** Headings, tagline and the copyright line. */
	muted: string;
	/** Hairlines. */
	line: string;
	/** The heart in the credit line. */
	heart: string;
	/** Dither tones from mist to deepest ridge. The first should be the paper. */
	tones: string[];
}

export type RidgelineTheme = 'polar' | 'evergreen' | 'glacier' | 'dusk' | 'sepia' | 'night';

export type RidgelinePreset = 'auto' | RidgelineTheme;

export const RIDGELINE_PRESETS: Record<RidgelineTheme, RidgelinePalette> = {
	polar: {
		paper: '#fdf9f4',
		ink: '#182230',
		muted: '#647080',
		line: '#e6e2da',
		heart: '#f97316',
		tones: ['#fdf9f4', '#dfeaf6', '#b2cde9', '#73a3d1', '#386fa4', '#1c436e', '#0d2342'],
	},
	evergreen: {
		paper: '#f3f8f5',
		ink: '#14211a',
		muted: '#67776e',
		line: '#dce8e1',
		heart: '#e5484d',
		tones: ['#f3f8f5', '#d4ecdf', '#a5d7bb', '#69b38a', '#2e7c52', '#145131', '#0a2d1a'],
	},
	glacier: {
		paper: '#f2f6fa',
		ink: '#121b26',
		muted: '#637184',
		line: '#dae3ed',
		heart: '#e5484d',
		tones: ['#f2f6fa', '#d6e6f4', '#a8cae7', '#6b9ecc', '#34679a', '#1a3e66', '#0b2140'],
	},
	dusk: {
		paper: '#f8f4f7',
		ink: '#21151f',
		muted: '#7a6876',
		line: '#ecdfe8',
		heart: '#e5484d',
		tones: ['#f8f4f7', '#efdbe7', '#d9b2cb', '#b1789f', '#7a4975', '#4a2750', '#25102c'],
	},
	sepia: {
		paper: '#f7f2ea',
		ink: '#231a10',
		muted: '#7b6d5c',
		line: '#e9dfcf',
		heart: '#d6452f',
		tones: ['#f7f2ea', '#efdfc6', '#ddbb8d', '#bb8a55', '#8a5a2e', '#5a3518', '#2f1a0b'],
	},
	night: {
		paper: '#08100c',
		ink: '#e2eee7',
		muted: '#7d9286',
		line: '#18271f',
		heart: '#ff6369',
		tones: ['#08100c', '#0c1c14', '#123224', '#1a4b33', '#256a48', '#3a8c63', '#62b388'],
	},
};

// #region ridge
// Pure helpers for ordered Bayer dither, ridged fractal value noise, and elevation.

/** Hex → [r, g, b] in 0–255, or null for anything that isn't #rgb / #rrggbb. */
export function rdfHex(hex: string): [number, number, number] | null {
	const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
	if (!m || !m[1]) return null;
	const raw = m[1];
	const h =
		raw.length === 3
			? raw
					.split('')
					.map((c) => c + c)
					.join('')
			: raw;
	return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** [r, g, b] → one opaque pixel for a little-endian Uint32 view of ImageData. */
export function rdfPack(rgb: readonly [number, number, number] | number[]): number {
	return ((255 << 24) | ((rgb[2] ?? 0) << 16) | ((rgb[1] ?? 0) << 8) | (rgb[0] ?? 0)) >>> 0;
}

/** The classic 8×8 Bayer matrix, as thresholds in (0, 1). */
export const RDF_BAYER: readonly number[] = [
	0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
	12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
	3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
	15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64);

/** Palette index for a tone in [0, 1] across `n` colours at Bayer threshold `b`. */
export function rdfDither(tone: number, n: number, b: number): number {
	const t = tone < 0 ? 0 : tone > 1 ? 1 : tone;
	const v = Math.floor(t * (n - 1) + b);
	return v > n - 1 ? n - 1 : v;
}

/** Integer lattice hash → [0, 1). */
export function rdfHash(x: number, y: number, seed: number): number {
	let h =
		Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1). */
export function rdfNoise(x: number, y: number, seed: number): number {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const a = rdfHash(xi, yi, seed);
	const b = rdfHash(xi + 1, yi, seed);
	const c = rdfHash(xi, yi + 1, seed);
	const d = rdfHash(xi + 1, yi + 1, seed);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal value noise, normalised back into [0, 1). */
export function rdfFbm(x: number, y: number, seed: number, octaves: number): number {
	let sum = 0;
	let amp = 0.5;
	let norm = 0;
	for (let o = 0; o < octaves; o++) {
		sum += rdfNoise(x, y, seed + o * 31) * amp;
		norm += amp;
		x *= 2.03;
		y *= 2.03;
		amp *= 0.5;
	}
	return norm > 0 ? sum / norm : 0;
}

/** Hermite step from e0 to e1, clamped. */
export function rdfSmooth(e0: number, e1: number, x: number): number {
	const t = e1 === e0 ? (x < e0 ? 0 : 1) : Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
}

/** Ease-out cubic over a progress that may run outside [0, 1]. */
export function rdfEase(t: number): number {
	const c = t < 0 ? 0 : t > 1 ? 1 : t;
	return 1 - Math.pow(1 - c, 3);
}

/**
 * Crest row of ridge `i` of `layers` (0 is the farthest) for every column of
 * a `cols` × `rows` grid, plus `margin` columns either side for parallax.
 * Farther ridges sit higher with more, smaller peaks; nearer ones are lower,
 * broader and taller.
 */
export function rdfRidgeline(
	cols: number,
	rows: number,
	i: number,
	layers: number,
	seed: number,
	margin: number,
): Float32Array {
	const k = layers > 1 ? i / (layers - 1) : 1;
	const n = cols + margin * 2;
	const out = new Float32Array(n);
	const base = rows * (0.38 + 0.66 * Math.pow(k, 1.4));
	const amp = rows * (0.2 + 0.24 * k);
	const freq = 6 - 3.8 * k;
	// Near ridges climb toward both edges, one side more than the other, so the
	// range opens into a valley. Nothing climbs into the faded band at the top.
	const flankL = rows * 0.5 * k * k * k * (0.55 + 0.6 * rdfHash(i, 11, seed));
	const flankR = rows * 0.5 * k * k * k * (0.55 + 0.6 * rdfHash(i, 13, seed));
	const ceil = rows * 0.17;
	const tilt = (rdfHash(i, 7, seed) - 0.5) * rows * 0.34 * (0.4 + k);
	const s = (seed | 0) * 13 + i * 101;
	for (let x = 0; x < n; x++) {
		const u = (x - margin) / cols;
		const r1 = 1 - Math.abs(rdfNoise(u * freq + i * 3.7, 0.5, s) * 2 - 1);
		const r2 = 1 - Math.abs(rdfNoise(u * freq * 2.3, 3.5, s + 1) * 2 - 1);
		const f = rdfFbm(u * freq * 4.1, 9.5, s + 2, 3);
		const h = r1 * r1 * 0.62 + r2 * 0.24 + f * 0.14;
		const e = Math.min(1.2, Math.abs(u * 2 - 1));
		const y =
			base -
			h * amp +
			tilt * (u - 0.5) * 2 -
			(u < 0.5 ? flankL : flankR) * e * e * Math.sqrt(e);
		out[x] = y < ceil ? ceil - (ceil - y) * 0.25 : y;
	}
	return out;
}

/** Altitude in metres shown for a crest at `crest` rows down a `rows`-tall range. */
export function rdfElevation(crest: number, rows: number, layer: number, layers: number): number {
	const up = rows > 0 ? 1 - Math.min(1, Math.max(0, crest / rows)) : 0;
	return Math.round(420 + up * 2600 + (layers - 1 - layer) * 140);
}
// #endregion
