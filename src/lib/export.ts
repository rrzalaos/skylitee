// Shared CSV + PDF export utilities for Skylitee dashboard

export interface ExportSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportToCSV(filename: string, sections: ExportSection[]): void {
  const BOM = "﻿"; // UTF-8 BOM — makes ₹ and special chars render correctly in Excel
  const lines: string[] = [];

  for (const section of sections) {
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
  sections: ExportSection[]
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const ORANGE: [number, number, number] = [249, 115, 22];
  const ORANGE_LIGHT: [number, number, number] = [255, 247, 237];
  const WHITE: [number, number, number] = [255, 255, 255];
  const DARK: [number, number, number] = [24, 24, 27];
  const MUTED: [number, number, number] = [113, 113, 122];

  // Determine orientation — landscape for wide tables
  const maxCols = Math.max(...sections.map(s => s.headers.length), 0);
  const orientation = maxCols > 7 ? "landscape" : "portrait";

  const doc = new jsPDF({ orientation, format: "a4", unit: "mm" });
  const pageW = doc.internal.pageSize.width;

  function drawPageHeader(full: boolean) {
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, pageW, full ? 14 : 8, "F");
    doc.setFontSize(full ? 11 : 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("Skylitee", 14, full ? 9 : 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(full ? 8 : 7);
    doc.text(reportTitle, pageW - 14, full ? 9 : 5.5, { align: "right" });
  }

  drawPageHeader(true);

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
    33,
    { align: "right" }
  );

  let y = 42;

  for (const section of sections) {
    if (section.rows.length === 0) continue;

    const pageH = doc.internal.pageSize.height;
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
        fillColor: ORANGE,
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
        fillColor: ORANGE_LIGHT,
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
