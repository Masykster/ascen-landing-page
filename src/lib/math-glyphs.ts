/**
 * Pool simbol matematika untuk latar dekoratif MathScramble.
 * Dipakai bersama oleh render server (posisi awal) dan script client (efek scramble).
 */
export const MATH_GLYPHS = [
	'∑',
	'∫',
	'π',
	'√',
	'∞',
	'∆',
	'θ',
	'λ',
	'α',
	'β',
	'φ',
	'∂',
	'∇',
	'≈',
	'≠',
	'±',
	'×',
	'÷',
	'≤',
	'≥',
	'%',
	'∛',
	'x²',
	'n!',
	'f(x)',
	'dy/dx',
	'a²+b²',
	'log',
	'sin θ',
	'cos',
] as const;

/** PRNG kecil ber-seed → hasil acak yang stabil antar build (tanpa layout shift). */
export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
