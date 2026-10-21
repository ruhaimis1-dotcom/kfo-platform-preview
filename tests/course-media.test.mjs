import test from 'node:test';import assert from 'node:assert/strict';
import {validateMediaAsset,validateCourseMediaDraft,reorderMediaBlocks,validateCourseMediaFile,uploadCourseMedia,saveCourseMediaDraft,signedCourseMediaUrl} from '../admin/course-media.mjs';
const id='c64b64b2-554d-4b6d-8741-17a98d4b1e33',blockId='fc9e5b64-30e2-484a-b6d7-8cc48a986aac';
const asset={asset_id:id,course_slug:'excel',course_version:1,kind:'image',mime_type:'image/png',size_bytes:8,status:'ready',object_path:'excel/1/'+id};
const activities=[{key:'intro',type:'content'}];
const draft={schemaVersion:1,cover:{assetId:id,alt:'صورة شرح',fit:'contain',positionY:50},activities:{intro:[{id:blockId,type:'image',assetId:id,title:'شرح',alt:'صورة البيانات',transcript:''}]}};
const file=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});
function fixture(){
 const calls=[];let currentUser='user';
 const state={course_slug:'excel',course_version:1,revision:0,draft,assets:[asset]};
 const client={
  auth:{getUser:async()=>({data:{user:{id:currentUser}}})},
  rpc:async(name,args)=>{calls.push([name,args]);if(name==='admin_reserve_course_media')return{data:{...asset,bucket:'kfo-course-media'}};if(name==='admin_confirm_course_media')return{data:asset};if(name==='admin_save_course_media')return{data:{...state,revision:1}};throw Error(name)},
  storage:{from:bucket=>{
   calls.push(['bucket',bucket]);
   return {
    upload:async(path,bytes,options)=>{calls.push(['upload',path,options]);return{}},
    createSignedUrl:async path=>({data:{signedUrl:'https://ktkdcfxeaicbykdurlfg.supabase.co/storage/v1/object/sign/'+bucket+'/'+path+'?token=test'}})
   };
  }}
 };
 return{client,calls,state,setUser:id=>currentUser=id};
}

test('media draft validates scoped ready references and rejects unowned or unexpected fields',()=>{assert.equal(validateMediaAsset(asset,'excel',1),asset);assert.equal(validateCourseMediaDraft(draft,activities,[asset],'excel',1),draft);assert.throws(()=>validateMediaAsset(asset,'power-bi',1));assert.throws(()=>validateCourseMediaDraft(draft,activities,[],'excel',1));assert.throws(()=>validateCourseMediaDraft({...draft,url:'https://bad.test'},activities,[asset],'excel',1));assert.throws(()=>validateCourseMediaDraft({...draft,activities:{foreign:draft.activities.intro}},activities,[asset],'excel',1));assert.throws(()=>validateCourseMediaDraft({...draft,activities:{intro:[...draft.activities.intro,...draft.activities.intro]}},activities,[asset],'excel',1))});
test('file preflight rejects misleading MIME, excessive size and unsupported HTML',async()=>{await validateCourseMediaFile(file,'image');await assert.rejects(()=>validateCourseMediaFile(new Blob(['<html>'],{type:'image/png'}),'image'));await assert.rejects(()=>validateCourseMediaFile(new Blob(['x'],{type:'text/html'}),'image'));await assert.rejects(()=>validateCourseMediaFile({type:'video/mp4',size:51*1024*1024},'video'))});
test('reordering is immutable, respects bounds and rejects missing blocks',()=>{const a=[{id:'a'},{id:'b'}];assert.deepEqual(reorderMediaBlocks(a,'a',1),[a[1],a[0]]);assert.deepEqual(a,[{id:'a'},{id:'b'}]);assert.deepEqual(reorderMediaBlocks(a,'a',-1),a);assert.throws(()=>reorderMediaBlocks(a,'c',1))});
test('upload uses a server-reserved path with no upsert and confirms before returning',async()=>{const f=fixture();assert.equal(await uploadCourseMedia({client:f.client,slug:'excel',version:1,file,kind:'image'}),asset);assert.deepEqual(f.calls.find(c=>c[0]==='upload'),['upload',asset.object_path,{contentType:'image/png',upsert:false}]);assert.equal(f.calls.at(-1)[0],'admin_confirm_course_media')});
test('upload fails closed when reservation points outside course or identity changes',async()=>{const f=fixture();f.client.rpc=async()=>({data:{...asset,bucket:'tenant-private'}});await assert.rejects(()=>uploadCourseMedia({client:f.client,slug:'excel',version:1,file,kind:'image'}));assert.equal(f.calls.filter(c=>c[0]==='upload').length,0);const g=fixture(),original=g.client.rpc;g.client.rpc=async(...args)=>{const r=await original(...args);g.setUser('other');return r};await assert.rejects(()=>uploadCourseMedia({client:g.client,slug:'excel',version:1,file,kind:'image'}));assert.equal(g.calls.filter(c=>c[0]==='upload').length,0)});
test('save checks optimistic revision and persisted draft; rejects stale acknowledgements',async()=>{const f=fixture();const r=await saveCourseMediaDraft(f.client,f.state,activities);assert.equal(r.revision,1);assert.equal(f.calls[0][1].p_expected_revision,0);f.client.rpc=async()=>({data:f.state});await assert.rejects(()=>saveCourseMediaDraft(f.client,f.state,activities));f.client.rpc=async()=>({error:{code:'40001'}});await assert.rejects(()=>saveCourseMediaDraft(f.client,f.state,activities),/تغيرت/)});
test('signed URLs accept only the exact project and scoped object path',async()=>{const f=fixture();assert.match(await signedCourseMediaUrl(f.client,asset,'excel',1),/^https:\/\/ktkdcfxeaicbykdurlfg/);f.client.storage.from=()=>({createSignedUrl:async()=>({data:{signedUrl:'https://attacker.test/file'}})});await assert.rejects(()=>signedCourseMediaUrl(f.client,asset,'excel',1))});

test('media draft rejects mixed course assets and references in non-content activities',()=>{
 assert.throws(()=>validateCourseMediaDraft(draft,activities,[{...asset,course_slug:'foreign',object_path:'foreign/1/'+id}],'excel',1));
 assert.throws(()=>validateCourseMediaDraft(draft,[{key:'intro',type:'scenario'}],[asset],'excel',1));
});
test('upload detects course switching after storage acknowledgement without confirming or attaching',async()=>{
 const f=fixture();let current=true;f.client.storage.from=()=>({upload:async()=>{current=false;return{}}});
 await assert.rejects(()=>uploadCourseMedia({client:f.client,slug:'excel',version:1,file,kind:'image',isCurrent:()=>current}),/لم يربط/);
 assert.equal(f.calls.some(c=>c[0]==='admin_confirm_course_media'),false);
});
test('save rejects a changed persisted draft even with the expected revision',async()=>{
 const f=fixture();f.client.rpc=async()=>({data:{...f.state,revision:1,draft:{...draft,cover:null}}});
 await assert.rejects(()=>saveCourseMediaDraft(f.client,f.state,activities),/تأكيد/);
});
