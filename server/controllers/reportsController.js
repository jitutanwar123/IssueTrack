import { getAgeingBuckets, getReportData, getSummaryStats } from "../models/Ticket.js";

export function summaryHandler(ctx) {
  return async (req, res) => {
    const filters = Object.fromEntries(req.url.searchParams.entries());
    ctx.sendJson(res, 200, { data: getSummaryStats(filters), charts: getReportData(filters) });
  };
}

export function ageingHandler(ctx) {
  return async (req, res) => {
    const filters = Object.fromEntries(req.url.searchParams.entries());
    ctx.sendJson(res, 200, { data: getAgeingBuckets(filters) });
  };
}

export function reportsHandler(ctx) {
  return async (req, res) => {
    const filters = Object.fromEntries(req.url.searchParams.entries());
    ctx.sendJson(res, 200, { data: getReportData(filters) });
  };
}
