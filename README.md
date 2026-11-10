# Ascendemy Landing Page

Astro implementation of the Ascendemy landing page, migrated from the static export in `clone/`.

## Commands

| Task                 | Bun             | npm                             |
| :------------------- | :-------------- | :------------------------------ |
| Install dependencies | `bun install`   | `npm install --no-package-lock` |
| Start dev server     | `bun dev`       | `npm run dev`                   |
| Build site           | `bun build`     | `npm run build`                 |
| Preview build        | `bun preview`   | `npm run preview`               |
| Astro CLI            | `bun astro ...` | `npx astro ...`                 |

Bun is used for deployment and is the recommended local setup. npm is supported as a local alternative; the project uses `bun.lock`, so do not commit a generated `package-lock.json`.

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

## Contributing

### Requirements

- [Bun](https://bun.sh/) (recommended and used for deployment) **or** npm for local development.
- Node.js `>=22.22.0` (Astro 7 requires it; deployment uses Node.js 24.x).
- Optional: a running CBT app if you want to work against local data.

### Local setup

1. Fork the repository, then clone your fork:

   ```bash
   git clone https://github.com/<your-username>/ascen-landing-page.git
   cd ascen-landing-page
   ```

2. Install dependencies with Bun (recommended):

   ```bash
   bun install
   ```

   Or use npm for local development:

   ```bash
   npm install --no-package-lock
   ```

3. Start the dev server:

   ```bash
   bun dev
   # or: npm run dev
   ```

   Open [http://localhost:4321](http://localhost:4321).

Builds use `https://cbt.ascendemy.id/api` by default. During local development, the fallback API is `http://localhost:8000/api`. To use another API, pass the variable for the current command:

```bash
PUBLIC_CBT_API_URL="https://cbt.ascendemy.id/api" bun dev
# or
PUBLIC_CBT_API_URL="https://cbt.ascendemy.id/api" npm run dev
```

Or create a local `.env` file (do not commit it):

```dotenv
PUBLIC_CBT_API_URL="http://localhost:8000/api"
```

Stats, testimonials, and blog posts come from the CBT API. If it is unavailable, the site falls back to the static content in `src/data/`. When using a local CBT instance, add the landing origin to the CBT app's CORS configuration.

### Development workflow

1. Create a branch from `main`, for example `git checkout -b feat/blog-filter`.
2. Make your changes and test the affected pages on the dev server. Client-side sections such as `/blog`, `/blog/artikel?slug=...`, and `/testimoni` need the API requests checked in a browser.
3. Run the production build before opening a pull request:

   ```bash
   bun run build
   # or: npm run build
   ```

   The project currently has no lint or test scripts, so the build is the required automated check. To inspect the built site locally, run `bun preview` (or `npm run preview`).
4. Commit with a clear conventional prefix, such as `feat(blog): add tag filtering` or `fix(testimoni): handle empty scores`.
5. Push the branch and open a pull request against `main`. Keep it focused and mention the pages or data sources it affects.

## Deploy

The site is fully static. On Vercel, import this repository and keep the detected Astro settings: install `bun install`, build `bun run build`, output `dist`. Use Node.js `24.x` (or any version `>=22.22.0`).

By default the site reads from `https://cbt.ascendemy.id/api`. To point at another CBT environment, set `PUBLIC_CBT_API_URL` at build time, e.g. `PUBLIC_CBT_API_URL=http://localhost:8000/api`. During `bun dev` the fallback is already `http://localhost:8000/api`. Stats, testimonials, and blog posts come from the CBT API, with static content as fallback; make sure the landing origin is listed in the CBT app's `config/cors.php`.

The public blog lives on the landing: `/blog` for the archive and `/blog/artikel?slug=...` for an article. CBT only supplies published news through the API and keeps its admin preview at `/preview-berita/{slug}`. Article detail is fetched client-side so new articles appear without a rebuild; clean `/blog/{slug}` URLs would need an SSR adapter.
