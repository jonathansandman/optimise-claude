# optimise-claude

One command that cuts Claude Code token spend in any project.

```
/optimise-claude
```

Run it from any project folder. It measures, fixes and reports, with no questions asked.

## Why

Cost = calls x context size. CLAUDE.md, MEMORY.md, plugin/skill listings and connector tool names are re-sent on **every call**, and cache reads on long sessions dominate the bill. This plugin attacks that.

## What `/optimise-claude` does

0. **Backs up** `~/.claude` settings, skills and memories, and asks once which features are deprecated.
1. **Measures** CLAUDE.md, rules, MEMORY.md, the global CLAUDE.md and every enabled plugin's skill listing (often the largest hidden cost, paid in every project), with byte counts.
2. **Splits CLAUDE.md** (target <= 5KB; global <= 2KB): architecture, conventions and subsystem sections move verbatim into `.claude/rules/*.md` with `paths:` frontmatter, so they load only when matching files are touched. Occasional procedures become skills.
3. **Shrinks MEMORY.md** (target <= 3KB) to cross-cutting rules. Area memory moves into path-scoped `.claude/rules/memory-<area>.md`, so it loads with the code it is about, and a contract line stops the index regrowing. Memories about deprecated features are deleted (backed up); every other memory file stays, and links are integrity-checked.
4. **Plugins, MCP and skills:** disables plugins unused anywhere at user level (their skills cost every project) and plugins irrelevant to this project at project level; blocks irrelevant project `.mcp.json` servers and lists user/plugin MCP servers to toggle off in `/mcp` for this project; hides unused skills, removes duplicate loose skill copies, disables claude.ai connectors. Never enables or forces auto-compact.
5. **User defaults:** `model: opusplan` (Opus plans, Sonnet executes) and `effortLevel: medium`.
6. **Commits** only what it touched, then **reports** before/after sizes for this project and for every project.

## Guard hooks (active as soon as the plugin is installed)

| Hook | Effect |
|---|---|
| Read guard | Blocks whole-file reads of files over 30KB. Use `offset`/`limit`. Override: `OPTIMISE_CLAUDE_MAX_READ_BYTES`. |
| Re-read guard | Blocks re-reading a file this session just edited when nothing else changed it. |
| Grep guard | Blocks `grep -r` with no `--exclude-dir`/`--include`. Use the Grep tool. |
| Size warning | At session start, warns if CLAUDE.md > 5KB, MEMORY.md > 3KB or `~/.claude/CLAUDE.md` > 2KB. |

Hooks need Node.js on PATH.

## Install

```
/plugin marketplace add jonathansandman/optimise-claude
/plugin install optimise-claude@optimise-claude
```

Restart the session. Then run `/optimise-claude:optimise-claude` (or just `/optimise-claude` if no other command shares the name).

Prefer a bare `/optimise-claude`? Copy `skills/optimise-claude/` to `~/.claude/skills/optimise-claude/`.

## Habits it reminds you of

- Choose model and effort at session start; switching mid-session invalidates the prompt cache.
- `/clear` between unrelated tasks. After > 1h idle on a big session, `/clear` and restate the task.
- Batch messages to peer sessions: one combined message per recipient.

## License

MIT
