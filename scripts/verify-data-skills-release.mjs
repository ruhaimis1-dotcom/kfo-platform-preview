import {isDeepStrictEqual} from 'node:util';
// Read-only verification of server-returned preview bundles against the source drafts.
import fs from 'node:fs';
import {validateReleaseBundle,releaseReviewSummary} from '../learning/release-contract.mjs';
import {renderActivity} from '../learning/activity-renderer.mjs';
const bundles=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(!Array.isArray(bundles)||bundles.length!==2)throw Error('Expected two data-skills releases');
const seen=new Set();
for(const bundle of bundles){
 validateReleaseBundle(bundle);const kind=({'excel-basics':'excel','power-bi-basics':'powerbi'})[bundle.course_slug];if(!kind||seen.has(kind))throw Error('Unexpected release identity');seen.add(kind);
 const source=JSON.parse(fs.readFileSync(new URL(`../content/authoring/data-skills/${kind}-curriculum-draft.json`,import.meta.url),'utf8'));
 if(bundle.course_version!==1||bundle.metadata_revision!==1||bundle.lesson_revision!==1)throw Error('Source revision mismatch');
 const questions=source.activities.filter(a=>a.type==='scenario'),activities=source.activities.filter(a=>a.type!=='scenario');
 if(questions.length!==bundle.assessment.questions.length||activities.length+1!==bundle.runtime.activities.length)throw Error('Missing activity/question');
 if(!isDeepStrictEqual(source.learning_design.skills,bundle.runtime.skills))throw Error('Skill source mismatch');
 for(const a of activities){const actual=bundle.runtime.activities.find(x=>x.key===a.key);if(!actual||actual.type!==a.type||actual.title!==a.title||!isDeepStrictEqual(actual.skillCodes,source.learning_design.activitySkills[a.key]))throw Error('Activity source mismatch');if(a.type==='content'&&actual.content?.[0]!==a.body||a.type==='practical_task'&&actual.instructions!==a.prompt)throw Error('Lesson text mismatch');if(a.type==='practical_task'&&!isDeepStrictEqual(actual.rubric,source.learning_design.rubrics[a.key]))throw Error('Rubric mismatch')}
 for(const q of questions){const actual=bundle.assessment.questions.find(x=>x.id===q.key);if(!actual||actual.prompt!==q.prompt||!isDeepStrictEqual(actual.options,q.options))throw Error('Assessment source mismatch')}
 const summary=releaseReviewSummary(bundle);if(summary.tasksWithoutRubric.length||summary.activitiesWithoutSkills.length||summary.unusedSkills.length)throw Error('Incomplete release design');
 for(const activity of bundle.runtime.activities)renderActivity(activity);
 console.log(JSON.stringify({course:bundle.course_slug,releaseId:bundle.release_id,...summary}));
}
