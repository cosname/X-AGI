# Design QA

## Scope

This pass refines the approved 2026 X-AGI homepage hero as native HTML and CSS.
It addresses probability-field flicker, rigid whole-layer translation, left-root overlap, small-scale moire, whole-branch sway, and the requested mosaic-scale tree response.
The final typography pass also resolves the visual mismatch between the dotted X-AGI wordmark and the formerly oversized, heavy sans-serif Chinese title.

## Source visual truth

The selected source is `/Users/audiofool/.codex/generated_images/019f598b-6ed2-71a2-925a-7a56116ae18c/exec-cb7d7bce-0879-47bb-9a43-a9a84eef9f1f.png`.
The source is 1487 by 1058 pixels.
It establishes two independently shaped pixel trees, non-uniform mosaic grain, a central live-information hierarchy, and a layered navy, violet, and orange probability landscape.

## Implementation strategy

The complete source composition is not placed into the website as a screenshot.
The conference year, title, tagline, date, venue, and calls to action remain semantic HTML.
`src/components/HeroPixelField.astro` server-renders 3,586 decorative HTML pixel blocks for the two asymmetric trees.
`src/data/hero-pixel-field.generated.json` contains deterministic position, size, color, and alpha tokens for those blocks.
`scripts/generate-hero-pixel-field.mjs` reproduces that checked-in data from the approved authoring reference.
The source image is an authoring input only and is not copied into the runtime build.

The tree blocks are now partitioned into eleven structural HTML groups for roots, trunks, crowns, inner branches, and outer branches.
Every group preserves its exact resting coordinates.
Large and medium opaque blocks within those groups are eligible for the local scale response.
Only blocks inside the cursor's bounded radius animate, while roots remain almost fixed.
Each active block expands from the corner nearest its branch origin, producing an overlapping scale-like ripple that follows the branch topology.

The probability landscape uses eight full-field HTML terrain surfaces and eleven HTML echo bands.
Every terrain texture is anchored to the same integer CSS pixel grid.
Pointer input changes the Gaussian components that define each layer's clip path instead of translating the textured element.
The pointer therefore changes local peak height, width, and only a small amount of peak position.
This keeps each layer's intrinsic distribution visible while allowing the complete stack to respond.

The terrain grid uses five-pixel cells on desktop and four-pixel cells below 720 CSS pixels.
Each cell contains a true square color block separated by a one-pixel gap.
The larger integer grid reduces high-frequency moire and avoids fractional background phases.
The left tree receives a fixed lower-root fade before the terrain is composited above it.
A paper-colored HTML occlusion surface tracks the exact dynamic navy terrain path between the tree and terrain layers.
This prevents the tree blocks from showing through the transparent terrain lattice while preserving the natural tree-to-hill transition.

The homepage hero contains no runtime image, picture, SVG, Canvas, CSS image URL, or image-set dependency.
The existing Canvas field remains available only for separate masthead and lower-page poster decorations.

## Evidence

The final desktop resting capture is `output/tree-density-hero/request-square-pattern.jpg`.
The same-size source and implementation comparison is `output/tree-density-hero/request-reference-comparison-final.jpg`.
The focused left, resting, and right terrain comparison is `output/tree-density-hero/final-terrain-sequence.jpg`.
The focused branch response comparison is `output/tree-density-hero/branch-proximity-sequence.jpg`.

The in-app browser viewport was 1502 by 1058 CSS pixels with a reported device pixel ratio of 2.
The browser content width was exactly 1487 pixels after the scrollbar was excluded.
The browser screenshot API normalized its output to CSS-pixel dimensions and omitted the final 11 rows, so the displayed evidence is 1047 pixels tall even though the measured DOM field reaches the expected bottom edge.

The responsive evidence is `output/tree-density-hero/request-mobile-390.jpg` and `output/tree-density-hero/request-mobile-320.jpg`.
The adjacent-pointer stability evidence is `output/tree-density-hero/flicker-square-700.jpg` and `output/tree-density-hero/flicker-square-705.jpg`.
The final marker removal and left-root cleanup are shown in `output/tree-density-hero/final-tweak-after-2.jpg` and `output/tree-density-hero/final-tweak-left-overlap-comparison-2.jpg`.
The matching active-pointer edge is shown in `output/tree-density-hero/final-tweak-left-overlap-pointer.jpg`.
The normalized source and final resting implementation are shown together in `output/tree-density-hero/scale-motion/source-rest-comparison.jpg`.
The former whole-branch movement and the revised block-level response are shown together in `output/tree-density-hero/scale-motion/before-after-motion-comparison.png`.
The focused animated evidence is `output/tree-density-hero/scale-motion/detail3/ripple.gif`.
The final responsive resting evidence is `output/tree-density-hero/scale-motion/mobile-comparison.jpg`.
The final optimized resting and active captures are `output/tree-density-hero/scale-motion/final-rest-optimized.jpg` and `output/tree-density-hero/scale-motion/final-active-optimized.jpg`.
The title baseline before the typography refinement is `output/title-refinement/before-desktop.jpg`.
The final desktop implementation is `output/title-refinement/final-desktop.jpg`.
The approved source and implementation are normalized to 1487 by 1047 pixels and shown together in `output/title-refinement/full-comparison.jpg`.
The focused source and implementation title comparison is `output/title-refinement/title-comparison.jpg`.
The focused same-implementation before and after comparison is `output/title-refinement/before-after-title.jpg`.
The final compact evidence is `output/title-refinement/final-mobile-390.jpg` and `output/title-refinement/final-mobile-320.jpg`.

## Five-surface review

### Typography

The conference copy remains live, selectable, and available when JavaScript is disabled.
The year, title, tagline, metadata, and calls to action preserve the source hierarchy and central alignment.
The English tagline declares `lang="en"` inside the Chinese page language context.
The Chinese title now uses the bundled XAGI Serif SC semibold face at a reduced optical size instead of a synthetic-looking heavy system sans face.
Its solid midnight-blue strokes intentionally counterpoint the dotted Latin wordmark, while the tightened gap and raised optical baseline make both scripts read as one title lockup.
At desktop size, the Chinese glyph box is approximately 80.6 pixels high instead of the previous 147-pixel inline box, and it no longer extends below the Latin title line.

### Spacing and layout

The left and right trees preserve separate source anchors instead of sharing a mirrored template.
All 3,586 tree blocks remain true squares at desktop and compact widths.
The live-copy sanctuary prevents tree blocks from interfering with the year, title, tagline, metadata, or actions.
Compact layouts crop and reframe the source trees around the outer rails instead of compressing the desktop scene.
At 320 CSS pixels, the document has no horizontal overflow and both action targets remain at least 52 pixels tall.
The distribution remains below the action area at the maximum compact amplitude.

### Colors and visual language

The DOM trees preserve the source's deep navy nodes, lavender branch hierarchy, teal signals, translucent endings, and changing tile scale.
The probability landscape resolves into pale haze, lavender, periwinkle, violet, posterior, navy, and orange depth bands.
The eleven echo bands remain lighter than the main posterior so the field reads as a probability distribution.
The fixed five-pixel desktop lattice renders as separated square mosaic blocks rather than a line grid.

### Motion and interaction

The posterior keeps an intrinsic mean of 0.675.
Pointer influence is bounded to 0.028 on either side before each layer applies its smaller local response.
The active path commits the newest pointer state on the next animation frame without an interpolation delay.
All eight layers deform their Gaussian components independently, so peak values and widths change without moving the full texture.
The release spring returns the distribution to its exact canonical state.

The tree is divided into structural branch groups.
Pointer proximity first rejects distant groups, then evaluates only eligible blocks inside a 68-to-118-pixel local radius.
The active blocks use two coherent wave frequencies and branch-origin phase offsets, so neighboring squares rise in a continuous scale-like sequence instead of moving as a rigid branch.
Root groups are limited to approximately two percent scale movement, while crowns and outer branches can reach the bounded 0.84-to-1.16 scale range.
Each entering block ramps from rest over 110 milliseconds, and departing blocks settle over 150 milliseconds.
This keeps the source topology anchored while making the mosaic itself carry the motion.

Touch input remains passive and never starts the decorative interaction.
Coarse-pointer and reduced-motion environments receive a canonical static state.
Moving the field out of view or hiding the document resets the field instead of freezing an intermediate frame.

### Accessibility and lifecycle

The decorative field is `aria-hidden`, unfocusable, and unable to intercept pointer events.
The title, facts, links, and registration action remain semantic HTML above the field.
Observers and listeners are removed before Astro page swaps.
The branch loop runs only while the cursor is close enough to a branch, and the terrain does not redraw while the pointer is stationary away from the trees.

## Comparison history

### Passes 1 through 3

The original radial network and smooth three-wave field did not match the approved tree composition.
Procedural mirrored trees could not reproduce the source's asymmetric branch hierarchy.
A temporary transparent raster proved the target geometry before the user required a complete HTML representation.

### Passes 4 through 6

The DOM extraction preserved the source trees and was compacted into shared size, palette, and alpha classes.
Terrain depth and faint branch presence were retuned against same-size comparisons.
The raster loader, procedural hero fallback, and homepage Canvas branch were removed completely.

### Passes 7 and 8

Lifecycle review fixed intermediate states that could remain frozen after leaving the viewport.
The first full-stack interaction still translated high-frequency textured layers, which made small pointer movements shimmer and made the response read as a rigid shift.

### Pass 9

All moving terrain transforms were removed.
The texture phase is now fixed while the underlying Gaussian peak values, widths, and local means are recomputed on a single animation-frame schedule.
The terrain cell size increased from three or 2.5 pixels to five or four integer pixels.
The trees were split into eleven structural groups for local proximity motion.
The left lower root now fades into the terrain before compositing, eliminating the previous overlap.

### Pass 10

The decorative posterior marker dot and vertical stem were removed from the HTML, CSS, and interaction loop.
The navy edge distribution was lowered slightly to reduce its visual weight beneath the left tree.
A dedicated occlusion surface now follows the navy layer's resting and interactive clip path exactly, so no tree pixels can leak through its transparent mosaic gaps.

### Pass 11

The original tree interaction moved an entire branch group by one or two pixels while every child block reported `transform: none`.
That response read as a rigid cutout and did not use the mosaic structure.
The replacement keeps all eleven branch containers at `transform: none` and animates only the large and medium opaque HTML blocks nearest the cursor.
The first version sampled one third of eligible blocks and remained too visually sparse.
The final version makes all 2,576 eligible blocks available while limiting each frame to the local interaction radius.
At the reviewed left-crown state, 165 blocks were active, with observed scale values from approximately 0.85 to 1.15.
The right-crown state activated 208 right-side blocks without affecting the left tree.
The left root itself stayed between 0.981 and 1.016 while the adjacent trunk carried the stronger ripple.

### Pass 12

The initial homepage title rendered `大会` in a 760-weight system sans face with a solid fill beside the dotted X-AGI display face.
At the 1502 by 1058 CSS pixel review viewport, the Chinese inline box extended below the parent title line and visually dominated the bilingual lockup.
An all-dotted Chinese test reduced the mismatch but made the fine strokes fragile at 320 and 390 CSS pixels.
The final treatment uses the bundled XAGI Serif SC at weight 600, a 0.72 desktop scale and 0.70 compact scale, a 0.04em raised baseline, and a slightly negative optical gap.
The focused before and after evidence shows the Chinese title retaining clear authority without competing with the X-AGI wordmark.
The 320, 390, and 640 CSS pixel checks all report zero horizontal overflow, and the title remains on one line.

## Verification

`npm run test:unit` passes all thirteen unit tests.
`npm run check` reports 0 errors, 0 warnings, and 0 hints across 32 files.
`npm run build` generates all seven 2026 routes and passes the repository validator.
The final homepage artifact is 375,533 bytes uncompressed and 49,875 bytes with gzip compression.
The repeated scale eligibility and origin classes add approximately 1.8 kilobytes to the compressed homepage while avoiding per-block coordinate attributes.
The DOM field contains 3,586 tree blocks, eleven branch groups, eight terrain layers, and eleven probability echoes.
It contains no posterior marker element.

A five-pixel cursor movement previously produced a normalized bottom-field RMSE of 0.0686798.
The fixed-grid implementation produces 0.0101474 under the same capture geometry, an approximately 85 percent reduction in visual difference intensity.
Two screenshots taken 500 milliseconds apart with the pointer stationary produced identical SHA-256 hashes.
All eight terrain layers report `transform: none` during active interaction.

The left and right pointer states produced means of 0.6568 and 0.6929 while changing layer peak shapes.
Pointer exit returned the field to mean 0.6750, amplitude 0.2500, idle state, and zero active branch groups within 1.3 seconds.
The left-crown proximity check activated 165 individual scale blocks while every branch container retained `transform: none`.
The right-crown proximity check activated only right-side blocks.
After pointer exit, all active and settling attributes and inline transforms cleared within 220 milliseconds.
The active navy terrain and its root-occlusion surface report identical clip paths during pointer movement.

The final 390 and 320 CSS pixel captures have no horizontal overflow.
The 320 layout keeps action targets between 52 and 54.4 pixels tall and uses the four-pixel terrain lattice.
Both compact resting captures contain zero active scale blocks.
The in-app browser reported no warning or error after desktop, interaction, and compact route checks.
`git diff --check` passes.

The final title pass was rendered in the in-app browser at 1502 by 1058, 640 by 800, 390 by 844, and 320 by 720 CSS pixels.
The final desktop screenshot is 1487 by 1047 normalized CSS pixels at a reported browser device pixel ratio of 2, matching the source width after scrollbar exclusion and source-height normalization.
The focused 1640 by 360 comparison places the 820 by 360 source crop and implementation crop in the same image.
The bundled Chinese font reached the browser `loaded` state before capture.
The browser console contained only Vite connection and stylesheet hot-update debug messages, with no warnings or errors.

Real coarse-pointer hardware was not available in the browser harness, so that policy was verified through the implementation path and static responsive evidence.

Pass 12 result: passed

## Pass 13 - Official WeChat content sync

### Scope

This pass translates the four supplied official-account graphics into live website content without importing their Canva layout.
The official wording is preserved in the conference data source and rendered across the homepage, conference introduction, schedule, Rising Stars page, and partner roster.
The presentation uses the established 2026 editorial system of open fields, hairline rules, midnight blue type, generous spacing, and square mosaic accents.

### Source visual truth

The supplied sources are `codex-clipboard-b2347fbc-3202-492a-8d4b-191e198522fc.png`, `codex-clipboard-0f9267dc-a01a-4cc8-9aff-d2b0fe9a8be5.png`, `codex-clipboard-18ca852b-f4b7-4939-b743-8751d53fa94c.png`, and `codex-clipboard-c4b8410b-9651-417c-bab1-98a584fb4f53.png`.
They provide the authoritative conference introduction, three-day flow, Rising Stars requirements and benefits, deadline, partner names, and contact address.
Their rounded Canva panels and handwritten display styling are treated as source-document presentation rather than the website design target.

### Implementation

`src/data/conference2026.ts` now contains the official paragraphs, schedule segments, Poster requirements, benefits, deadline, partner groups, and contact address.
`src/components/ScheduleDay.astro` groups each day by its source time slot so labels and items retain their original relationship.
`src/components/ConferencePartners.astro` renders the organization roster as semantic text and links instead of a collection of logo cards.
The homepage mechanism timeline uses 52-pixel circles with centered tabular numerals, and its rule passes through the exact circle center.
The Rising Stars page uses two open editorial columns and a separate deadline band with no rounded cards or floating labels.
The partner area uses one continuous ruled roster so organization names remain aligned even when they wrap.

### Responsive and overlap review

Desktop review used a 1502 by 1058 CSS-pixel viewport.
Mobile review used 390 by 844 and 320 by 720 CSS-pixel viewports.
The final document width equals the viewport content width at every reviewed size.
The 320-pixel homepage mechanism stream and Poster deadline report no content overflow.
The 390-pixel introduction, schedule, Poster details, and partner roster report no text or line collision.
Long organization names wrap within their own ruled row, and the contact email uses safe anywhere wrapping only when required.

### Evidence

The normalized source and implementation pairs are shown together in `output/push-content-sync/final/reference-implementation-comparison.jpg`.
The desktop mechanism, schedule, Poster, and partner sections are captured under `output/push-content-sync/final/`.
The compact homepage evidence is `output/push-content-sync/final/home-mobile-views.jpg`.
The compact Rising Stars evidence is `output/push-content-sync/final/poster-mobile-views.jpg`.
The 320-pixel edge-case evidence is `output/push-content-sync/final/narrow-views.jpg`.

### Verification

The build validator now checks the rendered about, schedule, and Poster routes for every authoritative source string.
`npm run check` reports no diagnostics.
All thirteen unit tests pass.
The static build generates all seven 2026 routes and passes the repository validator.
The in-app browser reports no horizontal document overflow at the reviewed desktop or mobile widths.

final result: passed
