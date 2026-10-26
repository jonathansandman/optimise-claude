---
name: optimise-claude
description: Cut Claude Code token spend, end to end. Measures always-loaded context (CLAUDE.md, MEMORY.md, global file, plugin skill listings), moves area knowledge into path-scoped rules, shrinks MEMORY.md to cross-cutting rules, trims plugins/skills/connectors, and sets cost-saving user defaults. Use when the user says "optimise claude", "reduce token usage", "cut Claude costs", or runs /optimise-claude.
disable-model-invocation: true
---

# optimise-claude

Cost = calls x context size. Everything loaded at session start (CLAUDE.md files, MEMORY.md, every enabled plugin's skill listing, tool names) is re-sent on every call, and prompt-cache reads on long sessions dominate spend. The win is moving knowledge from "always loaded" to "loaded when relevant":

| Mechanism | Loads |
| - | - |
| CLAUDE.md, global `~/.claude/CLAUDE.md`, MEMORY.md (first 200 lines / 25KB) | every call |
| `.claude/rules/*.md` WITHOUT `paths:` | every call |
| `.claude/rules/*.md` WITH `paths:` | only when a matching file is read/written/edited |
| subdirectory `CLAUDE.md` | only once a file in that folder is touched |
| skill | name + description every call; body only when used |
| memory topic files | only when opened |

Do the whole job below. Ask the user ONE question up front (step 0); otherwise decide and report at the end.

Rules for yourself:
- Edit existing files with the Edit tool. Stage specific files only (never `git add .` / `-A`).
- Anything uncommitted that you did not change belongs to another session: don't touch it; tell the user.
- Do not run the project's test suite.
- Move content verbatim; never paraphrase a rule. Delete only what step 0 says is dead.
- Write verbose command output to a file, then tail/grep it.

## 0. Back up and ask
- Back up first (memory is not in git): `tar -czf ~/claude-config-backup-<date>.tar.gz .claude/settings.json .claude/CLAUDE.md .claude/skills .claude/projects/*/memory` from `~`.
- Ask once: "Which features, models or projects are deprecated or removed?" Memories, skills and CLAUDE.md sections about them are deleted, not moved.

## 1. Measure (report numbers before changing anything)
- `wc -c`: project `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md` (note which lack `paths:`), `~/.claude/CLAUDE.md`, the auto-memory `MEMORY.md` (`~/.claude/projects/<cwd with every non-alphanumeric char replaced by '-'>/memory/MEMORY.md`).
- **Plugin skill listings** (often the biggest hidden cost, and in EVERY project): for each enabled plugin, count its `SKILL.md` files and sum their frontmatter bytes. Also user skills in `~/.claude/skills/` and project `.claude/skills/`.
- Duplicates: a skill present both as a plugin skill and as a loose copy in `~/.claude/skills/` is listed twice and the copies drift. Keep the plugin's, remove the loose copy.
- Targets: project CLAUDE.md <= 5KB, MEMORY.md <= 3KB, global CLAUDE.md <= 2KB.

## 2. Split CLAUDE.md (project, then global)
- Keep in the core file only what every task needs: project context and priorities, environment constraints (OS, shell, path rules), git safety, the test/build commands and their rules, work-tracking conventions, commit format.
- Move to path-scoped rules, verbatim: language/framework architecture, logging and coding conventions, ADR/doc maps, per-subsystem sections. Example: a Python backend's layers, logging and checks → `.claude/rules/backend-dev.md` with `paths: ["src/**/*.py", "tests/**"]`.
  ```
  ---
  paths:
    - "src/foo/**"
  ---
  ```
  Patterns are relative to the folder containing `.claude`. Keep brace groups few (one shared expansion budget per rule). A rule only loads for sibling worktrees when the session runs in that worktree.
- Procedures used only sometimes (dispatch checklists, release steps) → a skill, not CLAUDE.md.
- Leave a one-line pointer in CLAUDE.md to the rules folder, not one per section.
- Add a short "Context discipline" section if absent: `/clear` between tasks; never re-read a file you just edited; read ranges, not whole files; verbose output to a file then tail/grep; prefer Edit over Write; batch peer-session messages.
- Global `~/.claude/CLAUDE.md` loads in every project: keep only cross-project token rules; move long checklists into user skills.

## 3. MEMORY.md: cross-cutting rules only
An index of every memory still inflates without bound (one line per memory, forever). Instead:
- **Area memory → path-scoped rules.** Group the index's area lines (one subsystem each) into `.claude/rules/memory-<area>.md` with `paths:` globs for that subsystem's files. Body: a one-line note on where the topic files live (`~/.claude/projects/<repo>/memory/<slug>.md`), then the `[[slug]]` lines with their trap hooks, verbatim.
- **MEMORY.md keeps only** rules that apply to every task (working style, orchestration, git/test discipline, reporting) plus a contract line: "Hard cap 3KB. New memory: write its topic file, then add its slug to the matching `memory-*.md` rule; add a line here only for a rule that applies to every task. Find anything else by Grep on this folder."
- Delete memories about features from step 0's dead list (backup exists).
- **Integrity check:** every topic file must be linked from MEMORY.md or a `memory-*.md` rule, and every `[[slug]]` must resolve to a file. Fix both lists to empty.

## 4. Plugins, skills, connectors
- Plugin skills cannot be hidden with `skillOverrides`, only by disabling the plugin. Two levels:
  - **User level** (`~/.claude/settings.json` `enabledPlugins`): plugins the user doesn't use in any project (they cost every project).
  - **Project level** (project `.claude/settings.json` `enabledPlugins`, which overrides user): plugins the user keeps for other projects but that are irrelevant here (e.g. a Rust LSP in a Python repo, a design kit in a backend-only repo). Set them `false` with a `"//enabledPlugins": "why"` note.
  - List each so it is easy to revert. A plugin whose hooks the user relies on (e.g. a response-style mode) stays even if its skills are unused.
- **MCP servers** (`claude mcp list` shows each server and its source). Tool search defers MCP tool schemas by default, but every server still costs its tool-name listing, its startup and its connection. For servers irrelevant to this project:
  - Project `.mcp.json` servers: add them to `disabledMcpjsonServers` in the project `.claude/settings.json`.
  - User-scope, plugin-provided and claude.ai connector servers: the per-project switch is the `/mcp` toggle (stored as `disabledMcpServers` in `~/.claude.json`). Do NOT edit `~/.claude.json` yourself while Claude Code runs (the running process owns and rewrites it). List these servers in the report for the user to toggle off in `/mcp`.
  - A server that failed to connect still costs a startup attempt: report it so the user can fix or disable it.
- `skillOverrides` (user or project settings): `off` for never-used skills, `name-only` for rare ones, `user-invocable-only` for slash-command-only skills.
- `"disableClaudeAiConnectors": true` when claude.ai connectors are unused.
- Never set `CLAUDE_CODE_AUTO_COMPACT_WINDOW` or force auto-compact. If a settings file has it, report it and leave it to the user.

## 5. User defaults in `~/.claude/settings.json` (merge; set only missing or weaker keys; never silently overwrite a deliberate choice)
- `"model": "opusplan"`; `"effortLevel": "medium"`. Leave hooks and permissions alone.
- This plugin's guard hooks: block whole-file reads over 30KB, block re-reading a just-edited file, block `grep -r` with no exclusions, and warn at session start when CLAUDE.md, MEMORY.md or the global CLAUDE.md exceed the step-1 targets.

## 6. Other projects
Global and plugin changes already help every project. List other repos with a large CLAUDE.md (`wc -c` on likely roots). Apply step 2 only to repos the user works in now, and skip any repo other sessions are actively editing (say so in the report).

## 7. Commit and verify
- Commit only the files you created or edited in this project: `chore: cut always-on context; move area detail to path-scoped rules`. Memory and `~/.claude` files are outside the repo.
- After a restart, `/context` shows the new always-loaded total. An `InstructionsLoaded` hook can log which rules load and why if a path-scoped rule seems not to fire.

## 8. Report
- Before/after bytes per always-loaded source and the total, in this project and for every project (global + plugins).
- Every plugin (user vs project level), skill, MCP server, connector and setting changed; files created; memories deleted; the backup path; anything left uncommitted and why.
- MCP servers for the user to toggle off in `/mcp` in this project (with the reason for each).
- Reminders: plugin/env/model changes need a restart. Switching model or effort mid-session invalidates the prompt cache. After more than 1 hour idle on a big session, `/clear` and restate the task.
