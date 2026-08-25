# X-AGI 2026 Design System

## Design source of truth

The published 2026 homepage is the visual source of truth for current and future pages.
The system combines a warm paper surface, indigo and violet ink, a DOM-rendered mosaic tree, probability terrain, restrained cyan and orange glints, and layered Frosted Glass controls.
New work should extend this language rather than introducing generic glass cards, unrelated gradients, or a second visual system.

The primary design principle is contrast between a tactile editorial surface and precise computational structures.
Paper provides calm and readability.
The pixel field, tree, terrain, and history waveform express statistics, data science, and connected research communities.
Glass is reserved for active controls and hierarchy rather than used as decoration across every surface.

## Palette and typography

Core color roles are defined in the production styles rather than duplicated as page-local literals.
The visual hierarchy uses warm ivory for the page surface, deep indigo for primary ink and depth, blue-violet and purple for active structures, pale lavender for separation, and restrained cyan or orange for small optical glints.
Near-black blocks and high-saturation rainbow gradients do not belong in the current system.

Display typography should preserve the established X-AGI title proportions and optical alignment.
Condensed utility typography is used for navigation, labels, dates, metadata, and controls.
Body copy prioritizes Chinese reading comfort, stable line length, and clear information hierarchy.
New type treatments should be tested against both Latin and Chinese glyph metrics rather than aligned only by element boxes.

## Frosted Glass hierarchy

The production material system has four levels.
Each level should preserve translucency and optical depth without reading as a glossy plastic button or a visible drawn outline.

### Lens

Lens material is used for the moving desktop navigation capsule, compact-menu target lens, and homepage action capsule.
It has the strongest local refraction, upper highlight, violet lower depth, and responsive motion.
The center remains translucent.
The edge should read as light separation, not a stroke.

### Shell

Shell material belongs to a containing control such as the compact mobile menu.
It uses softer diffusion and broader shadows than a lens so the moving lens remains the active layer.
The shell should not create an additional competing selected state.

### Panel

Panel material is used for current inner-page cards and larger content surfaces.
It prioritizes text contrast and stable depth over visible refraction.
Panels should retain the warm paper relationship and use quiet optical separation from the background.

### Micro

Micro material is for badges, compact metadata, small chips, and restrained supporting controls.
It should use the least blur and the least visual weight.
A micro surface must never compete with the primary action or page title.

## Glass edge and lighting rules

Avoid hard one-pixel borders on rounded glass when antialiasing can create dark endpoint seams.
Use layered highlights, subtle inner separation, and soft contact shadows instead.
Rim opacity and stroke width must remain low enough that the material does not look outlined or thick.

Long Bar lighting uses a smooth deep-indigo to blue-violet to purple progression.
Do not split it into hard color segments.
Do not place a bright hotspot at the central color transition.
Keep the label centered and preserve a card-concentric corner radius rather than turning the bar into a full pill.

Static highlights should remain subordinate to interaction.
The approved Long Bar treatment intentionally uses reduced static lighting so the page retains calm depth.
Cyan and orange glints are accents, not complete edge colors.

## Homepage composition

`src/components/2026/home/PublishedHomeHero.astro` owns the published one-viewport hero.
`src/components/2026/home/GoalHomeLower.astro` owns the long-page transition from the hero into history and organization content.
`src/components/2026/home/GoalHistoryGallery.astro` owns the history semantics and visual structure.
`src/components/2026/home/GoalPartnerFooter.astro` owns organization groups, contact, and legal information.

The hero is a responsive DOM composition.
It must not be replaced by Canvas scene composition, broad WebGL rendering, DOM rasterization, SVG `foreignObject`, or runtime screenshots of the page.
The mosaic tree and probability terrain remain structurally inspectable and sharp across device densities.

The primary action and schedule action share one measured liquid capsule.
The capsule defaults to registration, follows pointer or keyboard ownership, and uses measured target geometry so unequal sizes and wrapped mobile rows remain aligned.
Reduced-motion users receive immediate state changes.
The original links remain functional without the enhanced capsule.

The desktop navigation uses one shared moving lens rather than separate hover pills.
The compact mobile navigation expands from the upper-right trigger into one shell and uses one shared lens across stacked targets.
Closed panels must remain inert and hidden from assistive technology.
Escape restores focus to the trigger.

## Inner pages

The five current inner pages are `/about/`, `/schedule/`, `/poster/`, `/guide/`, and `/register/`.
Their content components live under `src/components/2026/inner/`.
`src/layouts/PublishedInner2026Layout.astro` provides the current document shell, Meta, favicon, shared navigation, and current styles.
`src/styles/published-inner-2026.css` provides self-contained structural rules.
`src/styles/goal-2026.css` provides the current paper, masthead, card, table, and glass skin.

Current inner pages must not load archived Bootstrap, archived 2025 styles, or any `/2025/**` asset.
Reusable structure should receive explicit 2026 classes rather than retaining Bootstrap-oriented class names.
The inner masthead keeps the current pixel field, safe zones, transparent top navigation state, and pointer interaction where the input and motion preferences allow it.

Content cards should use clear heading bars, practical body spacing, readable line lengths, and predictable responsive behavior.
Tables must scroll inside their own container on narrow screens and must never cause body-level horizontal overflow.
Venue plans, hotel codes, partner logos, and legal icons must come from 2026-owned sources.

## History gallery

The production history source is `src/data/goal-history.ts` with 17 events and exactly 51 photographs.
Source images live under `src/assets/2026/goal-history/` and are optimized by Astro into `dist/_assets/`.
The data is stored chronologically and rendered in descending order from edition 18 to edition 8.
Each event contains exactly three images with human-written Chinese alternative text and a visible caption.

The gallery uses native horizontal scrolling and `scroll-snap-type: inline proximity`.
Desktop should show approximately 2.2 events.
Tablet should show approximately 1.25 to 1.4 events.
Mobile should show one dominant event with enough of the next event visible to signal horizontal content.
Do not force every source image into a uniform 16:9 crop.
Do not enlarge early low-resolution images beyond their useful source quality.

The waveform above the gallery is a one-event-per-line directory.
Every line is a native button inside a full grid-cell hit target.
The current event uses `aria-current="location"`.
Arrow keys, Home, End, Enter, and Space retain their native or documented toolbar behavior.
Clicking a waveform item changes only horizontal gallery position and must not move the page vertically.

The gallery initializes near the viewport with `IntersectionObserver` and preserves native lazy loading.
It uses `ResizeObserver`, `requestAnimationFrame`, and `AbortController` for measured state and cleanup.
JavaScript failure or `<noscript>` must leave a complete readable horizontal gallery with a visible native scrollbar.
Remote Qpic images and public source-link cards are prohibited.

## Asset rules

Runtime public assets belong under `public/2026/` according to purpose.
Brand runtime files belong in `public/2026/brand/`.
Legal files belong in `public/2026/legal/`.
One selected logo per organization belongs in `public/2026/logos/`.
Venue source images imported through Astro belong in `src/assets/2026/venue/`.

Curated vector masters live in `assets/brand-kit/2026/` and are not published.
A runtime export should be created only for a specific site requirement.
Do not publish all alternate formats, on-dark variants, intermediate exports, or byte-identical derivatives.

Complete source deliveries live in `assets/source-archive/2026/` and are not published.
This archive owns editable masters, high-resolution originals, alternate supplier exports, historical candidates, and QA evidence that would otherwise live outside the repository.
Every archived payload must have a semantic lowercase kebab-case filename, a manifest entry, and a verified SHA-256 checksum.
The manifest may retain a supplied filename for provenance, but no current asset may use a number-only, copy-suffixed, temporary, bare-generic, or otherwise ambiguous filename.
No source asset may exist only on Desktop, in Downloads, or in a temporary directory.

The 2025 archive is independent and frozen.
A current page must never link to an archived asset merely because the pixels happen to match.
Copy the needed source into 2026 ownership, choose a clear filename, and update the current consumer.

## Accessibility and input behavior

All interactive controls need visible keyboard focus and practical target sizes.
Decorative tree, terrain, particle, and glass layers remain hidden from assistive technology and must not intercept pointer input.
Current-page navigation semantics and expanded or inert states must remain accurate.

`prefers-reduced-motion` disables continuous decorative motion and replaces animated control movement with immediate state changes.
Coarse-pointer layouts must not depend on hover.
`prefers-contrast: more` and forced-colors modes must retain readable text, visible focus, and distinguishable controls.
The design should remain usable at 200 percent zoom without body-level horizontal scrolling.

## Motion and lifecycle

Motion should communicate one coherent event at a time.
The tree, terrain, navigation capsule, action capsule, and history waveform should not all demand attention simultaneously.
Persistent ambient motion must remain low amplitude and stop when the page is hidden or the user requests reduced motion.

Components that measure layout must handle resize, page visibility, `pageshow`, `pagehide`, BFCache restoration, and breakpoint changes.
Pointer capture and cancellation must clean up active state.
A component should schedule animation frames only while state is moving or input energy remains.

## Verification checklist

After a visual or interaction change, inspect all six production routes in a real browser at desktop and mobile widths.
Use 390px and 320px widths for compact navigation and narrow-content checks.
Check at least one tall desktop and one short desktop viewport when hero geometry changes.

Verify the following relevant states:

- transparent and scrolled navigation
- desktop pointer and keyboard capsule ownership
- compact menu open, close, Escape, focus restoration, and inertness
- homepage action capsule default, hover, focus, wrapped rows, and reduced motion
- history gallery pointer, touch, keyboard, native fallback, and page-position stability
- inner-page masthead, card, table, venue image, partner logo, and registration form containment
- zero console errors, failed resources, body-level horizontal overflow, and current-page `/2025/**` requests

Run the focused unit tests for changed geometry or state helpers.
Run `npm run check` after component or import changes.
Run a fresh `npm run build` after deleting stale `dist/`.
Run `npm test` before release.
Treat visual inspection as required evidence for user-facing design changes rather than relying on type checks or screenshots alone.
