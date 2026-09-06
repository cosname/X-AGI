# Homepage Chinese title font

The homepage title uses LXGW WenKai Medium v1.522 (weight 500), pinned to upstream commit `e8b5b48b79f19f29aa68b0a178eab3472ea9f7e8`.
The unmodified TTF is archived at `assets/source-archive/2026/fonts/lxgw-wenkai-medium.ttf`, and `LICENSE-LXGWWenKai.txt` preserves the SIL OFL 1.1 license from the same revision.
Only `lxgw-wenkai-title-medium.woff2` is requested by the homepage.
The subset preserves the font name and license records and covers the complete Chinese title plus all ten edition digits.

Regenerate it from the repository root after changing the Chinese title:

```bash
uv run --no-project --with 'fonttools[woff]==4.64.0' pyftsubset assets/source-archive/2026/fonts/lxgw-wenkai-medium.ttf --text='第0123456789届交叉智能大会' --flavor=woff2 --name-IDs='*' --name-languages='*' --output-file=src/assets/fonts/lxgw-wenkai-title-medium.woff2
```

Verify glyph coverage after changing this text, since a missing glyph silently falls back to another font.
The original `noto-serif-sc-xagi-semibold.woff2` remains the shared serif font for other site content.
