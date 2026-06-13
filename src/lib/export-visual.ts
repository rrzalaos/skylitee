// Visual PDF export — captures a rendered report element (charts, gauges, donuts and all)
// and lays it into a branded, multi-page A4 PDF so the PDF matches the on-screen design.
// Uses html2canvas-pro (handles Tailwind v4 oklch/color-mix, which classic html2canvas can't).

import type { ReportBranding } from "./export";

function hexToRgb(hex?: string): [number, number, number] {
  const fallback: [number, number, number] = [249, 115, 22];
  if (!hex) return fallback;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return fallback;
  const [r, g, b] = m.map(h => parseInt(h, 16));
  return [r, g, b].some(n => Number.isNaN(n)) ? fallback : [r, g, b];
}

export async function exportElementToPDF(
  el: HTMLElement,
  filename: string,
  opts: { reportTitle: string; subtitle?: string; branding?: ReportBranding }
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  // Capture at 2x in a forced light theme (clone-only mutation — the live page is untouched).
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      clonedDoc.documentElement.classList.remove("dark");
      clonedDoc.body.classList.remove("dark");
    },
  });

  const ACCENT = hexToRgb(opts.branding?.color);
  const WHITE: [number, number, number] = [255, 255, 255];
  const MUTED: [number, number, number] = [113, 113, 122];
  const brandName = opts.branding?.brandName?.trim() || "Skylitee";

  const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
  const pageW = doc.internal.pageSize.width;   // 210
  const pageH = doc.internal.pageSize.height;  // 297
  const margin = 8;
  const headerH = 13;
  const topGap = headerH + 4;
  const bottomGap = 8;

  const imgW = pageW - margin * 2;
  const mmPerPx = imgW / canvas.width;          // scale from canvas px → mm
  const pageContentMm = pageH - topGap - bottomGap;
  const pageContentPx = Math.floor(pageContentMm / mmPerPx);

  function drawHeader(pageNo: number, total: number) {
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(brandName, margin, 8.6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(opts.reportTitle, pageW - margin, 7.3, { align: "right" });
    if (opts.subtitle) {
      doc.setFontSize(6.8);
      doc.text(opts.subtitle, pageW - margin, 11, { align: "right" });
    }
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.text(`Page ${pageNo} / ${total}`, pageW - margin, pageH - 3, { align: "right" });
    doc.text(brandName, margin, pageH - 3);
  }

  // Page-break-aware slicing: snap each page's bottom to a gap BETWEEN top-level blocks so
  // no card/title/table row is cut across pages. Falls back to a hard cut if a single block
  // is taller than a page.
  const ranges: [number, number][] = [];
  const root = (el.querySelector("[data-pdf-root]") as HTMLElement) || el;
  const elRect = el.getBoundingClientRect();
  const ratio = elRect.height > 0 ? canvas.height / elRect.height : 2;
  const cutYs = Array.from(root.children).map(c => (c.getBoundingClientRect().bottom - elRect.top) * ratio);

  let startY = 0;
  let guard = 0;
  while (startY < canvas.height - 1 && guard++ < 200) {
    const limit = startY + pageContentPx;
    let endY: number;
    if (limit >= canvas.height) {
      endY = canvas.height;
    } else {
      // last block boundary that fits within this page
      let best = -1;
      for (const c of cutYs) if (c > startY + 20 && c <= limit) best = Math.max(best, c);
      endY = best > 0 ? best : limit; // no boundary fits → block taller than a page, hard cut
    }
    endY = Math.min(Math.round(endY), canvas.height);
    if (endY <= startY) endY = Math.min(startY + pageContentPx, canvas.height);
    ranges.push([startY, endY]);
    startY = endY;
  }
  const totalPages = ranges.length || 1;

  ranges.forEach(([sY, eY], page) => {
    if (page > 0) doc.addPage();
    const sliceH = eY - sY;
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, sY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    }
    const sliceImg = slice.toDataURL("image/jpeg", 0.92);
    doc.addImage(sliceImg, "JPEG", margin, topGap, imgW, sliceH * mmPerPx);
    drawHeader(page + 1, totalPages);
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
