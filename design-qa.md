# Design QA: `/goal` single-screen homepage

## Scope

The `/goal/` homepage keeps the selected animated tree hero and removes the unfinished lower-screen content and homepage footer.
The `/goal/` inner pages keep their published content structure, connection mastheads, scrolling behavior, and footers.
The public `/` routes and the complete `/next/` concept remain unchanged.

## Visual truth

The pre-change `/goal/` hero is the source visual truth for the retained header, typography, colors, tree field, terrain, and actions.
The mobile source also records the unfinished lower screen that the user explicitly asked to remove.

- `output/playwright/goal-hero-only/01-source-goal-desktop-before.png` records the pre-change desktop state at a requested 1440 by 900 CSS viewport and a captured size of 1425 by 891 pixels.
- `output/playwright/goal-hero-only/02-source-goal-mobile-before.png` records the pre-change mobile state at a requested 390 by 844 CSS viewport and a captured size of 375 by 812 pixels.
- `output/playwright/goal-hero-only/04-implementation-goal-desktop.png` records the final desktop state at 1440 by 900 CSS pixels and 1440 by 900 captured pixels.
- `output/playwright/goal-hero-only/03-implementation-goal-mobile.png` records the final mobile state at 390 by 844 CSS pixels and 390 by 844 captured pixels.
- `output/playwright/goal-hero-only/07-implementation-goal-short-phone.png` records the final 375 by 667 short-phone state.

The captures use the same in-app browser, light theme, scroll-top position, closed navigation state, and idle pointer state.
No density resampling was used.
The source captures were placed at natural size on same-size cream canvases because the removed scrollbars had reduced their captured pixel area.

## Comparison evidence

- `output/playwright/goal-hero-only/10-comparison-desktop-normalized.png` places the normalized pre-change desktop source and final desktop implementation side by side at 1440 by 900 pixels per side.
- `output/playwright/goal-hero-only/12-comparison-mobile-normalized.png` places the normalized pre-change mobile source and final mobile implementation side by side at 390 by 844 pixels per side.
- `output/playwright/goal-hero-only/08-mobile-menu-open.png` records the mobile navigation interaction state.

The desktop comparison keeps the header, typography, both tree canopies, actions, and terrain readable at once.
The mobile comparison keeps the compact header, title stack, actions, terrain, and removed lower-screen boundary readable at once.
No focused crop was needed because the required typography, spacing, colors, assets, and copy are legible in the full comparisons.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: passed.
  The connected X-AGI header, 2026 title, dotted wordmark, Chinese title, subtitle, date, venue, and actions retain the selected families, weights, wrapping, and hierarchy.
- Spacing and layout rhythm: passed.
  Desktop preserves the original centered composition.
  Mobile now expands the hero to the viewport bottom and uses the added space between the actions and terrain instead of exposing another section.
- Colors and visual tokens: passed.
  The cream field, navy title, lavender trees, teal connection marks, and terrain opacities remain consistent with the source.
- Image quality and asset fidelity: passed.
  The existing logo asset and DOM pixel artwork remain sharp, uncropped at their focal regions, and unchanged in rendering method.
- Copy and content: passed.
  All first-screen conference copy and actions remain present.
  The manifesto, subsequent homepage sections, organization strip, update strip, and homepage footer are absent by design.
- Motion behavior: passed.
  Pointer movement changes the hero from `idle` to `pointer`, activates 45 local pixel scales, and returns to `idle` after leaving the hero.
- Navigation: passed.
  The mobile menu opens within the 375 by 667 viewport, closes with Escape, and all internal homepage destinations stay in `/goal/*` with no `/next/*` links.
- Single-screen behavior: passed.
  At 1440 by 900, 390 by 844, and 375 by 667, document height equals viewport height with no vertical or horizontal overflow.
- Inner-page regression: passed.
  `/goal/about/` retains its connection masthead, footer, full scrolling content, and mobile width containment.
- Original concept regression: passed.
  `/next/` still renders its complete lower content, organization section, and footer.
- Runtime and automated regression: passed.
  The browser reports no warning or error logs.
  `npm test` completed with 14 passing unit tests, zero Astro diagnostics, a successful static build, and a successful build validator.

## Comparison history

The initial post-implementation desktop and mobile comparisons found no P0, P1, or P2 mismatch in the retained hero.
The intentional mobile difference is the full-height hero and removal of the unfinished lower screen requested by the user.
No visual correction iteration was required after the first comparison.

## Final result

final result: passed
