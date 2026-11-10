# Ascendemy Landing Page

Astro implementation of the Ascendemy landing page, migrated from the static export in `clone/`.

## Commands

| Command           | Action                                    |
| :---------------- | :---------------------------------------- |
| `bun install`     | Install dependencies                      |
| `bun dev`         | Start the dev server at `localhost:4321`  |
| `bun build`       | Build the production site to `./dist/`    |
| `bun preview`     | Preview the production build locally      |
| `bun astro ...`   | Run Astro CLI commands (e.g. `astro sync`) |

> Astro 7 requires Node.js `>=22.22.0`. If your Node version is older, run the scripts through Bun's runtime instead, e.g. `bun --bun run dev` or `bun --bun run build`.

## Structure

```text
src/
├── assets/
│   ├── fonts/                  # self-hosted woff2 fonts
│   └── images/                 # carousel, news, partner, logo and payment assets
├── components/
│   ├── layout/                 # Header, Footer, CookieBanner
│   ├── sections/               # one component per landing page section
│   └── ui/                     # Icon, Button, Eyebrow, CheckList, panels, SplitLayout
├── data/site.ts                # shared links and contact details
├── layouts/BaseLayout.astro    # head, global styles, reveal observer, cookie banner
├── pages/index.astro           # section composition
└── styles/
    ├── fonts.css               # @font-face declarations
    └── global.css              # design tokens, reset and shared utilities
```

Most sections are self-contained: they import their own images, keep their copy in frontmatter, and carry scoped styles. To add a section, create a component in `src/components/sections/`, import it in `src/pages/index.astro`, and place it in the desired order.

Reusable UI lives in `src/components/ui/`:

- `Icon` / `IconSprite` — inline SVG icons
- `Button` — primary, ghost, or dark; optional `lg` size and trailing icon
- `Eyebrow` — orange or blue pill label
- `CheckList` — orange or blue check list
- `SplitLayout` — two-column media/copy layout with an optional `reverse`
- `ExamPanel` / `PracticePanel` — product mock panels, `compact` for feature cards

The raw HTML/CSS/JS reference export is kept locally in `clone/` (gitignored) and is not part of the build.

## Deploy

The site is fully static. On Vercel, import this repository and keep the detected Astro settings: install `bun install`, build `bun run build`, output `dist`. Use Node.js `24.x` (or any version `>=22.22.0`).

By default the site reads from `https://cbt.ascendemy.id/api`. To point at another CBT environment, set `PUBLIC_CBT_API_URL` at build time, e.g. `PUBLIC_CBT_API_URL=http://localhost:8000/api`. During `bun dev` the fallback is already `http://localhost:8000/api`. Stats, testimonials, and blog posts come from the CBT API, with static content as fallback; make sure the landing origin is listed in the CBT app's `config/cors.php`.

The public blog lives on the landing: `/blog` for the archive and `/blog/artikel?slug=...` for an article. CBT only supplies published news through the API and keeps its admin preview at `/preview-berita/{slug}`. Article detail is fetched client-side so new articles appear without a rebuild; clean `/blog/{slug}` URLs would need an SSR adapter.
