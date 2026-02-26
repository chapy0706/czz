<!-- .claude/skills/codex-teacher-czz-mechanism/SKILL.md -->

# codex-teacher-czz-mechanism

Goal: Codex performs research -> evidence -> docs output for czz mechanism explanation.

## Inputs

- Spec or issue path
- Target doc path (default `docs/how-it-works/mechanism-overview.md`)

## Procedure

1. Read `docs/README.md` and `docs/czz_architecture.md` to align terms.
2. Use `rg` to locate evaluation, DSL, route handlers, and repository interfaces.
3. Open only the files needed to prove responsibilities and flow.
4. Summarize responsibilities as: entry, processing, exit.
5. Write or update the target doc with required sections and references.
6. Create or update skills under `.claude/skills/**` if requested by the issue.
7. Print the change list using `git diff --name-only`.

## Required Output Structure (for the doc)

- System overview: Top -> Task -> Evaluate -> Result
- Command flow: CommandBuilder -> serialize -> dsl-core -> testRunner
- Persistence flow: UseCase -> Repository interface -> Drizzle/PostgreSQL
- Clean Architecture dependency direction and rationale
- Next.js App Router dependencies (RSC, Client, route.ts)
- TypeScript boundary design (unknown -> Zod parse)
- At least one pitfall
- 5 to 15 reference paths

## Constraints

- Modify only `docs/**` and `.claude/skills/**`.
- Do not touch `.env`, keys, tokens, or secrets.
- Do not use network access.
- Do not run destructive commands.
