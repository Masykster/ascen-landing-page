export interface CbtStats {
	packages: number;
	questions: number;
	students: number;
	traffic_today: number;
}

export interface CbtNews {
	id: number;
	slug: string;
	title: string;
	excerpt: string;
	category: string;
	tags: string[];
	cover_image_url: string | null;
	published_at: string;
	is_pinned: boolean;
}

export interface CbtNewsDetail extends CbtNews {
	content: string;
	author: string;
	seo_description: string | null;
}

export interface CbtTestimonial {
	id: number;
	student_name: string;
	school_name: string;
	subject_label: string;
	event_name: string;
	rating: number;
	cbt_score: number | null;
	quote: string;
	avatar_url: string;
	sort_order: number;
}

export interface ApiResponse<T> {
	success: boolean;
	count?: number;
	data: T;
}

const configuredUrl = import.meta.env.PUBLIC_CBT_API_URL?.trim();

const baseUrl = (
	configuredUrl ||
	(import.meta.env.DEV ? 'http://localhost:8000/api' : 'https://cbt.ascendemy.id/api')
).replace(/\/+$/, '');

export const cbtOrigin = new URL(baseUrl).origin;

export function articleUrl(slug: string): string {
	return `/blog/artikel?slug=${encodeURIComponent(slug)}`;
}

export function tagUrl(tag: string): string {
	const value = tag.trim();
	return value ? `/blog?tag=${encodeURIComponent(value)}` : '/blog';
}

export async function fetchCbt<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	headers.set('Accept', 'application/json');

	const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
		...init,
		headers,
	});

	if (!response.ok) {
		throw new Error(`CBT API request failed: ${response.status}`);
	}

	return response.json() as Promise<T>;
}

export function formatDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(date);
}

export function initials(name: string): string {
	const value = name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word.charAt(0))
		.join('')
		.toUpperCase();

	return value || '?';
}
