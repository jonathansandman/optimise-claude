"use strict";
// SessionStart: warn when the always-loaded files (CLAUDE.md, auto-memory MEMORY.md) are bloated.
// Their full text is re-sent on every single call.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { readInput } = require("./lib");

const CLAUDE_MD_MAX = 10 * 1024;
const MEMORY_MD_MAX = 12 * 1024;

const input = readInput();
const cwd = input.cwd || process.cwd();
const warnings = [];

function size(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return null;
  }
}

const claudeMd = path.join(cwd, "CLAUDE.md");
const cs = size(claudeMd);
if (cs !== null && cs > CLAUDE_MD_MAX) {
  warnings.push(
    `CLAUDE.md is ${(cs / 1024).toFixed(1)}KB (target <= 10KB). Move subsystem sections into .claude/rules/*.md with paths: frontmatter.`
  );
}

// Auto-memory dir name = absolute cwd with every non-alphanumeric char replaced by '-'.
const mangled = cwd.replace(/[^A-Za-z0-9]/g, "-");
const memoryMd = path.join(os.homedir(), ".claude", "projects", mangled, "memory", "MEMORY.md");
const ms = size(memoryMd);
if (ms !== null && ms > MEMORY_MD_MAX) {
  warnings.push(
    `MEMORY.md is ${(ms / 1024).toFixed(1)}KB (target <= 12KB). Make it a one-line-per-memory index.`
  );
}

if (warnings.length) {
  const text =
    "optimise-claude: always-loaded context is bloated and re-sent every call.\n- " +
    warnings.join("\n- ") +
    "\nTell the user they can run /optimise-claude to fix this.";
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: text } })
  );
}
process.exit(0);
