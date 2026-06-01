#!/usr/bin/env node
/**
 * embeddings.mjs — Glitch MemoryCore Embedding Layer
 *
 * Provides embedding compute, storage, and hybrid BM25 + semantic search
 * for the FTS5 memory search system. Uses MiniLM-L6-v2 via
 * @huggingface/transformers for lightweight, zero-API-call embeddings.
 *
 * Usage:
 *   import { computeEmbedding, hybridSearch, cosineSimilarity } from './embeddings.mjs';
 *
 * Part of Project Daedalus — Phase 4: Embedding-based skill retrieval.
 */

import { pipeline } from '@huggingface/transformers';

// ---------------------------------------------------------------------------
// Singleton model loader
// ---------------------------------------------------------------------------

let _modelPromise = null;

/**
 * Lazy-loads the MiniLM-L6-v2 feature extraction pipeline.
 * Only loads once (singleton pattern).
 * @returns {Promise<Function>} The extract function
 */
export async function getModel() {
  if (!_modelPromise) {
    _modelPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return _modelPromise;
}

/**
 * Computes a 384-dimensional embedding for the given text.
 * @param {string} text - The text to embed
 * @returns {Promise<Float32Array>} The normalized embedding vector
 */
export async function computeEmbedding(text) {
  const extract = await getModel();
  const output = await extract(text, { pooling: 'mean', normalize: true });
  return new Float32Array(output.data);
}

/**
 * Converts a Float32Array embedding to a Node.js Buffer for SQLite storage.
 * @param {Float32Array} embedding - The embedding vector
 * @returns {Buffer} Binary buffer of the embedding
 */
export function embeddingToBuffer(embedding) {
  return Buffer.from(embedding.buffer);
}

/**
 * Converts a Buffer back to a Float32Array.
 * @param {Buffer} buffer - Binary buffer from SQLite
 * @returns {Float32Array} The embedding vector
 */
export function bufferToEmbedding(buffer) {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

/**
 * Computes cosine similarity between two vectors.
 * @param {Float32Array|number[]} a - First vector
 * @param {Float32Array|number[]} b - Second vector
 * @returns {number} Cosine similarity in [-1, 1], or 0 if zero-magnitude
 */
export function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Creates the chunk_embeddings table if it doesn't exist.
 * @param {import('better-sqlite3').Database} db - SQLite database instance
 */
export function initEmbeddingsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunk_embeddings (
      chunk_id INTEGER PRIMARY KEY REFERENCES memory_chunks(id) ON DELETE CASCADE,
      embedding BLOB NOT NULL,
      model TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
      created_at INTEGER NOT NULL
    );
  `);
}

/**
 * Stores an embedding for a given chunk, replacing any existing one.
 * @param {import('better-sqlite3').Database} db - SQLite database instance
 * @param {number} chunkId - The chunk ID from memory_chunks
 * @param {Float32Array} embedding - The embedding vector
 */
export function storeEmbedding(db, chunkId, embedding) {
  const buffer = embeddingToBuffer(embedding);
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT OR REPLACE INTO chunk_embeddings (chunk_id, embedding, model, created_at) VALUES (?, ?, ?, ?)'
  ).run(chunkId, buffer, 'all-MiniLM-L6-v2', now);
}

/**
 * Loads all stored embeddings from the database.
 * @param {import('better-sqlite3').Database} db - SQLite database instance
 * @returns {Array<{chunkId: number, embedding: Float32Array}>}
 */
export function loadAllEmbeddings(db) {
  try {
    const rows = db.prepare(
      'SELECT chunk_id, embedding FROM chunk_embeddings'
    ).all();
    return rows.map(row => ({
      chunkId: row.chunk_id,
      embedding: bufferToEmbedding(row.embedding),
    }));
  } catch {
    // Table doesn't exist yet — return empty
    return [];
  }
}

/**
 * Hybrid search: fuses BM25 results with cosine similarity using Reciprocal Rank Fusion.
 * @async
 * @param {Array<{id: number, file_path: string, section_heading: string, content: string, score: number}>} bm25Results
 * @param {string} queryText - The search query (for embedding computation)
 * @param {import('better-sqlite3').Database} db - SQLite database instance
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array<{id: number, file_path: string, section_heading: string, content: string, bm25Score: number, similarityScore: number, rrfScore: number}>>}
 */
export async function hybridSearch(bm25Results, queryText, db, limit) {
  // Step 1: Compute query embedding
  const queryEmbedding = await computeEmbedding(queryText);

  // Step 2: Load all chunk embeddings
  const allEmbeddings = loadAllEmbeddings(db);
  const embeddingMap = new Map();
  for (const entry of allEmbeddings) {
    embeddingMap.set(entry.chunkId, entry.embedding);
  }

  // Step 3: Compute cosine similarity for each BM25 result
  const bm25WithSim = bm25Results.map(r => {
    const chunkEmb = embeddingMap.get(r.id);
    const similarity = chunkEmb ? cosineSimilarity(queryEmbedding, chunkEmb) : 0;
    return { ...r, similarityScore: similarity };
  });

  // Step 4: Normalize BM25 scores
  const scores = bm25WithSim.map(r => r.score);
  const minBM25 = Math.min(...scores);
  const maxBM25 = Math.max(...scores);
  const bm25Range = maxBM25 - minBM25 || 1;

  const bm25Normalized = bm25WithSim.map(r => ({
    ...r,
    bm25Normalized: (r.score - minBM25) / bm25Range,
  }));

  // Step 5: Rank by BM25 (1-indexed, best = rank 1)
  const bm25Ranked = [...bm25Normalized].sort((a, b) => b.score - a.score);
  const bm25RankMap = new Map();
  bm25Ranked.forEach((r, i) => bm25RankMap.set(r.id, i + 1));

  // Step 6: Rank by cosine similarity (1-indexed, best = rank 1)
  const simRanked = [...bm25WithSim].sort((a, b) => b.similarityScore - a.similarityScore);
  const simRankMap = new Map();
  simRanked.forEach((r, i) => simRankMap.set(r.id, i + 1));

  // Also find chunks that have embeddings but are NOT in BM25 results
  const bm25Ids = new Set(bm25Results.map(r => r.id));
  const simOnlyChunks = [];
  for (const [chunkId, emb] of embeddingMap) {
    if (!bm25Ids.has(chunkId)) {
      const similarity = cosineSimilarity(queryEmbedding, emb);
      simOnlyChunks.push({ chunkId, similarityScore: similarity });
    }
  }
  // Rank these sim-only chunks
  simOnlyChunks.sort((a, b) => b.similarityScore - a.similarityScore);
  const simOnlyRankMap = new Map();
  simOnlyChunks.forEach((r, i) => simOnlyRankMap.set(r.chunkId, i + 1));

  // Step 7: Compute RRF scores
  const allIds = new Set([...bm25RankMap.keys(), ...simOnlyRankMap.keys()]);
  const fusedResults = [];

  // Fetch chunk data for sim-only items
  const getChunk = db.prepare(
    'SELECT id, file_path, section_heading, content FROM memory_chunks WHERE id = ?'
  );

  for (const id of allIds) {
    const bm25Rank = bm25RankMap.get(id);
    const simRank = simRankMap.get(id) ?? simOnlyRankMap.get(id);

    let rrfScore = 0;
    if (bm25Rank) rrfScore += 1 / (60 + bm25Rank);
    if (simRank) rrfScore += 1 / (60 + simRank);

    // Get chunk data
    let chunkData;
    const bm25Item = bm25WithSim.find(r => r.id === id);
    if (bm25Item) {
      chunkData = bm25Item;
    } else {
      chunkData = getChunk.get(id);
    }

    if (!chunkData) continue;

    fusedResults.push({
      id,
      file_path: chunkData.file_path,
      section_heading: chunkData.section_heading,
      content: chunkData.content,
      bm25Score: bm25Item ? bm25Item.score : 0,
      similarityScore: bm25Item ? bm25Item.similarityScore : (simOnlyChunks.find(c => c.chunkId === id)?.similarityScore ?? 0),
      rrfScore,
    });
  }

  // Step 8: Sort by RRF score descending, take top limit
  fusedResults.sort((a, b) => b.rrfScore - a.rrfScore);
  return fusedResults.slice(0, limit);
}
