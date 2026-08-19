# Design QA Log

## Goal Inner-page Masthead

### Comparison target

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

### Findings

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

### Comparison history

#### Iteration 1

- Earlier finding: P2 particle marks appeared directly behind the transparent navigation and could enter the page-title area because the title exclusion was only probabilistic.
- Earlier evidence: `output/playwright/goal-subpage-motion/01-about-before.png`.
- Fix: masthead particle seeding now uses deterministic brand, navigation, and title safe zones at desktop and compact widths.
- Post-fix evidence: `output/playwright/goal-subpage-motion/qa/header-before-after.png` and `output/playwright/goal-subpage-motion/06-about-mobile-after.png`.

#### Iteration 2

- Earlier finding: P1 the hybrid inner-page field reported animation support but stayed idle after pointer movement because its legacy header did not expose a connection stage.
- Earlier evidence: `output/playwright/goal-subpage-motion/02-about-pointer-before.png`, where the field remained in the idle interaction state.
- Fix: goal-skinned legacy inner headers now expose `data-connection-stage`, matching the working next-design masthead contract.
- Post-fix evidence: `output/playwright/goal-subpage-motion/05-about-after-pointer.png`, where the field enters the pointer interaction state.
- Pixel evidence: the idle-to-pointer comparison changes 62,947 pixels in the focused 1140 x 300 masthead crop.

### Primary interactions tested

- Moved the pointer through the desktop masthead and verified the particle field changes from idle to pointer interaction.
- Verified the field returns toward its resting probability terrain through the existing spring behavior.
- Navigated about, schedule, poster, guide, and register and verified each route initializes the same interactive masthead field.
- Checked the compact layout at 390 x 844 CSS pixels and found no horizontal overflow.
- Checked browser logs and found no warnings or errors from the implementation.

### Residual test gaps

- Static screenshot comparison cannot communicate the full temporal feel of the spring animation.
- The browser state contract, focused motion diff, reduced-motion preservation, unit tests, and route-level checks cover the implementation risks relevant to this change.

Previous result: passed.

## Liquid Glass Design QA

## 对照输入

- 视觉目标：`/Users/audiofool/.codex/generated_images/01a00e2a-2710-7b83-9dab-aa8c3672fbe7/exec-0bc087e0-9aca-4618-b34b-045572e00bd5.png`
- 桌面实现：`/Users/audiofool/Projects/X-AGI_Website/output/playwright/liquid-glass-design-qa-implementation.png`
- 并排对照：`/Users/audiofool/Projects/X-AGI_Website/output/playwright/liquid-glass-design-qa-comparison.png`
- 导航状态：`/Users/audiofool/Projects/X-AGI_Website/output/playwright/liquid-glass-implementation-nav-final.png`
- 子页状态：`/Users/audiofool/Projects/X-AGI_Website/output/playwright/liquid-glass-implementation-about.png`

桌面对照使用 1440 x 1024 CSS 视口，并将参考图缩放到同一尺寸后并排检查。
移动端另外使用 390 x 844 CSS 视口检查首页、折叠菜单和会议简介页。

## 结果

- P0：没有发现阻断交互、导航或内容阅读的问题。
- P1：桌面液态层最初覆盖了移动菜单定位，已将透镜容器限制在 inline 导航并复测通过。
- P1：导航从 inline 切换到 compact 时最初可能残留上一个栏目状态，已在模式变化时同步清空透镜与文字变换并复测通过。
- P1：首页透镜最初偏大且边缘过淡，已缩小到约 120 x 139 像素并增强紫色与青色弯月面。
- P2：键盘聚焦轮廓最初呈矩形，已统一为与透镜一致的圆角轮廓。
- P2：窄屏桌面指针环境最初会隐藏透镜却继续执行液态像素变形，已统一视觉与运行时断点，并确认降级为原有局部波动。

导航、树和子页粒子场均使用同一套几何、放大比例和弹性运动模型。
首页概率地形的持续移动、页面文字、原有布局和业务链接均保持不变。
子页橙色光晕只在 `/goal/` 视觉中被液态透镜替代，停放中的 `/next/` 行为没有被改写。
页面运行日志没有出现错误，构建校验、类型检查与单元测试全部通过。

final result: passed

## Badge-led Goal Homepage

### Comparison target

- Source visual truth: `/var/folders/jt/tl_hrhm575n65jcy0sk0fnr40000gn/T/codex-clipboard-96511ef8-27bc-4ed2-9213-3830524aa4be.png`.
- Rendered desktop implementation: `output/playwright/badge-redesign/09-desktop-final.png`.
- Rendered mobile implementation: `output/playwright/badge-redesign/07-mobile-final.png`.
- Expanded mobile navigation: `output/playwright/badge-redesign/08-mobile-menu.png`.
- Full-view comparison: `output/playwright/badge-redesign/10-reference-final-stacked.png`.
- Focused comparison: `output/playwright/badge-redesign/11-reference-final-focus.png`.
- Browser CSS viewport: 1800 x 768 for desktop and 390 x 844 for mobile at device pixel ratio 1.
- Source screenshot pixels: 1800 x 766.
- Desktop implementation screenshot pixels: 1800 x 768.
- Mobile implementation screenshot pixels: 390 x 844.
- Density normalization: the source was extended by two neutral paper pixels to 1800 x 768 without scaling, then stacked with the implementation.
- State: the page is at the top with its transparent header and the tree at rest, with separate interaction verification after moving the pointer through the broad tree field.

### Findings

No actionable P0, P1, or P2 visual, responsive, or interaction differences remain for the selected badge-led direction.

- Fonts and typography: the source hierarchy of a narrow year, large mosaic conference name, and compact English tagline is preserved while retaining the website's existing type system and live business copy.
- Spacing and layout rhythm: the desktop composition now uses a measured left editorial column and one dominant right tree, with enough negative space for the fixed navigation and no collision between primary copy and illustration.
- Colors and visual tokens: warm paper, indigo, lavender, teal, pale peach, and orange follow the supplied badge palette without reintroducing the old blue conference background.
- Image quality and asset fidelity: the paper texture and organic color fields are responsive raster assets generated for their exact slots, while the connection tree remains the existing sharp DOM mosaic rather than a CSS or SVG approximation.
- Copy and content: the date, venue, navigation labels, registration destination, and schedule destination remain unchanged.
- Interaction: the single right tree keeps the wide proximity response and activates 187 scale pixels when the pointer moves through the central browsing area.
- Navigation behavior: the transparent top state, 50px scroll surface, 3D capsule feedback, keyboard treatment, and compact menu remain shared with the rest of `/goal/`.
- Responsiveness: at 390 x 844 the title, tagline, date, venue, and actions remain unobstructed, while the tree begins below the conversion controls and the organic color fields anchor the lower viewport.
- Accessibility: the decorative background has empty alternative text, the pixel field remains hidden from assistive technology, the compact menu exposes correct expanded state, and reduced-motion handling remains intact.
- Cross-preview isolation: `/goal/` renders the badge composition with one right tree and no probability terrain, while `/next/` still renders two trees, nine terrain layers, eleven echoes, and direct interaction.
- Inner-page isolation: `/goal/about/` and the other content routes continue to use the existing interactive particle masthead with the shared scroll-header contract.

### Comparison history

#### Iteration 1

- Earlier finding: P1 the first badge composition placed the title too far right and left the single tree too close to the outer edge.
- Earlier evidence: `output/playwright/badge-redesign/01-desktop-pass1.png`.
- Fix: the copy origin was moved to the measured 236px position and the tree was enlarged and pulled inward to establish the source's left-copy and right-tree balance.
- Post-fix evidence: `output/playwright/badge-redesign/02-desktop-pass2.png`.

#### Iteration 2

- Earlier finding: P2 the source title width, tree canopy breadth, and background fields carried more visual weight than the second implementation pass.
- Earlier evidence: `output/playwright/badge-redesign/02-desktop-pass2.png`.
- Fix: the display text received controlled horizontal optical scaling, the tree artboard was widened, and the paper field crop was enlarged from the lower edge.
- Post-fix evidence: `output/playwright/badge-redesign/09-desktop-final.png`.

#### Iteration 3

- Earlier finding: P1 and P2 mobile passes first pushed the tree offscreen, then allowed it to overlap the title and conversion controls.
- Earlier evidence: `output/playwright/badge-redesign/04-mobile-pass1.png`, `output/playwright/badge-redesign/05-mobile-pass2.png`, and `output/playwright/badge-redesign/06-mobile-pass3.png`.
- Fix: the compact tree was reduced, moved below the action row, and softened behind a directional mask while preserving the broad pointer response on capable devices.
- Post-fix evidence: `output/playwright/badge-redesign/07-mobile-final.png` and `output/playwright/badge-redesign/08-mobile-menu.png`.

### Primary interactions tested

- Moved the desktop pointer through the central content area and verified the wide tree field enters the pointer state with 187 active scale pixels.
- Hovered the desktop navigation and verified the existing capsule feedback remains present without moving adjacent labels.
- Opened the compact menu at 390 x 844 and verified `aria-expanded="true"`, complete navigation labels, and an unobstructed registration action.
- Opened `/next/` and verified the legacy grove composition retains two trees, direct interaction, nine terrain layers, and eleven echoes.
- Opened `/goal/about/` and verified its interactive masthead, ripple mode, transparent initial header, and absence of the homepage field.
- Checked the browser development log after the final route pass and found no warnings or errors.
- Ran unit tests, Astro diagnostics, the production build, and route-level build validation successfully.

### Residual test gaps

- Static comparison images cannot express the temporal texture of the mosaic ripple or navigation spring.
- The DOM state checks, interaction counts, responsive screenshots, route isolation checks, build validator, and full test suite cover the implementation risks relevant to this change.

final result: passed

## Capsule Navigation And Wide Tree Response

### Comparison target

- Source visual truth: `output/playwright/capsule-tree-baseline.png`, where the two “立即报名” actions establish the existing light 3D capsule language.
- Rendered implementation: `output/playwright/capsule-nav-hover-final.png` for the navigation capsule and `output/playwright/capsule-tree-home-wide-response.png` for the enlarged tree response field.
- Inner-page implementation: `output/playwright/capsule-about-ripple-active.png`.
- Mobile implementation: `output/playwright/capsule-mobile-menu.png`.
- Full-view comparison: `output/playwright/capsule-design-qa-full.png`.
- Focused header comparison: `output/playwright/capsule-design-qa-header.png`.
- Browser CSS viewport: 1280 x 720 with device pixel ratio 2 for the desktop comparison, and 390 x 844 for the compact navigation check.
- Source and implementation screenshot pixels: 1280 x 720 because the browser capture normalizes both device-density images to CSS pixels.
- Density normalization: source and implementation have identical screenshot dimensions and browser density, so no resampling was required.
- State: the page is at the top with the transparent header, first idle and then with the pointer hovering over “会议简介”.

### Findings

No actionable P0, P1, or P2 visual or interaction differences remain for the requested capsule and tree changes.

- Fonts and typography: navigation size, weight, spacing, hero typography, and all content copy remain unchanged.
- Spacing and layout rhythm: the capsule expands inside the existing navigation rhythm without shifting neighboring labels or competing with the registration action.
- Colors and visual tokens: the navigation capsule reuses the same paper-to-lavender fill, purple outline, inset highlight, and restrained shadow as the existing “立即报名” actions.
- Image quality and asset fidelity: the DOM-rendered mosaic trees and canvas particle field remain unchanged assets, with no replacement illustration or synthetic overlay.
- Copy and content: all routes, labels, dates, locations, and calls to action remain unchanged.
- Interaction: all pointer-following glass layers are removed, normal pointer placement over the central title now activates 61 tree scale pixels, and the inner page keeps only a color-preserving particle ripple.
- Responsiveness: the 390 x 844 compact menu retains its original layout, full-width interaction rows, clear registration action, and zero horizontal overflow.
- Accessibility: keyboard focus uses one clear purple outline around the capsule, reduced-motion behavior remains intact, and coarse-pointer layouts do not receive desktop hover transforms.
- Cross-preview isolation: `/goal/` uses the wide tree mode and capsule navigation, while `/next/` preserves direct tree interaction and does not receive the capsule treatment.

### Comparison history

#### Iteration 1

- Earlier finding: P1 the pointer-following liquid lens was visually dominant across the navigation, homepage, and inner pages.
- Earlier evidence: `output/playwright/liquid-glass-final-natural.png` and `output/playwright/liquid-glass-implementation-about.png`.
- Fix: all liquid lens markup, styles, spring logic, and canvas refraction were removed, with no liquid nodes remaining in the rendered goal pages.
- Post-fix evidence: `output/playwright/capsule-tree-home-wide-response.png` and `output/playwright/capsule-about-ripple-active.png`.

#### Iteration 2

- Earlier finding: P1 clicking the central conference title produced zero active tree pixels because the pointer was outside the original direct-response radius.
- Earlier evidence: the browser contract reported `data-active-scale-pixels="0"` while the title occupied the normal central browsing area.
- Fix: the goal preview now uses a 180 to 380 pixel ripple radius with a larger branch eligibility field, while the parked next preview retains the original 68 to 118 pixel direct radius.
- Post-fix evidence: the same central-title interaction reports 61 active scale pixels in `wide` mode.

#### Iteration 3

- Earlier finding: P2 the first keyboard state combined the new capsule with the shared double focus treatment and looked heavier than the registration action.
- Earlier evidence: `output/playwright/capsule-nav-focus-first.png`.
- Fix: the goal navigation capsule now uses one restrained purple focus outline while retaining the shared 3D surface.
- Post-fix evidence: `output/playwright/capsule-nav-focus-final.png` and `output/playwright/capsule-design-qa-header.png`.

### Primary interactions tested

- Hovered a desktop navigation item and verified the capsule scales to 1.055 with the existing registration-action surface tokens.
- Focused the same item from the keyboard and verified the capsule retains one clear focus outline.
- Moved the pointer to the central hero title and verified the tree response increases from zero to 61 active scale pixels without rendering a glass layer.
- Opened the compact mobile menu at 390 x 844 and verified the menu remains fully usable without horizontal overflow.
- Activated the goal about-page masthead and verified it enters the pointer state with `data-pointer-effect="ripple"`, without orange glow or liquid refraction.
- Opened `/next/`, moved the pointer to the same central title position, and verified it retains `direct` mode with zero active tree pixels.
- Opened a fresh browser tab after the final changes and found only the normal development-server connection messages with no runtime errors or warnings.

### Residual test gaps

- Static screenshots cannot show the continuous temporal rhythm of the mosaic ripple.
- The browser state contract, before-and-after captures, responsive checks, unit tests, and fresh runtime log cover the implementation risks relevant to this change.

final result: passed

## Tall Desktop Badge Composition

### Comparison target

- User-reported visual evidence: `/var/folders/jt/tl_hrhm575n65jcy0sk0fnr40000gn/T/codex-clipboard-91cc85ba-8fdd-42e4-b125-220cf20b7e26.png`.
- Same-viewport implementation baseline: `output/playwright/badge-crop-fix/01-current-browser-before.png`.
- Same-viewport revised implementation: `output/playwright/badge-crop-fix/02-current-browser-after.png`.
- Full-view comparison: `output/playwright/badge-crop-fix/04-before-after-stacked.png`.
- Focused tree and background comparison: `output/playwright/badge-crop-fix/05-tree-background-focus.png`.
- Browser CSS viewport: 1280 x 720 at device pixel ratio 2 for the controlled before-and-after comparison.
- Source and implementation screenshot pixels: 1280 x 720 because the browser capture normalizes the device-density image to CSS pixels.
- User-reported screenshot pixels: 3358 x 2368, including browser chrome, which corresponds to an approximately 1679 x 1134 CSS content surface on the Retina display.
- Density normalization: the controlled baseline and revised implementation use identical viewport, capture density, route, and top-of-page state, so no resampling was required.
- State: `/goal/` is at the top with the transparent navigation, complete hero copy, and the single right tree at rest before a separate wide-pointer interaction check.

### Findings

No actionable P0, P1, or P2 visual, responsive, or interaction issues remain for the reported tall-desktop crop.

- Fonts and typography: the year, mosaic conference name, English tagline, metadata, navigation, and actions keep their existing family, scale, weight, line height, spacing, and wrapping.
- Spacing and layout rhythm: the editorial copy column remains fixed while the right tree is now sized by both viewport height and width and centered vertically, preventing tall windows from magnifying it beyond the visible frame.
- Colors and visual tokens: the warm paper, indigo, lavender, teal, peach, and orange palette is unchanged, but the complete corner color fields are now visible instead of being cropped to a mostly empty center.
- Image quality and asset fidelity: a dedicated 1536 x 1024 paper field serves desktop viewports up to a 1.99 aspect ratio, so high desktop windows use an asset matched to their slot rather than stretching the wide background.
- Copy and content: all conference copy, navigation labels, dates, venue, registration destination, and schedule destination remain unchanged.
- Responsive behavior: at the reported 1679 x 1134 CSS size, the tree formula resolves to approximately 1209px tall from y -37px to y 1171px, replacing the earlier approximately 1792px tree from y -306px to y 1486px.
- Interaction: the resized tree retains the wide proximity field and activates 642 scale pixels from the central browsing area.
- Accessibility: the decorative paper field keeps empty alternative text, the DOM tree remains hidden from assistive technology, and no focus, target-size, motion, or reading-order behavior changed.
- Cross-preview isolation: the new responsive source and sizing rules remain scoped to the badge composition, while `/next/` preserves its grove composition and probability terrain.

### Comparison history

#### Iteration 1

- Earlier finding: P1 the wide 1800 x 768 paper field used `cover` plus a 1.27 scale at every desktop aspect ratio, while the tree height stayed at 158% of the viewport, so a tall desktop showed only central background texture and a partial oversized tree.
- Earlier evidence: the user-reported screenshot and `output/playwright/badge-crop-fix/01-current-browser-before.png`.
- Fix: added a 3:2 high-desktop paper asset, selected it by aspect ratio, limited wide-background enlargement to aspect ratios of 2:1 or wider, and constrained the tree with `min(158%, 72vw)` around the vertical center.
- Post-fix evidence: `output/playwright/badge-crop-fix/02-current-browser-after.png`, `output/playwright/badge-crop-fix/04-before-after-stacked.png`, and `output/playwright/badge-crop-fix/05-tree-background-focus.png`.

### Primary interactions tested

- Loaded the revised `/goal/` top state and verified the browser selects `goal-hero-paper-field-tall.webp` at a 16:9 desktop viewport.
- Verified one right tree, no left tree, zero page overflow, and a visible primary registration action.
- Moved the pointer through the central hero area and verified wide tree interaction enters the pointer state with 642 active scale pixels.
- Checked browser development logs after the final reload and found no runtime errors or warnings.
- Ran all unit tests, Astro diagnostics, the production build, and route-level build validation successfully.

### Residual test gaps

- The browser surface did not expose an arbitrary viewport override for the exact user screenshot dimensions, so the 1679 x 1134 result was verified from the responsive asset selection and computed geometry rather than a second exact-size capture.
- The controlled 1280 x 720 before-and-after comparison, tall asset dimensions, computed high-viewport tree bounds, runtime checks, and full build validation cover the regression addressed here.

final result: passed

## Stable Badge Tree Anchor

### Comparison target

- Source visual truth: `/var/folders/jt/tl_hrhm575n65jcy0sk0fnr40000gn/T/codex-clipboard-8b06d0cd-5e83-4006-9b5a-0d26b0c37c1c.png`, `/var/folders/jt/tl_hrhm575n65jcy0sk0fnr40000gn/T/codex-clipboard-9d53bd66-039c-45c1-9cb2-37ee5815323b.png`, and `/var/folders/jt/tl_hrhm575n65jcy0sk0fnr40000gn/T/codex-clipboard-2baa0f8f-46db-43a1-9469-c84507e1d079.png`.
- Rendered implementation: `output/playwright/tree-anchor-fix/01-implementation-final.png`.
- Full-view comparison: `output/playwright/tree-anchor-fix/02-reported-and-fixed-contact-sheet.png`.
- Browser CSS viewport: 1038 x 1093 at device pixel ratio 2, with a 1023 x 1092 hero field after the scrollbar gutter.
- Source screenshot pixels: 3840 x 2378, 2682 x 2382, and 1204 x 2380.
- Implementation screenshot pixels: 1038 x 1093.
- Density normalization: the three user captures are Retina-density responsive references, while the browser screenshot is normalized to CSS pixels by the browser surface.
- State: `/goal/` is at the top with the transparent header, one right tree, and the pointer first at rest and then inside the broad tree response field.
- Focused comparison: a separate crop was not needed because the reported defect concerned the full tree's scale and anchor across the complete viewport rather than a small typographic or control detail.

### Findings

No actionable P0, P1, or P2 visual, responsive, or interaction issues remain for the reported tree drift.

- Fonts and typography: the navigation, year, mosaic title, English tagline, metadata, and actions retain their existing family, size, weight, line height, and wrapping.
- Spacing and layout rhythm: the tree now uses a stable trunk anchor and a height floor tied to the hero, so tall desktop windows no longer shrink the tree between otherwise adjacent responsive widths.
- Colors and visual tokens: paper, indigo, lavender, teal, peach, orange, masks, and opacity are unchanged.
- Image quality and asset fidelity: the existing DOM mosaic tree and responsive paper assets are preserved without a replacement illustration, scaling blur, or new approximation.
- Copy and content: all conference text, navigation labels, date, venue, registration destination, and schedule destination are unchanged.
- Responsive behavior: the earlier 1024px and narrow-phone position jumps are removed, desktop tree height now resolves between 116% and 132% of the hero, and compact layouts retain a consistent 98% height and 58% vertical anchor.
- Interaction: moving the pointer into the tree field increased active scale pixels from 0 to 713 while the tree rectangle stayed exactly 960.375 x 1266.719 CSS pixels at x 104.671 and y -87.359.
- Accessibility: the positioning transform is static rather than animated, reduced-motion still disables individual pixel movement, and the decorative field remains hidden from assistive technology.
- Runtime: the page initializes one tree, produces no horizontal document overflow, and reports no browser runtime errors.

### Comparison history

#### Iteration 1

- Earlier finding: P2 the desktop tree height was driven directly by `72vw`, then changed to unrelated top, right, and height values at 1024px and 496px, so resizing made the same tree visibly shrink, jump, and grow again.
- Earlier evidence: the three user-provided wide, tall-desktop, and compact captures in the comparison target.
- Fix: introduced shared tree anchor variables, anchored the trunk with one static transform, constrained desktop height by the hero as well as viewport width, and removed both breakpoint-specific geometry jumps.
- Post-fix evidence: `output/playwright/tree-anchor-fix/01-implementation-final.png` and `output/playwright/tree-anchor-fix/02-reported-and-fixed-contact-sheet.png`.

### Primary interactions tested

- Loaded the revised `/goal/` top state and verified one initialized right tree with no horizontal document overflow.
- Moved the pointer through the broad tree field and verified 713 mosaic pixels respond while the complete tree rectangle and anchor remain unchanged.
- Waited through the active ripple cycle and verified the full tree rectangle remains unchanged over time.
- Checked browser logs and found only normal development-server connection and hot-update messages.
- Ran all unit tests, Astro diagnostics, the production build, and route-level build validation successfully.

### Residual test gaps

- The browser surface does not expose an arbitrary viewport override for the three exact user capture sizes.
- The three responsive source captures, full-view contact sheet, computed fixed-anchor geometry, live interaction rectangle check, and production validation cover the reported regression.

final result: passed
