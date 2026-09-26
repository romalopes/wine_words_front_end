#!/usr/bin/env node
// Standalone smoke-test script for CI/CD. Reuses the health check
// configuration so post-deployment verification matches the admin
// dashboard checks.
//
// Usage:
//   node scripts/smoke-test.js [--base http://localhost:3000/api/v1]
//
// Exits 0 on success, 1 on any failure.
/* global process */

import { API_CHECKS, isWriteCheck } from "../src/services/apiHealth/apiHealthConfig";

const argIndex = process.argv.indexOf("--base");
const BASE_URL =
  (argIndex >= 0 && process.argv[argIndex + 1]) ||
  process.env.SMOKE_BASE_URL ||
  "http://localhost:3000/api/v1";

const AUTH_TOKEN = process.env.SMOKE_AUTH_TOKEN || null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, { method = "GET", auth = false, timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { Accept: "application/json" };
  if (auth && AUTH_TOKEN) headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  const start = performance.now();
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers,
      signal: controller.signal,
    });
    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? await response.json().catch(() => ({})) : await response.text();
    return { status: response.status, payload, latencyMs: Math.round(performance.now() - start) };
  } finally {
    clearTimeout(timer);
  }
}

async function runCheck(check) {
  try {
    const { status, payload, latencyMs } = await fetchJson(check.url, {
      method: check.method,
      auth: check.requiresAuth,
    });
    const passed = status === check.expectedStatus && (check.validate ? check.validate(payload) : true);
    return { id: check.id, name: check.name, passed, status, expectedStatus: check.expectedStatus, latencyMs };
  } catch {
    // Single retry on network/timeout errors.
    await sleep(300);
    try {
      const { status, payload, latencyMs } = await fetchJson(check.url, {
        method: check.method,
        auth: check.requiresAuth,
      });
      const passed = status === check.expectedStatus && (check.validate ? check.validate(payload) : true);
      return { id: check.id, name: check.name, passed, status, expectedStatus: check.expectedStatus, latencyMs, retried: true };
    } catch (err2) {
      return { id: check.id, name: check.name, passed: false, status: null, expectedStatus: check.expectedStatus, latencyMs: null, error: String(err2) };
    }
  }
}

const checks = API_CHECKS.filter((c) => !isWriteCheck(c));
console.log(`Smoke test against ${BASE_URL} (${checks.length} checks, token ${AUTH_TOKEN ? "present" : "absent"})\n`);

let failures = 0;
for (const check of checks) {
  const result = await runCheck(check);
  const mark = result.passed ? "PASS" : "FAIL";
  const latency = result.latencyMs != null ? `${result.latencyMs}ms` : "-";
  console.log(`[${mark}] ${result.name.padEnd(38)} ${result.status ?? "-"}/${result.expectedStatus} ${latency}${result.error ? ` — ${result.error}` : ""}`);
  if (!result.passed) failures += 1;
}

console.log(`\n${checks.length - failures}/${checks.length} checks passed.`);
process.exit(failures > 0 ? 1 : 0);