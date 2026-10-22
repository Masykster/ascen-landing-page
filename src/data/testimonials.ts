export type TestimonialProgram = 'Latihan' | 'Tryout TKA' | 'AMO 2026';

export interface Testimonial {
	name: string;
	school: string;
	city: string;
	program: TestimonialProgram;
	quote: string;
	before: number;
	after: number;
	metric: string;
	featured?: boolean;
}

/**
 * TODO: ganti SELURUH data di bawah dengan testimoni asli sebelum tayang.
 *
 * Sumber yang bisa dipakai:
 * - Testimoni yang sudah dipublikasikan Ascendemy (Instagram @ascendemy.ofc, Telegram blast, website)
 * - Review Google atau kutipan siswa yang izin namanya sudah diperoleh
 * - Data AMO / TKA yang memang dipublikasikan Ascendemy
 *
 * Pastikan nama, sekolah, dan angka hasil sudah disetujui sebelum tayang.
 * Jangan menampilkan data fiktif sebagai fakta — ini merusak kredibilitas
 * dan berisiko pada aturan iklan.
 */
export const testimonials: Testimonial[] = [
	{
		name: 'Nadia Prameswari',
		school: 'SMA Negeri 2 Surabaya',
		city: 'Surabaya',
		program: 'Tryout TKA',
		quote:
			'Dulu saya latihan asal-asalan tiap malam. Setelah rutin tryout, saya paham soal mana yang biasanya bikin kelar.',
		before: 54,
		after: 81,
		metric: 'Skor tryout TKA',
		featured: true,
	},
	{
		name: 'Rizky Firmansyah',
		school: 'SMK Negeri 1 Malang',
		city: 'Malang',
		program: 'Latihan',
		quote:
			'Pembahasannya stepwise, jadi saya tahu salahnya di langkah mana — bukan cuma tahu jawaban akhirnya.',
		before: 48,
		after: 76,
		metric: 'Skor tryout',
	},
	{
		name: 'Aulia Rahmadani',
		school: 'SMA Islam Gemilang',
		city: 'Bandung',
		program: 'Tryout TKA',
		quote:
			'Timer dan navigasi soal seperti ujian sungguhan. Dalam tiga paket pertama, nilai tryout saya sudah naik jauh.',
		before: 41,
		after: 72,
		metric: 'Skor tryout TKA',
	},
	{
		name: 'Bagas Wicaksono',
		school: 'SMA Kristen Sedulur',
		city: 'Surabaya',
		program: 'AMO 2026',
		quote:
			'AMO bikin saya latihan serius, dan e-sertifikatnya langsung saya pakai untuk portfolio.',
		before: 36,
		after: 68,
		metric: 'Skor seleksi AMO',
	},
];
