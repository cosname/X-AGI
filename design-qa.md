# Goal inner-page masthead design QA

## Comparison target

- Source visual truth: `output/playwright/goal-subpage-motion/01-about-before.png` for the original idle masthead and `output/playwright/goal-subpage-motion/02-about-pointer-before.png` for its non-responsive pointer state.
- Rendered implementation: `output/playwright/goal-subpage-motion/04-about-after-idle.png` for the revised idle masthead and `output/playwright/goal-subpage-motion/05-about-after-pointer.png` for the restored pointer response.
- Responsive implementation: `output/playwright/goal-subpage-motion/06-about-mobile-after.png`.
- Full-view comparison: `output/playwright/goal-subpage-motion/qa/desktop-before-after.png`.
- Focused masthead comparison: `output/playwright/goal-subpage-motion/qa/header-before-after.png`.
- Focused interaction comparison: `output/playwright/goal-subpage-motion/qa/motion-idle-pointer.png`.
- Interaction-difference evidence: `output/playwright/goal-subpage-motion/qa/motion-diff.png`.
- Browser CSS viewport: 1152 x 800 at device pixel ratio 1.25 for desktop, and 390 x 844 at device pixel ratio 1.25 for mobile.
- Source and implementation screenshot pixels: 1140 x 792 for the desktop browser content surface.
- Mobile implementation screenshot pixels: 378 x 817 for the mobile browser content surface.
- Density normalization: the desktop source and implementation captures have identical pixel dimensions and browser density, so no resampling was required.
- State: the page is at the top with a transparent fixed navigation bar, first at idle and then with the pointer positioned inside the masthead at CSS coordinates 650 x 180.

## Findings

No actionable P0, P1, or P2 visual or interaction differences remain for the requested masthead changes.

- Fonts and typography: the shared navigation, page title, subtitle, line height, weight, wrapping, and antialiasing remain unchanged.
- Spacing and layout rhythm: the masthead remains 300px tall on desktop and 245px tall on mobile, while deterministic wells now protect the brand, navigation, registration action, title, and subtitle from particle overlap.
- Colors and visual tokens: the paper, ink, purple, orange, teal, opacity, gradient, and terrain-layer tokens remain unchanged.
- Image quality and asset fidelity: the existing canvas-rendered particle field and probability terrain remain sharp at the browser density, and no replacement asset or approximation was introduced.
- Copy and content: all navigation labels, page titles, status text, and inner-page content remain unchanged.
- Interaction: the hybrid goal inner-page header now exposes the same connection-stage contract as the earlier next-design masthead, so pointer movement updates the particle ripple and posterior terrain.
- Responsiveness: at 390 x 844 CSS pixels, the brand and menu retain clean surrounding space, the title remains unobstructed, and the particle field naturally concentrates on the open right side without horizontal overflow.
- Cross-page consistency: about, schedule, poster, guide, and register all render an initialized 228-particle desktop field inside the same interactive stage.
- Accessibility: reduced-motion and touch-pointer safeguards remain intact, and the decorative canvas remains hidden from assistive technology.

## Comparison history

### Iteration 1

- Earlier finding: P2 particle marks appeared directly behind the transparent navigation and could enter the page-title area because the title exclusion was only probabilistic.
- Earlier evidence: `output/playwright/goal-subpage-motion/01-about-before.png`.
- Fix: masthead particle seeding now uses deterministic brand, navigation, and title safe zones at desktop and compact widths.
- Post-fix evidence: `output/playwright/goal-subpage-motion/qa/header-before-after.png` and `output/playwright/goal-subpage-motion/06-about-mobile-after.png`.

### Iteration 2

- Earlier finding: P1 the hybrid inner-page field reported animation support but stayed idle after pointer movement because its legacy header did not expose a connection stage.
- Earlier evidence: `output/playwright/goal-subpage-motion/02-about-pointer-before.png`, where the field remained in the idle interaction state.
- Fix: goal-skinned legacy inner headers now expose `data-connection-stage`, matching the working next-design masthead contract.
- Post-fix evidence: `output/playwright/goal-subpage-motion/05-about-after-pointer.png`, where the field enters the pointer interaction state.
- Pixel evidence: the idle-to-pointer comparison changes 62,947 pixels in the focused 1140 x 300 masthead crop.

## Primary interactions tested

- Moved the pointer through the desktop masthead and verified the particle field changes from idle to pointer interaction.
- Verified the field returns toward its resting probability terrain through the existing spring behavior.
- Navigated about, schedule, poster, guide, and register and verified each route initializes the same interactive masthead field.
- Checked the compact layout at 390 x 844 CSS pixels and found no horizontal overflow.
- Checked browser logs and found no warnings or errors from the implementation.

## Residual test gaps

- Static screenshot comparison cannot communicate the full temporal feel of the spring animation.
- The browser state contract, focused motion diff, reduced-motion preservation, unit tests, and route-level checks cover the implementation risks relevant to this change.

final result: passed
