# Development workflow

Run `source /workspace/development-tools/activate.sh` before CLI commands.
Use the existing checkout at /workspace/V4ULT. Cloud tasks are isolated; do not create a worktree unless explicitly requested.

- Planning: read /workspace/development-tools/superpowers/skills/brainstorming/SKILL.md for design work and /workspace/development-tools/superpowers/skills/writing-plans/SKILL.md for implementation planning. Follow user direction and higher-priority harness rules.
- Code understanding: read .codex/skills/graphify/SKILL.md and use Graphify's local AST extraction and graph queries. Verify conclusions against source. No API key is needed for code-only mode.
- Responses: read .agents/skills/caveman/SKILL.md. Keep responses short, preserve technical facts, code, errors, and necessary explanations.
- Noisy command output: use `caveman shrink -- <command>`. It preserves exit status; compressed output is lossy, so recover full output with `caveman retrieve <handle>` when diagnosis requires it. Do not hide test failures or treat compression as proof of success.
- Project-local skills are installed. This managed chat does not guarantee native plugin menus or automatic hooks; use explicit file reads and CLI commands.

## graphify

This repository currently has no application code. Once source exists, build its graph with `graphify extract . --code-only`; graph output lives in graphify-out/.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
