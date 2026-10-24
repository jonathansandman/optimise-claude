# optimise-claude

One command that cuts Claude Code token spend in any project.

```
/optimise-claude
```

Run it from any project folder. It measures, fixes and reports, with no questions asked.

## Why

Cost = calls x context size. CLAUDE.md, MEMORY.md, plugin/skill listings and connector tool names are re-sent on **every call**, and cache reads on long sessions dominate the bill. This plugin attacks that.

## What `/optimise-claude` does

1. **Measures** CLAUDE.md, rules, MEMORY.md, plugins, skills and MCP servers, with byte counts.
2. **Splits CLAUDE.md** (target <= 10KB): domain sections move verbatim into `.claude/rules/*.md` with `paths:` frontmatter, so they load only when matching files are read.
3. **Trims MEMORY.md** (target <= 12KB) into a one-line-per-memory index. Memory files are never deleted.
4. **Project settings:** `CLAUDE_CODE_AUTO_COMPACT_WINDOW=120000`, disables claude.ai connectors, unused plugins and skills.
5. **User defaults:** `model: opusplan` (Opus plans, Sonnet executes) and `effortLevel: medium`.
6. **Commits** only what it touched, then **reports** before/after sizes.

## Guard hooks (active as soon as the plugin is installed)

| Hook | Effect |
|---|---|
| Read guard | Blocks whole-file reads of files over 30KB. Use `offset`/`limit`. Override: `OPTIMISE_CLAUDE_MAX_READ_BYTES`. |
| Re-read guard | Blocks re-reading a file this session just edited when nothing else changed it. |
| Grep guard | Blocks `grep -r` with no `--exclude-dir`/`--include`. Use the Grep tool. |
| Size warning | At session start, warns if CLAUDE.md > 10KB or MEMORY.md > 12KB. |

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
