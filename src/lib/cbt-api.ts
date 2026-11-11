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

export type ResourceType = 'worksheet' | 'material' | 'game';
export type ResourceFileType = 'pdf' | 'image';

export interface CbtResource {
	id: number;
	slug: string;
	type: ResourceType;
	title: string;
	excerpt: string;
	thumbnail_url: string | null;
	subject: string | null;
	level: string | null;
	file_url: string | null;
	file_type: ResourceFileType | null;
	external_url: string | null;
	is_featured: boolean;
	published_at: string;
}

export interface CbtResourceDetail extends CbtResource {
	content: string | null;
	game_key: string | null;
	game_config: unknown | null;
}

export interface ResourceTypeMeta {
	label: string;
	tone: 'green' | 'blue' | 'orange';
	cta: string;
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

export class CbtApiError extends Error {
	readonly status: number;

	constructor(status: number) {
		super(`CBT API request failed: ${status}`);
		this.name = 'CbtApiError';
		this.status = status;
	}
}

export function articleUrl(slug: string): string {
	return `/blog/artikel?slug=${encodeURIComponent(slug)}`;
}

export function tagUrl(tag: string): string {
	const value = tag.trim();
	return value ? `/blog?tag=${encodeURIComponent(value)}` : '/blog';
}

export function resourceUrl(slug: string): string {
	return `/resource/detail?slug=${encodeURIComponent(slug)}`;
}

const RESOURCE_TYPE_META: Record<ResourceType, ResourceTypeMeta> = {
	worksheet: { label: 'Worksheet', tone: 'green', cta: 'Unduh worksheet' },
	material: { label: 'Materi', tone: 'blue', cta: 'Baca materi' },
	game: { label: 'Games', tone: 'orange', cta: 'Mainkan game' },
};

export function resourceTypeMeta(type: ResourceType): ResourceTypeMeta {
	return RESOURCE_TYPE_META[type] ?? RESOURCE_TYPE_META.worksheet;
}

export async function fetchCbt<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	headers.set('Accept', 'application/json');

	const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
		...init,
		headers,
	});

	if (!response.ok) {
		throw new CbtApiError(response.status);
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
