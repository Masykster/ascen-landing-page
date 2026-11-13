import type { FaqItem, SlitTypeFaqContact } from '../lib/slit-type-faq';

export const faqCategories: string[] = [
	'Umum',
	'Akun & Aturan',
	'Paket & Akses',
	'Pembayaran',
];

export const faqTicker: string[] = [
	'Latihan Soal',
	'Tryout TKA',
	'Olimpiade Matematika',
	'Pembayaran QRIS',
	'Pembahasan Lengkap',
	'Akses Instan',
];

export const faqContact: SlitTypeFaqContact = {
	prompt: 'Masih punya pertanyaan?',
	label: 'Email tim Ascendemy',
	href: 'mailto:ascendemyofficial@gmail.com',
};

export const faqItems: FaqItem[] = [
	{
		category: 'Umum',
		question: 'Apa itu Ascendemy.id?',
		answerHtml:
			'Ascendemy.id adalah platform <em>Computer Based Test</em> (CBT) yang menyediakan paket <strong>Latihan Soal</strong>, <strong>Tryout &amp; Simulasi Ujian</strong>, serta <strong>Kompetisi/Olimpiade</strong> untuk berbagai jenjang, dari SD hingga umum.',
	},
	{
		category: 'Akun & Aturan',
		question: 'Bagaimana cara mendaftar akun?',
		answerHtml:
			'Klik tombol <strong>Daftar / Masuk Aplikasi CBT</strong>, lalu isi nama, email/nomor HP, dan jenjang. Gunakan data yang benar karena dipakai untuk verifikasi transaksi dan penerbitan sertifikat (bila ada). Satu akun hanya untuk satu pengguna.',
	},
	{
		category: 'Paket & Akses',
		question: 'Bagaimana cara membeli paket latihan, tryout, atau kompetisi?',
		answerHtml:
			'Pilih paket pada katalog Latihan, Tryout, atau Kompetisi → klik untuk membuka <strong>Detail Paket</strong> → klik <strong>Beli/Daftar</strong> → selesaikan pembayaran. Akses aktif setelah pembayaran terverifikasi. Jika pembayaran berhasil tetapi akses belum terbuka maksimal 1×24 jam, hubungi kami dengan bukti pembayaran.',
	},
	{
		category: 'Pembayaran',
		question: 'Metode pembayaran apa saja yang tersedia?',
		answerHtml:
			'Tersedia <strong>QRIS</strong>, transfer bank (<strong>BSI, Mandiri, BNI, BRI, Permata, CIMB Niaga</strong>), dan dompet digital seperti <strong>GoPay</strong>. Pesanan yang belum dibayar hingga batas waktu yang ditentukan akan otomatis kedaluwarsa.',
	},
	{
		category: 'Paket & Akses',
		question: 'Berapa lama masa akses paket?',
		answerHtml:
			'Mengikuti keterangan pada tiap paket, misalnya <strong>X Bulan</strong> atau <strong>Akses Penuh</strong>. Untuk tryout dan kompetisi terjadwal, perhatikan periode pendaftaran serta jadwal mulai dan tutup ujian yang tercantum di halaman paket.',
	},
	{
		category: 'Pembayaran',
		question: 'Apakah dana dapat dikembalikan?',
		answerHtml:
			'Dana bersifat <strong>non-refundable</strong>, kecuali untuk <strong>pembayaran ganda</strong>, paket yang <strong>tidak bisa diakses karena kesalahan sistem kami</strong>, atau <strong>event yang dibatalkan penyelenggara</strong>. Pengajuan disampaikan maksimal 7 hari kalender sejak pembayaran. Selengkapnya lihat <a href="/syarat-ketentuan">Syarat &amp; Ketentuan</a>.',
	},
	{
		category: 'Akun & Aturan',
		question: 'Apa aturan dan sanksi kecurangan?',
		answerHtml:
			'Dilarang <strong>joki</strong> (dikerjakan orang lain), berbagi jawaban, serta menyalin/menyebarluaskan soal dan pembahasan. Pelanggaran dapat berakibat <strong>pembatalan nilai, diskualifikasi, atau penangguhan akun</strong> tanpa pengembalian dana.',
	},
	{
		category: 'Umum',
		question: 'Bagaimana jika saya mengalami kendala?',
		answerHtml:
			'Hubungi <a href="mailto:ascendemyofficial@gmail.com">ascendemyofficial@gmail.com</a> atau <a href="tel:+6285655560845">+62 856-5556-0845</a> dengan menyertakan bukti pembayaran atau tangkapan layar kendala agar terbantu lebih cepat.',
	},
];
