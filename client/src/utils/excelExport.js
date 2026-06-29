import ExcelJS from "exceljs";

// ─── Colour palette matching Viraj brand ────────────────────────────────────
const NAVY      = "FF0F172A";   // dark navy  – header background
const GOLD      = "FFCA8A04";   // gold       – section title background
const LIGHT_BG  = "FFF1F5F9";   // pale grey  – alternate row tint
const WHITE     = "FFFFFFFF";
const TEXT_DARK = "FF1E293B";
const TEXT_GOLD = "FFCA8A04";
const TEXT_WHITE= "FFFFFFFF";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function thin() {
  return { style: "thin", color: { argb: "FFE2E8F0" } };
}

function applyBorder(cell) {
  cell.border = { top: thin(), left: thin(), bottom: thin(), right: thin() };
}

function headerCell(cell, text, bgArgb = NAVY, fgArgb = TEXT_WHITE, fontSize = 11) {
  cell.value = text;
  cell.font  = { bold: true, color: { argb: fgArgb }, size: fontSize, name: "Calibri" };
  cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
  applyBorder(cell);
}

function dataCell(cell, value, shade = false, align = "left") {
  cell.value = value;
  cell.font  = { name: "Calibri", size: 11, color: { argb: TEXT_DARK } };
  cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: shade ? LIGHT_BG : WHITE } };
  cell.alignment = { vertical: "middle", horizontal: align };
  applyBorder(cell);
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function exportReportExcel(data) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = "Viraj Profiles Limited";
  wb.created  = new Date();
  wb.modified = new Date();

  const ws = wb.addWorksheet("Ticket Report", {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    properties: { tabColor: { argb: NAVY } },
  });

  // ── Column widths ──────────────────────────────────────────────────────────
  ws.columns = [
    { key: "a", width: 6  },   // row-number gutter
    { key: "b", width: 36 },   // label
    { key: "c", width: 18 },   // value
    { key: "d", width: 6  },   // right margin
  ];

  let row = 1;

  // ── TITLE BANNER ──────────────────────────────────────────────────────────
  ws.mergeCells(`A${row}:D${row}`);
  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = "VIRAJ PROFILES LIMITED";
  titleCell.font  = { bold: true, size: 16, color: { argb: TEXT_WHITE }, name: "Calibri" };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(row).height = 32;
  row++;

  ws.mergeCells(`A${row}:D${row}`);
  const subCell = ws.getCell(`A${row}`);
  subCell.value = "Ticket Tracking — Report Export";
  subCell.font  = { bold: false, size: 11, color: { argb: TEXT_GOLD }, name: "Calibri" };
  subCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  subCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(row).height = 22;
  row++;

  ws.mergeCells(`A${row}:D${row}`);
  const dateCell = ws.getCell(`A${row}`);
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long", timeStyle: "short" });
  dateCell.value = `Generated: ${now}`;
  dateCell.font  = { italic: true, size: 10, color: { argb: "FF94A3B8" }, name: "Calibri" };
  dateCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  dateCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(row).height = 20;
  row += 2; // blank spacer

  // ── Section renderer ──────────────────────────────────────────────────────
  function addSection(title, colHeaders, rows) {
    // Section title row (gold bar, full width)
    ws.mergeCells(`A${row}:D${row}`);
    const secTitle = ws.getCell(`A${row}`);
    secTitle.value = title;
    secTitle.font  = { bold: true, size: 11, color: { argb: TEXT_WHITE }, name: "Calibri" };
    secTitle.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    secTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(row).height = 22;
    row++;

    // Column header row (navy)
    const hRow = ws.getRow(row);
    hRow.height = 20;
    ["", ...colHeaders, ""].forEach((h, ci) => {
      const cell = hRow.getCell(ci + 1);
      headerCell(cell, h);
    });
    row++;

    // Data rows
    if (rows.length === 0) {
      ws.mergeCells(`B${row}:C${row}`);
      const emptyCell = ws.getCell(`B${row}`);
      emptyCell.value = "No data for this period";
      emptyCell.font  = { italic: true, color: { argb: "FF94A3B8" }, name: "Calibri", size: 10 };
      emptyCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
      emptyCell.alignment = { horizontal: "center" };
      row++;
    } else {
      rows.forEach((r, i) => {
        const shade = i % 2 === 1;
        const dRow = ws.getRow(row);
        dRow.height = 18;
        // gutter col A
        const gutterCell = dRow.getCell(1);
        gutterCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: shade ? LIGHT_BG : WHITE } };
        // label col B
        dataCell(dRow.getCell(2), r[0], shade, "left");
        // value col C
        dataCell(dRow.getCell(3), r[1], shade, "right");
        // gutter col D
        const gutterR = dRow.getCell(4);
        gutterR.fill = { type: "pattern", pattern: "solid", fgColor: { argb: shade ? LIGHT_BG : WHITE } };
        row++;
      });
    }

    row += 2; // spacer between sections
  }

  addSection(
    "TICKETS BY STATUS",
    ["Status", "Count"],
    data.byStatus.map((r) => [r.name, r.value])
  );

  addSection(
    "TICKETS BY PRIORITY",
    ["Priority", "Count"],
    data.byPriority.map((r) => [r.name, r.value])
  );

  addSection(
    "TICKETS RESOLVED PER DAY",
    ["Date", "Resolved Count"],
    data.resolvedPerDay.map((r) => [r.name, r.value])
  );

  addSection(
    "AVERAGE RESOLUTION TIME PER ASSIGNEE",
    ["Assignee", "Avg Time (Minutes)"],
    data.avgResolutionByAssignee.map((r) => [r.name, r.value])
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  ws.mergeCells(`A${row}:D${row}`);
  const footer = ws.getCell(`A${row}`);
  footer.value = "Viraj Profiles Limited — Confidential";
  footer.font  = { italic: true, size: 9, color: { argb: "FF94A3B8" }, name: "Calibri" };
  footer.alignment = { horizontal: "center" };

  // ── Download ──────────────────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toLocaleDateString("en-GB").replaceAll("/", "-");
  a.download = `Viraj-Ticket-Report-${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
