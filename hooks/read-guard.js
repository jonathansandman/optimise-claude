"use strict";
// PreToolUse(Read):
//  1. Block whole-file reads of large text files (read a range instead).
//  2. Block re-reading a file this session just edited, when nothing else has changed it.
const fs = require("fs");
const path = require("path");
const { readInput, loadEdits, norm, block } = require("./lib");

const MAX_BYTES = Number(process.env.OPTIMISE_CLAUDE_MAX_READ_BYTES || 30000);
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".pdf", ".ipynb",
]);

const input = readInput();
const ti = input.tool_input || {};
const file = ti.file_path;
if (!file) process.exit(0);

let stat;
try {
  stat = fs.statSync(file);
} catch {
  process.exit(0);
}
if (!stat.isFile()) process.exit(0);
if (SKIP_EXT.has(path.extname(file).toLowerCase())) process.exit(0);

const ranged = ti.offset !== undefined || ti.limit !== undefined;

if (!ranged) {
  const edits = loadEdits(input.session_id);
  const recorded = edits[norm(file)];
  if (recorded !== undefined && Math.abs(recorded - stat.mtimeMs) < 1) {
    block(
      `Blocked: ${file} was edited earlier this session and nothing has changed it since. ` +
        `Edit/Write fail loudly, so a re-read confirms nothing. Verify with a type-check or test instead.`
    );
  }
}

if (!ranged && stat.size > MAX_BYTES) {
  block(
    `Blocked: ${file} is ${Math.round(stat.size / 1024)}KB. Every token read is re-sent on every later call. ` +
      `Grep for the symbol first, then Read with offset/limit.`
  );
}
process.exit(0);
