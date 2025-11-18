import { jsPDF } from 'jspdf';
import {svg2pdf} from 'svg2pdf.js';

type CertData = {
  company: string;
  title: string;
  amountNumber: string;
  amountText: string;
  issuedToLabel: string;
  issuedToName: string;
  certNo: string;
  certClass: string;
  certDate: string;
  signature1Name: string;
  signature1Title: string;
  signature2Name: string;
  signature2Title: string;
  sealSVG: string;
};

const FONT_LIST = [
  { url: '/fonts/Inter-Regular.ttf', name: 'Inter', style: 'normal' as const },
  { url: '/fonts/Inter-SemiBold.ttf', name: 'Inter', style: 'bold' as const },
  { url: '/fonts/EBGaramond-Regular.ttf', name: 'EB Garamond', style: 'normal' as const },
  { url: '/fonts/EBGaramond-Italic.ttf', name: 'EB Garamond', style: 'italic' as const }
] as const;

function extractDataFromDOM(): CertData {
  return {
    company: document.querySelector('header p')!.textContent!.trim(),
    title: document.querySelector('.title-section h1')!.textContent!.trim(),
    amountNumber: document.querySelector('.amount-number')!.textContent!.trim(),
    amountText: document.querySelector('.amount-text')!.textContent!.trim(),
    issuedToLabel: document.querySelector('.issued-to-label')!.textContent!.trim(),
    issuedToName: document.querySelector('.issued-to-name')!.textContent!.trim(),
    certNo: (document.querySelector('.certificate-details p:nth-child(1)') as HTMLElement).textContent!.trim(),
    certClass: (document.querySelector('.certificate-details p:nth-child(2)') as HTMLElement).textContent!.trim(),
    certDate: (document.querySelector('.certificate-details p:nth-child(3)') as HTMLElement).textContent!.trim(),
    signature1Name: (document.querySelector('.signature-block:nth-child(1) .signature-name') as HTMLElement).textContent!.trim(),
    signature1Title: (document.querySelector('.signature-block:nth-child(1) .signature-title') as HTMLElement).textContent!.trim(),
    signature2Name: (document.querySelector('.signature-block:nth-child(2) .signature-name') as HTMLElement).textContent!.trim(),
    signature2Title: (document.querySelector('.signature-block:nth-child(2) .signature-title') as HTMLElement).textContent!.trim(),
    sealSVG: (document.querySelector('.seal-inner svg') as SVGElement).outerHTML
  };
}

async function registerFonts(doc: jsPDF) {
  for (const font of FONT_LIST) {
    const res = await fetch(font.url);
    if (!res.ok) throw new Error(`Failed to fetch font ${font.url}`);
    const buf = await res.arrayBuffer();

    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)) as any);
    }
    const base64 = btoa(binary);

    const vfsName = `${font.name}-${font.style}.ttf`;
    doc.addFileToVFS(vfsName, base64);
    doc.addFont(vfsName, font.name, font.style);
  }
}

function buildCertificateSVG(data: CertData): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');

  svg.setAttribute('width', '793.7');
  svg.setAttribute('height', '1122.5');
  svg.setAttribute('viewBox', '0 0 793.7 1122.5');
  svg.setAttribute('xmlns', ns);

  const defs = document.createElementNS(ns, 'defs');
  defs.innerHTML = `
    <linearGradient id="grad-top-right" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="20%" style="stop-color:#6f4314;stop-opacity:1" />
      <stop offset="65%" style="stop-color:#e6b52d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#efc12b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad-bottom-left" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#efc12b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e6b52d;stop-opacity:1" />
    </linearGradient>
  `;
  svg.appendChild(defs);

  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('width', '793.7');
  bg.setAttribute('height', '1122.5');
  bg.setAttribute('fill', '#f9eeee');
  svg.appendChild(bg);

  const containerWidth = 750;
  const containerHeight = 1030;
  const offsetX = (793.7 - containerWidth) / 2;
  const offsetY = (1122.5 - containerHeight) / 2;

  const g = document.createElementNS(ns, 'g');
  g.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);

  const certBg = document.createElementNS(ns, 'rect');
  certBg.setAttribute('width', `${containerWidth}`);
  certBg.setAttribute('height', `${containerHeight}`);
  certBg.setAttribute('fill', '#f9eeee');
  g.appendChild(certBg);

  const borderInner = document.createElementNS(ns, 'rect');
  borderInner.setAttribute('x', '8');
  borderInner.setAttribute('y', '8');
  borderInner.setAttribute('width', `${containerWidth - 16}`);
  borderInner.setAttribute('height', `${containerHeight - 16}`);
  borderInner.setAttribute('fill', 'none');
  borderInner.setAttribute('stroke', '#6f4314');
  borderInner.setAttribute('stroke-width', '1');
  g.appendChild(borderInner);

  const cornerTop = document.createElementNS(ns, 'path');
  cornerTop.setAttribute('d', `M 16 16 L 16 208 M 16 16 L 208 16`);
  cornerTop.setAttribute('stroke', '#6f4314');
  cornerTop.setAttribute('stroke-width', '2');
  cornerTop.setAttribute('fill', 'none');
  g.appendChild(cornerTop);

  const cornerBottom = document.createElementNS(ns, 'path');
  cornerBottom.setAttribute('d', `M ${containerWidth - 16} ${containerHeight - 16} L ${containerWidth - 16} ${containerHeight - 208} M ${containerWidth - 16} ${containerHeight - 16} L ${containerWidth - 208} ${containerHeight - 16}`);
  cornerBottom.setAttribute('stroke', '#6f4314');
  cornerBottom.setAttribute('stroke-width', '2');
  cornerBottom.setAttribute('fill', 'none');
  g.appendChild(cornerBottom);

  const gradTopRight = document.createElementNS(ns, 'polygon');
  gradTopRight.setAttribute('points', `${containerWidth} 0, ${containerWidth - 195} 0, ${containerWidth} 110`);
  gradTopRight.setAttribute('fill', 'url(#grad-top-right)');
  g.appendChild(gradTopRight);

  const gradBottomLeft = document.createElementNS(ns, 'polygon');
  gradBottomLeft.setAttribute('points', `0 ${containerHeight}, 195 ${containerHeight}, 0 ${containerHeight - 110}`);
  gradBottomLeft.setAttribute('fill', 'url(#grad-bottom-left)');
  g.appendChild(gradBottomLeft);

  let y = 80;

  const header = document.createElementNS(ns, 'text');
  header.setAttribute('x', `${containerWidth / 2}`);
  header.setAttribute('y', `${y}`);
  header.setAttribute('text-anchor', 'middle');
  header.setAttribute('font-family', 'Inter');
  header.setAttribute('font-size', '24');
  header.setAttribute('font-weight', '600');
  header.setAttribute('letter-spacing', '2');
  header.setAttribute('fill', '#6f4314');
  header.textContent = data.company;
  g.appendChild(header);

  y += 60;

  const title = document.createElementNS(ns, 'text');
  title.setAttribute('x', `${containerWidth / 2}`);
  title.setAttribute('y', `${y}`);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-family', 'Inter');
  title.setAttribute('font-size', '48');
  title.setAttribute('font-weight', '700');
  title.setAttribute('letter-spacing', '2');
  title.setAttribute('fill', '#1f2121');
  title.textContent = data.title;
  g.appendChild(title);

  y += 100;

  const amountNum = document.createElementNS(ns, 'text');
  amountNum.setAttribute('x', `${containerWidth / 2}`);
  amountNum.setAttribute('y', `${y}`);
  amountNum.setAttribute('text-anchor', 'middle');
  amountNum.setAttribute('font-family', 'Inter');
  amountNum.setAttribute('font-size', '96');
  amountNum.setAttribute('font-weight', '700');
  amountNum.setAttribute('fill', '#efc12b');
  amountNum.textContent = data.amountNumber;
  const amountNumShadow = amountNum.cloneNode(true) as SVGTextElement;
  amountNumShadow.setAttribute('stroke', 'rgba(84, 55, 55, 0.5)');
  amountNumShadow.setAttribute('stroke-width', '1');
  g.appendChild(amountNumShadow);
  g.appendChild(amountNum);

  y += 40;

  const amountTxt = document.createElementNS(ns, 'text');
  amountTxt.setAttribute('x', `${containerWidth / 2}`);
  amountTxt.setAttribute('y', `${y}`);
  amountTxt.setAttribute('text-anchor', 'middle');
  amountTxt.setAttribute('font-family', 'Inter');
  amountTxt.setAttribute('font-size', '20');
  amountTxt.setAttribute('font-weight', '600');
  amountTxt.setAttribute('letter-spacing', '2');
  amountTxt.setAttribute('fill', '#1f2121');
  amountTxt.textContent = data.amountText;
  g.appendChild(amountTxt);

  y += 80;

  const issuedLabel = document.createElementNS(ns, 'text');
  issuedLabel.setAttribute('x', `${containerWidth / 2}`);
  issuedLabel.setAttribute('y', `${y}`);
  issuedLabel.setAttribute('text-anchor', 'middle');
  issuedLabel.setAttribute('font-family', 'Inter');
  issuedLabel.setAttribute('font-size', '14');
  issuedLabel.setAttribute('font-weight', '600');
  issuedLabel.setAttribute('letter-spacing', '2');
  issuedLabel.setAttribute('fill', '#1f2121');
  issuedLabel.textContent = data.issuedToLabel;
  g.appendChild(issuedLabel);

  y += 30;

  const issuedName = document.createElementNS(ns, 'text');
  issuedName.setAttribute('x', `${containerWidth / 2}`);
  issuedName.setAttribute('y', `${y}`);
  issuedName.setAttribute('text-anchor', 'middle');
  issuedName.setAttribute('font-family', 'Inter');
  issuedName.setAttribute('font-size', '16');
  issuedName.setAttribute('font-weight', '500');
  issuedName.setAttribute('fill', '#1f2121');
  issuedName.textContent = data.issuedToName;
  g.appendChild(issuedName);

  const nameUnderline = document.createElementNS(ns, 'line');
  nameUnderline.setAttribute('x1', `${containerWidth / 2 - 200}`);
  nameUnderline.setAttribute('y1', `${y + 8}`);
  nameUnderline.setAttribute('x2', `${containerWidth / 2 + 200}`);
  nameUnderline.setAttribute('y2', `${y + 8}`);
  nameUnderline.setAttribute('stroke', '#6f4314');
  nameUnderline.setAttribute('stroke-width', '1');
  g.appendChild(nameUnderline);

  y += 50;

  [data.certNo, data.certClass, data.certDate].forEach((detail, i) => {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', `${containerWidth / 2}`);
    t.setAttribute('y', `${y + i * 20}`);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', 'Inter');
    t.setAttribute('font-size', '14');
    t.setAttribute('letter-spacing', '2');
    t.setAttribute('fill', '#1f2121');
    t.textContent = detail;
    g.appendChild(t);
  });

  y += 100;

  const sealG = document.createElementNS(ns, 'g');
  sealG.setAttribute('transform', `translate(${containerWidth / 2 - 75}, ${y}) scale(0.36)`);
  sealG.innerHTML = data.sealSVG.replace(/<svg[^>]*>/, '').replace('</svg>', '');
  g.appendChild(sealG);

  y += 220;

  const sig1X = containerWidth / 2 - 180;
  const sig2X = containerWidth / 2 + 180;

  const sig1Name = document.createElementNS(ns, 'text');
  sig1Name.setAttribute('x', `${sig1X}`);
  sig1Name.setAttribute('y', `${y}`);
  sig1Name.setAttribute('text-anchor', 'middle');
  sig1Name.setAttribute('font-family', 'EB Garamond');
  sig1Name.setAttribute('font-size', '28');
  sig1Name.setAttribute('font-style', 'italic');
  sig1Name.setAttribute('fill', '#6f4314');
  sig1Name.textContent = data.signature1Name;
  g.appendChild(sig1Name);

  const sig1Line = document.createElementNS(ns, 'line');
  sig1Line.setAttribute('x1', `${sig1X - 128}`);
  sig1Line.setAttribute('y1', `${y + 10}`);
  sig1Line.setAttribute('x2', `${sig1X + 128}`);
  sig1Line.setAttribute('y2', `${y + 10}`);
  sig1Line.setAttribute('stroke', '#6f4314');
  sig1Line.setAttribute('stroke-width', '2');
  g.appendChild(sig1Line);

  const sig1Title = document.createElementNS(ns, 'text');
  sig1Title.setAttribute('x', `${sig1X}`);
  sig1Title.setAttribute('y', `${y + 30}`);
  sig1Title.setAttribute('text-anchor', 'middle');
  sig1Title.setAttribute('font-family', 'Inter');
  sig1Title.setAttribute('font-size', '14');
  sig1Title.setAttribute('font-weight', '600');
  sig1Title.setAttribute('fill', '#1f2121');
  sig1Title.textContent = data.signature1Title;
  g.appendChild(sig1Title);

  const sig2Name = document.createElementNS(ns, 'text');
  sig2Name.setAttribute('x', `${sig2X}`);
  sig2Name.setAttribute('y', `${y}`);
  sig2Name.setAttribute('text-anchor', 'middle');
  sig2Name.setAttribute('font-family', 'EB Garamond');
  sig2Name.setAttribute('font-size', '28');
  sig2Name.setAttribute('font-style', 'italic');
  sig2Name.setAttribute('fill', '#6f4314');
  sig2Name.textContent = data.signature2Name;
  g.appendChild(sig2Name);

  const sig2Line = document.createElementNS(ns, 'line');
  sig2Line.setAttribute('x1', `${sig2X - 128}`);
  sig2Line.setAttribute('y1', `${y + 10}`);
  sig2Line.setAttribute('x2', `${sig2X + 128}`);
  sig2Line.setAttribute('y2', `${y + 10}`);
  sig2Line.setAttribute('stroke', '#6f4314');
  sig2Line.setAttribute('stroke-width', '2');
  g.appendChild(sig2Line);

  const sig2Title = document.createElementNS(ns, 'text');
  sig2Title.setAttribute('x', `${sig2X}`);
  sig2Title.setAttribute('y', `${y + 30}`);
  sig2Title.setAttribute('text-anchor', 'middle');
  sig2Title.setAttribute('font-family', 'Inter');
  sig2Title.setAttribute('font-size', '14');
  sig2Title.setAttribute('font-weight', '600');
  sig2Title.setAttribute('fill', '#1f2121');
  sig2Title.textContent = data.signature2Title;
  g.appendChild(sig2Title);

  svg.appendChild(g);
  return svg;
}

async function generateVectorPDF() {
  const button = document.getElementById('download-pdf-btn') as HTMLButtonElement;
  button.style.display = 'none';

  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    await registerFonts(doc);
    const data = extractDataFromDOM();
    const svgEl = buildCertificateSVG(data);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    await svg2pdf(svgEl, doc as any, { x: 0, y: 0, width, height });
    doc.save('Share_Certificate_SC-2025-007.pdf');
  } catch (e) {
    console.error('PDF generation failed:', e);
  } finally {
    button.style.display = 'flex';
  }
}

document.getElementById('download-pdf-btn')!.addEventListener('click', () => {
  generateVectorPDF();
});


