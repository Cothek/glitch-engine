#!/usr/bin/env node
/**
 * search-memory.mjs — Glitch MemoryCore FTS5 Search CLI
 *
 * Searches the indexed memory database using SQLite FTS5 full-text search.
 * Results are ranked by BM25 relevance and displayed in a clean format.
 *
 * Supports hybrid BM25 + embedding search via --hybrid flag.
 *
 * Usage:
 *   node search-memory.mjs -q "memory update protocol"
 *   node search-memory.mjs --query "git discipline" --limit 5
 *   node search-memory.mjs -q "preference" --json
 *   node search-memory.mjs -q "test" --db /custom/path/memory-search.db
 *   node search-memory.mjs -q "autonomous agents" --hybrid --limit 5
 *   node search-memory.mjs -q "semantic search" --embeddings-only
 *
 * FTS5 query syntax supported:
 *   Simple words:  memory
 *   Phrases:       "memory update"
 *   AND:           memory AND update
 *   OR:            memory OR preference
 *   NOT:           memory NOT stale
 *   Prefix:        memo*
 *   NEAR:          NEAR(memory update, 3)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { computeEmbedding, loadAllEmbeddings, initEmbeddingsTable, cosineSimilarity } from './embeddings.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default DB lives next to this script
const DEFAULT_DB_PATH = path.join(__dirname, 'memory-search.db');

// Default memory dir for relative path display
const DEFAULT_MEMORY_DIR = path.resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let query = null;
  let limit = 10;
  let dbPath = DEFAULT_DB_PATH;
  let jsonOutput = false;
  let hybrid = false;
  let embeddingsOnly = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--query':
      case '-q':
        if (i + 1 < args.length) {
          query = args[i + 1];
          i++;
        }
        break;
      case '--limit':
      case '-l':
        if (i + 1 < args.length) {
          limit = parseInt(args[i + 1], 10);
          if (isNaN(limit) || limit < 1) {
            console.error('Error: --limit must be a positive integer');
            process.exit(1);
          }
          i++;
        }
        break;
      case '--db':
        if (i + 1 < args.length) {
          dbPath = path.resolve(args[i + 1]);
          i++;
        }
        break;
      case '--json':
        jsonOutput = true;
        break;
      case '--hybrid':
        hybrid = true;
        break;
      case '--embeddings-only':
        embeddingsOnly = true;
        break;
      default:
        // Treat unrecognized positional args as part of the query
        if (!query) {
          query = args[i];
        }
        break;
    }
  }

  return { query, limit, dbPath, jsonOutput, hybrid, embeddingsOnly };
}

// ---------------------------------------------------------------------------
// Content preview — truncate to ~N chars at word boundary
// ---------------------------------------------------------------------------

function preview(text, maxLen = 300) {
  if (text.length <= maxLen) return text;

  // Trim to maxLen, then back up to last space for clean word boundary
  let truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    truncated = truncated.slice(0, lastSpace);
  }

  return truncated + '...';
}

// ---------------------------------------------------------------------------
// Text output — clean, readable format
// ---------------------------------------------------------------------------

function printTextResults(results, memoryDir, hasScores = false) {
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const relPath = path.relative(memoryDir, path.resolve(memoryDir, r.file_path));

    if (hasScores && r.rrfScore !== undefined) {
      const bm25 = r.bm25Score !== undefined ? r.bm25Score.toFixed(2) : 'n/a';
      const sim = r.similarityScore !== undefined ? r.similarityScore.toFixed(2) : 'n/a';
      const rrf = r.rrfScore.toFixed(4);
      console.log(`#${i + 1}  [bm25: ${bm25} | sim: ${sim} | rrf: ${rrf}]`);
    } else {
      const score = r.score !== undefined ? r.score.toFixed(2) : 'n/a';
      console.log(`#${i + 1}  [score: ${score}]`);
    }

    console.log(`  File:    ${relPath}`);
    if (r.section_heading) {
      console.log(`  Section: ${r.section_heading}`);
    }
    console.log(`  Content: ${preview(r.content)}`);

    if (i < results.length - 1) {
      console.log('  ' + '─'.repeat(60));
    }
  }
}

// ---------------------------------------------------------------------------
// JSON output — machine-readable
// ---------------------------------------------------------------------------

function printJsonResults(results, memoryDir) {
  const output = results.map(r => {
    const base = {
      file_path: path.relative(memoryDir, path.resolve(memoryDir, r.file_path)),
      section_heading: r.section_heading || null,
      content: r.content,
    };

    // Include score fields if present
    if (r.score !== undefined) {
      base.score = parseFloat(r.score.toFixed(4));
    }
    if (r.bm25Score !== undefined) {
      base.bm25Score = parseFloat(r.bm25Score.toFixed(4));
    }
    if (r.similarityScore !== undefined) {
      base.similarityScore = parseFloat(r.similarityScore.toFixed(4));
    }
    if (r.rrfScore !== undefined) {
      base.rrfScore = parseFloat(r.rrfScore.toFixed(4));
    }

    return base;
  });

  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// BM25 search — core FTS5 query
// ---------------------------------------------------------------------------

function runBm25Search(db, query, limit) {
  const searchSql = `
    SELECT
      mc.id,
      mc.file_path,
      mc.section_heading,
      mc.content,
      bm25(memory_fts, 10.0, 5.0, 2.0) AS score
    FROM memory_fts
    JOIN memory_chunks mc ON mc.id = memory_fts.rowid
    WHERE memory_fts MATCH ?
    ORDER BY score ASC
    LIMIT ?
  `;

  let results;
  try {
    results = db.prepare(searchSql).all(query, limit);
  } catch (err) {
    if (err.message.includes('fts5') || err.message.includes('syntax') || err.message.includes('parse')) {
      console.error(`Error: invalid FTS5 query syntax: ${err.message}`);
      console.error('');
      console.error('FTS5 query tips:');
      console.error('  Simple:    memory');
      console.error('  Phrase:    "memory update"');
      console.error('  AND/OR:    memory AND update');
      console.error('  Prefix:    memo*');
      console.error('  NOT:       memory NOT stale');
    } else {
      console.error(`Error: search failed: ${err.message}`);
    }
    process.exit(1);
  }

  if (results.length === 0) return [];

  // BM25 returns negative scores (lower = better), normalize for display
  const minScore = Math.min(...results.map(r => r.score));
  const maxScore = Math.max(...results.map(r => r.score));
  const range = maxScore - minScore || 1;

  return results.map(r => ({
    ...r,
    score: ((maxScore - r.score) / range) * 100,
  }));
}

// ---------------------------------------------------------------------------
// Hybrid search — fuse BM25 + cosine similarity via RRF
// ---------------------------------------------------------------------------

async function runHybridSearch(db, query, limit, bm25Results) {
  try {
    // Ensure embeddings table exists
    initEmbeddingsTable(db);

    // Check if we have any embeddings
    const allEmbeddings = loadAllEmbeddings(db);
    if (allEmbeddings.length === 0) {
      console.warn('Warning: no embeddings found. Run index-memory.mjs --embeddings first. Falling back to BM25 only.');
      return null; // Signal to fall back
    }

    // Compute query embedding
    const queryEmbedding = await computeEmbedding(query);

    // Compute cosine similarity for ALL chunks (not just BM25 results)
    const embeddingMap = new Map();
    for (const entry of allEmbeddings) {
      embeddingMap.set(entry.chunkId, entry.embedding);
    }

    const similarities = allEmbeddings.map(entry => ({
      chunkId: entry.chunkId,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    // Sort by similarity, take top N*2 to have enough candidates
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSim = similarities.slice(0, limit * 2);

    // Fetch the data for the top similarity results
    const simChunks = db.prepare(
      'SELECT id, file_path, section_heading, content FROM memory_chunks WHERE id = ?'
    );
    const simResults = topSim
      .map(s => {
        const row = simChunks.get(s.chunkId);
        return row ? { ...row, similarity: s.similarity } : null;
      })
      .filter(Boolean);

    // Create maps for easy lookup
    const bm25Map = new Map();
    bm25Results.forEach((r, i) => {
      bm25Map.set(r.id, { ...r, bm25Rank: i + 1 });
    });

    const simMap = new Map();
    simResults.forEach((r, i) => {
      simMap.set(r.id, { ...r, simRank: i + 1 });
    });

    // Collect all unique IDs from both result sets
    const allIds = new Set([...bm25Map.keys(), ...simMap.keys()]);

    // Compute RRF score for each
    const fusedResults = [];
    for (const id of allIds) {
      const bm25 = bm25Map.get(id);
      const sim = simMap.get(id);

      let rrfScore = 0;
      if (bm25) rrfScore += 1 / (60 + bm25.bm25Rank);
      if (sim) rrfScore += 1 / (60 + sim.simRank);

      fusedResults.push({
        id,
        file_path: (bm25 || sim).file_path,
        section_heading: (bm25 || sim).section_heading,
        content: (bm25 || sim).content,
        bm25Score: bm25?.score ?? 0,
        similarityScore: sim?.similarity ?? 0,
        rrfScore,
      });
    }

    // Sort by RRF score descending
    fusedResults.sort((a, b) => b.rrfScore - a.rrfScore);

    // Take top N
    return fusedResults.slice(0, limit);
  } catch (err) {
    console.warn(`Warning: hybrid search failed (${err.message}). Falling back to BM25 only.`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Embeddings-only search — pure cosine similarity, no BM25
// ---------------------------------------------------------------------------

async function runEmbeddingsOnlySearch(db, query, limit) {
  try {
    initEmbeddingsTable(db);

    const allEmbeddings = loadAllEmbeddings(db);
    if (allEmbeddings.length === 0) {
      console.error('Error: no embeddings found. Run index-memory.mjs --embeddings first.');
      process.exit(1);
    }

    const queryEmbedding = await computeEmbedding(query);

    const similarities = allEmbeddings.map(entry => ({
      chunkId: entry.chunkId,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSim = similarities.slice(0, limit);

    const getChunk = db.prepare(
      'SELECT id, file_path, section_heading, content FROM memory_chunks WHERE id = ?'
    );

    const results = topSim.map((s, i) => {
      const row = getChunk.get(s.chunkId);
      if (!row) return null;
      return {
        id: row.id,
        file_path: row.file_path,
        section_heading: row.section_heading,
        content: row.content,
        similarityScore: s.similarity,
        rrfScore: 1 / (60 + i + 1), // Use sim rank as pseudo-RRF for display
      };
    }).filter(Boolean);

    return results;
  } catch (err) {
    console.error(`Error: embeddings-only search failed: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { query, limit, dbPath, jsonOutput, hybrid, embeddingsOnly } = parseArgs();

  if (!query) {
    console.error('Error: --query or -q is required');
    console.error('');
    console.error('Usage:');
    console.error('  node search-memory.mjs -q "search terms"');
    console.error('  node search-memory.mjs --query "phrase" --limit 5');
    console.error('  node search-memory.mjs -q "terms" --json');
    console.error('  node search-memory.mjs -q "terms" --hybrid');
    console.error('  node search-memory.mjs -q "terms" --embeddings-only');
    process.exit(1);
  }

  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: database not found at ${dbPath}`);
    console.error('');
    console.error('Run the indexer first:');
    console.error('  node index-memory.mjs');
    process.exit(1);
  }

  // Determine memory dir for relative path display
  const memoryDir = DEFAULT_MEMORY_DIR;

  // Open database (read-only mode for search)
  let db;
  try {
    db = new Database(dbPath, { readonly: true });
  } catch (err) {
    console.error(`Error: could not open database: ${err.message}`);
    process.exit(1);
  }

  try {
    let finalResults = null;
    let hasHybridScores = false;

    if (embeddingsOnly) {
      // Pure embedding search
      finalResults = await runEmbeddingsOnlySearch(db, query, limit);
      hasHybridScores = true;
    } else if (hybrid) {
      // Run BM25 first
      const bm25Results = runBm25Search(db, query, limit * 2); // Get more candidates for fusion

      if (bm25Results.length === 0 && !jsonOutput) {
        console.log(`No BM25 results for: "${query}" — trying embedding search...`);
        console.log('');
      }

      // Fuse with embeddings
      const hybridResults = await runHybridSearch(db, query, limit, bm25Results);

      if (hybridResults) {
        finalResults = hybridResults;
        hasHybridScores = true;
      } else {
        // Fallback to BM25 only
        finalResults = bm25Results;
      }
    } else {
      // Standard BM25 only
      finalResults = runBm25Search(db, query, limit);
    }

    if (!finalResults || finalResults.length === 0) {
      console.log('No results found');
      return;
    }

    if (jsonOutput) {
      printJsonResults(finalResults, memoryDir);
    } else {
      const modeLabel = embeddingsOnly ? ' (embeddings-only)' : hybrid ? ' (hybrid)' : '';
      console.log(`Found ${finalResults.length} result(s) for: "${query}"${modeLabel}`);
      console.log('');
      printTextResults(finalResults, memoryDir, hasHybridScores);
    }
  } finally {
    db.close();
  }
}

main();
