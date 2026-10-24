"use strict";
// PreToolUse(Bash): block recursive shell grep with no exclusions. It crawls caches, node_modules,
// binary blobs and dumps huge output into context. The Grep tool (ripgrep) honours ignore files.
const { readInput, block } = require("./lib");

const input = readInput();
const cmd = (input.tool_input && input.tool_input.command) || "";

const recursiveGrep = /(^|[;&|]\s*|\s)(e?grep|fgrep)\s+(?:[^|;&]*\s)?(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b/;
const hasExclusion = /--exclude-dir|--include=|--exclude=/;

if (recursiveGrep.test(cmd) && !hasExclusion.test(cmd)) {
  block(
    "Blocked: recursive `grep -r` with no --exclude-dir. Use the Grep tool (ripgrep, honours .gitignore/.ignore) " +
      "or add -I --exclude-dir=<cache dirs> --include='*.ext'. Redirect large output to a file, then tail it."
  );
}
process.exit(0);
