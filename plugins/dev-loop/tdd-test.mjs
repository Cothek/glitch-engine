#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXECUTE_TOOL = resolve(__dirname, 'execute-tool.mjs');

function printHelp() {
  process.stdout.write(`Usage: node tdd-test.mjs [options]

Options:
  --code <string>       JavaScript code to test (alternative to --file)
  --file <path>         JS file to test (alternative to --code)
  --tests <json>        JSON array of test cases (alternative to --tests-file)
  --tests-file <path>   Read test cases from file (alternative to --tests)
  --timeout <ms>        Per-test timeout in ms (default: 10000)
  --save-on-pass <path> If ALL tests pass, save code to this file
  --verbose             Show full details for every test
  --help                Show this help message

Test case format:
  [{ "name": "test name", "input": <any>, "expected": <any> }]

Input Priority:
  1. --code or --file provides the code
  2. --tests or --tests-file provides test cases
  3. If no tests source given, read tests JSON from stdin

Examples:
  node tdd-test.mjs --code "function handler(i) { return i.x + 1; }" --tests '[{"input":{"x":41},"expected":42}]'
  node tdd-test.mjs --file ./tool.mjs --tests-file ./tests.json
  node tdd-test.mjs --code "..." --tests '[...]' --save-on-pass ./tools/mytool.mjs
`);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] !== keysB[i]) return false;
      if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
    }
    return true;
  }

  return false;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function runExecuteTool(code, input, timeoutMs) {
  return new Promise((resolve, reject) => {
    const args = ['--code', code, '--input', JSON.stringify(input)];
    if (timeoutMs) args.push('--timeout', String(timeoutMs));

    const child = spawn('node', [EXECUTE_TOOL, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('error', (err) => {
      reject(new Error('execute-tool.mjs not found: ' + err.message));
    });

    child.on('close', (exitCode) => {
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(new Error('execute-tool.mjs returned empty output' + (stderr ? ': ' + stderr.trim() : '')));
        return;
      }
      try {
        const result = JSON.parse(trimmed);
        resolve(result);
      } catch (err) {
        reject(new Error('Invalid JSON from execute-tool.mjs: ' + err.message + '\nOutput: ' + trimmed));
      }
    });
  });
}

async function runTest(code, testCase, timeoutMs, index) {
  const name = testCase.name || 'test #' + (index + 1);
  const startTime = Date.now();

  try {
    const result = await runExecuteTool(code, testCase.input, timeoutMs);
    const executionTime = Date.now() - startTime;

    if (!result.success) {
      return {
        name,
        passed: false,
        executionTime,
        error: result.error || 'Unknown error',
        stack: result.stack,
      };
    }

    const actual = result.result;
    const expected = testCase.expected;
    const passed = deepEqual(actual, expected);

    const testResult = {
      name,
      passed,
      executionTime,
    };

    if (!passed) {
      testResult.expected = expected;
      testResult.actual = actual;
      testResult.error = 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual);
    }

    return testResult;
  } catch (err) {
    const executionTime = Date.now() - startTime;
    return {
      name,
      passed: false,
      executionTime,
      error: err.message,
    };
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      code: { type: 'string' },
      file: { type: 'string' },
      tests: { type: 'string' },
      'tests-file': { type: 'string' },
      timeout: { type: 'string' },
      'save-on-pass': { type: 'string' },
      verbose: { type: 'boolean' },
      help: { type: 'boolean' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values.code && !values.file) {
    process.stderr.write('Error: provide code via --code or --file\n');
    process.exit(1);
  }

  let code;
  if (values.code !== undefined) {
    code = values.code;
  } else {
    try {
      code = readFileSync(values.file, 'utf-8');
    } catch (err) {
      process.stderr.write('Error: Cannot read file "' + values.file + '": ' + err.message + '\n');
      process.exit(1);
    }
  }

  let tests;
  if (values.tests !== undefined) {
    try {
      tests = JSON.parse(values.tests);
    } catch (err) {
      process.stderr.write('Error: Invalid JSON for --tests: ' + err.message + '\n');
      process.exit(1);
    }
  } else if (values['tests-file'] !== undefined) {
    try {
      const raw = readFileSync(values['tests-file'], 'utf-8');
      tests = JSON.parse(raw);
    } catch (err) {
      process.stderr.write('Error: Cannot read tests file "' + values['tests-file'] + '": ' + err.message + '\n');
      process.exit(1);
    }
  } else {
    if (process.stdin.isTTY) {
      process.stderr.write('Error: provide tests via --tests, --tests-file, or pipe JSON to stdin\n');
      process.exit(1);
    }
    const stdinData = await readStdin();
    if (!stdinData.trim()) {
      process.stderr.write('Error: no tests received from stdin\n');
      process.exit(1);
    }
    try {
      tests = JSON.parse(stdinData);
    } catch (err) {
      process.stderr.write('Error: Invalid JSON from stdin: ' + err.message + '\n');
      process.exit(1);
    }
  }

  if (!Array.isArray(tests)) {
    process.stderr.write('Error: tests must be a JSON array\n');
    process.exit(1);
  }

  if (tests.length === 0) {
    process.stderr.write('Error: No tests provided\n');
    process.exit(1);
  }

  const timeoutMs = values.timeout ? parseInt(values.timeout, 10) : 10000;
  if (isNaN(timeoutMs) || timeoutMs <= 0) {
    process.stderr.write('Error: --timeout must be a positive number\n');
    process.exit(1);
  }

  if (!existsSync(EXECUTE_TOOL)) {
    process.stderr.write('Error: execute-tool.mjs not found at ' + EXECUTE_TOOL + '\n');
    process.exit(1);
  }

  const overallStart = Date.now();
  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const result = await runTest(code, tests[i], timeoutMs, i);
    results.push(result);
  }

  const executionTime = Date.now() - overallStart;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  const output = results.map((r) => {
    const entry = {
      name: r.name,
      passed: r.passed,
      executionTime: r.executionTime,
    };
    if (values.verbose) {
      entry.expected = r.expected !== undefined ? r.expected : '(not checked)';
      entry.actual = r.actual !== undefined ? r.actual : '(not checked)';
    }
    if (!r.passed) {
      entry.error = r.error;
      if (r.expected !== undefined) entry.expected = r.expected;
      if (r.actual !== undefined) entry.actual = r.actual;
      if (r.stack) entry.stack = r.stack;
    }
    return entry;
  });

  const report = {
    total: results.length,
    passed,
    failed,
    allPassed,
    executionTime,
    results: output,
  };

  if (allPassed && values['save-on-pass']) {
    const savePath = resolve(values['save-on-pass']);
    try {
      mkdirSync(dirname(savePath), { recursive: true });
      writeFileSync(savePath, code, 'utf-8');
      report.saved = savePath;
    } catch (err) {
      report.saveError = err.message;
    }
  }

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write('Fatal: ' + err.message + '\n');
  process.exit(1);
});
