# Goal header scale and tree spacing design QA

## Comparison target

- Source visual truth: `output/playwright/goal-header-tuning/01-home-before.png` for desktop and `output/playwright/goal-header-tuning/02-home-mobile-before.png` for mobile.
- Rendered implementation: `output/playwright/goal-header-tuning/06-home-final.png` for desktop and `output/playwright/goal-header-tuning/07-home-mobile-final.png` for mobile.
- Full desktop comparison: `output/playwright/goal-header-tuning/qa/desktop-before-after.png`.
- Focused desktop header comparison: `output/playwright/goal-header-tuning/qa/desktop-header-before-after.png`.
- Full mobile comparison: `output/playwright/goal-header-tuning/qa/mobile-before-after.png`.
- Inner-page evidence: `output/playwright/goal-header-tuning/05-about-after.png`.
- Expanded mobile-menu evidence: `output/playwright/goal-header-tuning/08-mobile-menu-final.png`.
- Browser CSS viewport: 1440 x 1000 at device pixel ratio 1 for desktop, and 390 x 844 at device pixel ratio 1 for mobile.
- Source pixels and implementation pixels: 1440 x 1000 for desktop, and 390 x 844 for mobile.
- Density normalization: every comparison uses equal CSS and pixel dimensions at device pixel ratio 1, so no resampling was required.
- State: page top with the overlay header transparent and the animated trees in their initial position.

## Findings

No actionable P0, P1, or P2 visual differences remain for the requested navigation-scale and tree-spacing changes.

- Fonts and typography: desktop navigation and the registration action now render at 16px, the intermediate inline range renders at 15.2px, and the compact mobile menu renders at 16px.
- Cross-page consistency: the homepage and inner pages inherit the same shared navigation typography, active-state treatment, brand lockup, registration action, and header height.
- Header spacing: the desktop header remains 78px tall and the mobile header remains 67.3984px tall, so the larger labels do not change the established page frame.
- Tree safety area: the first visible desktop tree pixel moved from 23.2364px to 92.2364px, leaving 14.2364px below the header instead of overlapping it.
- Mobile tree safety area: the first visible mobile tree pixel moved from 29.8594px to 69.2969px, leaving 1.8984px below the header instead of overlapping it.
- Layout rhythm: the entire tree layer moves together while the hero title, date, actions, and bottom terrain retain their previous positions.
- Colors and visual tokens: the paper, purple, ink, border, gradient, and active-state tokens remain unchanged.
- Image quality and asset fidelity: the existing connection logo and pixel-tree assets remain unchanged and render at their intrinsic density.
- Copy and content: all navigation labels, their order, the 2026 lockup, and the page content remain unchanged.
- Responsiveness: inline navigation fits without horizontal overflow from 768px through desktop widths, and compact navigation fits without overflow at 390px.
- Interaction: the navigation remains fixed, changes from transparent to the solid paper surface after the existing scroll threshold, and the compact menu expands with equal side gutters.

## Comparison history

### Iteration 1

- Earlier finding: P2 navigation labels rendered at 12.16px and the registration action rendered at 12.48px, which looked noticeably smaller than the previously approved inner-page navigation.
- Fix: the shared desktop navigation and action now use 16px, with a 15.2px intermediate breakpoint and a 16px compact-menu scale.
- Post-fix evidence: `output/playwright/goal-header-tuning/qa/desktop-header-before-after.png` and `output/playwright/goal-header-tuning/05-about-after.png`.

### Iteration 2

- Earlier finding: P2 tree artwork entered the transparent header region on desktop and mobile, reducing navigation clarity and making the two layers feel visually crowded.
- Fix: the goal homepage now exposes a shared tree offset derived from the current site-header height, and every tree position consumes that offset at desktop and mobile breakpoints.
- Post-fix evidence: `output/playwright/goal-header-tuning/qa/desktop-before-after.png` and `output/playwright/goal-header-tuning/qa/mobile-before-after.png`.

### Iteration 3

- Earlier risk: the larger text could crowd the inline navigation at intermediate desktop widths or overflow the compact menu.
- Verification: 1180px, 1024px, 900px, 820px, 768px, and 390px viewports all retain the expected navigation mode without horizontal overflow.
- Post-fix evidence: `output/playwright/goal-header-tuning/08-mobile-menu-final.png`.

## Primary interactions tested

- Verified the transparent page-top header and the solid scrolled header.
- Verified the homepage and the 会议简介 inner page use the same navigation scale.
- Opened the compact mobile navigation and checked its labels, side gutters, and overflow.
- Checked the homepage at desktop, intermediate, and mobile breakpoints.
- Checked browser logs and found no warnings or errors from the implementation.

## Residual test gaps

- Screenshot review cannot establish full assistive-technology compatibility.
- The automated checks, static build, browser geometry checks, and route-level visual review cover the implementation risks relevant to this change.

final result: passed
