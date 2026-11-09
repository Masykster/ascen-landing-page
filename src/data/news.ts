import type { ImageMetadata } from 'astro';
import news1 from '../assets/images/news-1.jpg';
import news2 from '../assets/images/news-2.jpg';
import news3 from '../assets/images/news-3.jpg';
import news4 from '../assets/images/news-4.jpg';

export interface NewsItem {
	href: string;
	image: ImageMetadata;
	alt: string;
	date: string;
	category: string;
	title: string;
	excerpt?: string;
	pinned?: boolean;
}

export const featuredNews: NewsItem = {
	href: 'https://ascendemy.id/news/news-detail.php?slug=olimpiade-matematika-nasional-gratis-untuk-siswa-sma-peserta-dapat-e-sertifikat',
	image: news1,
	alt: 'Banner Olimpiade Matematika Nasional Ascendemy 2026',
	date: '4 Agustus 2026',
	category: 'Kompetisi',
	title: 'Olimpiade Matematika Nasional gratis untuk siswa SMA, peserta dapat e-sertifikat',
	excerpt:
		'Ascendemy resmi membuka pendaftaran Ascendemy Mathematics Olympiad (AMO) 2026, kompetisi matematika tingkat nasional untuk siswa SMA/MA/SMK di seluruh Indonesia.',
	pinned: true,
};

export const newsItems: NewsItem[] = [
	{
		href: 'https://ascendemy.id/news/news-detail.php?slug=siswa-smk-wajib-ikut-tka-empat-hari-bagaimana-jika-sedang-pkl',
		image: news2,
		alt: 'Siswa SMK mengikuti pembelajaran di laboratorium',
		date: '13 Oktober 2026',
		category: 'TKA',
		title: 'Siswa SMK wajib ikut TKA empat hari, bagaimana jika sedang PKL?',
	},
	{
		href: 'https://ascendemy.id/news/news-detail.php?slug=dari-sains-hingga-ips-686-finalis-unjuk-kemampuan-di-osn-2026',
		image: news3,
		alt: 'Finalis Olimpiade Sains Nasional 2026',
		date: '12 Oktober 2026',
		category: 'OSN',
		title: 'Dari sains hingga IPS, 686 finalis unjuk kemampuan di OSN 2026',
	},
	{
		href: 'https://ascendemy.id/news/news-detail.php?slug=hasil-tka-smasmk-2026-bisa-diakses-sendiri-catat-tanggal-pengumumannya',
		image: news4,
		alt: 'Halaman informasi Tes Kemampuan Akademik',
		date: '12 Oktober 2026',
		category: 'TKA',
		title: 'Hasil TKA SMA/SMK 2026 bisa diakses sendiri, catat tanggal pengumumannya',
	},
];

export const allNews: NewsItem[] = [featuredNews, ...newsItems];
