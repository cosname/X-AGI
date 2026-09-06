# X-AGI 2026 Source Archive

This directory is the canonical non-published archive for supplied 2026 source material.
It preserves editable masters, high-resolution originals, alternate exports, historical candidates, and QA evidence that must not live only on a desktop or in a temporary directory.

The archive contains 88 recorded source entries representing 87 unique payloads.
Eighty-six payloads are stored here under semantic names.
One supplied SVG was already byte-identical to `assets/brand-kit/2026/wordmark.svg`, so the manifest points to that existing canonical file instead of storing another copy.
The supplied `1.png` and `thu.png` files were also byte-identical, so both provenance entries point to one canonical Tsinghua source file.

## Directory roles

- `brand/` contains the Illustrator identity master and supplied brand export variants.
- `campaign/` contains the supplied 2026 key visual and orbit-mark reference.
- `partner-logos/` contains original organization logo deliveries and editable logo boards.
- `history/` contains high-resolution or otherwise unselected historical conference images.
- `people/` contains 30 public portraits supplied through the 2026 attendee workbook, without registration or private contact fields.
- Portrait source files retain their image pixels while embedded EXIF, XMP, IPTC, GPS, camera identifiers, and creator contact metadata are removed before repository storage.
- `venue/` contains the original high-resolution hotel and floor-plan files.
- `qa/` contains annotated review evidence that explains design decisions.

## Naming policy

Canonical filenames use ASCII lowercase kebab-case.
The filename grammar is `<subject>-<role>[-<variant>][-<meaningful-sequence>].<extension>`.
Pure numbers, whitespace, underscores, parentheses, Chinese filenames, and ambiguous tokens such as `backup`, `copy`, `draft`, `final`, `tmp`, and `untitled` are prohibited.
Bare generic stems such as `logo`, `image`, `photo`, `mobile`, and `banner` are also prohibited because they identify a file category without identifying its subject.
Meaningful sequence numbers must be placed at the end and zero-padded.
Original supplied names are retained only inside `manifest.json` as migration provenance.

## Integrity

`manifest.json` records every supplied source entry, its canonical repository path, SHA-256 digest, byte count, media type, dimensions when applicable, modification time, and any runtime counterpart.
`checksums.sha256` covers every canonical payload stored inside this archive.
Run `npm run assets:verify` from the repository root to verify naming, manifest coverage, checksums, duplicate control, runtime counterpart paths, symlink boundaries, and the absence of private absolute filesystem paths.

Files in this directory are source material and must never be copied wholesale into `public/2026/` or `dist/`.
Create only the runtime export required by a specific consumer, give it a semantic filename, and place it in the appropriate current-year runtime directory.
