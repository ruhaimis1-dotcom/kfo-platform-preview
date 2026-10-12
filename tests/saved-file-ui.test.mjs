import test from 'node:test';
import assert from 'node:assert/strict';
import {mountSavedEvidenceFile} from '../admin/saved-file-ui.mjs';
import {browserFixture} from './helpers/browser-script.mjs';
const evidenceId='f8c74eef-21e9-42b1-8f32-449b4703421a';
function fixture({rows,error,downloadError,blob=new Blob(['<script>example</script>'],{type:'text/csv'})}={}){
 const ui=browserFixture(),calls=[];
 const client={rpc:async(name,args)=>{calls.push({name,args});return {data:rows??[{object_path:'private/path.csv',original_name:'example.csv'}],error}},storage:{from:bucket=>{assert.equal(bucket,'kfo-learning-evidence');return{download:async path=>{calls.push({path});return {data:blob,error:downloadError}}}}}};
 return {...ui,client,calls,host:ui.get('saved-file')};
}
test('saved attachment loads through existing scoped read and Storage, renders text safely, and never writes a review',async()=>{
 const ui=fixture();let downloads=0;
 await mountSavedEvidenceFile({...ui,evidenceId,download:async()=>downloads++});
 assert.equal(ui.calls[0].name,'learning_evidence_file');assert.deepEqual(ui.calls[0].args,{p_evidence_id:evidenceId});
 assert.equal(ui.calls[1].path,'private/path.csv');
 const preview=ui.host.children.at(-1);assert.equal(preview.textContent,'<script>example</script>');assert.equal(preview.innerHTML,'');
 const button=ui.host.children[3];await button.fire('click');assert.equal(downloads,1);
 assert.equal(ui.calls.filter(c=>c.name).length,1);
});
test('invalid file links make no API request',async()=>{
 const ui=fixture();await mountSavedEvidenceFile({...ui,evidenceId:'bad',download:async()=>{}});
 assert.equal(ui.calls.length,0);assert.match(ui.host.children[0].textContent,/غير صالح/);
});
test('denied metadata or byte downloads do not reveal file names or render previews',async()=>{
 for(const input of [{rows:[]},{error:{}},{downloadError:{}}]){
  const ui=fixture(input);await mountSavedEvidenceFile({...ui,evidenceId,download:async()=>{}});
  assert.equal(ui.host.children.length,1);assert.match(ui.host.children[0].textContent,/غير متاح/);
 }
});
test('download guard prevents concurrent clicks and permits retry after failure',async()=>{
 const ui=fixture({blob:new Blob(['x'.repeat(65537)])});let calls=0,release;
 await mountSavedEvidenceFile({...ui,evidenceId,download:async()=>{calls++;await new Promise(r=>release=r);throw new Error('failure')}});
 assert.equal(ui.host.children.length,5);const button=ui.host.children[3];
 const first=button.fire('click');await button.fire('click');assert.equal(calls,1);
 release();await first;assert.equal(button.disabled,false);assert.match(ui.host.children[4].textContent,/تعذر/);
});
