"use strict";
// PostToolUse(Edit|Write|MultiEdit): remember the file's mtime right after our own edit,
// so read-guard can tell "nothing else touched it since" from "something changed it".
const fs = require("fs");
const { readInput, loadEdits, saveEdits, norm } = require("./lib");

const input = readInput();
const file = input.tool_input && input.tool_input.file_path;
if (file) {
  try {
    const edits = loadEdits(input.session_id);
    edits[norm(file)] = fs.statSync(file).mtimeMs;
    saveEdits(input.session_id, edits);
  } catch {
    /* ignore */
  }
}
process.exit(0);
