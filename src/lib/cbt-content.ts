import { cbtOrigin } from './cbt-api';

/**
 * Resolve a relative CBT path against the configured API origin.
 * Unsafe javascript: links are discarded so they never reach the DOM.
 */
export function absoluteUrl(value: string): string {
	if (!value || value.startsWith('#') || /^(https?:)?\/\//i.test(value) || /^(mailto|tel):/i.test(value)) {
		return value;
	}

	if (/^javascript:/i.test(value)) return '';

	return new URL(value, `${cbtOrigin}/`).toString();
}

/**
 * Insert trusted CBT article/material HTML after removing executable nodes,
 * normalising relative media URLs, and hardening external links.
 */
export function renderContent(html: string, target: HTMLElement): void {
	const template = document.createElement('template');
	template.innerHTML = html ?? '';

	template.content.querySelectorAll('script, style, link').forEach((node) => node.remove());

	template.content.querySelectorAll<HTMLElement>('*').forEach((node) => {
		Array.from(node.attributes).forEach((attribute) => {
			if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
		});
	});

	template.content.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
		const src = image.getAttribute('src');
		if (src) image.src = absoluteUrl(src);

		image.removeAttribute('srcset');
		image.loading = 'lazy';
		image.decoding = 'async';
	});

	template.content.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
		const href = link.getAttribute('href');
		if (!href) return;

		const absolute = absoluteUrl(href);
		if (!absolute) link.removeAttribute('href');
		else link.setAttribute('href', absolute);

		if (/^https?:\/\//i.test(absolute) && !absolute.startsWith(cbtOrigin)) {
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
		}
	});

	template.content.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => {
		const src = frame.getAttribute('src');
		if (src) frame.src = absoluteUrl(src);

		frame.loading = 'lazy';
	});

	template.content.querySelectorAll<HTMLSourceElement>('source').forEach((source) => {
		const src = source.getAttribute('src');
		if (src) source.src = absoluteUrl(src);
	});

	target.replaceChildren(template.content);
}
