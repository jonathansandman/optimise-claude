"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

// Per-session record of files this session just edited: { absPath: mtimeMs }.
function editStatePath(sessionId) {
  const safe = String(sessionId || "nosession").replace(/[^A-Za-z0-9_-]/g, "_");
  return path.join(os.tmpdir(), `optimise-claude-edits-${safe}.json`);
}

function loadEdits(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(editStatePath(sessionId), "utf8"));
  } catch {
    return {};
  }
}

function saveEdits(sessionId, edits) {
  try {
    fs.writeFileSync(editStatePath(sessionId), JSON.stringify(edits));
  } catch {
    /* best effort */
  }
}

function norm(p) {
  return path.resolve(String(p || "")).replace(/\\/g, "/").toLowerCase();
}

// Block the tool call: exit 2, stderr is shown to the model.
function block(msg) {
  process.stderr.write(msg + "\n");
  process.exit(2);
}

module.exports = { readInput, loadEdits, saveEdits, norm, block };
