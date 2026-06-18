import { URL } from "node:url";

export function createContext() {
  return {
    json(res, status, data, extraHeaders = {}) {
      const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        ...extraHeaders,
      };
      res.writeHead(status, headers);
      res.end(JSON.stringify(data));
    },
    sendJson(res, status, data) {
      this.json(res, status, data);
    },
    text(res, status, body, extraHeaders = {}) {
      const headers = {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        ...extraHeaders,
      };
      res.writeHead(status, headers);
      res.end(body);
    },
    binary(res, status, buffer, contentType, extraHeaders = {}) {
      const headers = {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        ...extraHeaders,
      };
      res.writeHead(status, headers);
      res.end(buffer);
    },
  };
}

export function parseUrl(req) {
  const origin = req.headers.host ? `http://${req.headers.host}` : "http://localhost";
  return new URL(req.url, origin);
}

export async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function normalizeSearch(text = "") {
  return String(text).trim().toLowerCase();
}
