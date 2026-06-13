// Shared CSV + PDF export utilities for Skylitee dashboard

export interface ExportSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  text?: string;   // when set, render as a paragraph (e.g. an AI executive summary) instead of a table
}

// White-label options for a generated PDF.
export interface ReportBranding {
  brandName?: string;     // header label (default "Skylitee")
  color?: string;         // hex accent color (default Skylitee orange)
  logoDataUrl?: string;   // base64 logo drawn in the title area
}

function hexToRgb(hex?: string): [number, number, number] {
  const fallback: [number, number, number] = [249, 115, 22];
  if (!hex) return fallback;
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return fallback;
  const [r, g, b] = m.map(h => parseInt(h, 16));
  return [r, g, b].some(n => Number.isNaN(n)) ? fallback : [r, g, b];
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportToCSV(filename: string, sections: ExportSection[]): void {
  const BOM = "﻿"; // UTF-8 BOM — makes ₹ and special chars render correctly in Excel
  const lines: string[] = [];

  for (const section of sections) {
    if (section.text) {
      lines.push(`=== ${section.title} ===`);
      lines.push(csvEscape(section.text));
      lines.push("");
      continue;
    }
    if (section.rows.length === 0) continue;
    lines.push(`=== ${section.title} ===`);
    lines.push(section.headers.map(csvEscape).join(","));
    for (const row of section.rows) {
      lines.push(row.map(csvEscape).join(","));
    }
    lines.push(""); // blank line separator between sections
  }

  const csv = BOM + lines.join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function exportToPDF(
  filename: string,
  reportTitle: string,
  subtitle: string,
  sections: ExportSection[],
  branding?: ReportBranding
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const ACCENT: [number, number, number] = hexToRgb(branding?.color);
  const ACCENT_LIGHT: [number, number, number] = [
    Math.round(ACCENT[0] + (255 - ACCENT[0]) * 0.88),
    Math.round(ACCENT[1] + (255 - ACCENT[1]) * 0.88),
    Math.round(ACCENT[2] + (255 - ACCENT[2]) * 0.88),
  ];
  const WHITE: [number, number, number] = [255, 255, 255];
  const DARK: [number, number, number] = [24, 24, 27];
  const MUTED: [number, number, number] = [113, 113, 122];
  const brandName = branding?.brandName?.trim() || "Skylitee";

  // Determine orientation — landscape for wide tables
  const maxCols = Math.max(...sections.map(s => s.headers.length), 0);
  const orientation = maxCols > 7 ? "landscape" : "portrait";

  const doc = new jsPDF({ orientation, format: "a4", unit: "mm" });
  const pageW = doc.internal.pageSize.width;

  function drawPageHeader(full: boolean) {
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, full ? 14 : 8, "F");
    doc.setFontSize(full ? 11 : 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(brandName, 14, full ? 9 : 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(full ? 8 : 7);
    doc.text(reportTitle, pageW - 14, full ? 9 : 5.5, { align: "right" });
  }

  drawPageHeader(true);

  // Optional white-label logo, top-right of the title block (aspect-preserved).
  if (branding?.logoDataUrl) {
    try {
      const props = doc.getImageProperties(branding.logoDataUrl);
      const h = 12;
      const w = Math.min(40, (props.width / props.height) * h);
      doc.addImage(branding.logoDataUrl, props.fileType || "PNG", pageW - 14 - w, 19, w, h);
    } catch { /* bad image — skip */ }
  }

  // Title block
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle, 14, 26);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(subtitle, 14, 33);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageW - 14,
    38,
    { align: "right" }
  );

  let y = 44;
  const pageH = doc.internal.pageSize.height;

  for (const section of sections) {
    // Paragraph (e.g. AI summary) instead of a table.
    if (section.text) {
      if (y > pageH - 40) { doc.addPage(); drawPageHeader(false); y = 18; }
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
      doc.text(section.title, 14, y); y += 5;
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
      const wrapped = doc.splitTextToSize(section.text.replace(/₹/g, "Rs."), pageW - 28);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 4.5 + 8;
      continue;
    }

    if (section.rows.length === 0) continue;

    if (y > pageH - 40) {
      doc.addPage();
      drawPageHeader(false);
      y = 18;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(section.title, 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [section.headers],
      // Replace ₹ with Rs. since standard PDF fonts don't include the rupee glyph
      body: section.rows.map(r => r.map(v => String(v).replace(/₹/g, "Rs."))),
      theme: "striped",
      headStyles: {
        fillColor: ACCENT,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: DARK,
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: ACCENT_LIGHT,
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawPageHeader(false);
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
