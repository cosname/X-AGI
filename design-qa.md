# Design QA: `/goal`

## Scope

The `/goal/` preview combines the published 2026 content structure with the current tree, connection, and cream-purple visual system.
The public `/` routes and the parked `/next/` routes are outside the implementation scope and must remain unchanged.

## Visual sources

- `output/playwright/goal-design-qa/03-source-live-home.png` captures the published homepage structure at 1440 by 900.
- `output/playwright/goal-design-qa/01-source-next-home.png` captures the tree and terrain visual source at 1440 by 900.
- `output/playwright/goal-design-qa/04-source-live-about.png` captures the published inner-page structure at 1440 by 900.
- `output/playwright/goal-design-qa/02-source-next-about.png` captures the connection masthead visual source at 1440 by 900.

## Comparison artifacts

- `output/playwright/goal-design-qa/13-comparison-home-live-next-goal.png` places the published homepage, tree visual source, and `/goal/` homepage in one comparison image.
- `output/playwright/goal-design-qa/14-comparison-about-live-next-goal.png` places the published inner page, connection visual source, and `/goal/` inner page in one comparison image.
- `output/playwright/goal-design-qa/09-implementation-goal-home-mobile-fixed.png` records the final 390 by 844 homepage state.
- `output/playwright/goal-design-qa/10-implementation-goal-about-mobile.png` records the final 390 by 844 inner-page state.

## Review results

- Desktop homepage: passed.
  The title, conference facts, actions, single-screen composition, and bottom organization order match the published structure.
  The double tree and probability terrain match the current visual source.
- Desktop inner page: passed.
  The page header uses the connection particle field while the published card layout, copy density, spacing, and information order remain intact.
- Mobile homepage: passed.
  The organization section is compact, legible, and anchored near the bottom without competing with the primary conference information.
- Mobile inner page: passed.
  The masthead, content card, typography, and gutters fit the 390-pixel viewport without horizontal content overflow.
- Navigation: passed.
  The mobile menu opens correctly, and every visible navigation and registration link stays inside the `/goal/` namespace.
- Assets and runtime: passed.
  All six `/goal/` routes render their visual field, report no broken images, and produce no browser runtime errors.
- Publication safety: passed.
  Every preview page is `noindex, nofollow`, `robots.txt` disallows `/goal/`, the sitemap excludes `/goal/`, and the OSS sync script excludes `goal/**`.
- Regression checks: passed.
  `npm test` completed with 14 unit tests, zero Astro diagnostics, a successful static build, and a successful build validation.

## Final result

final result: passed
