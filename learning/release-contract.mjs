import {validateRuntimeCourse} from './activity-runtime.mjs';
import {validateLearningDesign} from '../admin/learning-design.mjs';
export const hasReleaseAnswers=v=>!!v&&typeof v==='object'&&Object.entries(v).some(([key,item])=>['correctIndex','correct_answers','assessment_key'].includes(key)||hasReleaseAnswers(item));
const id=v=>typeof v==='string'&&v.length<=80&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const text=(v,max)=>typeof v==='string'&&!!v.trim()&&[...v].length<=max;
const sameCodes=(a,b)=>Array.isArray(a)&&a.length===new Set(a).size&&a.length===b.size&&a.every(c=>b.has(c));
export function validateReleaseBundle(data,expected={}){
 const fail=()=>{throw Error('تعذر التحقق من محتوى حزمة المراجعة وهويتها.');};
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data?.release_id||'')||data.status!=='prepared_for_review'||!id(data.course_slug)||!Number.isInteger(data.course_version)||data.course_version<1||!Number.isInteger(data.metadata_revision)||data.metadata_revision<1||!Number.isInteger(data.lesson_revision)||data.lesson_revision<1||Object.entries(expected).some(([key,value])=>data[key]!==value)||hasReleaseAnswers(data))fail();
 const c=data.runtime,b=data.assessment;
 if(c?.slug!==data.course_slug||c.version!==data.course_version||b?.courseSlug!==data.course_slug||b.courseVersion!==data.course_version||!text(c.title,160)||c.passPercent!==75||b.passPercent!==75||c.certificatePolicy!=='assessment_and_evidence'||!Array.isArray(c.skills)||!Array.isArray(b.questions)||b.questions.length<1||b.questions.length>60)fail();
 const runtime=validateRuntimeCourse(c),all=runtime.activities;
 if(all.length>61||all.filter(a=>a.type==='assessment').length!==1||all.at(-1).type!=='assessment'||all.at(-1).key!=='__final-assessment'||new Set(all.map(a=>a.sequence)).size!==all.length||!all.some(a=>a.type==='content'))fail();
 const design={skills:c.skills,activitySkills:{},rubrics:{}},refs=[],keys=new Set();
 for(const a of all){if(!text(a.title,160)||a.required!==true||!Array.isArray(a.skillCodes))fail();if(a.type==='assessment')continue;if(!id(a.key)||!['content','reflection','practical_task'].includes(a.type))fail();if(a.type==='content'&&(!Array.isArray(a.content)||a.content.length!==1||!text(a.content[0],12000))||a.type==='reflection'&&!text(a.prompt,4000)||a.type==='practical_task'&&!text(a.instructions,4000))fail();keys.add(a.key);refs.push(a);Object.defineProperty(design.activitySkills,a.key,{value:a.skillCodes,enumerable:true});if(a.rubric!==undefined)Object.defineProperty(design.rubrics,a.key,{value:a.rubric,enumerable:true});}
 const assessmentSkills=new Set();
 for(const q of b.questions){if(!id(q?.id)||keys.has(q.id)||!text(q.prompt,4000)||!Array.isArray(q.options)||q.options.length<2||q.options.length>6||q.options.some(o=>!text(o,500))||q.skillCodes!==undefined&&!Array.isArray(q.skillCodes))fail();keys.add(q.id);refs.push({key:q.id,type:'scenario'});const codes=q.skillCodes||[];Object.defineProperty(design.activitySkills,q.id,{value:codes,enumerable:true});codes.forEach(code=>assessmentSkills.add(code));}
 validateLearningDesign(design,refs);
 if(!sameCodes(all.at(-1).skillCodes,assessmentSkills))fail();
 return data;
}
export function releaseReviewSummary(data){validateReleaseBundle(data);const activities=data.runtime.activities.filter(a=>a.type!=='assessment'),tasks=activities.filter(a=>a.type==='practical_task'),used=new Set([...activities.flatMap(a=>a.skillCodes),...data.assessment.questions.flatMap(q=>q.skillCodes||[])]);return{activities:activities.length,questions:data.assessment.questions.length,skills:data.runtime.skills.length,tasks:tasks.length,tasksWithoutRubric:tasks.filter(a=>!a.rubric).map(a=>a.title),activitiesWithoutSkills:activities.filter(a=>!a.skillCodes.length).map(a=>a.title),unusedSkills:data.runtime.skills.filter(s=>!used.has(s.code)).map(s=>s.title)}}
