# Data skills review snapshots — 2026-10-17

Actual database preparation, not deployment, activation or browser QA.

| Course | Review release | Learning activities (excluding assessment) | Questions | Skills | Practical tasks |
|---|---|---:|---:|---:|---:|
| excel-basics v1 | 9258a28c-c395-433d-8b30-c249e50cb4b7 | 16 | 8 | 8 | 1 |
| power-bi-basics v1 | a89992df-c64e-445b-b72e-48ab92ad4a84 | 17 | 8 | 8 | 1 |

Both use metadata revision1 and lesson revision1. Eight source scenarios become the assessment bank; runtime learning activities contain the other source activities plus one final assessment. This explains the difference from authoring counts24/25.

Verification performed:
- Existing SA-only preparation RPC generated persistent review snapshots. No course content edit or schema change.
- Server-returned bundles passed native runtime/release contract and safe activity rendering.
- scripts/verify-data-skills-release.mjs compared actual server-returned text, titles, options, skill mappings and project rubrics against source curriculum JSON. Deep comparison ignores JSON object property ordering, preserves array order.
- No answer keys in preview bundles; no tasks missing rubrics, activities missing skills or unused skills.
- Practice file allowlist matches Excel workbook / three PowerBI CSVs. Actual browser download remains untested.
- Rolled-back SQL role tests: SA reads both, learner denied both, anonymous denied preview API.
- Independent final query: one prepared release per course, published=false, runtime_ready=false, source revisions unchanged.

Remaining gates: browser/mobile latest source, learner runtime activation integration, official learning/evidence/completion chain, real Excel and PowerBI execution, instructional review and human publishing approval. The old QA deployment does not include the new frontend and must not be represented as visual proof.
