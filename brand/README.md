# Glass Qubit brand

## The idea

**Glass Qubit** is a lab where nothing is hidden: you see every effect of a gate at once. The logo shows that literally:

- **A glass sphere:** the Bloch sphere, the lab's most recognisable view, drawn as clear glass with a highlight and a reflection.
- **The equator and axis:** the guides a learner reads positions against. The back half of the equator is dashed, seen through the glass.
- **One arrow and an amber point:** the qubit's state. Amber is the only warm colour, so the eye goes to the qubit first.
- **The wordmark:** "Glass" is light and pale (clear, see-through); "Qubit" is bold (the thing you work with). Set in Inter Display, converted to outlines so the files look the same on every device.

## Files

| File | Use |
|---|---|
| `glass-qubit-logo-on-dark.svg` | Horizontal logo on dark backgrounds (the app, the social card) |
| `glass-qubit-logo-on-light.svg` | Horizontal logo on light backgrounds (documents, slides) |
| `glass-qubit-stacked-on-dark.svg`, `-on-light.svg` | Stacked logo for square or narrow spaces (README header) |
| `glass-qubit-mark.svg`, `glass-qubit-mark-512.png` | The sphere alone, 48 px and up (avatars, app icons) |
| `../favicon.svg`, `../favicon-32.png` | Browser tab icon: a simplified mark with thicker lines that stays readable at 16 px |
| `../apple-touch-icon.png` | Home-screen icon on phones and tablets (180 × 180) |
| `social-preview.png` (and `.svg`) | GitHub social preview card, 1280 × 640: Settings → General → Social preview |

## Colours

| Name | Hex | Where |
|---|---|---|
| Glass Blue | `#2f6fed` | The sphere's middle tone; also the app's existing accent colour (buttons, active links) |
| Deep Glass | `#14307f` | The sphere's edge |
| Ice | `#d6e7ff` | The sphere's lit side |
| Soft Blue | `#a9c6ff` | "Glass" in the wordmark on dark backgrounds |
| Ink | `#0e1f4d` | "Qubit" in the wordmark on light backgrounds |
| Qubit Amber | `#ffc24b` | The state point. Use sparingly: it marks the qubit |
| Lab Black | `#111111` | The app background |

## Rules

- Keep clear space around the logo of at least half the sphere's width.
- Use the mark alone at 48 px and larger, and the favicon below that.
- Don't stretch, recolour, rotate or add effects to the logo, or set "Glass Qubit" in another font next to it.
- Use the on-light and on-dark versions on the backgrounds they're made for.

## Regenerating

The SVG files are generated, so change `make-logo.py` rather than editing them by hand. From the repository root:

```bash
pip install fonttools
python3 brand/make-logo.py .
node brand/make-png.js
```

`make-logo.py` reads the Inter Display font files (SIL Open Font License) from `/usr/share/fonts/opentype/inter`, or from the folder in the `INTER_DIR` environment variable. `make-png.js` uses the Playwright already installed for the browser tests.
