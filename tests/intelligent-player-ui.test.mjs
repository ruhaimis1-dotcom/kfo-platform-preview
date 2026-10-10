import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import {browserFixture,runController} from './helpers/browser-script.mjs';
import {runtimeState,recommendNext} from '../learning/activity-runtime.mjs';
import {courseSource} from '../learning/course-source.mjs';
import {attachMyReviewFeedback} from '../learning/review-feedback.mjs';
import {renderActivity} from '../learning/activity-renderer.mjs';
const html=await readFile(new URL('../learning/player.html',import.meta.url),'utf8');const js=await readFile(new URL('../learning/intelligent-player.js',import.meta.url),'utf8');
async function playerFixture(submit,{kind='enrolled',type='reflection',records=[],feedback=[]}={}){
 const ui=browserFixture();
 const course={slug:'qa',version:1,title:'QA',skills:[],activities:[{key:'task',type,title:'Task',sequence:1,required:true},{key:'next',type:'content',title:'Next',sequence:2,required:true}]};
 const input=ui.get('activity').querySelector('[data-evidence]');
 input.type=type==='file_evidence'?'file':'textarea';input.value='response';input.files=[{name:'qa.pdf'}];
 await runController('learning/intelligent-player.js',{...ui,
  createClient:()=>({rpc:async()=>({data:feedback})}),fetch:async()=>({ok:true,json:async()=>course}),
  resolveEnrollment:async()=>({kind,userId:'u',enrollment:{id:'e'}}),
  loadActivityRecords:async()=>records,loadSkillMeasurements:async()=>[],summarizeSkills:()=>[],
  runtimeState,recommendNext,renderActivity,attachMyReviewFeedback,courseSource,submitEvidence:submit,uploadFileEvidence:submit,
  saveLessonCompletion:async()=>{throw new Error('evidence must not complete lesson')}
 },'main');
 return ui;
}
test('player exposes skill journey progress coach and focused activity stage',()=>{for(const id of ['skills','activity-nav','progress-value','activity','coach-title','measurement'])assert.match(html,new RegExp('id="'+id+'"'))});
test('player keeps remotely submitted text and file evidence pending and blocks next activity',async()=>{
 for(const type of ['reflection','file_evidence']){
  let calls=0;
  const ui=await playerFixture(async()=>{calls++;return{activity_key:'task',review_status:'pending',evidence_id:'ev'}},{type});
  await ui.get('primary-action').fire('click');
  assert.equal(calls,1);
  assert.equal(ui.get('activity-nav').children[0].dataset.state,'awaiting_review');
  assert.equal(ui.get('progress-value').textContent,'0%');
  assert.equal(ui.get('coach-title').textContent,'بانتظار المراجعة');
  await ui.get('activity-nav').children[1].fire('click');
  assert.equal(ui.get('activity-nav').children[0]['aria-current'],'true');
 }
});
test('player shows reviewer feedback as text while revision still blocks progress',async()=>{
 const ui=await playerFixture(async()=>{}, {records:[{activity_key:'task',evidence_id:'ev',review_status:'needs_revision'}],feedback:[{evidence_id:'ev',feedback:'<img onerror="alert(1)"> حدّد المسؤول'}]});
 assert.match(ui.get('coach-copy').textContent,/<img onerror=/);
 assert.equal(ui.get('coach-copy').innerHTML,'');
 assert.equal(ui.get('activity-nav').children[0].dataset.state,'needs_revision');
 assert.equal(ui.get('progress-value').textContent,'0%');
});
test('official assessment is unavailable to public untracked course',()=>{assert.match(js,/التقييم الرسمي متاح فقط من دورة مسجلة في حسابك/)});
test('player coach handles remediation review and completion states',()=>{for(const state of ['remediate','wait_review','complete'])assert.ok(js.includes(state))});
test('player reports submission errors without advancing or claiming persistence',async()=>{
 const ui=await playerFixture(async()=>{throw new Error('submission failed')});
 await ui.get('primary-action').fire('click');
 assert.equal(ui.get('activity-message').textContent,'submission failed');
 assert.equal(ui.get('activity-nav').children[0].dataset.state,'available');
 assert.equal(ui.get('primary-action').disabled,false);
 assert.equal(ui.get('progress-value').textContent,'0%');
});
test('player prevents duplicate concurrent submission and rejects public evidence persistence',async()=>{
 let resolve,calls=0;
 const ui=await playerFixture(()=>{calls++;return new Promise(r=>{resolve=r})});
 const first=ui.get('primary-action').fire('click');
 await ui.get('primary-action').fire('click');
 assert.equal(calls,1);
 assert.equal(ui.get('primary-action').disabled,true);
 resolve({activity_key:'task',review_status:'pending',evidence_id:'ev'});await first;
 assert.equal(ui.get('primary-action').disabled,false);
 const guest=await playerFixture(async()=>{throw new Error('public submission called')},{kind:'public'});
 await guest.get('primary-action').fire('click');
 assert.equal(guest.get('activity-message').textContent,'حفظ التطبيق يتطلب فتح الدورة من حسابك.');
 assert.equal(guest.get('progress-value').textContent,'0%');
});
