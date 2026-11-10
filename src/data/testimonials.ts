export interface Testimonial {
	name: string;
	school: string;
	program: string;
	quote: string;
	score: number | null;
	rating: number;
	avatarUrl?: string;
}

/**
 * Fallback statis saat API CBT belum tersedia.
 *
 * Sumber utama testimoni adalah CBT App -> Informasi & Marketing -> Testimoni.
 * Data di bawah hanya dipakai bila request API gagal.
 */
export const testimonials: Testimonial[] = [
	{
		name: 'Nadia Prameswari',
		school: 'SMA Negeri 2 Surabaya',
		program: 'Tryout TKA',
		quote:
			'Dulu saya latihan asal-asalan tiap malam. Setelah rutin tryout, saya paham soal mana yang biasanya bikin kelar.',
		score: 81,
		rating: 5,
	},
	{
		name: 'Rizky Firmansyah',
		school: 'SMK Negeri 1 Malang',
		program: 'Latihan',
		quote:
			'Pembahasannya stepwise, jadi saya tahu salahnya di langkah mana — bukan cuma tahu jawaban akhirnya.',
		score: 76,
		rating: 5,
	},
	{
		name: 'Aulia Rahmadani',
		school: 'SMA Islam Gemilang',
		program: 'Tryout TKA',
		quote:
			'Timer dan navigasi soal seperti ujian sungguhan. Dalam tiga paket pertama, nilai tryout saya sudah naik jauh.',
		score: 72,
		rating: 5,
	},
	{
		name: 'Bagas Wicaksono',
		school: 'SMA Kristen Sedulur',
		program: 'AMO 2026',
		quote:
			'AMO bikin saya latihan serius, dan e-sertifikatnya langsung saya pakai untuk portfolio.',
		score: 68,
		rating: 5,
	},
];
