export type QuizFigure = 'right-triangle' | 'bar-chart';

export interface QuizQuestion {
	/** topik/elemen TKA, contoh: "Geometri" */
	topic: string;
	/** teks soal — boleh berisi markup matematika sederhana (HTML statis tepercaya) */
	stem: string;
	/** ekspresi utama yang ditampilkan besar (opsional) */
	formula?: string;
	/** ilustrasi SVG pendamping soal (opsional) */
	figure?: QuizFigure;
	/** opsi jawaban — boleh berisi markup matematika sederhana */
	options: string[];
	/** indeks jawaban benar — dipakai mode demo & pengembangan fitur skoring berikutnya */
	answer: number;
}

/** pecahan bertumpuk, contoh: frac(3, 4) → ¾, frac(3, 4, 2) → 2¾ */
const frac = (numerator: number, denominator: number, whole?: number) =>
	`${whole ? `<span class="mf-whole">${whole}</span>` : ''}<span class="mf"><span>${numerator}</span><span>${denominator}</span></span>`;

export const quizQuestions: QuizQuestion[] = [
	{
		topic: 'Bilangan',
		stem: 'Hasil dari operasi bilangan berpangkat berikut adalah …',
		formula: '2<sup>5</sup> × 2<sup>3</sup> : 2<sup>4</sup> = …',
		options: ['8', '16', '32', '64'],
		answer: 1,
	},
	{
		topic: 'Bilangan',
		stem: `Ibu membeli ${frac(3, 4, 2)} kg gula. Sebanyak ${frac(1, 2, 1)} kg digunakan untuk membuat kue. Sisa gula Ibu sekarang adalah …`,
		options: [
			`${frac(1, 4, 1)} kg`,
			`${frac(1, 2, 1)} kg`,
			`${frac(3, 4, 1)} kg`,
			`${frac(1, 4, 4)} kg`,
		],
		answer: 0,
	},
	{
		topic: 'Geometri',
		stem: 'Perhatikan segitiga siku-siku ABC berikut. Jika AB = 8 cm dan BC = 6 cm, panjang sisi AC adalah …',
		figure: 'right-triangle',
		options: ['10 cm', '12 cm', '14 cm', '7 cm'],
		answer: 0,
	},
	{
		topic: 'Aljabar',
		stem: 'Nilai <i>x</i> yang memenuhi persamaan linear berikut adalah …',
		formula: '3(<i>x</i> − 2) = 2<i>x</i> + 5',
		options: ['1', '7', '11', '−1'],
		answer: 2,
	},
	{
		topic: 'Statistika',
		stem: 'Diagram batang berikut menunjukkan nilai ulangan matematika 20 siswa. Rata-rata nilai ulangan tersebut adalah …',
		figure: 'bar-chart',
		options: ['7,4', '7,5', '7,6', '7,8'],
		answer: 2,
	},
];
