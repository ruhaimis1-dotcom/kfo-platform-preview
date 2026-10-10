import test from 'node:test';
import assert from 'node:assert/strict';
import {attachMyReviewFeedback} from '../learning/review-feedback.mjs';
const session={kind:'enrolled',enrollment:{id:'en1'}};
test('public and evidence-free sessions do not request private feedback',async()=>{
 const client={rpc:()=>{throw new Error('must not call')}};
 assert.deepEqual(await attachMyReviewFeedback(client,{kind:'public'},[{evidence_id:'e1'}]),[{evidence_id:'e1'}]);
 assert.deepEqual(await attachMyReviewFeedback(client,session,[]),[]);
});
test('feedback joins exact evidence identity without changing review outcome',async()=>{
 const records=[{activity_key:'a',evidence_id:'latest',review_status:'needs_revision'}];
 const result=await attachMyReviewFeedback({rpc:async(name,args)=>{assert.equal(name,'my_learning_review_feedback');assert.deepEqual(args,{p_enrollment_id:'en1'});return{data:[{evidence_id:'old',feedback:'stale'},{evidence_id:'latest',feedback:'حدّد الموعد'}]}}},session,records);
 assert.equal(result[0].review_feedback,'حدّد الموعد');assert.equal(result[0].review_status,'needs_revision');assert.equal(records[0].review_feedback,undefined);
});
test('feedback service failure is explicit',async()=>{
 await assert.rejects(attachMyReviewFeedback({rpc:async()=>({error:{}})},session,[{evidence_id:'e1'}]),/ملاحظات المراجع/);
});
