#!/usr/bin/env node

/**
 * wait-for-server.mjs — Polls a URL until it returns HTTP 200
 * 
 * Usage:
 *   node wait-for-server.mjs                    → polls http://localhost:3000
 *   node wait-for-server.mjs --url http://localhost:4100 --timeout 30
 *   node wait-for-server.mjs --url http://localhost:3000/api/health
 * 
 * Flags:
 *   --url       URL to poll (default: http://localhost:3000)
 *   --timeout   Max wait in seconds (default: 30)
 *   --interval  Poll interval in seconds (default: 1)
 */

const DEFAULT_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT = 30;
const DEFAULT_INTERVAL = 1;

// Parse args
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) {
    const key = process.argv[i].slice(2);
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
}

const url = args.url || DEFAULT_URL;
const timeoutMs = (parseInt(args.timeout) || DEFAULT_TIMEOUT) * 1000;
const intervalMs = (parseInt(args.interval) || DEFAULT_INTERVAL) * 1000;

async function poll() {
  const start = Date.now();
  let attempts = 0;

  console.log(`⏳ Waiting for ${url}...`);

  while (Date.now() - start < timeoutMs) {
    attempts++;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`✅ Server ready after ${elapsed}s (attempt ${attempts}, HTTP ${res.status})`);
        return true;
      }
      // Non-200 but server responded
      console.log(`   attempt ${attempts}: HTTP ${res.status}`);
    } catch (err) {
      // Connection refused or timeout — server not ready yet
      if (attempts === 1 || attempts % 5 === 0) {
        console.log(`   attempt ${attempts}: ${err.cause?.code || 'waiting...'}`);
      }
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  console.error(`❌ Timeout after ${timeoutMs / 1000}s — ${url} never responded`);
  process.exit(1);
}

poll();
