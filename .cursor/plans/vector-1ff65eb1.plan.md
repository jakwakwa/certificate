<!-- 1ff65eb1-25af-4992-9627-5fb3380c1c44 c2e833c8-2edd-4450-896f-b8512cc71b7b -->
# Swap html2pdf for jsPDF + svg2pdf with embedded fonts

## What we'll do

- Remove the `html2pdf` dependency and its `.from(...).save()` usage in `index.html`.
- Add `jsPDF` and `svg2pdf.js` and register embedded fonts (Inter, EB Garamond) inside the PDF for perfect text fidelity.
- Build an in-memory A4-sized `<svg>` that reproduces the certificate (borders, gradients, text, footer) and clones the existing inline seal `<svg>` into it.
- Render the SVG to the PDF via `svg2pdf` at 0,0 with width 210mm and save directly (no print dialog).
- Keep the on-screen HTML/CSS unchanged; the SVG is only for PDF output.

## Key edits

- Remove html2pdf script tag and generation code in `index.html`:
```12:14:/Users/jacobkotzee/Projects/REPOS/certificate/index.html
<!-- html2pdf library for PDF generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
```
```326:363:/Users/jacobkotzee/Projects/REPOS/certificate/index.html
// Generate PDF
html2pdf().set(opt).from(certificateContainer).save().then(function() {
  // Show the button again after PDF is generated
  button.style.display = 'flex';
}).catch(function(error) {
  console.error('PDF generation failed:', error);
  button.style.display = 'flex';
});
```

- Add jsPDF + svg2pdf script tags (CDN) just before `</body>` and replace the click handler to construct the SVG and call `svg2pdf`.
- Add font files under `fonts/` and register them with jsPDF before rendering so `svg2pdf` can use "Inter" and "EB Garamond" in the PDF.

## Core generation flow (concise)

```javascript
// 1) Create doc
const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

// 2) Register fonts (TTF -> base64 -> VFS)
await registerFonts(doc, [
  { url: 'fonts/Inter-Regular.ttf', name: 'Inter', style: 'normal' },
  { url: 'fonts/Inter-Bold.ttf',    name: 'Inter', style: 'bold' },
  { url: 'fonts/EBGaramond-Regular.ttf', name: 'EB Garamond', style: 'normal' },
  { url: 'fonts/EBGaramond-Italic.ttf',  name: 'EB Garamond', style: 'italic' },
]);

// 3) Build SVG (A4 mm), clone seal <svg> into it
const svgEl = buildCertificateSVG(extractDataFromDOM());

// 4) Render exact vectors, then save without dialog
await svg2pdf(svgEl, doc, { x: 0, y: 0, width: 210, height: 297 });
doc.save('Share_Certificate_SC-2025-007.pdf');
```

Notes:

- Fonts are embedded; resulting PDF text remains selectable/searchable.
- The inline seal’s gradients and shapes remain vectors; SVG filters (drop shadows) may be simplified if unsupported by svg2pdf.
- All layout triangles/lines are drawn as SVG shapes; letter-spacing and font-sizes set to match screen design.

## Files to touch/add

- Edit: `index.html` (remove html2pdf, add jsPDF/svg2pdf, new click handler)
- Add: `fonts/Inter-Regular.ttf`, `fonts/Inter-Bold.ttf`, `fonts/EBGaramond-Regular.ttf`, `fonts/EBGaramond-Italic.ttf`
- Add: small helpers inside a new inline `<script type="module">` in `index.html`:
  - `registerFonts(doc, fonts)` – fetch TTF -> base64 -> `addFileToVFS`/`addFont`
  - `buildCertificateSVG(data)` – constructs the page SVG (A4), clones existing seal
  - `extractDataFromDOM()` – reads amount/name/cert details from the current DOM

### To-dos

- [ ] Remove html2pdf script tag and usage in index.html
- [ ] Add jsPDF and svg2pdf scripts to index.html
- [ ] Add Inter/EB Garamond TTFs under fonts/ and reference them
- [ ] Implement registerFonts to embed TTFs into jsPDF VFS
- [ ] Build A4 SVG for certificate, clone seal SVG, set text styles
- [ ] Replace click handler to render SVG with svg2pdf and save
- [ ] Validate vector fidelity: selectable text, crisp lines, correct sizing