# Goal navigation design QA

## Comparison target

- Source visual truth: `output/playwright/goal-header-unification/14-home-stable.png`.
- Rendered implementation: `output/playwright/goal-header-unification/15-about-stable.png`.
- Full-view comparison: `output/playwright/goal-header-unification/20-final-full-comparison.png`.
- Focused header comparison: `output/playwright/goal-header-unification/18-final-header-comparison.png`.
- Mobile menu evidence: `output/playwright/goal-header-unification/07-mobile-schedule-menu-final.png`.
- Scrolled-header evidence: `output/playwright/goal-header-unification/21-about-scrolled-final.png`.
- Browser CSS viewport: 1440 x 1000 at device pixel ratio 1 for desktop, and 390 x 844 at device pixel ratio 1 for mobile.
- Source pixels: 1440 x 1000.
- Implementation pixels: 1425 x 990 because the long inner page exposes the browser scrollbar.
- Density normalization: both desktop header regions were cropped to 1425 x 120 pixels at device pixel ratio 1 before the focused comparison.
- State: page top with the overlay header transparent, with the expected active destination differing between 首页 and 会议简介.

## Findings

No actionable P0, P1, or P2 visual differences remain in the shared navigation.

- Fonts and typography: both routes render navigation with XAGI Condensed at 12.16px and weight 600.
- Spacing and layout rhythm: the final desktop routes share a 78px header, brand left position of 50px, navigation left position of 908.59375px, and action right position of 1375px.
- Colors and visual tokens: both routes use the same paper, purple, ink, border, gradient, and active-state tokens from the 2026 system.
- Image quality and asset fidelity: both routes use the same raster connection logo at `/brand/xagi-connect-logo.png` with its intrinsic sizing preserved.
- Copy and content: labels, order, 2026 year lockup, and registration action are identical, while only the correct active destination changes.
- Responsiveness: all goal routes use compact mode at 390px, have no horizontal overflow, and expose the same functional mobile menu.
- Interaction: the navigation remains fixed, changes from transparent to the pure paper surface after 50px, and closes correctly after mobile navigation.
- Accessibility: the shared skip link targets `#main-content`, current destinations use `aria-current`, and the mobile toggle updates `aria-expanded` and its accessible label.

## Comparison history

### Iteration 1

- Earlier finding: P1 component mismatch between the homepage and inner pages.
- Earlier evidence: `output/playwright/goal-header-unification/01-home-header-before.png` and `output/playwright/goal-header-unification/02-inner-header-before.png`.
- Difference: the homepage used the connection logo, 2026 lockup, condensed navigation, and light capsule button, while inner pages used the old wordmark, system typography, Bootstrap navigation, and solid purple button.
- Fix: `Goal2026Layout.astro` now renders the same `SiteHeader.astro` component as the goal homepage.
- Post-fix evidence: `output/playwright/goal-header-unification/18-final-header-comparison.png`.

### Iteration 2

- Earlier finding: P2 mobile menu edge spacing narrowed to 5px on the scrollbar-reduced content viewport.
- Fix: the compact menu width now uses its containing block instead of `100vw`, producing equal 20px side gutters and zero horizontal overflow.
- Post-fix evidence: `output/playwright/goal-header-unification/07-mobile-schedule-menu-final.png`.

### Iteration 3

- Earlier finding: P2 risk of a horizontal header jump between the non-scrolling homepage and scrolling inner pages.
- Fix: the root page now reserves a stable scrollbar gutter.
- Post-fix evidence: brand, navigation, and action coordinates are identical on `/goal/` and `/goal/about/` at the desktop comparison viewport.

## Primary interactions tested

- Navigated through 首页, 会议简介, 日程安排, 海报展示, 参会指南, and 立即报名.
- Opened and closed the compact mobile navigation.
- Scrolled the page past the 50px header threshold.
- Switched schedule day tabs and verified the destination remains below the fixed header.
- Checked browser logs and found no errors or warnings from the implementation.

## Residual test gaps

- Screenshot review cannot establish full assistive-technology compatibility.
- The final automated check, static build, and route-level browser checks cover the implementation risks relevant to this change.

final result: passed
