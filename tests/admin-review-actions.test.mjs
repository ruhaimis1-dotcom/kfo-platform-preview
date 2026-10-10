import test from 'node:test';
import assert from 'node:assert/strict';
import {loadReviewDetail,submitReview,downloadReviewFile} from '../admin/review-data.mjs';
import {mountReviewQueue} from '../admin/review-ui.mjs';
import {browserFixture} from './helpers/browser-script.mjs';
const detail={evidence_id:'e1',submitted_at:'2026-10-10T12:00:00Z',activity_title:'مهمة عملية',evidence_type:'text',payload:{text:'<script>test</script>'},rubrics:[{id:'r1',title:'المعيار',criteria:[{title:'وضوح الوقائع',weight:100}]}]};

test('review detail rejects errors and mismatched evidence identity',async()=>{
 for(const response of [{error:{}},{data:{...detail,evidence_id:'foreign'}},{data:{...detail,rubrics:null}}])await assert.rejects(loadReviewDetail({rpc:async()=>response},'e1'));
 assert.deepEqual(await loadReviewDetail({rpc:async()=>({data:detail})},'e1'),detail);
});

test('invalid grades, decisions, feedback and foreign rubrics never submit',async()=>{
 let calls=0;const client={rpc:async()=>{calls++;return{}}};
 for(const input of [{status:'pending',score:80},{status:'passed',score:''},{status:'passed',score:Infinity},{status:'passed',score:101},{status:'failed',score:20},{status:'needs_revision',score:50,feedback:'  '},{status:'passed',score:80,rubricId:'foreign'},{status:'passed',score:80,feedback:'x'.repeat(4001)}])await assert.rejects(submitReview(client,detail,input));
 assert.equal(calls,0);
});

test('review sends immutable evidence reference, no claimed reviewer identity, and requires server confirmation',async()=>{
 let received;const input={status:'needs_revision',score:'55.5',feedback:'  حدّد المسؤول  ',rubricId:'r1'};
 const client={rpc:async(name,args)=>{received={name,args};return{data:{id:'e1',review_status:'needs_revision'}}}};
 await submitReview(client,detail,input);
 assert.equal(received.name,'admin_submit_evidence_review');
 assert.deepEqual(received.args,{p_evidence_id:'e1',p_expected_submitted_at:detail.submitted_at,p_rubric_id:'r1',p_score:55.5,p_feedback:'حدّد المسؤول',p_status:'needs_revision'});
 for(const response of [{error:{}},{data:null},{data:{id:'foreign',review_status:'needs_revision'}},{data:{id:'e1',review_status:'pending'}}])await assert.rejects(submitReview({rpc:async()=>response},detail,input));
});

test('private file access uses authenticated download and refuses absent or ambiguous metadata',async()=>{
 let downloaded;
 const client={rpc:async()=>({data:[{object_path:'owned/path.pdf',original_name:'../test.pdf'}]}),storage:{from:bucket=>{assert.equal(bucket,'kfo-learning-evidence');return{download:async path=>{downloaded=path;return{data:{bytes:1}}}}}}};
 const result=await downloadReviewFile(client,'e1');assert.equal(downloaded,'owned/path.pdf');assert.equal(result.name,'.._test.pdf');
 for(const rows of [[],[{},{}],[{}]])await assert.rejects(downloadReviewFile({...client,rpc:async()=>({data:rows})},'e1'));
 await assert.rejects(downloadReviewFile({...client,storage:{from:()=>({download:async()=>({error:{}})})}},'e1'));
});

function uiFixture(rpc,reload=async()=>{}){
 const ui=browserFixture(),tbody=ui.get('tbody'),detailHost=ui.get('detail');
 mountReviewQueue({document:ui.document,client:{rpc},tbody,detailHost,rows:[{evidence_id:'e1',display_name:'متدرب',course_slug:'دورة',activity_key:'مهمة'}],reload,download:async()=>{}});
 return{...ui,tbody,detailHost,open:tbody.children[0].children[4].children[0]};
}
async function openForm(ui){await ui.open.fire('click');return ui.detailHost.children.find(n=>n.children.some(c=>c.children?.some(i=>i.type==='number')))}
function fillForm(form){const labels=form.children.filter(n=>n.children.length===1);labels[0].children[0].value='r1';labels[1].children[0].value='passed';labels[2].children[0].value='90';labels[3].children[0].value='جيد'}

test('review UI renders payload as text and only refreshes after a confirmed save',async()=>{
 let refreshes=0,finish;const gate=new Promise(resolve=>finish=resolve);let writes=0;
 const ui=uiFixture(async(name)=>{if(name==='admin_learning_evidence_detail')return{data:detail};writes++;await gate;return{data:{id:'e1',review_status:'passed'}}},async()=>{refreshes++});
 const form=await openForm(ui);assert.equal(ui.detailHost.children[2].textContent,detail.payload.text);assert.equal(ui.detailHost.children[2].innerHTML,'');fillForm(form);
 const first=form.fire('submit',{preventDefault(){}});await form.fire('submit',{preventDefault(){}});
 assert.equal(writes,1);assert.equal(refreshes,0);assert.equal(form.children.at(-1).disabled,true);
 finish();await first;assert.equal(refreshes,1);
});

test('review UI retains form and answer on failed save without claiming success',async()=>{
 let refreshes=0;const ui=uiFixture(async name=>name==='admin_learning_evidence_detail'?{data:detail}:{error:{}},async()=>refreshes++);
 const form=await openForm(ui);fillForm(form);await form.fire('submit',{preventDefault(){}});
 assert.equal(refreshes,0);assert.equal(form.children.at(-1).disabled,false);
 assert.match(ui.detailHost.children.at(-1).textContent,/لم يتم تأكيد حفظ القرار/);
 assert.equal(ui.detailHost.children[2].textContent,detail.payload.text);
});

test('empty review queue shows an explicit state',()=>{
 const ui=browserFixture(),tbody=ui.get('tbody');mountReviewQueue({document:ui.document,tbody,detailHost:ui.get('detail'),rows:[]});
 assert.equal(tbody.children[0].children[0].textContent,'لا توجد مهام بانتظار المراجعة.');
});
