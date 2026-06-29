import ExcelJS from "exceljs";
import { api } from "./api.js";

const COLUMNS = [
  { key: "ticket_id",             header: "Ticket ID",             width: 12 },
  { key: "title",                 header: "Title",                 width: 36 },
  { key: "category",              header: "Category",              width: 18 },
  { key: "sub_category",          header: "Sub-Category",          width: 18 },
  { key: "priority",              header: "Priority",              width: 10 },
  { key: "status",                header: "Status",                width: 20 },
  { key: "customer_name",         header: "Requester Name",        width: 24 },
  { key: "requester_email",       header: "Requester Email",       width: 30 },
  { key: "phone",                 header: "Phone",                 width: 16 },
  { key: "location",              header: "Location",              width: 18 },
  { key: "assigned_to",           header: "Assigned To",           width: 24 },
  { key: "workstream",            header: "Workstream",            width: 16 },
  { key: "workgroup",             header: "Workgroup",             width: 16 },
  { key: "service",               header: "Service",               width: 16 },
  { key: "response_time",         header: "Response Time (min)",   width: 20 },
  { key: "resolution_time",       header: "Resolution Time (min)", width: 22 },
  { key: "expected_closure_date", header: "Expected Closure",      width: 20 },
  { key: "actual_closure_date",   header: "Actual Closure",        width: 20 },
  { key: "created_at",            header: "Created At",            width: 20 },
  { key: "updated_at",            header: "Updated At",            width: 20 },
];

function fmtDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function exportReportExcel(filters = {}) {
  const response = await api.reportExport(filters);
  const tickets  = response.data || [];

  const wb = new ExcelJS.Workbook();
  wb.creator = "Viraj Profiles Limited";
  wb.created = wb.modified = new Date();

  const ws = wb.addWorksheet("Tickets", {
    views: [{ state: "frozen", ySplit: 1 }],  // freeze header row only
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // ── Header row ────────────────────────────────────────────────────────────
  const hRow = ws.getRow(1);
  hRow.height = 20;
  COLUMNS.forEach((col, ci) => {
    const cell = hRow.getCell(ci + 1);
    cell.value = col.header;
    cell.font  = { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Calibri" };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF334155" } },
      right:  { style: "thin", color: { argb: "FF334155" } },
    };
  });

  // Enable AutoFilter dropdowns on the header row
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: COLUMNS.length },
  };

  // ── Data rows ─────────────────────────────────────────────────────────────
  tickets.forEach((ticket, idx) => {
    const dr  = ws.getRow(idx + 2);
    dr.height = 16;
    const bg  = idx % 2 === 0 ? "FFFAFAFA" : "FFFFFFFF";

    COLUMNS.forEach((col, ci) => {
      const cell = dr.getCell(ci + 1);

      let value = ticket[col.key] ?? "";
      if (["expected_closure_date", "actual_closure_date", "created_at", "updated_at"].includes(col.key)) {
        value = fmtDate(value);
      }
      if (["response_time", "resolution_time"].includes(col.key)) {
        value = value !== "" ? Number(value) || "" : "";
      }

      cell.value     = value;
      cell.font      = { size: 10, name: "Calibri", color: { argb: "FF1E293B" } };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.alignment = { vertical: "middle", horizontal: ci === 0 ? "center" : "left" };
      cell.border    = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right:  { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // ── Download ──────────────────────────────────────────────────────────────
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  const dateStr = new Date().toLocaleDateString("en-GB").replaceAll("/", "-");
  a.href     = url;
  a.download = `Viraj-Tickets-${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
