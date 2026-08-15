# X-AGI Conference Website

This repository contains the X-AGI conference website and its permanent annual archives.

The site is built as static HTML with Astro.
Only the generated `dist/` directory should be deployed.

## Editions

- `/2025/` is an immutable archive of the 2025 X-AGI and 18th China-R Conference website.
- `/2026/` is the published website for the current conference edition.
- `/` redirects to the edition selected by `currentEdition` in `src/config/site.ts`.

The Git branch `archive/2025` and tag `x-agi-2025-final` preserve the original 2025 source and high-resolution assets.

## Architecture

```text
src/
  components/       Shared components for current and future editions
  config/           Site, edition, and navigation configuration
  data/             Conference content and generated DOM pixel coordinates
  layouts/          Shared document layouts and metadata
  pages/            Astro routes and generated endpoints
  scripts/          Client interaction modules for decorative fields
  styles/           Current-edition design tokens and global styles
public/
  2025/             Immutable legacy HTML archive
    assets/         Edition-scoped legacy assets and vendored dependencies
scripts/
  generate-archive-download-manifest.mjs
  generate-hero-pixel-field.mjs
  validate-build.mjs
assets/slides/      Local archive downloads, intentionally excluded from Git
```

The 2025 archive remains plain HTML so historical content is not needlessly rewritten.
The 2026 and future editions use shared Astro components and typed edition configuration.
The 2026 homepage hero is server-rendered HTML and CSS rather than a Canvas or runtime image.
Its asymmetric tree art is compiled into deterministic DOM pixel coordinates, while its probability landscape stays interactive through contained transforms and height updates.

## Local development

Node.js 24 is the supported runtime.

```bash
npm install
npm run dev
```

Astro serves the development site at `http://localhost:4321` by default.

The approved hero reference is an authoring input and is not shipped at runtime.
Regenerate the checked-in DOM coordinates only when that reference changes:

```bash
node scripts/generate-hero-pixel-field.mjs /absolute/path/to/reference.png src/data/hero-pixel-field.generated.json --preview /tmp/xagi-hero-dom-preview.png
```

## Verification

Run strict type and Astro checks:

```bash
npm run check
```

Build and validate the site artifact:

```bash
npm run build
```

The build validator checks generated HTML for duplicate IDs, broken local references, unmanaged archive downloads, and every non-archived page's HTML and initial local payload budgets.
It also rejects runtime raster, Canvas, SVG, CSS URL, and image-set dependencies inside the pure DOM homepage hero.

## Archive downloads

Large slide files are intentionally not stored in Git or copied into `dist/`.
They must be uploaded to `/2025/assets/slides/` by the selected object-storage release process.

The generated `public/2025/downloads-manifest.json` records every archive download with its path, byte size, and SHA-256 checksum.

Regenerate the manifest after changing a local slide file:

```bash
npm run downloads:manifest
```

Do not edit the generated manifest manually.

Verify every local slide against the manifest before uploading the archive downloads:

```bash
npm run downloads:verify
```

## Deployment

Build the site and deploy only `dist/`.
Do not publish the repository root.

CI publishes the verified `dist/` directory as the `site-dist` workflow artifact.
Production deployment should promote that exact artifact rather than rebuilding from an unchecked working tree.

The hosting layer should serve HTML with a short cache lifetime and fingerprinted assets with a long immutable cache lifetime.
The separate slide upload should preserve the exact `/2025/assets/slides/` paths recorded in the archive manifest.

## Performance budgets

CI enforces the first three static artifact budgets.
LCP and CLS are release targets that must be measured in a browser against the final CDN configuration.

- Standard current-edition HTML should remain below 50 KB per page.
- The DOM-pixel homepage may use up to 700 KB of raw HTML, but must remain below 75 KB when compressed and below 4,000 decorative pixel nodes.
- The initial homepage local asset set should remain below 1 MB.
- Every other current-edition page's initial local asset set should remain below 1.5 MB.
- Mobile Largest Contentful Paint should remain below 2.5 seconds.
- Cumulative Layout Shift should remain below 0.1.
- New local images should use Astro's image pipeline rather than being added directly to `public/`.

## 2025 archive maintenance

The 2025 pages are intentionally frozen except for archive integrity, accessibility, security, or performance corrections that do not change conference content.
New conference information belongs in the current edition configuration and components rather than in `public/2025/`.
