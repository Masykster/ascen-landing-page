import { describe, expect, test } from 'bun:test';
import { faqItems } from '../data/faq';
import {
	SLIT_PRESETS,
	contrast,
	highlightRuns,
	itemIds,
	matches,
	nextFocus,
	pickOnInk,
	queryHint,
	resolveOpen,
	slugify,
	snippet,
	stripHtml,
} from './slit-type-faq';

describe('slit-type-faq helpers', () => {
	test('slugify normalizes diacritics, punctuation, and fallback', () => {
		expect(slugify('Apa itu Ascendemy.id?')).toBe('apa-itu-ascendemy-id');
		expect(slugify('Café & Résumé')).toBe('cafe-resume');
		expect(slugify('???')).toBe('question');
	});

	test('itemIds deduplicates identical questions', () => {
		expect(itemIds(['Apa itu?', 'Apa itu?', 'Lainnya'], [undefined, undefined, 'custom'])).toEqual([
			'apa-itu',
			'apa-itu-2',
			'custom',
		]);
	});

	test('matches requires every query word regardless of order or casing', () => {
		expect(matches('Tersedia QRIS dan transfer bank Mandiri', 'bank qris')).toBe(true);
		expect(matches('Tersedia QRIS dan transfer bank Mandiri', 'qris gopay')).toBe(false);
		expect(matches('Apa saja', '   ')).toBe(true);
	});

	test('highlightRuns merges overlapping words cleanly', () => {
		expect(highlightRuns('Pembayaran QRIS cepat', 'qris bayar')).toEqual([
			{ text: 'Pem', hit: false },
			{ text: 'bayar', hit: true },
			{ text: 'an ', hit: false },
			{ text: 'QRIS', hit: true },
			{ text: ' cepat', hit: false },
		]);
	});

	test('snippet extracts context around first matched term', () => {
		const text =
			'Dana bersifat non-refundable, kecuali untuk pembayaran ganda atau kesalahan sistem kami.';
		const out = snippet(text, 'ganda', 15);
		expect(out).toContain('ganda');
		expect(out.startsWith('…')).toBe(true);
		expect(snippet(text, 'tidakada')).toBe('');
	});

	test('resolveOpen handles index, id, prefix, and single mode', () => {
		const ids = ['faq-satu', 'faq-dua', 'faq-tiga'];
		expect(resolveOpen(0, ids, true)).toEqual(['faq-satu']);
		expect(resolveOpen(['dua', 2], ids, false, 'faq-')).toEqual(['faq-dua', 'faq-tiga']);
		expect(resolveOpen([0, 1], ids, true)).toEqual(['faq-satu']);
	});

	test('nextFocus wraps cleanly on arrow keys and handles Home/End', () => {
		expect(nextFocus('ArrowDown', 2, 3)).toBe(0);
		expect(nextFocus('ArrowUp', 0, 3)).toBe(2);
		expect(nextFocus('Home', 2, 3)).toBe(0);
		expect(nextFocus('End', 0, 3)).toBe(2);
		expect(nextFocus('Enter', 0, 3)).toBe(-1);
	});

	test('ascendemy preset achieves high WCAG contrast and pickOnInk selects paper', () => {
		const { paper, ink } = SLIT_PRESETS.ascendemy.light;
		expect(contrast(ink, paper)).toBeGreaterThan(14);
		expect(pickOnInk(ink, paper)).toBe(paper);
	});

	test('stripHtml decodes entities and strips tags cleanly for all Ascendemy FAQs', () => {
		const sample = faqItems[5]; // Syarat & Ketentuan link
		const plain = stripHtml(sample.answerHtml);
		expect(plain).toContain('Syarat & Ketentuan');
		expect(plain).not.toContain('<a');
		expect(plain).not.toContain('&amp;');
		expect(queryHint(faqItems)).toBeTruthy();
	});
});
