// @ts-no-check

import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";

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
  { url: "/fonts/Inter-Regular.ttf", name: "Inter", style: "normal" as const },
  { url: "/fonts/Inter-SemiBold.ttf", name: "Inter", style: "bold" as const },
  { url: "/fonts/EBGaramond-Regular.ttf", name: "EB Garamond", style: "normal" as const },
  { url: "/fonts/EBGaramond-Italic.ttf", name: "EB Garamond", style: "italic" as const },
] as const;

function extractDataFromDOM(): CertData {
  return {
    company: document.querySelector("header p")!.textContent!.trim(),
    title: document.querySelector(".title-section h1")!.textContent!.trim(),
    amountNumber: document.querySelector(".amount-number")!.textContent!.trim(),
    amountText: document.querySelector(".amount-text")!.textContent!.trim(),
    issuedToLabel: document.querySelector(".issued-to-label")!.textContent!.trim(),
    issuedToName: document.querySelector(".issued-to-name")!.textContent!.trim(),
    certNo: (document.querySelector(".certificate-details p:nth-child(1)") as HTMLElement).textContent!.trim(),
    certClass: (document.querySelector(".certificate-details p:nth-child(2)") as HTMLElement).textContent!.trim(),
    certDate: (document.querySelector(".certificate-details p:nth-child(3)") as HTMLElement).textContent!.trim(),
    signature1Name: (
      document.querySelector(".signature-block:nth-child(1) .signature-name") as HTMLElement
    ).textContent!.trim(),
    signature1Title: (
      document.querySelector(".signature-block:nth-child(1) .signature-title") as HTMLElement
    ).textContent!.trim(),
    signature2Name: (
      document.querySelector(".signature-block:nth-child(2) .signature-name") as HTMLElement
    ).textContent!.trim(),
    signature2Title: (
      document.querySelector(".signature-block:nth-child(2) .signature-title") as HTMLElement
    ).textContent!.trim(),
    sealSVG: (document.querySelector(".seal-inner svg") as SVGElement).outerHTML,
  };
}

async function registerFonts(doc: jsPDF) {
  for (const font of FONT_LIST) {
    const res = await fetch(font.url);
    if (!res.ok) throw new Error(`Failed to fetch font ${font.url}`);
    const buf = await res.arrayBuffer();

    const bytes = new Uint8Array(buf);
    let binary = "";
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
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");

  svg.setAttribute("width", "793.7");
  svg.setAttribute("height", "1122.5");
  svg.setAttribute("viewBox", "0 0 793.7 1122.5");
  svg.setAttribute("xmlns", ns);

  const defs = document.createElementNS(ns, "defs");
  svg.appendChild(defs);

  // Helper to apply precise letter spacing by using per-character tspans with dx
  const setTextWithTracking = (textEl: SVGTextElement, text: string, trackingPx: number) => {
    while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
    if (!text) return;
    const first = document.createElementNS(ns, "tspan");
    first.textContent = text.charAt(0);
    textEl.appendChild(first);
    for (let i = 1; i < text.length; i++) {
      const tspan = document.createElementNS(ns, "tspan");
      tspan.setAttribute("dx", String(trackingPx));
      tspan.textContent = text.charAt(i);
      textEl.appendChild(tspan);
    }
  };

  const measureCtx = document.createElement("canvas").getContext("2d");
  const withFallbackWidth = (text: string, fontSize: number, trackingPx: number) =>
    text.length * (fontSize * 0.6 + trackingPx);
  const measureTrackedWidth = (
    text: string,
    fontFamily: string,
    fontWeight: number | string,
    fontSize: number,
    trackingPx: number,
  ) => {
    if (!measureCtx) return withFallbackWidth(text, fontSize, trackingPx);
    measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const baseWidth = measureCtx.measureText(text).width;
    return baseWidth + Math.max(0, text.length - 1) * trackingPx;
  };
  const wrapTextToWidth = (
    text: string,
    maxWidth: number,
    fontFamily: string,
    fontWeight: number | string,
    fontSize: number,
    trackingPx: number,
  ) => {
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return [""];
    const lines: string[] = [];
    let current = words.shift()!;
    for (const word of words) {
      const attempt = `${current} ${word}`;
      if (measureTrackedWidth(attempt, fontFamily, fontWeight, fontSize, trackingPx) <= maxWidth) {
        current = attempt;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
    return lines;
  };

  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", "793.7");
  bg.setAttribute("height", "1122.5");
  bg.setAttribute("fill", "#f9eeee");
  svg.appendChild(bg);

  // Draw at full page size to avoid artificial margins
  const containerWidth = 793.7;
  const containerHeight = 1122.5;
  const offsetX = 0;
  const offsetY = 0;

  const g = document.createElementNS(ns, "g");
  g.setAttribute("transform", `translate(${offsetX}, ${offsetY})`);

  const certBg = document.createElementNS(ns, "rect");
  certBg.setAttribute("width", `${containerWidth}`);
  certBg.setAttribute("height", `${containerHeight}`);
  certBg.setAttribute("fill", "#f9eeee");
  g.appendChild(certBg);

  // Gradients – use userSpaceOnUse to match CSS look precisely
  // Both gradients use "to top left" direction (from bottom-right to top-left)
  const gradTopRightDef = document.createElementNS(ns, "linearGradient");
  gradTopRightDef.setAttribute("id", "grad-top-right");
  gradTopRightDef.setAttribute("gradientUnits", "userSpaceOnUse");
  gradTopRightDef.setAttribute("x1", String(containerWidth - 8));
  gradTopRightDef.setAttribute("y1", "100");
  gradTopRightDef.setAttribute("x2", String(containerWidth - 235));
  gradTopRightDef.setAttribute("y2", "8");
  const gtrStop1 = document.createElementNS(ns, "stop");
  gtrStop1.setAttribute("offset", "-10%");
  gtrStop1.setAttribute("stop-color", "#332e36");
  const gtrStop2 = document.createElementNS(ns, "stop");
  gtrStop2.setAttribute("offset", "40%");
  gtrStop2.setAttribute("stop-color", "#d8ba6a");
  const gtrStop3 = document.createElementNS(ns, "stop");
  gtrStop3.setAttribute("offset", "60%");
  gtrStop3.setAttribute("stop-color", "#a1822c");
  const gtrStop4 = document.createElementNS(ns, "stop");
  gtrStop4.setAttribute("offset", "80%");
  gtrStop4.setAttribute("stop-color", "#a1822c");
  const gtrStop5 = document.createElementNS(ns, "stop");
  gtrStop5.setAttribute("offset", "120%");
  gtrStop5.setAttribute("stop-color", "#332e36");
  gradTopRightDef.appendChild(gtrStop1);
  gradTopRightDef.appendChild(gtrStop2);
  gradTopRightDef.appendChild(gtrStop3);
  gradTopRightDef.appendChild(gtrStop4);
  gradTopRightDef.appendChild(gtrStop5);
  defs.appendChild(gradTopRightDef);

  const gradBottomLeftDef = document.createElementNS(ns, "linearGradient");
  gradBottomLeftDef.setAttribute("id", "grad-bottom-left");
  gradBottomLeftDef.setAttribute("gradientUnits", "userSpaceOnUse");
  gradBottomLeftDef.setAttribute("x1", "460");
  gradBottomLeftDef.setAttribute("y1", String(containerHeight - 9));
  gradBottomLeftDef.setAttribute("x2", "9");
  gradBottomLeftDef.setAttribute("y2", String(containerHeight - 170));
  const gblStop1 = document.createElementNS(ns, "stop");
  gblStop1.setAttribute("offset", "-10%");
  gblStop1.setAttribute("stop-color", "#332e36");
  const gblStop2 = document.createElementNS(ns, "stop");
  gblStop2.setAttribute("offset", "40%");
  gblStop2.setAttribute("stop-color", "#d8ba6a");
  const gblStop3 = document.createElementNS(ns, "stop");
  gblStop3.setAttribute("offset", "60%");
  gblStop3.setAttribute("stop-color", "#a1822c");
  const gblStop4 = document.createElementNS(ns, "stop");
  gblStop4.setAttribute("offset", "80%");
  gblStop4.setAttribute("stop-color", "#a1822c");
  const gblStop5 = document.createElementNS(ns, "stop");
  gblStop5.setAttribute("offset", "120%");
  gblStop5.setAttribute("stop-color", "#332e36");
  gradBottomLeftDef.appendChild(gblStop1);
  gradBottomLeftDef.appendChild(gblStop2);
  gradBottomLeftDef.appendChild(gblStop3);
  gradBottomLeftDef.appendChild(gblStop4);
  gradBottomLeftDef.appendChild(gblStop5);
  defs.appendChild(gradBottomLeftDef);

  const borderInner = document.createElementNS(ns, "rect");
  borderInner.setAttribute("x", "8");
  borderInner.setAttribute("y", "8");
  borderInner.setAttribute("width", `${containerWidth - 16}`);
  borderInner.setAttribute("height", `${containerHeight - 16}`);
  borderInner.setAttribute("fill", "none");
  borderInner.setAttribute("stroke", "#7a6d4d");
  borderInner.setAttribute("stroke-width", "1");
  g.appendChild(borderInner);

  const cornerTop = document.createElementNS(ns, "path");
  cornerTop.setAttribute("d", `M 16 16 L 16 208 M 16 16 L 208 16`);
  cornerTop.setAttribute("stroke", "#7a6d4d");
  cornerTop.setAttribute("stroke-width", "2");
  cornerTop.setAttribute("fill", "none");
  g.appendChild(cornerTop);

  const cornerBottom = document.createElementNS(ns, "path");
  cornerBottom.setAttribute(
    "d",
    `M ${containerWidth - 16} ${containerHeight - 16} L ${containerWidth - 16} ${containerHeight - 208} M ${containerWidth - 16} ${containerHeight - 16} L ${containerWidth - 208} ${containerHeight - 16}`,
  );
  cornerBottom.setAttribute("stroke", "#7a6d4d");
  cornerBottom.setAttribute("stroke-width", "2");
  cornerBottom.setAttribute("fill", "none");
  g.appendChild(cornerBottom);

  const gradTopRight = document.createElementNS(ns, "polygon");
  gradTopRight.setAttribute("points", `${containerWidth - 8} 8, ${containerWidth - 235} 8, ${containerWidth - 8} 100`);
  gradTopRight.setAttribute("fill", "url(#grad-top-right)");
  g.appendChild(gradTopRight);

  const gradBottomLeft = document.createElementNS(ns, "polygon");
  gradBottomLeft.setAttribute("points", `9 ${containerHeight - 9}, 460 ${containerHeight - 9}, 9 ${containerHeight - 170}`);
  gradBottomLeft.setAttribute("fill", "url(#grad-bottom-left)");
  g.appendChild(gradBottomLeft);

  // Top padding similar to CSS: 48 outer + 16 content + baseline
  let y = 48 + 16 + 24;

  const header = document.createElementNS(ns, "text");
  header.setAttribute("x", `${containerWidth / 2}`);
  header.setAttribute("y", `${y}`);
  header.setAttribute("text-anchor", "middle");
  header.setAttribute("font-family", "Inter");
  header.setAttribute("font-size", "24");
  header.setAttribute("font-weight", "bold");
  header.setAttribute("fill", "#7a6d4d");
  setTextWithTracking(header, data.company, 2);
  g.appendChild(header);

  y += 60;

  const title = document.createElementNS(ns, "text");
  title.setAttribute("x", `${containerWidth / 2}`);
  title.setAttribute("y", `${y}`);
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("font-family", "Inter");
  title.setAttribute("font-size", "48");
  title.setAttribute("font-weight", "bold");
  title.setAttribute("fill", "#1f2121");
  setTextWithTracking(title, data.title, 2);
  g.appendChild(title);

  // Increase whitespace between title and amount to match browser layout
  y += 160;

  const amountNum = document.createElementNS(ns, "text");
  amountNum.setAttribute("x", `${containerWidth / 2}`);
  amountNum.setAttribute("y", `${y}`);
  amountNum.setAttribute("text-anchor", "middle");
  amountNum.setAttribute("font-family", "Inter");
  amountNum.setAttribute("font-size", "82");
  amountNum.setAttribute("font-weight", "bold");
  amountNum.setAttribute("fill", "#d5a60c");
  amountNum.textContent = data.amountNumber;
  // Realistic text-shadow to match CSS
  const amountShadow = document.createElementNS(ns, "text");
  amountShadow.setAttribute("x", `${containerWidth / 2}`);
  amountShadow.setAttribute("y", `${y}`);
  amountShadow.setAttribute("text-anchor", "middle");
  amountShadow.setAttribute("font-family", "Inter");
  amountShadow.setAttribute("font-size", "82");
  amountShadow.setAttribute("font-weight", "bold");
  amountShadow.setAttribute("fill", "#5f5c5c");
  amountShadow.setAttribute("transform", "translate(1,3)");
  amountShadow.textContent = data.amountNumber;
  g.appendChild(amountShadow);
  g.appendChild(amountNum);

  y += 48;

  const amountTracking = 2;
  const amountFontSize = 16;
  const amountLineHeight = amountFontSize * 1.375;
  const amountLines = wrapTextToWidth(
    data.amountText,
    containerWidth * 0.8,
    "Inter",
    "700",
    amountFontSize,
    amountTracking,
  );
  amountLines.forEach((line, idx) => {
    const amountTxtLine = document.createElementNS(ns, "text");
    amountTxtLine.setAttribute("x", `${containerWidth / 2}`);
    amountTxtLine.setAttribute("y", `${y + idx * amountLineHeight}`);
    amountTxtLine.setAttribute("text-anchor", "middle");
    amountTxtLine.setAttribute("font-family", "Inter");
    amountTxtLine.setAttribute("font-size", `${amountFontSize}`);
    amountTxtLine.setAttribute("font-weight", "bold");
    amountTxtLine.setAttribute("fill", "#1f2121");
    setTextWithTracking(amountTxtLine, line, amountTracking);
    g.appendChild(amountTxtLine);
  });

  y += amountLines.length * amountLineHeight + 58;

  const issuedLabel = document.createElementNS(ns, "text");
  issuedLabel.setAttribute("x", `${containerWidth / 2}`);
  issuedLabel.setAttribute("y", `${y}`);
  issuedLabel.setAttribute("text-anchor", "middle");
  issuedLabel.setAttribute("font-family", "Inter");
  issuedLabel.setAttribute("font-size", "14");
  issuedLabel.setAttribute("font-weight", "bold");
  issuedLabel.setAttribute("fill", "#7a6d4d");
  setTextWithTracking(issuedLabel, data.issuedToLabel, 2);
  g.appendChild(issuedLabel);

  y += 30;

  const issuedName = document.createElementNS(ns, "text");
  issuedName.setAttribute("x", `${containerWidth / 2}`);
  issuedName.setAttribute("y", `${y}`);
  issuedName.setAttribute("text-anchor", "middle");
  issuedName.setAttribute("font-family", "Inter");
  issuedName.setAttribute("font-size", "24");
  issuedName.setAttribute("font-weight", "bold");
  issuedName.setAttribute("fill", "#1f2121");
  issuedName.textContent = data.issuedToName;
  g.appendChild(issuedName);

  const nameUnderline = document.createElementNS(ns, "line");
  nameUnderline.setAttribute("x1", `${containerWidth / 2 - 200}`);
  nameUnderline.setAttribute("y1", `${y + 8}`);
  nameUnderline.setAttribute("x2", `${containerWidth / 2 + 200}`);
  nameUnderline.setAttribute("y2", `${y + 8}`);
  nameUnderline.setAttribute("stroke", "#7a6d4d");
  nameUnderline.setAttribute("stroke-width", "1");
  g.appendChild(nameUnderline);

  y += 50;

  const detailsY = y;
  [data.certNo, data.certClass, data.certDate].forEach((detail, i) => {
    const rowY = detailsY + i * 24;
    const [rawLabel, ...rest] = detail.split(":");
    const label = ((rawLabel ?? "").trim().toUpperCase() + ":").replace("::", ":");
    const value = rest.join(":").trim();

    const detailText = document.createElementNS(ns, "text");
    detailText.setAttribute("x", `${containerWidth / 2}`);
    detailText.setAttribute("y", `${rowY}`);
    detailText.setAttribute("text-anchor", "middle");
    detailText.setAttribute("font-family", "Inter");
    detailText.setAttribute("font-size", "14");
    detailText.setAttribute("letter-spacing", "2");

    const labelSpan = document.createElementNS(ns, "tspan");
    labelSpan.setAttribute("font-weight", "bold");
    labelSpan.setAttribute("fill", "#7a6d4d");
    labelSpan.textContent = label;

    const valueSpan = document.createElementNS(ns, "tspan");
    valueSpan.setAttribute("font-weight", "normal");
    valueSpan.setAttribute("fill", "#1f2121");
    valueSpan.textContent = ` ${value}`;

    detailText.appendChild(labelSpan);
    detailText.appendChild(valueSpan);
    g.appendChild(detailText);
  });

  y += 100;

  const sealG = document.createElementNS(ns, "g");
  sealG.setAttribute("transform", `translate(${containerWidth / 2 - 110}, ${y - 30}) scale(0.60)`);
  sealG.innerHTML = data.sealSVG.replace(/<svg[^>]*>/, "").replace("</svg>", "");
  g.appendChild(sealG);

  y += 320;

  const sig1X = containerWidth / 2 - 180;
  const sig2X = containerWidth / 2 + 180;

  const sig1Name = document.createElementNS(ns, "text");
  sig1Name.setAttribute("x", `${sig1X}`);
  sig1Name.setAttribute("y", `${y}`);
  sig1Name.setAttribute("text-anchor", "middle");
  sig1Name.setAttribute("font-family", "EB Garamond");
  sig1Name.setAttribute("font-size", "28");
  sig1Name.setAttribute("font-style", "italic");
  sig1Name.setAttribute("fill", "#7a6d4d");
  sig1Name.textContent = data.signature1Name;
  g.appendChild(sig1Name);

  const sig1Line = document.createElementNS(ns, "line");
  sig1Line.setAttribute("x1", `${sig1X - 128}`);
  sig1Line.setAttribute("y1", `${y + 10}`);
  sig1Line.setAttribute("x2", `${sig1X + 128}`);
  sig1Line.setAttribute("y2", `${y + 10}`);
  sig1Line.setAttribute("stroke", "#7a6d4d");
  sig1Line.setAttribute("stroke-width", "2");
  g.appendChild(sig1Line);

  const sig1Title = document.createElementNS(ns, "text");
  sig1Title.setAttribute("x", `${sig1X}`);
  sig1Title.setAttribute("y", `${y + 30}`);
  sig1Title.setAttribute("text-anchor", "middle");
  sig1Title.setAttribute("font-family", "Inter");
  sig1Title.setAttribute("font-size", "14");
  sig1Title.setAttribute("font-weight", "bold");
  sig1Title.setAttribute("fill", "#1f2121");
  sig1Title.textContent = data.signature1Title;
  g.appendChild(sig1Title);

  const sig2Name = document.createElementNS(ns, "text");
  sig2Name.setAttribute("x", `${sig2X}`);
  sig2Name.setAttribute("y", `${y}`);
  sig2Name.setAttribute("text-anchor", "middle");
  sig2Name.setAttribute("font-family", "EB Garamond");
  sig2Name.setAttribute("font-size", "28");
  sig2Name.setAttribute("font-style", "italic");
  sig2Name.setAttribute("fill", "#7a6d4d");
  sig2Name.textContent = data.signature2Name;
  g.appendChild(sig2Name);

  const sig2Line = document.createElementNS(ns, "line");
  sig2Line.setAttribute("x1", `${sig2X - 128}`);
  sig2Line.setAttribute("y1", `${y + 10}`);
  sig2Line.setAttribute("x2", `${sig2X + 128}`);
  sig2Line.setAttribute("y2", `${y + 10}`);
  sig2Line.setAttribute("stroke", "#7a6d4d");
  sig2Line.setAttribute("stroke-width", "2");
  g.appendChild(sig2Line);

  const sig2Title = document.createElementNS(ns, "text");
  sig2Title.setAttribute("x", `${sig2X}`);
  sig2Title.setAttribute("y", `${y + 30}`);
  sig2Title.setAttribute("text-anchor", "middle");
  sig2Title.setAttribute("font-family", "Inter");
  sig2Title.setAttribute("font-size", "14");
  sig2Title.setAttribute("font-weight", "bold");
  sig2Title.setAttribute("fill", "#1f2121");
  sig2Title.textContent = data.signature2Title;
  g.appendChild(sig2Title);

  svg.appendChild(g);
  return svg;
}

async function generateVectorPDF() {
  const button = document.getElementById("download-pdf-btn") as HTMLButtonElement;
  button.style.display = "none";

  // Hide watermark during PDF generation and remember its state
  const watermark = document.getElementById("watermark-overlay");
  const wasWatermarkVisible = watermark && !watermark.classList.contains("hidden");
  if (watermark && wasWatermarkVisible) {
    watermark.classList.add("hidden");
  }

  try {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    await registerFonts(doc);
    const data = extractDataFromDOM();
    const svgEl = buildCertificateSVG(data);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    await svg2pdf(svgEl, doc as any, { x: 0, y: 0, width, height });
    doc.save("Share_Certificate_SC-2025-007.pdf");
  } catch (e) {
    console.error("PDF generation failed:", e);
  } finally {
    button.style.display = "flex";

    // Restore watermark state
    if (watermark && wasWatermarkVisible) {
      watermark.classList.remove("hidden");
    }
  }
}

document.getElementById("download-pdf-btn")!.addEventListener("click", () => {
  generateVectorPDF();
});

document.getElementById("cancel-btn")!.addEventListener("click", () => {
  const watermark = document.getElementById("watermark-overlay");
  if (watermark) {
    watermark.classList.toggle("hidden");
  }
});
