# Design QA: `/goal` scroll-aware navigation

## Scope

The `/goal/` candidate now carries the 2025 site's transparent-to-solid fixed navigation pattern across its modern homepage and legacy-content inner pages.
The public site and the complete `/next/` concept remain unchanged.

## Visual truth

The archived 2025 implementation is the interaction reference.
It uses a fixed transparent navigation bar at the top of the masthead and adds a solid color surface after the page passes a 50px scroll threshold.

- `output/playwright/goal-header-scroll/04-legacy-2025-top-reference.png` records the 2025 transparent top state.
- `output/playwright/goal-header-scroll/05-legacy-2025-scrolled-reference.png` records the 2025 solid scrolled state.
- `output/playwright/goal-header-scroll/02-current-goal-inner-top-before.png` records the previous `/goal/` inner-page header with its permanent translucent surface.
- `output/playwright/goal-header-scroll/03-current-goal-inner-scrolled-before.png` records that the previous surface did not visibly change after scrolling.

## Final evidence

- `output/playwright/goal-header-scroll/06-goal-home-top-final.png` records the desktop homepage with the hero extending under a transparent fixed header.
- `output/playwright/goal-header-scroll/07-goal-inner-top-final.png` records the desktop inner-page transparent state over the connection masthead.
- `output/playwright/goal-header-scroll/08-goal-inner-scrolled-final.png` records the desktop inner-page solid cream surface after scrolling.
- `output/playwright/goal-header-scroll/09-goal-mobile-home-top-final.png` records the mobile single-screen homepage and transparent compact header.
- `output/playwright/goal-header-scroll/10-goal-mobile-menu-final.png` records the solid header surface while the modern mobile menu is open.
- `output/playwright/goal-header-scroll/11-goal-mobile-inner-top-final.png` records the mobile inner-page transparent state with corrected width containment.
- `output/playwright/goal-header-scroll/12-goal-mobile-inner-scrolled-final.png` records the mobile inner-page solid scrolled state.

## Comparison evidence

- `output/playwright/goal-header-scroll/13-reference-and-final-state-comparison.png` places the 2025 top and scrolled states above the final `/goal/` top and scrolled states in one comparison image.
- `output/playwright/goal-header-scroll/14-inner-top-before-after.png` places the previous permanent surface beside the final transparent top state at the same desktop viewport.

The comparisons use one in-app browser, a 1440 by 1000 desktop viewport, a 390 by 844 mobile viewport, light theme, and matching closed-menu states unless the menu is the subject of the capture.

## Findings

No actionable P0, P1, or P2 differences remain.

- State model: passed.
  Every `/goal/` header starts with `data-scroll-state="top"` and changes to `scrolled` only after the shared 50px threshold.
- Desktop top state: passed.
  The navigation has no background, border, shadow, or blur and remains legible over the tree or connection field.
- Desktop scrolled state: passed.
  The fixed navigation gains an opaque cream surface, a restrained separator, and a subtle shadow while the page content continues underneath it.
- Mobile menu state: passed.
  Both navigation implementations gain an opaque surface while their menus are open, including when the page remains at the top state.
- Responsive containment: passed.
  The goal inner-page content now uses parent-relative widths below 1000px, removing the 7px horizontal overflow caused by viewport units and the vertical scrollbar.
- Homepage composition: passed.
  The modern header is removed from document flow, the hero begins at the top edge, and the page remains exactly one viewport tall with no lower screen or footer.
- Navigation continuity: passed.
  The header remains fixed on every goal inner page and retains active-link, registration, compact-menu, Escape-close, and Bootstrap collapse behavior.
- Isolation: passed.
  `/next/` retains its existing sticky translucent header, and the public 2025-derived pages retain their archived navigation implementation.
- Runtime quality: passed.
  Browser checks report no warnings or errors.
- Automated regression: passed.
  The unit suite covers the threshold boundary and invalid positions, Astro reports zero diagnostics, and the build validator requires the shared contract on all `/goal/` routes while rejecting leakage into other editions.

## Final result

final result: passed
