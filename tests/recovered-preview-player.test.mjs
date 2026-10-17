import {mountDataSkillsLab} from '../learning/data-skills-labs.mjs';
import {mountPracticeFiles} from '../learning/practice-files.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {browserFixture,runController} from './helpers/browser-script.mjs';
import {runtimeState,recommendNext} from '../learning/activity-runtime.mjs';
import {renderActivity} from '../learning/activity-renderer.mjs';
import {renderOfficialAssessment} from '../learning/official-assessment-ui.mjs';
import {loadActivityRecords} from '../learning/evidence-session.mjs';
test('preview permits all activities but never invokes learner mutations or live asset fetch',async()=>{
 const ui=browserFixture();ui.location.search='?release=00000000-0000-4000-8000-000000000001';
 const course={slug:'draft',version:1,title:'مسودة',skills:[{code:'unsafe',title:'<img src=x onerror=alert(1)>'}],activities:[{key:'intro',type:'content',title:'<img onerror=alert(1)>',sequence:1,skillCodes:['unsafe','<svg onload=alert(1)>'],content:['درس'],required:true},{key:'final',type:'assessment',title:'تقييم',sequence:2,required:true}]};let writes=0;
 await runController('learning/intelligent-player.js',{...ui,loadEnrolledRelease:async()=>null,createClient:()=>({}),loadReleasePreview:async()=>({course,assessmentBank:{questions:[{id:'q1',prompt:'اختر',options:['أ','ب']}]},session:{kind:'preview'}}),fetch:async()=>{throw Error('live fetch')},resolveEnrollment:async()=>{throw Error('enrollment read')},runtimeState,recommendNext,renderActivity,mountPracticeFiles,mountDataSkillsLab,renderOfficialAssessment,summarizeSkills:()=>[],saveLessonCompletion:async()=>{writes++},submitOfficialAssessment:async()=>{writes++}},'main');
 assert.equal(ui.get('measurement').innerHTML,'');assert.equal(ui.get('measurement').children[0].textContent,'<img src=x onerror=alert(1)>');assert.equal(ui.get('measurement').children[0].innerHTML,'');assert.equal(ui.get('measurement').children[1].textContent,'<svg onload=alert(1)>');assert.equal(ui.get('primary-action').disabled,true);assert.equal(ui.get('activity-nav').children[0].children[1].textContent,'1. <img onerror=alert(1)>');assert.equal(ui.get('activity-nav').children[0].innerHTML,'');await ui.get('primary-action').fire('click');await ui.get('activity-nav').children[1].fire('click');assert.equal(ui.get('activity-nav').children[1]['aria-current'],'true');assert.equal(ui.get('measurement').children.length,0);assert.equal(writes,0);assert.equal(ui.get('progress-value').textContent,'0%');
});
test('legacy lesson progress cannot mask pending evidence',async()=>{
 const rows={course_activities:[{id:'a1',activity_key:'task',activity_type:'practical_task'}],enrollment_progress:[{lesson_id:'task',completed_at:'2026-10-14'}],learning_evidence:[{id:'ev1',activity_id:'a1',review_status:'pending'}]};const client={from(table){const data=rows[table];const c={select(){return c},eq(){return c},in(){return c},not:async()=>({data}),order:async()=>({data}),then(resolve,reject){return Promise.resolve({data}).then(resolve,reject)}};return c}};
 const result=await loadActivityRecords(client,{kind:'enrolled',enrollment:{id:'e1'},userId:'u1'},{slug:'course',version:1,activities:[{key:'task',type:'practical_task'}]});assert.equal(result[0].review_status,'pending');assert.equal(result[0].completed_at,undefined);
});
test('enrolled server bundle bypasses reference files and legacy enrollment resolver',async()=>{
 const ui=browserFixture();ui.location.search='?enrollment=11111111-1111-4111-8111-111111111111';
 const course={slug:'new-course',version:1,title:'دورة التسجيل الصحيح',skills:[],activities:[{key:'intro',type:'content',title:'مقدمة الدورة',sequence:1,required:true,content:['محتوى جديد'],skillCodes:[]}]};
 await runController('learning/intelligent-player.js',{...ui,createClient:()=>({}),loadEnrolledRelease:async()=>({course,assessmentBank:{questions:[]},session:{kind:'enrolled',userId:'u',enrollment:{id:'e'}}}),fetch:async()=>{throw Error('reference fallback forbidden')},resolveEnrollment:async()=>{throw Error('legacy resolver forbidden')},loadActivityRecords:async()=>[],attachMyReviewFeedback:async(c,s,rows)=>rows,loadSkillMeasurements:async()=>[],summarizeSkills:()=>[],runtimeState,recommendNext,renderActivity,mountPracticeFiles,mountDataSkillsLab},'main');
 assert.equal(ui.get('course-title').textContent,'دورة التسجيل الصحيح');assert.equal(ui.get('activity-nav').children[0].children[1].textContent,'1. مقدمة الدورة');
});
