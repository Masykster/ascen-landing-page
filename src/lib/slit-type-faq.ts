export type SlitPreset = 'ascendemy' | 'signal' | 'cobalt' | 'moss' | 'carbon';

export interface SlitPalette {
	/** Background. */
	paper: string;
	/** Type, rules and the flood. */
	ink: string;
	/** Text on the flood. Defaults to whichever of paper, white or black reads best on the ink. */
	onInk?: string;
}

export type SlitPaletteInput = Partial<SlitPalette>;

export interface FaqItem {
	question: string;
	/** HTML string rendered inside the answer body. */
	answerHtml: string;
	/** Plain text of the answer for search; extracted from `answerHtml` when omitted. */
	answerText?: string;
	/** Matches one of `categories`. */
	category?: string;
	/** Stable id for the #hash deep link. Defaults to a slug of the question. */
	id?: string;
}

export interface SlitTypeFaqContact {
	prompt: string;
	label: string;
	href: string;
}

export interface SlitTypeFaqLabels {
	allCategory: string;
	clearSearch: string;
	copyLink: string;
	linkCopied: string;
	playTicker: string;
	pauseTicker: string;
	resetFilter: string;
	emptyPrefix: string;
	emptySuffix: string;
	searchHintPrefix: string;
	questionsSuffix: string;
	ofWord: string;
	defaultAriaLabel: string;
	questionsAriaLabel: string;
	filterAriaLabel: string;
}

export const DEFAULT_FAQ_LABELS: SlitTypeFaqLabels = {
	allCategory: 'Semua',
	clearSearch: 'Hapus',
	copyLink: 'Salin tautan',
	linkCopied: 'Tautan disalin',
	playTicker: 'Jalankan teks berjalan',
	pauseTicker: 'Hentikan teks berjalan',
	resetFilter: 'Tampilkan semua pertanyaan',
	emptyPrefix: 'Tidak ada pertanyaan yang cocok dengan “',
	emptySuffix: '”.',
	searchHintPrefix: 'Coba “',
	questionsSuffix: 'pertanyaan',
	ofWord: 'dari',
	defaultAriaLabel: 'Pertanyaan yang sering diajukan',
	questionsAriaLabel: 'Daftar pertanyaan',
	filterAriaLabel: 'Filter berdasarkan topik',
};

export const SLIT_PRESETS: Record<SlitPreset, { light: SlitPalette; dark: SlitPalette }> = {
	ascendemy: {
		light: { paper: '#fdf9f4', ink: '#23272e', onInk: '#fdf9f4' },
		dark: { paper: '#16191e', ink: '#fdf9f4', onInk: '#16191e' },
	},
	signal: {
		light: { paper: '#ffffff', ink: '#e10e17', onInk: '#ffffff' },
		dark: { paper: '#140c0c', ink: '#ff4a3d', onInk: '#140c0c' },
	},
	cobalt: {
		light: { paper: '#f6f7ff', ink: '#1d3cf5', onInk: '#ffffff' },
		dark: { paper: '#0b1030', ink: '#7b8cff', onInk: '#0b1030' },
	},
	moss: {
		light: { paper: '#f4f6ef', ink: '#1f4d2b', onInk: '#f4f6ef' },
		dark: { paper: '#0e1a12', ink: '#8fd19e', onInk: '#0e1a12' },
	},
	carbon: {
		light: { paper: '#f3f3f1', ink: '#111111', onInk: '#f3f3f1' },
		dark: { paper: '#131313', ink: '#f1f1ee', onInk: '#131313' },
	},
};

export function splitLines(text: string): string[] {
	return text.split(/\r?\n/);
}

/** Converts a question string into a URL-safe slug for deep linking. */
export function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 64) || 'question'
	);
}

/** Ids for every item: its own id, or a slug of the question, made unique. */
export function itemIds(questions: string[], ids: (string | undefined)[]): string[] {
	const seen: Record<string, number> = {};
	return questions.map((q, i) => {
		const base = ids[i] || slugify(q);
		seen[base] = (seen[base] || 0) + 1;
		return seen[base] > 1 ? `${base}-${seen[base]}` : base;
	});
}

/** Lower-case words of a query; every word must appear somewhere in the text. */
export function queryWords(query: string): string[] {
	return query.toLowerCase().split(/\s+/).filter(Boolean);
}

export function matches(text: string, query: string): boolean {
	const words = queryWords(query);
	if (!words.length) return true;
	const t = text.toLowerCase();
	return words.every((w) => t.includes(w));
}

/** Splits text into plain and matched runs so matches can be marked. Overlapping words merge. */
export function highlightRuns(text: string, query: string): { text: string; hit: boolean }[] {
	const words = queryWords(query);
	if (!words.length || !text) return [{ text, hit: false }];
	const t = text.toLowerCase();
	const marks = new Array<boolean>(text.length).fill(false);
	for (const w of words) {
		let at = t.indexOf(w);
		while (at > -1) {
			for (let k = at; k < at + w.length; k++) marks[k] = true;
			at = t.indexOf(w, at + 1);
		}
	}
	const runs: { text: string; hit: boolean }[] = [];
	for (let k = 0; k < text.length; k++) {
		const last = runs[runs.length - 1];
		if (last && last.hit === marks[k]) last.text += text[k];
		else runs.push({ text: text[k], hit: marks[k] });
	}
	return runs;
}

/** A short excerpt of `text` around the first matched word, or "" when nothing matches. */
export function snippet(text: string, query: string, radius = 44): string {
	const words = queryWords(query);
	if (!words.length || !text) return '';
	const t = text.toLowerCase();
	let at = -1;
	for (const w of words) {
		const i = t.indexOf(w);
		if (i > -1 && (at < 0 || i < at)) at = i;
	}
	if (at < 0) return '';
	let from = Math.max(0, at - radius);
	let to = Math.min(text.length, at + radius * 2);
	if (from > 0) from = text.indexOf(' ', from) + 1 || from;
	if (to < text.length) to = text.lastIndexOf(' ', to) > at ? text.lastIndexOf(' ', to) : to;
	return (from > 0 ? '…' : '') + text.slice(from, to).trim() + (to < text.length ? '…' : '');
}

/** Which ids start open, from an index, an id, or a list of both. */
export function resolveOpen(
	spec: number | string | (number | string)[] | undefined,
	ids: string[],
	single: boolean,
	prefix = '',
): string[] {
	if (spec === undefined) return [];
	const list = Array.isArray(spec) ? spec : [spec];
	const out: string[] = [];
	for (const s of list) {
		const named =
			typeof s === 'string'
				? ids.includes(s)
					? s
					: ids.includes(prefix + s)
						? prefix + s
						: undefined
				: undefined;
		const id = typeof s === 'number' ? ids[s] : named;
		if (id && !out.includes(id)) out.push(id);
	}
	return single ? out.slice(0, 1) : out;
}

/** Roving focus between question buttons. Returns -1 for keys it does not handle. */
export function nextFocus(key: string, i: number, n: number): number {
	if (!n) return -1;
	if (key === 'ArrowDown') return (i + 1) % n;
	if (key === 'ArrowUp') return (i - 1 + n) % n;
	if (key === 'Home') return 0;
	if (key === 'End') return n - 1;
	return -1;
}

function channel(v: number): number {
	const c = v / 255;
	return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a #rgb or #rrggbb colour; NaN for anything else. */
export function luminance(hex: string): number {
	let h = hex.trim().replace('#', '');
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	if (!/^[0-9a-f]{6}$/i.test(h)) return NaN;
	const r = channel(parseInt(h.slice(0, 2), 16));
	const g = channel(parseInt(h.slice(2, 4), 16));
	const b = channel(parseInt(h.slice(4, 6), 16));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
	const x = luminance(a);
	const y = luminance(b);
	if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Text colour for the flood: the paper if it reads (4.5:1), else white or near-black, whichever reads better. */
export function pickOnInk(ink: string, paper: string): string {
	const onPaper = contrast(ink, paper);
	if (Number.isNaN(onPaper)) return paper;
	if (onPaper >= 4.5) return paper;
	return contrast(ink, '#ffffff') >= contrast(ink, '#111111') ? '#ffffff' : '#111111';
}

const ENTITY_MAP: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&apos;': "'",
	'&nbsp;': ' ',
	'&times;': '×',
};

/** Extracts normalized plain text from an HTML answer fragment for search and snippets. */
export function stripHtml(html: string): string {
	return html
		.replace(/<\/?(?:p|div|li|br|ul|ol|h[1-6])\b[^>]*>/gi, ' ')
		.replace(/<[^>]+>/g, '')
		.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp|times);/g, (entity) => ENTITY_MAP[entity] ?? entity)
		.replace(/\s+/g, ' ')
		.trim();
}

const STOP_WORDS = new Set([
	// English
	'what',
	'which',
	'where',
	'when',
	'does',
	'should',
	'could',
	'would',
	'every',
	'there',
	'their',
	'about',
	'before',
	'after',
	'your',
	'from',
	'with',
	'have',
	'this',
	'that',
	'many',
	'much',
	'long',
	'take',
	'make',
	'copy',
	'look',
	'slightly',
	'different',
	// Indonesian
	'apa',
	'apakah',
	'bagaimana',
	'berapa',
	'dimana',
	'kapan',
	'siapa',
	'mengapa',
	'kenapa',
	'yang',
	'untuk',
	'dalam',
	'pada',
	'dari',
	'atau',
	'dengan',
	'jika',
	'saja',
	'dapat',
	'bisa',
	'akan',
	'sudah',
	'belum',
	'saya',
	'kamu',
	'anda',
	'kami',
	'mereka',
	'tidak',
	'bukan',
	'adalah',
	'seperti',
	'karena',
]);

/** A word worth searching for, taken from the questions so the hint always finds something. */
export function queryHint(items: Pick<FaqItem, 'question'>[]): string {
	for (const it of items.slice(1)) {
		const words = it.question
			.toLowerCase()
			.replace(/[^a-z\s]/g, ' ')
			.split(/\s+/);
		for (const w of words) {
			if (w.length > 4 && !STOP_WORDS.has(w)) return w;
		}
	}
	return '';
}
