---
name: optimise-claude
description: Cut Claude Code token spend in the current project, end to end. Measures always-loaded context, splits a bloated CLAUDE.md into path-scoped rules, turns MEMORY.md into an index, trims plugins/skills/connectors, sets a compact window, and sets cost-saving user defaults (opusplan, medium effort). Use when the user says "optimise claude", "reduce token usage", "cut Claude costs", or runs /optimise-claude.
disable-model-invocation: true
---

# optimise-claude

Cost = calls x context size. The fixed prefix (CLAUDE.md, MEMORY.md, skill/plugin listings, tool names) is re-sent on every call, and prompt-cache reads on long sessions dominate spend. Do the whole job below without asking questions; report at the end.

Rules for yourself while doing it:
- Edit existing files with the Edit tool. Stage specific files only (never `git add .` / `-A`).
- Anything uncommitted that you did not change belongs to another session: do not touch, stage or commit it, and tell the user.
- Do not run the project's test suite.
- Never delete content: move it. Move rules verbatim, do not paraphrase.
- Write verbose command output to a file, then tail/grep it.

## 1. Measure (report numbers before changing anything)
- `wc -c` on: `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md`, `.claude/settings.json`, `~/.claude/CLAUDE.md`, and the auto-memory `MEMORY.md`. Memory path: `~/.claude/projects/<cwd with every non-alphanumeric char replaced by '-'>/memory/MEMORY.md`.
- List enabled plugins (`~/.claude/settings.json` and the project's `.claude/settings.json`), plus the skills, agents and MCP servers visible this session. Note the ones this project never uses.
- Targets: project CLAUDE.md <= 10KB, MEMORY.md <= 12KB.

## 2. Split CLAUDE.md
- Keep in the core file: project context and priorities, environment constraints (OS, shell, path rules), git-safety rules, test/build commands, architecture overview, doc map, commit conventions.
- Move each domain-specific section (one subsystem, framework or workflow) verbatim into `.claude/rules/<topic>.md`:
  ```
  ---
  paths:
    - "src/foo/**"
  ---
  ```
  Rules with `paths:` load only when a matching file is read. Pick globs tight enough to matter.
- Leave a 1-2 line pointer in CLAUDE.md for each moved section.
- Remove references to plugins/agents you disable in step 4.
- Add a short "Context discipline" section if absent: one task per session and `/clear` between tasks; never re-read a file you just edited; read ranges (`offset`/`limit`), not whole files; send verbose output to a file then tail/grep it; prefer Edit over Write on existing files; batch messages to peer sessions (one combined message per recipient).
- Skip this step if CLAUDE.md is already <= 10KB.

## 3. Trim MEMORY.md
- It loads in full every call. Make it an index: one line per memory, bare `[[slug]]` wikilinks, a short hook only where it changes behaviour before the file is opened (traps/warnings). No status words, hashes or content.
- Never delete the underlying memory files.
- Skip if already <= 12KB.

## 4. Project `.claude/settings.json` (create if missing; merge, never clobber permissions or hooks)
- `"env": {"CLAUDE_CODE_AUTO_COMPACT_WINDOW": "120000"}`: caps context. Note it locks `/autocompact`.
- `"disableClaudeAiConnectors": true` when claude.ai connectors (Slack, Asana, Figma, etc.) are unused here. They add deferred tool names to every session.
- `enabledPlugins`: set plugins this project never uses to `false` (project overrides user). Plugin skills cannot be hidden with `skillOverrides`, only by disabling the plugin. Be conservative: only disable what you saw no use of; list each in the report so it is easy to revert.
- `skillOverrides`: `off` for skills never used here, `name-only` for rarely used, `user-invocable-only` for slash-command-only skills.
- Add a `"//key": "why"` comment beside each block.
- If the file already has uncommitted hunks you did not make, edit it but do not commit it, and say so.

## 5. User defaults in `~/.claude/settings.json` (merge; set only keys that are missing or weaker, never overwrite a deliberate choice without saying so)
- `"model": "opusplan"`: Opus plans, Sonnet executes.
- `"effortLevel": "medium"`: raise per task only for hard problems.
- Leave existing hooks, plugins and permissions alone.
- This plugin ships guard hooks (installed via the plugin itself, nothing to copy): blocks whole-file reads of files over 30KB, blocks re-reading a file just edited, blocks `grep -r` with no exclusions, and warns at session start when CLAUDE.md or MEMORY.md is oversized.

## 6. Commit
Commit only the files you created or edited in this project, as `chore: slim CLAUDE.md, move path-scoped rules to .claude/rules`. Skip the commit if the project is not a git repo. Memory and `~/.claude` files are outside the repo and are not committed.

## 7. Report
- Before/after bytes for CLAUDE.md, MEMORY.md and total always-loaded context.
- Every plugin, skill and connector disabled; every file created; every user-level setting changed.
- Anything left uncommitted and why.
- Reminders: plugin/env/model changes need a session restart. Switching model or effort mid-session invalidates the prompt cache, so choose at session start. After more than 1 hour idle on a big session, `/clear` and restate the task (the cache expired). `/model opusplan` is worth it only for tasks big enough to need a plan.
