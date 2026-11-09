export interface NavLink {
	label: string;
	href: string;
}

export interface SocialLink {
	label: string;
	href: string;
	icon: string;
}

export interface ContactLine {
	icon: string;
	label: string;
	href?: string;
	external?: boolean;
}

export const navLinks: NavLink[] = [
	{ label: 'Beranda', href: '#beranda' },
	{ label: 'Latihan', href: '#latihan' },
	{ label: 'Tryout', href: '#tryout' },
	{ label: 'Berita', href: '/berita' },
	{ label: 'Harga', href: '#harga' },
];

export const socialLinks: SocialLink[] = [
	{ label: 'Facebook Ascendemy', href: 'https://www.facebook.com/share/1CLzDDwzfW/', icon: 'facebook' },
	{ label: 'X Ascendemy', href: 'https://x.com/ascendemy', icon: 'x' },
	{ label: 'Instagram Ascendemy', href: 'https://www.instagram.com/ascendemy.ofc/', icon: 'instagram' },
	{ label: 'LinkedIn Ascendemy', href: 'https://www.linkedin.com/company/ascendemy/', icon: 'linkedin' },
	{ label: 'TikTok Ascendemy', href: 'https://www.tiktok.com/@ascendemy.id', icon: 'tiktok' },
	{ label: 'YouTube Ascendemy', href: 'https://www.youtube.com/@Ascendemy_Official', icon: 'youtube' },
];

export const contactLines: ContactLine[] = [
	{ icon: 'mail', label: 'ascendemyofficial@gmail.com', href: 'mailto:ascendemyofficial@gmail.com' },
	{ icon: 'phone', label: '+62 856-5556-0845', href: 'tel:+6285655560845' },
	{ icon: 'map', label: 'PIBT Unesa Kampus 2, Surabaya, Jawa Timur' },
	{
		icon: 'users',
		label: 'Inkubator Bisnis Unesa',
		href: 'https://sipensi.umkm.go.id/inkubators/11',
		external: true,
	},
];
