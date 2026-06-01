#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { Worker } from 'node:worker_threads';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

const VERSION = '1.0.0';
const PLUGINS_DIR = resolve(import.meta.dirname, '..');
const TOOLS_DIR = resolve(PLUGINS_DIR, 'tools');
const STATS_FILE = resolve(TOOLS_DIR, 'tool-stats.json');

function printHelp() {
  process.stdout.write(`Usage: node run-tool.mjs <tool-name> [options]

Options:
  --input <json>     JSON input for the handler function (required for execution)
  --timeout <ms>     Execution timeout in milliseconds (default: 10000)
  --list             List all registered tools with trust levels and stats
  --refresh          Refresh stats by scanning tools directory
  --help             Show this help message
  --version          Show version

Examples:
  node run-tool.mjs double-array --input '[1,2,3]'
  node run-tool.mjs --list
  node run-tool.mjs --list --refresh
`);
}

function loadStats() {
  if (!existsSync(STATS_FILE)) {
    mkdirSync(TOOLS_DIR, { recursive: true });
    writeFileSync(STATS_FILE, '{}', 'utf-8');
    return {};
  }
  try {
    return JSON.parse(readFileSync(STATS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveStats(stats) {
  mkdirSync(TOOLS_DIR, { recursive: true });
  writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2) + '\n', 'utf-8');
}

function discoverTools() {
  if (!existsSync(TOOLS_DIR)) return [];
  return readdirSync(TOOLS_DIR)
    .filter(f => f.endsWith('.mjs') && f !== '.gitkeep')
    .map(f => basename(f, '.mjs'));
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[_\s]+/g, '-');
}

function findToolPath(toolName) {
  const direct = resolve(TOOLS_DIR, toolName + '.mjs');
  if (existsSync(direct)) return direct;

  const files = readdirSync(TOOLS_DIR).filter(f => f.endsWith('.mjs'));
  const needle = normalizeName(toolName);
  for (const f of files) {
    if (normalizeName(basename(f, '.mjs')) === needle) {
      return resolve(TOOLS_DIR, f);
    }
  }
  return null;
}

function computeTrustLevel(entry) {
  if (entry.consecutiveFailures >= 3) return 'degraded';
  if (entry.successes >= 10) return 'live';
  if (entry.successes >= 3) return 'validated';
  return entry.trustLevel || 'sandboxed';
}

function updateStats(toolName, success) {
  const stats = loadStats();
  const now = Math.floor(Date.now() / 1000);
  const key = normalizeName(toolName);

  if (!stats[key]) {
    stats[key] = {
      trustLevel: 'tested',
      runs: 0,
      successes: 0,
      failures: 0,
      consecutiveFailures: 0,
      lastRun: now,
      created: now,
    };
  }

  const entry = stats[key];
  entry.runs++;
  entry.lastRun = now;

  if (success) {
    entry.successes++;
    entry.consecutiveFailures = 0;
  } else {
    entry.failures++;
    entry.consecutiveFailures = (entry.consecutiveFailures || 0) + 1;
  }

  entry.trustLevel = computeTrustLevel(entry);
  saveStats(stats);
  return entry;
}

function buildWorkerCode(code) {
  return (
    "import { parentPort } from 'node:worker_threads';\n" +
    "\n" +
    "const logs = { stdout: [], stderr: [] };\n" +
    "console.log = (...args) => { logs.stdout.push(args.map(String).join(' ')); };\n" +
    "console.error = (...args) => { logs.stderr.push(args.map(String).join(' ')); };\n" +
    "console.warn = (...args) => { logs.stderr.push(args.map(String).join(' ')); };\n" +
    "\n" +
    code +
    "\n" +
    "\n" +
    "if (typeof handler !== 'function') {\n" +
    "  throw new Error('Tool must export/define a function named \"handler\"');\n" +
    "}\n" +
    "\n" +
    "parentPort.on('message', async (msg) => {\n" +
    "  try {\n" +
    "    const result = await handler(msg.input);\n" +
    "    parentPort.postMessage({ success: true, result, stdout: logs.stdout, stderr: logs.stderr });\n" +
    "  } catch (err) {\n" +
    "    parentPort.postMessage({ success: false, error: err.message, stack: err.stack, name: err.name, stdout: logs.stdout, stderr: logs.stderr });\n" +
    "  }\n" +
    "});\n"
  );
}

function output(result) {
  process.stdout.write(JSON.stringify(result) + '\n');
}

async function runTool(toolName, input, timeoutMs) {
  const toolPath = findToolPath(toolName);
  if (!toolPath) {
    const available = discoverTools();
    output({ error: "Tool '" + toolName + "' not found", availableTools: available });
    process.exit(2);
  }

  let code;
  try {
    code = readFileSync(toolPath, 'utf-8');
  } catch (err) {
    output({ error: "Cannot read tool file: " + err.message });
    process.exit(1);
  }

  const workerCode = buildWorkerCode(code);
  const startTime = Date.now();
  let settled = false;

  let worker;
  try {
    worker = new Worker(workerCode, { eval: true, type: 'module' });
  } catch (err) {
    const executionTime = Date.now() - startTime;
    output({ tool: toolName, trustLevel: 'unknown', success: false, error: err.message, stack: err.stack, executionTime });
    process.exit(1);
  }

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    worker.terminate();
    const executionTime = Date.now() - startTime;
    output({ tool: toolName, trustLevel: 'unknown', success: false, error: 'Timeout exceeded (' + timeoutMs + 'ms)', timedOut: true, executionTime });
    process.exit(1);
  }, timeoutMs);

  worker.on('message', (msg) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const executionTime = Date.now() - startTime;
    const entry = updateStats(toolName, msg.success);
    const trustLevel = entry.trustLevel;

    const result = {
      tool: toolName,
      trustLevel,
      success: msg.success,
      executionTime,
    };

    if (msg.success) {
      result.result = msg.result;
    } else {
      result.error = msg.error;
      if (msg.stack) result.stack = msg.stack;
      if (msg.name) result.name = msg.name;
    }

    if (msg.stdout && msg.stdout.length > 0) result.stdout = msg.stdout;
    if (msg.stderr && msg.stderr.length > 0) result.stderr = msg.stderr;

    output(result);
    process.exit(msg.success ? 0 : 1);
  });

  worker.on('error', (err) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const executionTime = Date.now() - startTime;
    const entry = updateStats(toolName, false);
    output({ tool: toolName, trustLevel: entry.trustLevel, success: false, error: err.message, stack: err.stack, executionTime });
    process.exit(1);
  });

  worker.on('exit', (exitCode) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const executionTime = Date.now() - startTime;
    const entry = updateStats(toolName, false);
    output({ tool: toolName, trustLevel: entry.trustLevel, success: false, error: 'Worker exited unexpectedly (code ' + exitCode + ')', executionTime });
    process.exit(1);
  });

  worker.postMessage({ input });
}

function listTools(refresh) {
  const stats = loadStats();
  const discovered = discoverTools();
  const tools = {};

  for (const name of discovered) {
    const key = normalizeName(name);
    const filePath = resolve(TOOLS_DIR, name + '.mjs');
    const entry = stats[key];

    tools[key] = {
      trustLevel: entry ? entry.trustLevel : 'sandboxed',
      runs: entry ? entry.runs : 0,
      successes: entry ? entry.successes : 0,
      failures: entry ? entry.failures : 0,
      lastRun: entry ? entry.lastRun : null,
      created: entry ? entry.created : null,
      filePath,
      exists: true,
    };
  }

  if (refresh) {
    for (const key of Object.keys(stats)) {
      if (!tools[key]) {
        tools[key] = {
          trustLevel: stats[key].trustLevel,
          runs: stats[key].runs,
          successes: stats[key].successes,
          failures: stats[key].failures,
          lastRun: stats[key].lastRun,
          created: stats[key].created,
          filePath: resolve(TOOLS_DIR, key + '.mjs'),
          exists: false,
        };
      }
    }
  }

  output({ tools });
  process.exit(0);
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      input: { type: 'string' },
      timeout: { type: 'string' },
      list: { type: 'boolean' },
      refresh: { type: 'boolean' },
      help: { type: 'boolean' },
      version: { type: 'boolean' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    process.stdout.write('run-tool v' + VERSION + '\n');
    process.exit(0);
  }

  if (values.list) {
    listTools(values.refresh || false);
    return;
  }

  const toolName = positionals[0];
  if (!toolName) {
    process.stderr.write('Error: <tool-name> is required (or use --list)\n');
    process.exit(3);
  }

  if (values.input === undefined) {
    process.stderr.write('Error: --input <json> is required for execution\n');
    process.exit(3);
  }

  let input;
  try {
    input = JSON.parse(values.input);
  } catch (err) {
    process.stderr.write('Error: Invalid JSON for --input: ' + err.message + '\n');
    process.exit(3);
  }

  const timeoutMs = values.timeout ? parseInt(values.timeout, 10) : 10000;
  if (isNaN(timeoutMs) || timeoutMs <= 0) {
    process.stderr.write('Error: --timeout must be a positive number\n');
    process.exit(3);
  }

  await runTool(toolName, input, timeoutMs);
}

main().catch((err) => {
  process.stderr.write('Fatal: ' + err.message + '\n');
  process.exit(1);
});
