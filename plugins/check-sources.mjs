#!/usr/bin/env node
/**
 * check-sources.mjs — Monitor external sources for new releases/updates
 *
 * Reads library/external-sources.md, checks GitHub repos for new releases,
 * compares against the last-reviewed version, and reports what's changed.
 *
 * Usage:
 *   node check-sources.mjs              # check all sources, print report
 *   node check-sources.mjs --json       # machine-readable output
 *   node check-sources.mjs --update     # also update the Checked: dates in the file
 *
 * The script does NOT auto-update external-sources.md unless --update is passed.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the sources registry (moved from glitch-memorycore/library/ to user/library/ in May 2026)
const SOURCES_FILE = resolve(__dirname, '../../user/library/external-sources.md');

// ── Parse external-sources.md ─────────────────────────────────────────────

function parseSources(text) {
    const lines = text.split('\n');
    const repos = [];
    let currentRepo = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect GitHub repo headers (### owner/name)
        const repoMatch = line.match(/^### (.+?)\/(.+?)$/);
        if (repoMatch) {
            if (currentRepo) repos.push(currentRepo);
            currentRepo = {
                owner: repoMatch[1].trim(),
                name: repoMatch[2].trim(),
                url: '',
                watchFor: '',
                lastReviewed: '',
                checked: '',
                notes: '',
            };
            continue;
        }

        if (!currentRepo) continue;

        // Parse fields from the | **Field** | **Value** | table
        const urlMatch = line.match(/^\| \*\*URL\*\* \| (.+?) \|$/);
        if (urlMatch) { currentRepo.url = urlMatch[1].trim(); continue; }

        const watchMatch = line.match(/^\| \*\*Watch for\*\* \| (.+?) \|$/);
        if (watchMatch) { currentRepo.watchFor = watchMatch[1].trim(); continue; }

        const reviewedMatch = line.match(/^\| \*\*Last reviewed\*\* \| (.+?) \|$/);
        if (reviewedMatch) { currentRepo.lastReviewed = reviewedMatch[1].trim(); continue; }

        const checkedMatch = line.match(/^\| \*\*Checked\*\* \| (.+?) \|$/);
        if (checkedMatch) { currentRepo.checked = checkedMatch[1].trim(); continue; }
    }

    // Don't forget the last one
    if (currentRepo) repos.push(currentRepo);

    return repos;
}

// ── Fetch latest release from GitHub API ───────────────────────────────────

async function checkGitHubRelease(owner, name) {
    const url = `https://api.github.com/repos/${owner}/${name}/releases/latest`;
    const resp = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'glitch-memorycore/1.0',
        },
    });

    if (!resp.ok) {
        // Try tags as fallback
        const tagsUrl = `https://api.github.com/repos/${owner}/${name}/tags?per_page=1`;
        const tagsResp = await fetch(tagsUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'glitch-memorycore/1.0',
            },
        });
        if (!tagsResp.ok) {
            return { error: `GitHub API error: ${resp.status} (releases), ${tagsResp.status} (tags)` };
        }
        const tags = await tagsResp.json();
        if (!Array.isArray(tags) || tags.length === 0) {
            return { error: 'No tags found' };
        }
        return {
            tag: tags[0].name,
            url: tags[0].html_url || `https://github.com/${owner}/${name}/releases`,
            publishedAt: 'unknown',
        };
    }

    const data = await resp.json();
    return {
        tag: data.tag_name,
        url: data.html_url,
        publishedAt: data.published_at,
        name: data.name,
    };
}

// ── Parse version string to comparable parts ──────────────────────────────

function parseVersion(v) {
    // Strip leading v/V:  v0.21.8 → 0.21.8
    const cleaned = v.replace(/^[vV]/, '');
    const parts = cleaned.split(/[.\-_]/).map(p => {
        const n = parseInt(p, 10);
        return isNaN(n) ? p : n;
    });
    return parts;
}

function isNewerVersion(latest, reviewed) {
    if (!reviewed || reviewed === '_(None)_' || reviewed === 'N/A') return true;
    if (!latest) return false;

    const latestParts = parseVersion(latest);
    const reviewedParts = parseVersion(reviewed);

    for (let i = 0; i < Math.max(latestParts.length, reviewedParts.length); i++) {
        const l = i < latestParts.length ? latestParts[i] : 0;
        const r = i < reviewedParts.length ? reviewedParts[i] : 0;

        if (typeof l === 'string' || typeof r === 'string') {
            // String comparison fallback
            if (String(l) !== String(r)) return String(l) > String(r);
        } else {
            if (l > r) return true;
            if (l < r) return false;
        }
    }
    return false;
}

// ── Format today's date ───────────────────────────────────────────────────

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    const doUpdate = args.includes('--update');

    // Read sources file
    let text;
    try {
        text = readFileSync(SOURCES_FILE, 'utf8');
    } catch (err) {
        console.error(`Error: could not read ${SOURCES_FILE}`);
        console.error(err.message);
        process.exit(1);
    }

    const repos = parseSources(text);
    if (repos.length === 0) {
        console.log('No GitHub repos found in external-sources.md');
        return;
    }

    // Check each repo
    const results = [];
    for (const repo of repos) {
        const result = await checkGitHubRelease(repo.owner, repo.name);
        const hasUpdate = !result.error && isNewerVersion(result.tag, repo.lastReviewed);

        results.push({
            owner: repo.owner,
            name: repo.name,
            reviewed: repo.lastReviewed,
            latest: result.tag || result.error || 'unknown',
            hasUpdate,
            url: repo.url,
            releaseUrl: result.url,
            publishedAt: result.publishedAt,
            watchFor: repo.watchFor,
        });
    }

    // Output
    if (jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
        return;
    }

    // Text output
    const today = todayStr();
    let hasAnyUpdate = false;

    for (const r of results) {
        if (r.hasUpdate) {
            hasAnyUpdate = true;
            console.log(`⬆ ${r.owner}/${r.name}`);
            console.log(`   Reviewed: ${r.reviewed || 'never'} → Latest: ${r.latest}`);
            console.log(`   ${r.releaseUrl}`);
            if (r.watchFor) console.log(`   Watch: ${r.watchFor}`);
            console.log('');
        } else if (r.latest) {
            console.log(`✓ ${r.owner}/${r.name} — up to date at ${r.latest}${r.reviewed ? ` (reviewed ${r.reviewed})` : ''}`);
        } else {
            console.log(`? ${r.owner}/${r.name} — ${r.latest}`);
        }
    }

    if (!hasAnyUpdate) {
        console.log('\nAll sources up to date. Last checked: ' + today);
    } else {
        console.log('\nUpdates available! Review the repos above and update external-sources.md when done.');
    }

    // Update Checked date if --update
    if (doUpdate) {
        const updatedText = text.replace(
            /(\*\*Checked\*\* \| ).+? \|/,
            `$1${today} |`
        );
        writeFileSync(SOURCES_FILE, updatedText, 'utf8');
        console.log(`\nUpdated Checked date to ${today} in external-sources.md`);
    }
}

main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
