#!/usr/bin/env node

/**
 * extract-latest-image.mjs — Extract the latest image from opencode session
 * 
 * Connects to the opencode server API, finds the latest user message with
 * an image attachment, and saves it as a file for @vision to analyze.
 * 
 * Usage:
 *   node extract-latest-image.mjs                              → saves to ./latest-chat-image.png
 *   node extract-latest-image.mjs --out screenshots/img.png   → custom output path
 *   node extract-latest-image.mjs --session ses_xxx           → specific session
 *   node extract-latest-image.mjs --password <pw>             → explicit server password
 * 
 * Environment:
 *   OPENCODE_SERVER_URL      — base URL (default: http://localhost:4100)
 *   OPENCODE_SERVER_PASSWORD — server auth password
 *   OPENCODE_PROJECT_DIR     — project directory (for auth context)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────

const SERVER_URL = process.env.OPENCODE_SERVER_URL || 'http://localhost:4100';
const DEFAULT_OUTPUT = resolve(process.cwd(), 'latest-chat-image.png');
const AUTH_FILE = resolve(__dirname, '..', '..', '..', '..', '.server-password');
const PROJECT_DIR = process.env.OPENCODE_PROJECT_DIR || process.cwd();

// ─── SQLite Fallback Config ──────────────────────────────────────────────

const SQLITE_BIN = resolve(__dirname, '..', '..', '..', '..', 'tools', 'sqlite.exe');
const OPENCODE_DB = process.env.OPENCODE_DB || 
  `${process.env.USERPROFILE || homedir()}\\.local\\share\\opencode\\opencode.db`;

// ─── Args ────────────────────────────────────────────────────────────────

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

// ─── Auth ────────────────────────────────────────────────────────────────

function getPassword() {
  if (args.password) return args.password;
  if (process.env.OPENCODE_SERVER_PASSWORD) return process.env.OPENCODE_SERVER_PASSWORD;
  try {
    return readFileSync(AUTH_FILE, 'utf-8').trim();
  } catch {
    console.error('❌ No password found. Set OPENCODE_SERVER_PASSWORD or pass --password');
    process.exit(1);
  }
}

const PASSWORD = getPassword();
const AUTH_HEADER = 'Basic ' + Buffer.from(`opencode:${PASSWORD}`).toString('base64');

// ─── HTTP Helper ─────────────────────────────────────────────────────────

async function api(path) {
  const url = `${SERVER_URL}/api${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      'Authorization': AUTH_HEADER,
      'Accept': 'application/json',
    },
  });
  clearTimeout(timeout);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${url}\n${text.slice(0, 500)}`);
  }
  return res.json();
}

// ─── DB Fallback ──────────────────────────────────────────────────────────

function findImageInDB() {
  console.log('  🔍 Falling back to SQLite DB query...');

  if (!existsSync(SQLITE_BIN)) {
    throw new Error(`sqlite3 not found at ${SQLITE_BIN}. Install it to use DB fallback.`);
  }
  if (!existsSync(OPENCODE_DB)) {
    throw new Error(`opencode DB not found at ${OPENCODE_DB}`);
  }

  console.log(`  📁 DB: ${OPENCODE_DB}`);

  const sql = `
    SELECT p.id, p.session_id, p.message_id, p.time_created, p.data
    FROM part p
    WHERE p.data LIKE '%"mime":"image%'
    ORDER BY p.time_created DESC
    LIMIT 5;
  `;

  let result;
  try {
    result = execFileSync(SQLITE_BIN, [OPENCODE_DB, '-json', sql], { 
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err) {
    throw new Error(`SQLite query failed: ${err.stderr || err.message}`);
  }

  const rows = JSON.parse(result);
  if (!rows || rows.length === 0) {
    throw new Error('No images found in Part table');
  }

  for (const row of rows) {
    try {
      const partData = JSON.parse(row.data);
      const mime = partData.mime || 'image/png';
      
      let imageBuffer = null;

      if (partData.url && typeof partData.url === 'string') {
        if (partData.url.startsWith('data:')) {
          const base64Data = partData.url.split(',')[1];
          if (base64Data) {
            imageBuffer = Buffer.from(base64Data, 'base64');
          }
        } else if (partData.url.startsWith('http')) {
          console.log(`  ⚠️ Skipping remote URL: ${partData.url.slice(0, 60)}...`);
          continue;
        }
      }

      if (!imageBuffer && partData.content && typeof partData.content === 'string') {
        imageBuffer = Buffer.from(partData.content, 'base64');
      }

      if (!imageBuffer && partData.body && typeof partData.body === 'string') {
        imageBuffer = Buffer.from(partData.body, 'base64');
      }

      if (imageBuffer && imageBuffer.length > 100) {
        console.log(`  📸 Found image in part ${row.id || '(unknown)'} (${mime})`);
        console.log(`     Size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
        console.log(`     Session: ${row.session_id || 'unknown'}`);
        return { imageBuffer, mime };
      }

      console.log(`  ⚠️ Part ${row.id || ''}: no decodable image data found`);
    } catch (err) {
      console.log(`  ⚠️ Part ${row.id || ''}: parse error - ${err.message}`);
    }
  }

  throw new Error('Could not decode any image from Part table');
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const outputPath = resolve(process.cwd(), args.out || DEFAULT_OUTPUT);

  console.log(`🔌 Connecting to ${SERVER_URL}...`);

  let imageBuffer = null;
  let imageInfo = null;

  // Step 1-3: Try API path (failure gracefully falls through to DB fallback)
  try {
    const sessions = await api('/session?limit=10');
    const items = sessions.items || [];
    if (items.length === 0) throw new Error('No sessions found');

    let targetSession;
    if (args.session) {
      targetSession = items.find(s => s.id === args.session);
      if (!targetSession) throw new Error(`Session "${args.session}" not found`);
    } else {
      targetSession = [...items].sort((a, b) => 
        new Date(b.time?.updated || 0) - new Date(a.time?.updated || 0)
      )[0];
    }

    console.log(`📋 Session: ${targetSession.title || targetSession.id}`);
    console.log(`   ID: ${targetSession.id}`);

    const dirParam = targetSession.directory ? `&directory=${encodeURIComponent(targetSession.directory)}` : '';
    const messages = await api(`/session/${targetSession.id}/message?limit=50${dirParam}`);
    const messageItems = messages.items || [];

    messageItems.sort((a, b) => new Date(a.time?.created || 0) - new Date(b.time?.created || 0));

    const userMessages = messageItems.filter(m => m.type === 'user' && m.files?.length > 0);
    const toolMessages = messageItems.filter(m => 
      m.type === 'assistant' && m.content?.some(c => c.type === 'file')
    );

    let apiImageInfo = null;

    if (userMessages.length > 0) {
      const latest = userMessages[userMessages.length - 1];
      for (const file of latest.files) {
        if (file.mime?.startsWith('image/') && file.uri) {
          apiImageInfo = { uri: file.uri, mime: file.mime, name: file.name || 'image' };
          break;
        }
      }
    }

    if (!apiImageInfo && toolMessages.length > 0) {
      const latest = toolMessages[toolMessages.length - 1];
      for (const content of latest.content || []) {
        if (content.type === 'file' && content.mime?.startsWith('image/') && content.uri) {
          apiImageInfo = { uri: content.uri, mime: content.mime, name: content.name || 'image' };
          break;
        }
      }
    }

    if (apiImageInfo) {
      console.log(`📸 Found: ${apiImageInfo.name} (${apiImageInfo.mime})`);
      console.log(`   URI type: ${apiImageInfo.uri.startsWith('data:') ? 'data URI' : apiImageInfo.uri.startsWith('http') ? 'HTTP URL' : 'file path'}`);

      if (apiImageInfo.uri.startsWith('data:')) {
        const base64Data = apiImageInfo.uri.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
        console.log(`   Decoded: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      } else if (apiImageInfo.uri.startsWith('http')) {
        const imgCtrl = new AbortController();
        const imgTimeout = setTimeout(() => imgCtrl.abort(), 3000);
        const resp = await fetch(apiImageInfo.uri, { signal: imgCtrl.signal });
        clearTimeout(imgTimeout);
        if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
        imageBuffer = Buffer.from(await resp.arrayBuffer());
        console.log(`   Fetched: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      } else {
        imageBuffer = readFileSync(apiImageInfo.uri);
        console.log(`   Read from disk: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      }
      imageInfo = apiImageInfo;
    }
  } catch (apiErr) {
    console.log(`❌ API path failed: ${apiErr.message}`);
    console.log('   Falling back to DB query...');
  }

  // DB fallback path
  if (!imageBuffer) {
    try {
      const dbResult = findImageInDB();
      imageBuffer = dbResult.imageBuffer;
      imageInfo = { mime: dbResult.mime, name: 'db-image' };
      console.log(`   Decoded from DB: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
    } catch (dbErr) {
      console.error(`❌ DB fallback also failed: ${dbErr.message}`);
      process.exit(1);
    }
  }

  if (!imageBuffer) {
    console.error('❌ No image found');
    process.exit(1);
  }

  // Determine extension from MIME
  const extMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  const ext = extMap[imageInfo.mime] || '.png';

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  // If output path doesn't have extension, add it
  const finalPath = basename(outputPath).includes('.') ? outputPath : outputPath + ext;

  writeFileSync(finalPath, imageBuffer);
  console.log(`✅ Image saved: ${finalPath}`);
  console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

  // Output the path for script consumers
  console.log(`\nOUTPUT_PATH=${finalPath}`);
}

main().catch(err => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
