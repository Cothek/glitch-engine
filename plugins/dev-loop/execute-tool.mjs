#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { Worker } from 'node:worker_threads';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const VERSION = '1.0.0';

function printHelp() {
  process.stdout.write(`Usage: node execute-tool.mjs [options]

Options:
  --code <string>    JavaScript code to execute
  --file <path>      JavaScript file to execute
  --input <json>     JSON input for the handler function
  --timeout <ms>     Execution timeout in milliseconds (default: 10000)
  --export <name>    Name of the exported function to call (default: handler)
  --save-to <path>   Save the code to a file if execution succeeds
  --help             Show this help message
  --version          Show version

Input Priority:
  1. --code (inline JavaScript)
  2. --file (read from file)
  3. stdin (pipe code in)

  If --code or --file is used, --input can come from --input arg or stdin.
  If reading code from stdin, --input is required.

Examples:
  node execute-tool.mjs --code "function handler(i) { return i.x + 1; }" --input '{"x": 41}'
  node execute-tool.mjs --file ./tool.mjs --input '{"test": true}'
  echo "function handler(i) { return i * 2; }" | node execute-tool.mjs --input '21'
`);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function buildWorkerCode(userCode, exportName) {
  return (
    "import { parentPort } from 'node:worker_threads';\n" +
    "\n" +
    "const logs = { stdout: [], stderr: [] };\n" +
    "console.log = (...args) => { logs.stdout.push(args.map(String).join(' ')); };\n" +
    "console.error = (...args) => { logs.stderr.push(args.map(String).join(' ')); };\n" +
    "console.warn = (...args) => { logs.stderr.push(args.map(String).join(' ')); };\n" +
    "\n" +
    userCode +
    "\n" +
    "\n" +
    "if (typeof " + exportName + " !== 'function') {\n" +
    "  throw new Error('No function named " + JSON.stringify(exportName) + " found');\n" +
    "}\n" +
    "\n" +
    "parentPort.on('message', async (msg) => {\n" +
    "  try {\n" +
    "    const result = await " + exportName + "(msg.input);\n" +
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

async function main() {
  const { values } = parseArgs({
    options: {
      code: { type: 'string' },
      file: { type: 'string' },
      input: { type: 'string' },
      timeout: { type: 'string' },
      export: { type: 'string' },
      'save-to': { type: 'string' },
      help: { type: 'boolean' },
      version: { type: 'boolean' },
    },
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    process.stdout.write('execute-tool v' + VERSION + '\n');
    process.exit(0);
  }

  let code;
  let codeFromStdin = false;

  if (values.code !== undefined) {
    code = values.code;
  } else if (values.file !== undefined) {
    try {
      code = readFileSync(values.file, 'utf-8');
    } catch (err) {
      process.stderr.write('Error: Cannot read file "' + values.file + '": ' + err.message + '\n');
      process.exit(1);
    }
  } else {
    if (process.stdin.isTTY) {
      process.stderr.write('Error: provide code via --code, --file, or pipe to stdin\n');
      process.exit(1);
    }
    code = await readStdin();
    codeFromStdin = true;
  }

  let input;

  if (values.input !== undefined) {
    try {
      input = JSON.parse(values.input);
    } catch (err) {
      process.stderr.write('Error: Invalid JSON for --input: ' + err.message + '\n');
      process.exit(1);
    }
  } else if (!codeFromStdin) {
    if (process.stdin.isTTY) {
      process.stderr.write('Error: --input is required when code is provided via --code or --file without piped stdin\n');
      process.exit(1);
    }
    const stdinData = await readStdin();
    if (!stdinData.trim()) {
      process.stderr.write('Error: --input is required (no input received from stdin)\n');
      process.exit(1);
    }
    try {
      input = JSON.parse(stdinData);
    } catch (err) {
      process.stderr.write('Error: Invalid JSON from stdin: ' + err.message + '\n');
      process.exit(1);
    }
  } else {
    process.stderr.write('Error: --input is required when reading code from stdin\n');
    process.exit(1);
  }

  const timeoutMs = values.timeout ? parseInt(values.timeout, 10) : 10000;
  if (isNaN(timeoutMs) || timeoutMs <= 0) {
    process.stderr.write('Error: --timeout must be a positive number\n');
    process.exit(1);
  }

  const exportName = values.export || 'handler';
  const saveTo = values['save-to'];

  const workerCode = buildWorkerCode(code, exportName);

  const startTime = Date.now();
  let settled = false;

  let worker;
  try {
    worker = new Worker(workerCode, { eval: true, type: 'module' });
  } catch (err) {
    const executionTime = Date.now() - startTime;
    output({ success: false, error: err.message, stack: err.stack, executionTime });
    process.exit(1);
  }

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    worker.terminate();
    const executionTime = Date.now() - startTime;
    output({ success: false, error: 'Timeout exceeded (' + timeoutMs + 'ms)', timedOut: true, executionTime });
    process.exit(1);
  }, timeoutMs);

  worker.on('message', (msg) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const executionTime = Date.now() - startTime;
    const result = {
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

    if (saveTo && msg.success) {
      try {
        const savePath = resolve(saveTo);
        mkdirSync(dirname(savePath), { recursive: true });
        writeFileSync(savePath, code, 'utf-8');
        result.saved = savePath;
      } catch (err) {
        result.saveError = err.message;
      }
    }

    output(result);
    process.exit(msg.success ? 0 : 1);
  });

  worker.on('error', (err) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const executionTime = Date.now() - startTime;
    output({ success: false, error: err.message, stack: err.stack, executionTime });
    process.exit(1);
  });

  worker.on('exit', (exitCode) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const executionTime = Date.now() - startTime;
    output({ success: false, error: 'Worker exited unexpectedly (code ' + exitCode + ')', executionTime });
    process.exit(1);
  });

  worker.postMessage({ input });
}

main().catch((err) => {
  process.stderr.write('Fatal: ' + err.message + '\n');
  process.exit(1);
});
