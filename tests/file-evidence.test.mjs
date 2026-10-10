import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEvidenceFile,uploadFileEvidence} from '../learning/file-evidence.mjs';
const session={kind:'enrolled',userId:'u',enrollment:{id:'en'}};
const course={slug:'course',version:1},activity={key:'file',type:'file_evidence'};
const file={name:'task.pdf',type:'application/pdf',size:25};
function mock(failAt){
 const calls=[];let c;
 const chain={select(){return chain},eq(){return chain},async maybeSingle(){return {data:{id:'a',activity_type:'file_evidence'}}}};
 const storage={async upload(path,body,options){calls.push(['upload',path,body,options]);return {error:failAt==='upload'?{}:null}},async remove(paths){calls.push(['remove',paths]);return {error:null}}};
 c={calls,from:()=>chain,storage:{from(bucket){assert.equal(bucket,'kfo-learning-evidence');return storage}},async rpc(name,args){calls.push([name,args]);return name==='prepare_my_evidence_upload'?{data:{bucket:'kfo-learning-evidence',object_path:failAt==='path'?'foreign/en/a/x.pdf':'u/en/a/x.pdf'}}:{data:failAt==='finalize'?null:{id:'evidence',review_status:'pending'},error:failAt==='finalize'?{}:null}}};
 return c;
}
test('file validation rejects empty, oversized and disallowed or mismatched types',()=>{
 for(const change of [{size:0},{size:10485761},{name:'a.exe'},{type:'text/html'}])assert.throws(()=>validateEvidenceFile({...file,...change}));
 assert.equal(validateEvidenceFile({...file,name:'task.CSV',type:''}).mime,'text/csv');
});
test('file flow uploads bytes before verified pending submission without overwrite',async()=>{
 const c=mock();const saved=await uploadFileEvidence(c,session,course,activity,file);
 assert.equal(saved.review_status,'pending');assert.deepEqual(c.calls.map(x=>x[0]),['prepare_my_evidence_upload','upload','finalize_verified_file_evidence']);
 assert.equal(c.calls[1][2],file);assert.equal(c.calls[1][3].upsert,false);
});
test('foreign server path fails before upload',async()=>{
 const c=mock('path');await assert.rejects(uploadFileEvidence(c,session,course,activity,file));assert.equal(c.calls.length,1);
});
test('failed upload cannot create evidence',async()=>{
 const c=mock('upload');await assert.rejects(uploadFileEvidence(c,session,course,activity,file));assert.equal(c.calls.length,2);
});
test('failed finalization attempts cleanup and never marks evidence passed',async()=>{
 const c=mock('finalize');await assert.rejects(uploadFileEvidence(c,session,course,activity,file));assert.equal(c.calls.at(-1)[0],'remove');
});
test('public sessions cannot upload',async()=>{await assert.rejects(uploadFileEvidence({}, {kind:'public'},course,activity,file));});
