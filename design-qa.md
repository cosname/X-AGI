# Design QA: `/goal` animated homepage reuse

## Scope

The `/goal/` homepage now directly reuses the existing `/next/` animated homepage component and its full content flow.
The `/goal/` inner pages keep the published 2026 content structure and the existing connection masthead skin.
The public `/` routes and the parked `/next/` routes remain unchanged.

## Visual truth

The user-provided homepage screenshot established the selected visual direction.
The live `/next/` implementation was then captured as the exact executable source of truth because the request was to reuse that implementation directly.

- `output/playwright/goal-home-reuse/01-source-next-desktop.png` records `/next/` at a requested 1440 by 900 viewport and a captured image size of 1425 by 891 pixels.
- `output/playwright/goal-home-reuse/02-source-next-mobile.png` records `/next/` at a requested 390 by 844 viewport and a captured image size of 375 by 812 pixels.
- `output/playwright/goal-home-reuse/03-implementation-goal-desktop.png` records the implemented `/goal/` desktop state at the same requested viewport and captured size.
- `output/playwright/goal-home-reuse/04-implementation-goal-mobile.png` records the implemented `/goal/` mobile state at the same requested viewport and captured size.

The source and implementation captures use the same browser, viewport override, scroll position, and initial menu state.

## Comparison artifacts

- `output/playwright/goal-home-reuse/05-comparison-desktop.png` places the desktop `/next/` source and `/goal/` implementation side by side.
- `output/playwright/goal-home-reuse/06-comparison-mobile.png` places the mobile `/next/` source and `/goal/` implementation side by side.
- `output/playwright/goal-home-reuse/07-mobile-menu-open.png` records the mobile navigation open state.
- `output/playwright/goal-home-reuse/08-goal-about-regression.png` records the retained `/goal/about/` inner-page treatment.

The full desktop comparison keeps the header, title treatment, both tree canopies, calls to action, and probability terrain readable at once.
The full mobile comparison keeps the compact header, hero, terrain transition, and first content section readable at once.
No additional focused crop was needed because every required fidelity surface is legible in those two comparisons.

## Required fidelity surfaces

- The connected X-AGI brand header and 2026 year marker.
- The cream paper field, DOM pixel trees, floating connection marks, and probability terrain.
- The centered 2026 and X-AGI title treatment, English subtitle, date, venue, and primary actions.
- The responsive mobile composition and the continuation into the long homepage content.
- The organization section order of 主办单位, 协办单位, and 赞助单位.
- The existing connection masthead and published content structure on all `/goal/` inner pages.

## Review results

- Desktop fidelity: passed.
  The source and implementation screenshots have identical SHA-256 hashes, so the initial desktop visual state is pixel-identical.
- Mobile fidelity: passed.
  The layout, typography, responsive tree composition, terrain transition, and content entry match the source comparison.
  The small terrain shape difference in the paired capture is the expected time-dependent animation state, not a layout difference.
- Motion behavior: passed.
  The hero reports `data-ready="true"`, pointer movement changes its interaction state from `idle` to `pointer`, 45 local pixel scales activate near the pointer, and leaving the hero resets the state to `idle`.
- Navigation: passed.
  The homepage navigation and internal calls to action use `/goal/*` destinations, with no `/next/*` links.
  The mobile menu opens, exposes the goal navigation, and closes with Escape.
- Responsive layout: passed.
  The homepage and inner-page document widths stay within the requested 390-pixel mobile viewport without horizontal overflow.
- Assets and runtime: passed.
  All lazy-loaded homepage logos resolve after entering the organization section, and the browser reports no warning or error logs.
- Inner-page regression: passed.
  `/goal/about/` retains the connection masthead, published copy density, card structure, and navigation treatment.
  Every route from `/goal/` through the five inner pages responds successfully.
- Publication safety: passed.
  The preview remains `noindex, nofollow`, excluded from the sitemap, disallowed by `robots.txt`, and excluded from the production sync path.
- Automated regression: passed.
  `npm test` completed with 14 passing unit tests, zero Astro diagnostics, a successful static build, and a successful build validator.

## Final result

final result: passed
