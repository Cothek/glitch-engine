#!/usr/bin/env node
/**
 * check-dedup.mjs — Glitch MemoryCore Duplicate Content Checker
 *
 * Checks whether content already exists in the FTS5 memory index.
 * Supports exact hash matching and optional fuzzy FTS5 search.
 *
 * Usage:
 *   node check-dedup.mjs --content "text to check"
 *   echo "text to check" | node check-dedup.mjs
 *   node check-dedup.mjs --content "text" --fuzzy
 *   node check-dedup.mjs --content "text" --json
 *   node check-dedup.mjs --content "text" --db /path/to/db
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database lives next to this script (same as index-memory.mjs)
const DEFAULT_DB_PATH = path.join(__dirname, 'memory-search.db');

// Common stop words to skip during fuzzy word extraction
const STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their',
  'there', 'about', 'which', 'would', 'could', 'should', 'will', 'some',
  'into', 'more', 'than', 'then', 'them', 'these', 'those', 'what', 'when',
  'where', 'who', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'most', 'other', 'such', 'only', 'own', 'same', 'does', 'did', 'doing',
  'also', 'just', 'very', 'much', 'many', 'well', 'back', 'even', 'still',
  'way', 'take', 'come', 'make', 'like', 'long', 'look', 'use', 'used',
  'using', 'get', 'got', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'had', 'has', 'having', 'do', 'done', 'being', 'is',
  'am', 'are', 'was', 'were', 'be', 'an', 'and', 'but', 'or', 'nor', 'not',
  'so', 'yet', 'for', 'if', 'because', 'as', 'until', 'while', 'of', 'at',
  'by', 'on', 'to', 'in', 'up', 'out', 'off', 'over', 'under', 'again',
  'further', 'once', 'here', 'after', 'before', 'between', 'through',
  'during', 'above', 'below', 'any', 'no', 'yes', 'it', 'its', 'he', 'she',
  'him', 'her', 'his', 'we', 'you', 'your', 'my', 'me', 'i', 'a', 'the',
]);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let content = null;
  let dbPath = DEFAULT_DB_PATH;
  let fuzzy = false;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--content' && i + 1 < args.length) {
      content = args[i + 1];
      i++;
    } else if (args[i] === '--db' && i + 1 < args.length) {
      dbPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--fuzzy') {
      fuzzy = true;
    } else if (args[i] === '--json') {
      jsonOutput = true;
    }
  }

  return { content, dbPath, fuzzy, jsonOutput };
}

// ---------------------------------------------------------------------------
// Read content from stdin if not provided via --content
// ---------------------------------------------------------------------------

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }

    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim() || null);
    });
  });
}

// ---------------------------------------------------------------------------
// Normalization — must match index-memory.mjs hashing approach
//
// The indexer hashes chunk.content directly (the raw trimmed text from
// splitIntoChunks). For exact duplicate detection of arbitrary input text,
// we normalize consistently:
//   1. Trim whitespace
//   2. Convert to lowercase
//   3. Replace multiple spaces/newlines with single space
//   4. Compute SHA256 of normalized text
// ---------------------------------------------------------------------------

function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Fuzzy search — extract significant words and build FTS5 query
// ---------------------------------------------------------------------------

function extractSignificantWords(text) {
  const normalized = normalize(text);
  // Extract words (alphanumeric sequences)
  const words = normalized.match(/[a-z0-9]+/g) || [];
  // Filter: length > 3, not a stop word, unique
  const significant = [];
  const seen = new Set();
  for (const word of words) {
    if (word.length > 3 && !STOP_WORDS.has(word) && !seen.has(word)) {
      significant.push(word);
      seen.add(word);
    }
  }
  return significant;
}

function buildFtsQuery(words) {
  if (words.length === 0) return null;
  // Use AND query for all significant words
  return words.map(w => `"${w}"`).join(' AND ');
}

// ---------------------------------------------------------------------------
// Check for exact duplicates
// ---------------------------------------------------------------------------

function checkExact(db, inputHash) {
  const stmt = db.prepare(
    'SELECT file_path, section_heading, content, content_hash FROM memory_chunks WHERE content_hash = ?'
  );
  return stmt.all(inputHash);
}

// ---------------------------------------------------------------------------
// Check for fuzzy matches
// ---------------------------------------------------------------------------

function checkFuzzy(db, content) {
  const words = extractSignificantWords(content);
  if (words.length < 2) {
    // Not enough significant words for meaningful fuzzy search
    return [];
  }

  const query = buildFtsQuery(words);
  if (!query) return [];

  try {
    // FTS5 rank() returns relevance score (lower is better, can be negative)
    // We invert it for display: higher = more similar
    const stmt = db.prepare(`
      SELECT
        file_path,
        section_heading,
        content,
        rank
      FROM memory_fts
      WHERE memory_fts MATCH ?
      ORDER BY rank
      LIMIT 5
    `);
    const results = stmt.all(query);

    // Normalize scores for display (invert rank, scale to 0-100)
    if (results.length === 0) return [];

    // Find min/max rank for normalization
    const ranks = results.map(r => r.rank);
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    const range = maxRank - minRank || 1;

    return results.map(r => ({
      file_path: r.file_path,
      section_heading: r.section_heading,
      content_preview: r.content.slice(0, 120) + (r.content.length > 120 ? '...' : ''),
      // Invert: lower rank = higher score. Scale to 0-100.
      score: Math.round(((maxRank - r.rank) / range) * 1000) / 10,
    }));
  } catch {
    // FTS5 query might fail if tokenizer rejects the query
    return [];
  }
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatTextOutput(exactMatches, fuzzyMatches, inputContent) {
  const lines = [];

  if (exactMatches.length > 0) {
    lines.push(`⚠ Duplicate detected (${exactMatches.length} exact match(es)):`);
    lines.push('');
    for (const match of exactMatches) {
      const preview = match.content.slice(0, 100) + (match.content.length > 100 ? '...' : '');
      lines.push(`  File: ${match.file_path}`);
      lines.push(`  Section: ${match.section_heading}`);
      lines.push(`  Existing: "${preview}"`);
      lines.push('');
    }
  } else if (fuzzyMatches.length > 0) {
    lines.push('No exact duplicates. Similar entries found:');
    lines.push('');
    for (const match of fuzzyMatches) {
      lines.push(`  [score: ${match.score}] ${match.file_path} → ${match.section_heading}`);
    }
    lines.push('');
  } else {
    lines.push('No duplicate found — safe to write.');
    lines.push('');
  }

  return lines.join('\n');
}

function formatJsonOutput(exactMatches, fuzzyMatches) {
  if (exactMatches.length > 0) {
    return JSON.stringify({
      duplicate: true,
      match_type: 'exact',
      matches: exactMatches.map(m => ({
        file_path: m.file_path,
        section_heading: m.section_heading,
        content_preview: m.content.slice(0, 120) + (m.content.length > 120 ? '...' : ''),
      })),
    }, null, 2);
  }

  if (fuzzyMatches.length > 0) {
    return JSON.stringify({
      duplicate: false,
      match_type: 'fuzzy',
      matches: fuzzyMatches,
    }, null, 2);
  }

  return JSON.stringify({
    duplicate: false,
    match_type: 'none',
    matches: [],
  }, null, 2);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { content: argContent, dbPath, fuzzy, jsonOutput } = parseArgs();

  // Get content from argument or stdin
  let content = argContent;
  if (!content) {
    content = await readStdin();
  }

  if (!content || content.trim().length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'No content provided', duplicate: false, match_type: 'none', matches: [] }, null, 2));
    } else {
      console.error('Error: No content provided. Use --content "text" or pipe stdin.');
    }
    process.exit(1);
  }

  // Check if DB exists
  if (!fs.existsSync(dbPath)) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: 'No index found. Run index-memory.mjs first.', duplicate: false, match_type: 'none', matches: [] }, null, 2));
    } else {
      console.log('No index found. Run index-memory.mjs first.');
    }
    process.exit(0);
  }

  // Open database (read-only)
  let db;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch (err) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: `Failed to open database: ${err.message}`, duplicate: false, match_type: 'none', matches: [] }, null, 2));
    } else {
      console.error(`Error: Failed to open database: ${err.message}`);
    }
    process.exit(1);
  }

  try {
    // Compute normalized hash
    const normalized = normalize(content);
    const inputHash = sha256(normalized);

    // Check for exact duplicates
    const exactMatches = checkExact(db, inputHash);

    let fuzzyMatches = [];
    if (exactMatches.length === 0 && fuzzy) {
      fuzzyMatches = checkFuzzy(db, content);
    }

    // Output results
    if (jsonOutput) {
      console.log(formatJsonOutput(exactMatches, fuzzyMatches));
    } else {
      console.log(formatTextOutput(exactMatches, fuzzyMatches, content));
    }

    // Exit code: 1 if exact duplicate found, 0 otherwise
    process.exit(exactMatches.length > 0 ? 1 : 0);
  } catch (err) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: `Query failed: ${err.message}`, duplicate: false, match_type: 'none', matches: [] }, null, 2));
    } else {
      console.error(`Error: Query failed: ${err.message}`);
    }
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
