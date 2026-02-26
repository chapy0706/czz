<!-- .claude/skills/teacher-czz-mechanism/SKILL.md -->

# teacher-czz-mechanism

Goal: Generate a teacher-style explanation of czz mechanisms with a fixed output order: what happens -> why -> where.

## Input

- Target doc path (default `docs/how-it-works/mechanism-overview.md`)
- Optional focus area (UI, API, DSL, persistence)

## Steps

1. Read `docs/README.md` and `docs/czz_architecture.md` for terminology.
2. Identify the relevant code paths with `rg` and open the minimal files that show entry, processing, and exit points.
3. Extract responsibilities and data flow without guessing.
4. Draft the explanation in the required output order.
5. List reference paths explicitly.

## Output Format

**What Happens**

Explain the flow in 3 to 6 short paragraphs. Use concrete nouns like Top, Task, Evaluate, Result.

**Why It Works**

Explain the reasoning behind the flow, including Clean Architecture direction and boundary validation.

**Where To Look**

Provide 5 to 15 file paths. Use paths only, no prose.

## Constraints

- Do not modify code.
- Do not reference `.env` or secrets.
- Do not use external network resources.
