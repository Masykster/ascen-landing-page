import {
	RDF_BAYER,
	RIDGELINE_PRESETS,
	rdfDither,
	rdfEase,
	rdfElevation,
	rdfFbm,
	rdfHash,
	rdfHex,
	rdfNoise,
	rdfPack,
	rdfRidgeline,
	rdfSmooth,
} from '../lib/ridgeline-dither';

function parseNum(val: string | undefined, fallback: number): number {
	if (val === undefined || val === '') return fallback;
	const n = Number(val);
	return Number.isFinite(n) ? n : fallback;
}

function parseBool(val: string | undefined, fallback: boolean): boolean {
	if (val === undefined || val === '') return fallback;
	return val !== 'false' && val !== '0';
}

export function initRidgelineFooter(root: HTMLElement): () => void {
	const scene = root.querySelector<HTMLDivElement>('[data-rdf-scene]');
	const canvas = root.querySelector<HTMLCanvasElement>('[data-rdf-canvas]');
	const alt = root.querySelector<HTMLDivElement>('[data-rdf-alt]');
	const altText = root.querySelector<HTMLSpanElement>('[data-rdf-alt-text]');

	if (!scene || !canvas) return () => {};
	const ctx = canvas.getContext('2d');
	if (!ctx) return () => {};

	const presetAttr = root.dataset.rdfPreset || 'polar';
	const seed = Math.round(parseNum(root.dataset.rdfSeed, 7));
	const layers = Math.max(2, Math.min(9, Math.round(parseNum(root.dataset.rdfRidges, 6))));
	const pixel = Math.max(1, Math.round(parseNum(root.dataset.rdfPixel, 2)));
	const mist = parseNum(root.dataset.rdfMist, 0.8);
	const drift = parseNum(root.dataset.rdfDrift, 1);
	const radius = parseNum(root.dataset.rdfRadius, 130);
	const interactive = parseBool(root.dataset.rdfInteractive, true);
	const altimeter = parseBool(root.dataset.rdfAltimeter, true);

	const parseTones = (raw: string | undefined): string[] => {
		const list = (raw || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		return list.length >= 2 ? list : RIDGELINE_PRESETS.polar.tones;
	};

	let currentTones = parseTones(root.dataset.rdfTones);
	const buildPalette = (tones: string[]) =>
		new Uint32Array(tones.map((t) => rdfPack(rdfHex(t) || [128, 128, 128])));

	let pal = buildPalette(currentTones);
	let nTones = pal.length;

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let revealAt: number | null = reduced ? -Infinity : null;
	if (reduced) {
		root.classList.add('rdf-in');
	}

	let p = 2;
	let cols = 1;
	let rows = 1;
	let margin = 2;
	let img: ImageData | null = null;
	let buf = new Uint32Array(0);
	let tops: Float32Array[] = [];
	let pools: Float32Array[] = [];
	let colTop = new Float32Array(0);
	let colSlope = new Float32Array(0);
	let colPool = new Float32Array(0);
	let fog = new Float32Array(0);
	let fw = 1;
	let fh = 1;
	let ceil = 0;
	let fadeTo = 1;

	let raf = 0;
	let visible = true;
	let awake = true;
	let lastDraw = 0;
	let lastTick = performance.now();

	// Pointer in grid cells: target and eased.
	let tx = 0;
	let ty = 0;
	let ex = 0;
	let ey = 0;
	let inside = false;
	let clear = 0;

	// Parallax in -1..1, target and eased.
	let pt = 0;
	let pe = 0;
	let windV = 0;
	let windX = 0;
	let altShown = false;
	let altLabel = '';

	const layout = () => {
		const rect = scene.getBoundingClientRect();
		p = Math.max(1, Math.round(pixel));
		cols = Math.max(8, Math.ceil(rect.width / p));
		rows = Math.max(8, Math.ceil(rect.height / p));
		canvas.width = cols;
		canvas.height = rows;
		canvas.style.width = `${cols * p}px`;
		canvas.style.height = `${rows * p}px`;
		img = ctx.createImageData(cols, rows);
		buf = new Uint32Array(img.data.buffer);
		margin = Math.ceil(cols * 0.045) + 3;
		ceil = Math.max(rows * 0.17, 92 / p);
		fadeTo = Math.max(rows * 0.3, 128 / p);
		tops = [];
		pools = [];

		for (let i = 0; i < layers; i++) {
			const t = rdfRidgeline(cols, rows, i, layers, seed, margin);
			// Keep every crest clear of the copyright line, which overlaps the top of the range.
			for (let x = 0; x < t.length; x++) {
				const tv = t[x] ?? 0;
				if (tv < ceil) t[x] = ceil - (ceil - tv) * 0.2;
			}
			const pool = new Float32Array(t.length);
			for (let x = 0; x < t.length; x++) {
				pool[x] = 0.45 + 1.1 * rdfFbm(((x - margin) / cols) * 4, i * 5.3, seed + 9, 2);
			}
			tops.push(t);
			pools.push(pool);
		}

		colTop = new Float32Array(layers * cols);
		colSlope = new Float32Array(layers * cols);
		colPool = new Float32Array(layers * cols);
		fw = (cols >> 1) + 2;
		fh = (rows >> 1) + 2;
		fog = new Float32Array(fw * fh);
		awake = true;
	};

	const draw = (now: number) => {
		if (!img) return;
		const dt = Math.min(64, now - lastTick);
		lastTick = now;
		const live = interactive && !reduced;
		const age = revealAt === null ? -1 : now - revealAt;

		// Ease the pointer, the clearing and the parallax toward their targets.
		const ease = 1 - Math.pow(0.82, dt / 16.7);
		const slow = 1 - Math.pow(0.93, dt / 16.7);
		ex += (tx - ex) * ease;
		ey += (ty - ey) * ease;
		clear += ((inside && interactive ? 1 : 0) - clear) * slow;
		pe += ((live ? pt : 0) - pe) * slow;
		windV *= Math.pow(0.965, dt / 16.7);
		windX += (windV * dt) / 1000;
		const fogT = (reduced ? 0 : (now / 1000) * 0.045 * Math.max(0, drift)) + windX;

		// The mist: a wide, slow fractal field at half resolution.
		const sx = 9 / cols;
		const sy = 4.4 / rows;
		for (let gy = 0; gy < fh; gy++) {
			const ny = gy * sy;
			for (let gx = 0; gx < fw; gx++) {
				const nx = gx * sx + fogT;
				const warp = rdfNoise(nx * 0.45 - fogT * 0.6, ny * 0.8, 77) * 0.6;
				const v = rdfFbm(nx + warp, ny + warp * 0.4, 31, 3);
				fog[gy * fw + gx] = rdfSmooth(0.3, 0.74, v);
			}
		}

		// Each ridge's reveal, back to front, and where its crest sits this frame.
		const rev = new Float32Array(layers);
		const k = new Float32Array(layers);
		const toneBase = new Float32Array(layers);
		const fogDepth = new Float32Array(layers);

		for (let i = 0; i < layers; i++) {
			const ki = layers > 1 ? i / (layers - 1) : 1;
			const revI = age < 0 ? 0 : rdfEase((age - 380 - i * 170) / 1300);
			const fogDepthI = rows * (0.08 + 0.42 * ki);
			k[i] = ki;
			rev[i] = revI;
			toneBase[i] = 0.16 + 0.76 * Math.pow(ki, 1.6);
			fogDepth[i] = fogDepthI;

			const rise = (1 - revI) * rows * 0.09;
			const shift = Math.round(pe * (0.25 + ki) * 0.75 * (margin - 3));
			const t = tops[i];
			const poolI = pools[i];
			if (!t || !poolI) continue;
			const last = t.length - 1;
			for (let x = 0; x < cols; x++) {
				const at = x + margin + shift;
				colTop[i * cols + x] = (t[at] ?? 0) + rise;
				colSlope[i * cols + x] =
					(t[Math.min(last, at + 2)] ?? 0) - (t[Math.max(0, at - 2)] ?? 0);
				colPool[i * cols + x] = fogDepthI * (poolI[at] ?? 0);
			}
		}

		const lift = age < 0 ? 1 : 1 - rdfEase((age - 900) / 1800);
		const mistK = Math.max(0, Math.min(1, mist));
		const r = Math.max(1, radius / p);
		const r2 = r * r;

		for (let y = 0; y < rows; y++) {
			const fade = rdfSmooth(0, fadeTo, y);
			const frow = (y >> 1) * fw;
			const by = (y & 7) * 8;
			const dyc = (y - ey) * 1.5;

			for (let x = 0; x < cols; x++) {
				let L = -1;
				for (let i = layers - 1; i >= 0; i--) {
					if (y >= (colTop[i * cols + x] ?? 0)) {
						L = i;
						break;
					}
				}

				let tone = 0;
				let mk = 0.3;
				if (L >= 0) {
					const kk = k[L] ?? 0;
					const topVal = colTop[L * cols + x] ?? 0;
					const d = y - topVal;
					const depth = colPool[L * cols + x] ?? 1;
					const crest = 1 - rdfSmooth(0, depth, d) * (0.88 - 0.45 * kk);
					tone = (toneBase[L] ?? 0) * crest;
					const sl = (colSlope[L * cols + x] ?? 0) * 0.06;
					tone +=
						(sl < -0.2 ? -0.2 : sl > 0.2 ? 0.2 : sl) *
						(1 - rdfSmooth(0, depth * 0.5, d));
					tone += (rdfHash(x + Math.round(topVal * 7), d | 0, L) - 0.5) * 0.07 * kk;
					tone *= rev[L] ?? 0;
					mk = 0.95 - 0.5 * kk;
				} else {
					tone = 0.05 * rdfSmooth(rows * 0.15, rows * 0.6, y);
				}

				let m = (fog[frow + (x >> 1)] ?? 0) * mistK * mk;
				if (clear > 0.01) {
					const dx = x - ex;
					const q = (dx * dx + dyc * dyc) / r2;
					if (q < 4) {
						const c = clear * Math.exp(-q);
						m *= 1 - c * 0.92;
						if (L >= 0) tone += c * 0.16 * (rev[L] ?? 0);
					}
				}

				// Just under full tone, so even the deepest slope keeps its texture.
				if (tone > 0.93) tone = 0.93;
				m += lift * 0.55;
				if (m > 1) m = 1;
				tone = (tone * (1 - m) + 0.09 * m * (1 - lift)) * fade;

				const bayer = RDF_BAYER[by + (x & 7)] ?? 0;
				buf[y * cols + x] = pal[rdfDither(tone, nTones, bayer)] ?? 0;
			}
		}

		ctx.putImageData(img, 0, 0);

		// The altimeter rides the crest of the ridge under the pointer.
		let show = false;
		if (alt && altText && altimeter && inside && age > 1600) {
			const x = Math.max(0, Math.min(cols - 1, Math.round(ex)));
			for (let i = layers - 1; i >= 0; i--) {
				const crest = colTop[i * cols + x] ?? 0;
				if (ey >= crest - 6) {
					show = true;
					alt.style.transform = `translate(${(x * p).toFixed(1)}px,${(crest * p).toFixed(1)}px)`;
					const text = `${rdfElevation(crest, rows, i, layers).toLocaleString('en-US')} m`;
					if (text !== altLabel) {
						altLabel = text;
						altText.textContent = text;
					}
					break;
				}
			}
		}
		if (alt && show !== altShown) {
			altShown = show;
			alt.style.opacity = show ? '1' : '0';
		}

		const settling =
			Math.abs(tx - ex) + Math.abs(ty - ey) > 0.05 ||
			Math.abs((inside && interactive ? 1 : 0) - clear) > 0.005 ||
			Math.abs((live ? pt : 0) - pe) > 0.001 ||
			Math.abs(windV) > 0.002;
		awake = (age >= 0 && age < 3400) || settling || (!reduced && drift > 0);
	};

	const busy = () => {
		const age = revealAt === null ? -1 : performance.now() - revealAt;
		return (
			(age >= 0 && age < 3400) ||
			inside ||
			Math.abs(windV) > 0.002 ||
			Math.abs(pt - pe) > 0.001
		);
	};

	const loop = (now: number) => {
		raf = 0;
		if (!visible || revealAt === null) return;
		if (busy() || now - lastDraw > 32) {
			draw(now);
			lastDraw = now;
		}
		if (awake) raf = requestAnimationFrame(loop);
	};

	const wake = () => {
		if (revealAt === null) return;
		awake = true;
		if (!raf && visible) raf = requestAnimationFrame(loop);
	};

	const onMove = (e: PointerEvent) => {
		if (!interactive && !altimeter) return;
		const b = root.getBoundingClientRect();
		pt = b.width > 0 ? ((e.clientX - b.left) / b.width) * 2 - 1 : 0;
		const s = scene.getBoundingClientRect();
		const lx = (e.clientX - s.left) / p;
		const ly = (e.clientY - s.top) / p;
		const was = inside;
		inside = lx >= 0 && ly >= 0 && lx < cols && ly < rows;
		tx = lx;
		ty = ly;
		if (inside && !was) {
			ex = tx;
			ey = ty;
		}
		wake();
	};

	const onLeave = () => {
		pt = 0;
		inside = false;
		wake();
	};

	const onDown = (e: PointerEvent) => {
		if (!interactive || reduced || !inside) return;
		if ((e.target as HTMLElement).closest('a,button')) return;
		// A gust blows the mist away from whichever side was clicked.
		windV += tx < cols / 2 ? 1.4 : -1.4;
		wake();
	};

	layout();
	draw(performance.now());
	wake();

	let mo: MutationObserver | null = null;
	if (presetAttr === 'auto') {
		const syncAutoTheme = () => {
			const isDark =
				document.documentElement.classList.contains('dark') || Boolean(root.closest('.dark'));
			const theme = isDark ? RIDGELINE_PRESETS.night : RIDGELINE_PRESETS.evergreen;
			const deep = theme.tones[Math.max(1, theme.tones.length - 2)] ?? theme.ink;
			const accent = theme.tones[Math.max(1, theme.tones.length - 3)] ?? theme.ink;
			root.style.setProperty('--rdf-paper', theme.paper);
			root.style.setProperty('--rdf-ink', theme.ink);
			root.style.setProperty('--rdf-muted', theme.muted);
			root.style.setProperty('--rdf-line', theme.line);
			root.style.setProperty('--rdf-heart', theme.heart);
			root.style.setProperty('--rdf-deep', deep);
			root.style.setProperty('--rdf-accent', accent);
			currentTones = theme.tones;
			pal = buildPalette(currentTones);
			nTones = pal.length;
			draw(performance.now());
			wake();
		};
		syncAutoTheme();
		mo = new MutationObserver(syncAutoTheme);
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	}

	const revealIo = new IntersectionObserver(
		(entries) => {
			if (!entries.some((e) => e.isIntersecting)) return;
			if (revealAt === null) {
				revealAt = reduced ? -Infinity : performance.now();
			}
			root.classList.add('rdf-in');
			lastTick = performance.now();
			wake();
			revealIo.disconnect();
		},
		{ threshold: 0.18 },
	);
	if (!reduced) {
		revealIo.observe(root);
	}

	const ro = new ResizeObserver(() => {
		layout();
		draw(performance.now());
		wake();
	});
	ro.observe(scene);

	const visibilityIo = new IntersectionObserver((entries) => {
		visible = entries[0] ? entries[0].isIntersecting : true;
		if (visible) {
			lastTick = performance.now();
			wake();
		}
	});
	visibilityIo.observe(root);

	root.addEventListener('pointermove', onMove);
	root.addEventListener('pointerleave', onLeave);
	root.addEventListener('pointerdown', onDown);

	return () => {
		cancelAnimationFrame(raf);
		mo?.disconnect();
		revealIo.disconnect();
		ro.disconnect();
		visibilityIo.disconnect();
		root.removeEventListener('pointermove', onMove);
		root.removeEventListener('pointerleave', onLeave);
		root.removeEventListener('pointerdown', onDown);
	};
}

document.querySelectorAll<HTMLElement>('[data-rdf-root]').forEach((el) => {
	initRidgelineFooter(el);
});
