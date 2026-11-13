import {
	highlightRuns,
	matches,
	nextFocus,
	snippet,
	type SlitTypeFaqLabels,
} from '../lib/slit-type-faq';

interface ClientItemConfig {
	id: string;
	question: string;
	answerText: string;
	category: string | null;
}

interface ClientConfig {
	single: boolean;
	syncHash: boolean;
	labels: SlitTypeFaqLabels;
	items: ClientItemConfig[];
	initialOpen: string[];
}

function renderMarkedRuns(container: HTMLElement, text: string, query: string): void {
	const frag = document.createDocumentFragment();
	const runs = highlightRuns(text, query);
	for (const run of runs) {
		if (run.hit) {
			const mark = document.createElement('mark');
			mark.className = 'stf-mark';
			mark.textContent = run.text;
			frag.appendChild(mark);
		} else {
			frag.appendChild(document.createTextNode(run.text));
		}
	}
	container.replaceChildren(frag);
}

/** Walks text nodes inside an HTML answer container so matches are marked without breaking links/formatting. */
function renderMarkedAnswer(
	container: HTMLElement,
	pristineNodes: DocumentFragment,
	query: string,
): void {
	const clone = pristineNodes.cloneNode(true) as DocumentFragment;
	if (!query.trim()) {
		container.replaceChildren(clone);
		return;
	}

	const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let current = walker.nextNode();
	while (current) {
		if (current.nodeType === Node.TEXT_NODE && current.nodeValue) {
			textNodes.push(current as Text);
		}
		current = walker.nextNode();
	}

	for (const tn of textNodes) {
		const value = tn.nodeValue ?? '';
		const runs = highlightRuns(value, query);
		if (runs.length === 1 && !runs[0].hit) continue;

		const frag = document.createDocumentFragment();
		for (const run of runs) {
			if (run.hit) {
				const mark = document.createElement('mark');
				mark.className = 'stf-mark';
				mark.textContent = run.text;
				frag.appendChild(mark);
			} else {
				frag.appendChild(document.createTextNode(run.text));
			}
		}
		tn.parentNode?.replaceChild(frag, tn);
	}

	container.replaceChildren(clone);
}

export function initSlitTypeFaq(root: HTMLElement): () => void {
	if (root.dataset.stfInit === '1') return () => {};
	root.dataset.stfInit = '1';

	const configEl = root.querySelector<HTMLScriptElement>('script[data-stf-config]');
	if (!configEl || !configEl.textContent) return () => {};

	let config: ClientConfig;
	try {
		config = JSON.parse(configEl.textContent) as ClientConfig;
	} catch {
		return () => {};
	}

	const { single, syncHash, labels, items, initialOpen } = config;
	const itemMap = new Map(items.map((it) => [it.id, it]));
	const fullTexts = new Map(items.map((it) => [it.id, `${it.question} ${it.answerText}`]));

	const reduced = () =>
		typeof window !== 'undefined' &&
		Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

	// 1. Slit headline reveal via viewport check + IntersectionObserver on headline
	let io: IntersectionObserver | null = null;
	let introSafetyTimer: number | undefined;
	const titleEl = root.querySelector<HTMLElement>('.stf-title') ?? root;
	const markIntroDone = () => {
		root.dataset.intro = 'done';
	};

	const isInitiallyVisible = () => {
		const rect = titleEl.getBoundingClientRect();
		return rect.top < window.innerHeight * 0.98 && rect.bottom > 0;
	};

	if (reduced() || typeof IntersectionObserver === 'undefined') {
		markIntroDone();
	} else if (isInitiallyVisible()) {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(markIntroDone);
		});
		introSafetyTimer = window.setTimeout(markIntroDone, 400);
	} else {
		io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					window.requestAnimationFrame(markIntroDone);
					io?.disconnect();
					io = null;
				}
			},
			{ threshold: 0.1 },
		);
		io.observe(titleEl);
		introSafetyTimer = window.setTimeout(markIntroDone, 2500);
	}

	// 2. DOM references
	const tickerEl = root.querySelector<HTMLElement>('[data-stf-ticker]');
	const tickerToggle = root.querySelector<HTMLButtonElement>('[data-stf-ticker-toggle]');
	const pauseSvg = tickerToggle?.querySelector<SVGElement>('.stf-icon-pause') ?? null;
	const playSvg = tickerToggle?.querySelector<SVGElement>('.stf-icon-play') ?? null;

	const searchInput = root.querySelector<HTMLInputElement>('[data-stf-search]');
	const clearBtn = root.querySelector<HTMLButtonElement>('[data-stf-clear]');
	const countEl = root.querySelector<HTMLElement>('[data-stf-count]');

	const catButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-stf-cat-btn]'));
	const catCounts = Array.from(root.querySelectorAll<HTMLElement>('[data-stf-cat-count]'));

	const listEl = root.querySelector<HTMLUListElement>('[data-stf-list]');
	const emptyEl = root.querySelector<HTMLElement>('[data-stf-empty]');
	const emptyMsgEl = root.querySelector<HTMLElement>('[data-stf-empty-msg]');
	const resetBtn = root.querySelector<HTMLButtonElement>('[data-stf-reset]');
	const liveEl = root.querySelector<HTMLElement>('[data-stf-live]');

	interface ItemDom {
		id: string;
		li: HTMLLIElement;
		btn: HTMLButtonElement;
		qSpans: HTMLElement[];
		snippetSpans: HTMLElement[];
		textEl: HTMLElement | null;
		pristineAnswer: DocumentFragment | null;
		copyBtn: HTMLButtonElement | null;
	}

	const itemDoms: ItemDom[] = [];
	const itemDomById = new Map<string, ItemDom>();

	root.querySelectorAll<HTMLLIElement>('[data-stf-item]').forEach((li) => {
		const id = li.dataset.stfItem;
		const btn = li.querySelector<HTMLButtonElement>('[data-stf-btn]');
		if (!id || !btn) return;

		const textEl = li.querySelector<HTMLElement>('[data-stf-text]');
		let pristineAnswer: DocumentFragment | null = null;
		if (textEl) {
			pristineAnswer = document.createDocumentFragment();
			Array.from(textEl.childNodes).forEach((node) => {
				pristineAnswer!.appendChild(node.cloneNode(true));
			});
		}

		const dom: ItemDom = {
			id,
			li,
			btn,
			qSpans: Array.from(li.querySelectorAll<HTMLElement>('[data-stf-q]')),
			snippetSpans: Array.from(li.querySelectorAll<HTMLElement>('[data-stf-snippet]')),
			textEl,
			pristineAnswer,
			copyBtn: li.querySelector<HTMLButtonElement>('[data-stf-copy]'),
		};
		itemDoms.push(dom);
		itemDomById.set(id, dom);
	});

	// 3. Mutable state
	let openIds = [...initialOpen];
	let closingIds: string[] = [];
	let query = '';
	let activeCategory: string | null = null;
	let copiedId: string | null = null;
	let tickerPaused = false;
	const closeTimers: Record<string, number> = {};
	let copyTimer: number | undefined;

	const getVisibleDoms = (): ItemDom[] =>
		itemDoms.filter(({ id }) => {
			const meta = itemMap.get(id);
			const text = fullTexts.get(id) ?? '';
			if (!meta) return false;
			return (!activeCategory || meta.category === activeCategory) && matches(text, query);
		});

	const syncRowStates = () => {
		for (const dom of itemDoms) {
			const isOpen = openIds.includes(dom.id);
			const isClosing = !isOpen && closingIds.includes(dom.id);
			const state = isOpen ? 'open' : isClosing ? 'closing' : 'closed';
			dom.li.dataset.state = state;
			dom.btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		}
	};

	const syncFilterAndHighlight = () => {
		const visible = getVisibleDoms();
		const visibleSet = new Set(visible.map((d) => d.id));
		const qTrim = query.trim();
		const filtering = qTrim !== '' || activeCategory !== null;

		if (clearBtn) clearBtn.hidden = query.length === 0;
		if (countEl) {
			countEl.textContent = filtering
				? `${visible.length} ${labels.ofWord} ${items.length} ${labels.questionsSuffix}`
				: '';
		}

		// Category chip counts reflect active search query
		const counts: Record<string, number> = {};
		let allMatching = 0;
		for (const it of items) {
			const fullText = fullTexts.get(it.id) ?? '';
			if (matches(fullText, query)) {
				allMatching++;
				if (it.category) counts[it.category] = (counts[it.category] || 0) + 1;
			}
		}

		for (const el of catCounts) {
			const cat = el.dataset.stfCatCount ?? '';
			el.textContent = cat === '' ? String(allMatching) : String(counts[cat] || 0);
		}

		for (const btn of catButtons) {
			const cat = btn.dataset.stfCatBtn || null;
			btn.setAttribute('aria-pressed', activeCategory === cat ? 'true' : 'false');
		}

		for (const dom of itemDoms) {
			const isVisible = visibleSet.has(dom.id);
			dom.li.hidden = !isVisible;
			if (!isVisible) continue;

			const meta = itemMap.get(dom.id);
			if (!meta) continue;

			const isOpen = openIds.includes(dom.id);

			for (const qEl of dom.qSpans) {
				renderMarkedRuns(qEl, meta.question, query);
			}

			const excerpt = qTrim && !isOpen ? snippet(meta.answerText, query) : '';
			for (const sEl of dom.snippetSpans) {
				if (excerpt) {
					renderMarkedRuns(sEl, excerpt, query);
					sEl.hidden = false;
				} else {
					sEl.replaceChildren();
					sEl.hidden = true;
				}
			}

			if (dom.textEl && dom.pristineAnswer) {
				renderMarkedAnswer(dom.textEl, dom.pristineAnswer, query);
			}
		}

		if (listEl) listEl.hidden = visible.length === 0;
		if (emptyEl) emptyEl.hidden = visible.length > 0;
		if (emptyMsgEl && visible.length === 0) {
			emptyMsgEl.textContent = `${labels.emptyPrefix}${qTrim || activeCategory || ''}${labels.emptySuffix}`;
		}
	};

	const setOpenIds = (next: string[]) => {
		const prev = openIds;
		const added = next.filter((id) => !prev.includes(id));
		const removed = prev.filter((id) => !next.includes(id));

		openIds = next;

		if (added.length) {
			for (const id of added) window.clearTimeout(closeTimers[id]);
			closingIds = closingIds.filter((id) => !added.includes(id));
		}

		if (removed.length && !reduced()) {
			closingIds = [...closingIds.filter((id) => !removed.includes(id)), ...removed];
			for (const id of removed) {
				window.clearTimeout(closeTimers[id]);
				closeTimers[id] = window.setTimeout(() => {
					closingIds = closingIds.filter((c) => c !== id);
					syncRowStates();
				}, 300);
			}
		}

		syncRowStates();
		syncFilterAndHighlight();
	};

	const toggleItem = (id: string) => {
		const isOpen = openIds.includes(id);
		const next = isOpen
			? openIds.filter((o) => o !== id)
			: single
				? [id]
				: [...openIds, id];
		setOpenIds(next);

		if (syncHash && typeof history !== 'undefined') {
			const ownHash = decodeURIComponent(location.hash.replace(/^#/, '')) === id;
			if (!isOpen || ownHash) {
				history.replaceState(
					history.state,
					'',
					location.pathname + location.search + (isOpen ? '' : `#${id}`),
				);
			}
		}
	};

	// 4. Event handlers
	const onTickerClick = () => {
		tickerPaused = !tickerPaused;
		if (tickerEl) tickerEl.dataset.paused = tickerPaused ? 'true' : 'false';
		if (tickerToggle) {
			tickerToggle.setAttribute('aria-pressed', tickerPaused ? 'true' : 'false');
			tickerToggle.setAttribute(
				'aria-label',
				tickerPaused ? labels.playTicker : labels.pauseTicker,
			);
		}
		if (pauseSvg) pauseSvg.toggleAttribute('hidden', tickerPaused);
		if (playSvg) playSvg.toggleAttribute('hidden', !tickerPaused);
	};
	tickerToggle?.addEventListener('click', onTickerClick);

	const onSearchInput = () => {
		query = searchInput?.value ?? '';
		syncFilterAndHighlight();
	};

	const onSearchKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && query) {
			e.preventDefault();
			query = '';
			if (searchInput) searchInput.value = '';
			syncFilterAndHighlight();
			return;
		}
		if (e.key === 'ArrowDown') {
			const visible = getVisibleDoms();
			if (visible.length) {
				e.preventDefault();
				visible[0].btn.focus();
			}
		}
	};

	searchInput?.addEventListener('input', onSearchInput);
	searchInput?.addEventListener('keydown', onSearchKeyDown);

	const onClearClick = () => {
		query = '';
		if (searchInput) {
			searchInput.value = '';
			searchInput.focus();
		}
		syncFilterAndHighlight();
	};
	clearBtn?.addEventListener('click', onClearClick);

	const onResetClick = () => {
		query = '';
		activeCategory = null;
		if (searchInput) searchInput.value = '';
		syncFilterAndHighlight();
		searchInput?.focus();
	};
	resetBtn?.addEventListener('click', onResetClick);

	const catHandlers: Array<{ btn: HTMLButtonElement; handler: () => void }> = [];
	for (const btn of catButtons) {
		const handler = () => {
			const cat = btn.dataset.stfCatBtn || null;
			activeCategory = cat === null ? null : activeCategory === cat ? null : cat;
			syncFilterAndHighlight();
		};
		btn.addEventListener('click', handler);
		catHandlers.push({ btn, handler });
	}

	const itemBtnHandlers: Array<{ btn: HTMLButtonElement; click: () => void; key: (e: KeyboardEvent) => void }> = [];
	for (const dom of itemDoms) {
		const click = () => toggleItem(dom.id);
		const key = (e: KeyboardEvent) => {
			const visible = getVisibleDoms();
			const pos = visible.findIndex((v) => v.id === dom.id);
			if (pos < 0) return;
			const to = nextFocus(e.key, pos, visible.length);
			if (to < 0) return;
			e.preventDefault();
			visible[to]?.btn.focus();
		};
		dom.btn.addEventListener('click', click);
		dom.btn.addEventListener('keydown', key);
		itemBtnHandlers.push({ btn: dom.btn, click, key });
	}

	const copyHandlers: Array<{ btn: HTMLButtonElement; handler: () => void }> = [];
	const syncCopyLabels = () => {
		for (const dom of itemDoms) {
			if (dom.copyBtn) {
				dom.copyBtn.textContent = copiedId === dom.id ? labels.linkCopied : labels.copyLink;
			}
		}
		if (liveEl) liveEl.textContent = copiedId ? labels.linkCopied : '';
	};

	const copyLink = async (id: string) => {
		const url = `${location.origin}${location.pathname}${location.search}#${id}`;
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = url;
			ta.setAttribute('readonly', '');
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand('copy');
			} catch {
				/* fallback exhausted */
			}
			ta.remove();
		}
		copiedId = id;
		syncCopyLabels();
		window.clearTimeout(copyTimer);
		copyTimer = window.setTimeout(() => {
			copiedId = null;
			syncCopyLabels();
		}, 1800);
	};

	for (const dom of itemDoms) {
		if (!dom.copyBtn) continue;
		const handler = () => void copyLink(dom.id);
		dom.copyBtn.addEventListener('click', handler);
		copyHandlers.push({ btn: dom.copyBtn, handler });
	}

	// 5. #hash deep linking
	const fromHash = () => {
		const h = decodeURIComponent(location.hash.replace(/^#/, ''));
		if (!h || !itemDomById.has(h)) return;

		const visible = getVisibleDoms();
		if (!visible.some((v) => v.id === h)) {
			query = '';
			activeCategory = null;
			if (searchInput) searchInput.value = '';
		}

		if (!openIds.includes(h)) {
			setOpenIds(single ? [h] : [...openIds, h]);
		} else {
			syncFilterAndHighlight();
		}

		const target = itemDomById.get(h);
		window.setTimeout(() => {
			target?.btn.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
		}, 60);
	};

	fromHash();
	window.addEventListener('hashchange', fromHash);

	// Initial state sync
	syncRowStates();
	syncFilterAndHighlight();

	return () => {
		io?.disconnect();
		window.clearTimeout(introSafetyTimer);
		window.clearTimeout(copyTimer);
		Object.values(closeTimers).forEach((t) => window.clearTimeout(t));
		window.removeEventListener('hashchange', fromHash);
		tickerToggle?.removeEventListener('click', onTickerClick);
		searchInput?.removeEventListener('input', onSearchInput);
		searchInput?.removeEventListener('keydown', onSearchKeyDown);
		clearBtn?.removeEventListener('click', onClearClick);
		resetBtn?.removeEventListener('click', onResetClick);
		catHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
		itemBtnHandlers.forEach(({ btn, click, key }) => {
			btn.removeEventListener('click', click);
			btn.removeEventListener('keydown', key);
		});
		copyHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
	};
}

document.querySelectorAll<HTMLElement>('[data-stf-root]').forEach((root) => {
	initSlitTypeFaq(root);
});
