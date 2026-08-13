#!/usr/bin/env node
/**
 * index-memory.mjs — Glitch MemoryCore FTS5 Indexer
 *
 * Walks the glitch-memorycore directory tree, reads all .md files,
 * splits them into sections by ## headings and --- separators,
 * and indexes each chunk into a SQLite FTS5 database.
 *
 * Change detection: only re-indexes chunks whose content_hash or file_mtime changed.
 * Idempotent: safe to run multiple times.
 *
 * Usage:
 *   node index-memory.mjs              # uses default memory dir
 *   node index-memory.mjs --dir /path  # custom memory directory
 *   node index-memory.mjs --embeddings # also compute and store vector embeddings
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { initEmbeddingsTable, computeEmbedding, storeEmbedding } from './embeddings.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to skip during the walk
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.nyc_output', 'coverage']);

// Default memory directory (the glitch-memorycore root)
const DEFAULT_MEMORY_DIR = path.resolve(__dirname, '../../');

// Database lives next to this script
const DB_PATH = path.join(__dirname, 'memory-search.db');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let dir = DEFAULT_MEMORY_DIR;
  let embeddings = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && i + 1 < args.length) {
      dir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--embeddings') {
      embeddings = true;
    }
  }

  return { dir, embeddings };
}

// ---------------------------------------------------------------------------
// File discovery — recursive walk, skipping unwanted dirs
// ---------------------------------------------------------------------------

function findMarkdownFiles(rootDir) {
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // skip unreadable dirs
    }

    for (const entry of entries) {
      // Skip hidden/skip directories
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) {
          continue;
        }
        walk(path.join(dir, entry.name));
        continue;
      }

      // Only index .md files
      if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  walk(rootDir);
  return results;
}

// ---------------------------------------------------------------------------
// Chunk splitting — split by ## headings and --- separators
// ---------------------------------------------------------------------------

function splitIntoChunks(filePath, content) {
  const lines = content.split('\n');
  const chunks = [];
  let currentLines = [];
  let currentHeading = null;

  function flushChunk() {
    if (currentLines.length === 0) return;

    const text = currentLines.join('\n').trim();
    if (!text) return;

    // Derive section heading: use the heading line, or first N chars
    let heading = currentHeading;
    if (!heading) {
      // Use first non-empty line as a pseudo-heading, truncated
      const firstLine = currentLines.find(l => l.trim().length > 0);
      heading = firstLine ? firstLine.trim().slice(0, 80) : '(untitled)';
    }

    chunks.push({
      section_heading: heading,
      content: text,
    });

    currentLines = [];
    currentHeading = null;
  }

  for (const line of lines) {
    // Check for ## heading (must start at beginning of line)
    if (line.startsWith('## ')) {
      flushChunk();
      currentHeading = line.trim();
      currentLines.push(line);
      continue;
    }

    // Check for --- separator (line of only dashes, at least 3)
    if (/^-{3,}$/.test(line.trim())) {
      flushChunk();
      continue;
    }

    currentLines.push(line);
  }

  flushChunk();
  return chunks;
}

// ---------------------------------------------------------------------------
// SHA256 hash of content
// ---------------------------------------------------------------------------

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Database setup — create tables and triggers if they don't exist
// ---------------------------------------------------------------------------

// External-content FTS5: memory_fts mirrors memory_chunks via content='memory_chunks'.
// The 'delete' command in the AFTER UPDATE / AFTER DELETE triggers is ONLY valid on
// external-content tables — a standalone FTS5 table crashes with "SQL logic error".
// This is why the initial 480-chunk insert succeeded but any re-index after a file
// changed (UPDATE path) crashed at updateChunk.run (index-memory.mjs:284).
const FTS_CREATE_SQL = `
  CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
    content,
    section_heading,
    file_path,
    content='memory_chunks',
    content_rowid='id',
    tokenize='porter unicode61'
  );
`;

const TRIGGER_SQL = `
  CREATE TRIGGER IF NOT EXISTS mc_ai AFTER INSERT ON memory_chunks BEGIN
    INSERT INTO memory_fts(rowid, content, section_heading, file_path)
    VALUES (new.id, new.content, new.section_heading, new.file_path);
  END;

  CREATE TRIGGER IF NOT EXISTS mc_ad AFTER DELETE ON memory_chunks BEGIN
    INSERT INTO memory_fts(memory_fts, rowid, content, section_heading, file_path)
    VALUES ('delete', old.id, old.content, old.section_heading, old.file_path);
  END;

  CREATE TRIGGER IF NOT EXISTS mc_au AFTER UPDATE ON memory_chunks BEGIN
    INSERT INTO memory_fts(memory_fts, rowid, content, section_heading, file_path)
    VALUES ('delete', old.id, old.content, old.section_heading, old.file_path);
    INSERT INTO memory_fts(rowid, content, section_heading, file_path)
    VALUES (new.id, new.content, new.section_heading, new.file_path);
  END;
`;

// Migrate a legacy standalone-schema DB to external-content.
// CREATE VIRTUAL TABLE IF NOT EXISTS won't alter an existing table, so a DB created
// with the old schema keeps its broken triggers. Detect legacy by checking whether the
// memory_fts CREATE SQL contains "content='memory_chunks'"; if not, drop the FTS table
// + the 3 triggers so the new CREATE statements recreate them, then repopulate the FTS
// index from memory_chunks (preserves the index without a full re-walk of all .md files).
function migrateLegacyFts(db) {
  const ftsRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='memory_fts'").get();
  if (!ftsRow) {
    return false; // no FTS table yet — fresh DB, nothing to migrate
  }

  // External-content tables include content='memory_chunks' in their CREATE SQL.
  const isLegacy = !ftsRow.sql.includes("content='memory_chunks'");
  if (!isLegacy) {
    return false; // already external-content — no migration needed
  }

  console.log('Detected legacy standalone FTS5 schema — migrating to external-content...');

  // Drop legacy triggers first (they reference memory_fts), then the FTS table itself.
  // IF EXISTS guards against partial states from a previous interrupted migration.
  db.exec(`
    DROP TRIGGER IF EXISTS mc_ai;
    DROP TRIGGER IF EXISTS mc_ad;
    DROP TRIGGER IF EXISTS mc_au;
    DROP TABLE IF EXISTS memory_fts;
  `);

  // Recreate with the external-content schema + triggers.
  db.exec(FTS_CREATE_SQL);
  db.exec(TRIGGER_SQL);

  // Repopulate the FTS index from existing memory_chunks rows.
  const chunkCount = db.prepare('SELECT COUNT(*) AS c FROM memory_chunks').get().c;
  if (chunkCount > 0) {
    db.exec(`
      INSERT INTO memory_fts(rowid, content, section_heading, file_path)
      SELECT id, content, section_heading, file_path FROM memory_chunks;
    `);
    console.log(`  Repopulated FTS index from ${chunkCount} existing chunks.`);
  }

  console.log('Legacy FTS5 schema migration complete.');
  return true;
}

function initDB(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      section_heading TEXT,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      file_mtime INTEGER NOT NULL
    );
  `);

  // Migrate any legacy standalone-schema DB before creating the (correct) external-content
  // table + triggers. Must run after memory_chunks exists (external-content references it).
  migrateLegacyFts(db);

  db.exec(FTS_CREATE_SQL);
  db.exec(TRIGGER_SQL);

  initEmbeddingsTable(db);
}

// ---------------------------------------------------------------------------
// Indexing logic — upsert chunks with change detection
// ---------------------------------------------------------------------------

async function indexFile(db, filePath, memoryDir, embeddingsEnabled) {
  // Read file content — skip binary files gracefully
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    // Binary or unreadable — skip silently
    return { skipped: true, reason: err.message };
  }

  // Check for null bytes (binary indicator)
  if (content.includes('\0')) {
    return { skipped: true, reason: 'binary file detected' };
  }

  const stat = fs.statSync(filePath);
  const mtime = Math.floor(stat.mtimeMs);
  const relativePath = path.relative(memoryDir, filePath);

  // Split into chunks
  const chunks = splitIntoChunks(filePath, content);

  // Prepare statements
  const getExisting = db.prepare(
    'SELECT id, content_hash, file_mtime FROM memory_chunks WHERE file_path = ? AND section_heading = ?'
  );
  const insertChunk = db.prepare(
    'INSERT INTO memory_chunks (file_path, section_heading, content, content_hash, file_mtime) VALUES (?, ?, ?, ?, ?)'
  );
  const updateChunk = db.prepare(
    'UPDATE memory_chunks SET content = ?, content_hash = ?, file_mtime = ? WHERE id = ?'
  );
  const deleteStmt = db.prepare(
    'DELETE FROM memory_chunks WHERE file_path = ? AND section_heading = ?'
  );
  const getAllExisting = db.prepare(
    'SELECT section_heading FROM memory_chunks WHERE file_path = ?'
  );
  const deleteAllFile = db.prepare('DELETE FROM memory_chunks WHERE file_path = ?');

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let embedded = 0;

  // Track which (file_path, section_heading) pairs we've seen this run
  const seenKeys = new Set();

  for (const chunk of chunks) {
    const hash = sha256(chunk.content);
    const key = `${relativePath}|||${chunk.section_heading}`;
    seenKeys.add(key);

    const existing = getExisting.get(relativePath, chunk.section_heading);

    if (!existing) {
      // New chunk — insert
      const result = insertChunk.run(relativePath, chunk.section_heading, chunk.content, hash, mtime);
      inserted++;

      // Compute embedding if enabled
      if (embeddingsEnabled) {
        try {
          const embedding = await computeEmbedding(chunk.content);
          storeEmbedding(db, result.lastInsertRowID, embedding);
          embedded++;
        } catch (err) {
          console.warn(`  Warning: embedding failed for ${relativePath}: ${err.message}`);
        }
      }
    } else if (existing.content_hash !== hash || existing.file_mtime !== mtime) {
      // Changed — update
      updateChunk.run(chunk.content, hash, mtime, existing.id);
      updated++;

      // Recompute embedding if enabled
      if (embeddingsEnabled) {
        try {
          const embedding = await computeEmbedding(chunk.content);
          storeEmbedding(db, existing.id, embedding);
          embedded++;
        } catch (err) {
          console.warn(`  Warning: embedding failed for ${relativePath}: ${err.message}`);
        }
      }
    } else {
      unchanged++;
    }
  }

  // Delete chunks that no longer exist in this file (section was removed)
  const allExisting = getAllExisting.all(relativePath);
  for (const row of allExisting) {
    if (!seenKeys.has(`${relativePath}|||${row.section_heading}`)) {
      deleteStmt.run(relativePath, row.section_heading);
    }
  }

  // If the file was deleted entirely (no chunks), remove all its entries
  if (chunks.length === 0) {
    deleteAllFile.run(relativePath);
  }

  return { inserted, updated, unchanged, embedded, total: chunks.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { dir, embeddings } = parseArgs();

  if (!fs.existsSync(dir)) {
    console.error(`Error: directory not found: ${dir}`);
    process.exit(1);
  }

  console.log('Glitch MemoryCore FTS5 Indexer');
  console.log(`Memory dir: ${dir}`);
  console.log(`Database:   ${DB_PATH}`);
  if (embeddings) {
    console.log(`Embeddings: enabled (MiniLM-L6-v2)`);
  }
  console.log('');

  // Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // better concurrent read performance
  initDB(db);

  // Find all markdown files
  const files = findMarkdownFiles(dir);
  console.log(`Found ${files.length} markdown files`);

  // Index each file (sequential to avoid overloading the embedding model)
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalUnchanged = 0;
  let totalSkipped = 0;
  let totalEmbedded = 0;

  for (const file of files) {
    const result = await indexFile(db, file, dir, embeddings);

    if (result.skipped) {
      totalSkipped++;
      continue;
    }

    totalInserted += result.inserted || 0;
    totalUpdated += result.updated || 0;
    totalUnchanged += result.unchanged || 0;
    totalEmbedded += result.embedded || 0;
  }

  // Clean up entries for files that no longer exist
  const allPaths = db.prepare('SELECT DISTINCT file_path FROM memory_chunks').pluck().all();
  const currentRelativePaths = new Set(
    files.map(f => path.relative(dir, f))
  );

  let deletedEntries = 0;
  const deleteFileStmt = db.prepare('DELETE FROM memory_chunks WHERE file_path = ?');
  for (const oldPath of allPaths) {
    if (!currentRelativePaths.has(oldPath)) {
      deleteFileStmt.run(oldPath);
      deletedEntries++;
    }
  }

  // Get final counts
  const totalChunks = db.prepare('SELECT COUNT(*) FROM memory_chunks').pluck().get();
  const chunksWithEmbeddings = db.prepare('SELECT COUNT(*) FROM chunk_embeddings').pluck().get();

  db.close();

  // Summary
  console.log('');
  console.log('Index complete:');
  console.log(`  New chunks:      ${totalInserted}`);
  console.log(`  Updated:         ${totalUpdated}`);
  console.log(`  Unchanged:       ${totalUnchanged}`);
  console.log(`  Skipped:         ${totalSkipped}`);
  console.log(`  Deleted (stale): ${deletedEntries}`);
  console.log(`  Total chunks:    ${totalChunks}`);
  if (embeddings) {
    console.log(`  Embedded:        ${totalEmbedded}`);
    console.log(`  With embeddings: ${chunksWithEmbeddings}`);
  }
}

main();
