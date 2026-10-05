# KFO Intelligent Course Engine — MVP Architecture

## Product principle
KFO measures learning, understanding, application and impact. Completion time or media consumption alone never proves competence.

## Course contract
Each course version declares:
- provider/brand and audience
- learning outcomes mapped to skills
- activities chosen for the skill, not a fixed slide sequence
- assessment policy and certificate policy
- evidence requirements and rubrics when applicable
- review/legal status and content version

## Activity types
content, quick_check, scenario, ordering, error_spotting, reflection, practical_task, file_evidence, simulation, assessment.
A course uses only the types that add learning value.

## Measurement
1. content_progress
2. knowledge_score
3. skill_score
4. evidence/rubric result
5. impact checkpoints

Pre/post assessment may share skill coverage but must not expose answer keys. Official scoring remains server-side.

## Evidence
Evidence may be text, structured answer, approved file type, external observation or manager/trainer evaluation. Evidence has review status and must never be treated as passed only because it was uploaded.

## Rubrics
Rubrics contain criteria, weights and observable levels. Formal outcomes must be deterministic or human-reviewed where AI confidence is insufficient.

## Adaptivity
Activity results can recommend remediation, another example, a prerequisite lesson or a harder activity. AI may generate feedback/recommendations, but AI alone cannot issue formal completion/certification.

## Impact
Organization learning may schedule 30/60/90-day checkpoints. Impact can include learner self-report, manager observation, repeat assessment and operational KPI references. Personal learning supports optional follow-up without employer visibility.

## Privacy boundary
Personal enrollment evidence/results are private to the learner/KFO. Employers can see only organization-context learning assigned through their organization, subject to role scope.

## Release
No Deploy Until MVP Gate.
