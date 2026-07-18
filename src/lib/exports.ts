import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportExcel(filename: string, rows: Record<string, unknown>[], sheetName = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportPDF(
  filename: string,
  title: string,
  columns: string[],
  rows: (string | number)[][],
) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.setTextColor(76, 29, 149);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows,
    headStyles: { fillColor: [124, 58, 237], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
