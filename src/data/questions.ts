export interface QuizQuestion {
	/** keterangan soal, contoh: "Hitung penjumlahan berikut:" */
	label: string;
	/** ekspresi utama, contoh: "2 × (−3 + 9) = …" */
	formula?: string;
	options: string[];
	/** indeks jawaban benar — dipakai untuk pengembangan fitur skoring berikutnya */
	answer: number;
}

export const quizQuestions: QuizQuestion[] = [
	{
		label: 'Hitung penjumlahan berikut:',
		formula: '2 × (−3 + 9) = …',
		options: ['6', '−6', '12', '−12'],
		answer: 0,
	},
	{
		label: 'Selesaikan persamaan linear berikut:',
		formula: '2x + 5 = 17 → x = …',
		options: ['4', '5', '6', '7'],
		answer: 2,
	},
	{
		label: 'Tentukan jari-jari lingkaran berikut:',
		formula: 'L = 154 cm² → r = …',
		options: ['7 cm', '11 cm', '14 cm', '22 cm'],
		answer: 0,
	},
	{
		label: 'Tentukan sisa pembagian berikut:',
		formula: '47 ÷ 6 → sisa = …',
		options: ['5', '6', '7', '8'],
		answer: 0,
	},
	{
		label: 'Hitung total belanja berikut:',
		formula: '3 × Rp18.000 − Rp6.000 = …',
		options: ['Rp48.000', 'Rp54.000', 'Rp60.000', 'Rp42.000'],
		answer: 0,
	},
];
