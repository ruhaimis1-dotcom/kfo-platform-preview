// Course media protocol. Kept separate from the live editor until server gates exist.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const COURSE_MEDIA_BUCKET='kfo-course-media';
const origin='https://ktkdcfxeaicbykdurlfg.supabase.co';
const MIME={image:new Set(['image/jpeg','image/png','image/webp']),video:new Set(['video/mp4']),audio:new Set(['audio/mpeg','audio/ogg','audio/wav'])};
const maxBytes=kind=>(kind==='image'?5:50)*1024*1024;
const fail=message=>{throw Error(message)};
function scope(slug,version){if(typeof slug!=='string'||slug.length>80||!SLUG.test(slug)||!Number.isInteger(version)||version<1||version>100000)fail('تعذر التحقق من هوية الدورة.');}
function plain(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
function only(value,keys){return plain(value)&&Object.keys(value).every(key=>keys.includes(key));}
function text(value,max,required=false){return typeof value==='string'&&[...value].length<=max&&(!required||!!value.trim())&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);}
export function validateMediaAsset(asset,slug,version){
 scope(slug,version);
 if(!asset||asset.course_slug!==slug||asset.course_version!==version||!UUID.test(asset.asset_id)||!Object.hasOwn(MIME,asset.kind)||!MIME[asset.kind].has(asset.mime_type)||!Number.isInteger(asset.size_bytes)||asset.size_bytes<1||asset.size_bytes>maxBytes(asset.kind)||asset.status!=='ready'||typeof asset.object_path!=='string'||asset.object_path!==slug+'/'+version+'/'+asset.asset_id)fail('تعذر التحقق من ملف الدورة.');
 return asset;
}
export function validateCourseMediaDraft(draft,activities,assets,slug,version){
 scope(slug,version);
 if(!Array.isArray(assets))fail('قائمة ملفات الدورة غير صالحة.');
 if(!only(draft,['schemaVersion','cover','activities'])||draft.schemaVersion!==1||!plain(draft.activities)||!Array.isArray(activities)||Object.keys(draft.activities).length>60)fail('مسودة الوسائط غير صالحة.');
 const allowed=new Set(activities.filter(a=>a.type==='content').map(a=>a.key)),seen=new Set(),assetsById=new Map();
 for(const asset of assets){validateMediaAsset(asset,slug,version);if(assetsById.has(asset.asset_id))fail('ملف مكرر.');assetsById.set(asset.asset_id,asset)}
 const assetFor=(id,kind)=>{const a=assetsById.get(id);if(!UUID.test(id)||!a||a.status!=='ready'||kind&&a.kind!==kind)fail('الملف غير جاهز أو لا يطابق نوع المحتوى.');return a};
 if(draft.cover!==null){const c=draft.cover;if(!only(c,['assetId','alt','fit','positionY'])||!text(c.alt,300,true)||!['cover','contain'].includes(c.fit)||!Number.isInteger(c.positionY)||c.positionY<0||c.positionY>100)fail('تحقق من بيانات الغلاف ووصفه.');assetFor(c.assetId,'image')}
 let total=0;
 for(const [key,blocks] of Object.entries(draft.activities)){
  if(!allowed.has(key)||!Array.isArray(blocks)||blocks.length>30)fail('الوسائط مرتبطة بدرس غير صالح.');
  for(const block of blocks){
   total++;if(!plain(block)||!UUID.test(block.id)||seen.has(block.id)||!['text','image','video','audio'].includes(block.type))fail('عناصر محتوى غير صالحة أو مكررة.');seen.add(block.id);
   if(block.type==='text'){if(!only(block,['id','type','text'])||!text(block.text,12000,true))fail('نص عنصر المحتوى مطلوب.');continue}
   if(!only(block,['id','type','assetId','title','alt','transcript'])||!text(block.title,160)||!text(block.alt,300,block.type==='image')||!text(block.transcript,20000))fail('تحقق من وصف الوسائط والنص المصاحب.');assetFor(block.assetId,block.type);
  }
 }
 if(total>120||new TextEncoder().encode(JSON.stringify(draft)).length>350000)fail('حجم محتوى الوسائط يتجاوز الحد المسموح.');return draft;
}
export function reorderMediaBlocks(blocks,id,delta){
 if(!Array.isArray(blocks)||![-1,1].includes(delta))fail('خيار ترتيب غير صالح.');const index=blocks.findIndex(b=>b.id===id);if(index<0)fail('عنصر المحتوى غير موجود.');const copy=[...blocks],next=index+delta;if(next<0||next>=copy.length)return copy;[copy[index],copy[next]]=[copy[next],copy[index]];return copy;
}
export async function validateCourseMediaFile(file,kind){
 if(!Object.hasOwn(MIME,kind)||!file||!MIME[kind].has(file.type)||!Number.isInteger(file.size)||file.size<1||file.size>maxBytes(kind)||typeof file.slice!=='function')fail('نوع الملف أو حجمه غير مدعوم.');
 const bytes=new Uint8Array(await file.slice(0,64).arrayBuffer());const ascii=(start,end)=>String.fromCharCode(...bytes.slice(start,end));
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const signatures={'image/png':png,'image/jpeg':bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'image/webp':ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP','video/mp4':ascii(4,8)==='ftyp'&&bytes[0]===0&&bytes[1]===0,'audio/mpeg':ascii(0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224,'audio/ogg':ascii(0,4)==='OggS','audio/wav':ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE'};
 if(!signatures[file.type])fail('محتوى الملف لا يطابق نوعه.');return{mime_type:file.type,size_bytes:file.size,kind};
}
async function identity(client){const {data,error}=await client.auth.getUser();if(error||!data?.user?.id)fail('سجّل الدخول لإدارة ملفات الدورة.');return data.user.id}
async function sameIdentity(client,id){if(await identity(client)!==id)fail('تغير الحساب أثناء العملية. أعد فتح الدورة.');}
async function call(client,name,args){const {data,error}=await client.rpc(name,args);if(error){if(error.code==='40001')fail('تغيرت مسودة الوسائط من جلسة أخرى. أعد تحميلها قبل المحاولة.');fail('تعذر تأكيد عملية ملفات الدورة. أعد تحميل البيانات قبل إعادة المحاولة.');}return data;}
export async function uploadCourseMedia({client,slug,version,file,kind,isCurrent=()=>true}){
 scope(slug,version);const meta=await validateCourseMediaFile(file,kind),userId=await identity(client);
 if(!isCurrent())fail('تغيرت الدورة أثناء العملية.');
 const reservation=await call(client,'admin_reserve_course_media',{p_slug:slug,p_version:version,p_kind:kind,p_mime_type:meta.mime_type,p_size_bytes:meta.size_bytes});
 if(reservation?.bucket!==COURSE_MEDIA_BUCKET||!UUID.test(reservation.asset_id)||reservation.course_slug!==slug||reservation.course_version!==version||reservation.object_path!==slug+'/'+version+'/'+reservation.asset_id)fail('تعذر التحقق من وجهة الرفع.');
 await sameIdentity(client,userId);if(!isCurrent())fail('تغيرت الدورة أثناء العملية.');
 const {error}=await client.storage.from(COURSE_MEDIA_BUCKET).upload(reservation.object_path,file,{contentType:meta.mime_type,upsert:false});
 if(error)fail('تعذر تأكيد رفع الملف. حدّث قائمة الملفات قبل المحاولة مجددًا.');
 await sameIdentity(client,userId);if(!isCurrent())fail('رُفع الملف للدورة السابقة؛ لم يربط بالمحتوى. أعد فتح الدورة.');
 const asset=validateMediaAsset(await call(client,'admin_confirm_course_media',{p_asset_id:reservation.asset_id}),slug,version);
 if(asset.asset_id!==reservation.asset_id||asset.kind!==kind||asset.mime_type!==meta.mime_type||asset.size_bytes!==meta.size_bytes)fail('تعذر مطابقة الملف المرفوع.');
 await sameIdentity(client,userId);if(!isCurrent())fail('تغيرت الدورة؛ لم يربط الملف بالمحتوى.');return asset;
}
export async function loadCourseMediaDraft(client,slug,version,activities){
 scope(slug,version);const userId=await identity(client),data=await call(client,'admin_course_media_draft',{p_slug:slug,p_version:version});await sameIdentity(client,userId);
 return checkMediaResponse(data,slug,version,activities);
}
function checkMediaResponse(data,slug,version,activities){
 if(data?.course_slug!==slug||data.course_version!==version||!Number.isInteger(data.revision)||data.revision<0||!Array.isArray(data.assets))fail('تعذر التحقق من مسودة ملفات الدورة.');
 data.assets.forEach(a=>validateMediaAsset(a,slug,version));validateCourseMediaDraft(data.draft,activities,data.assets,slug,version);return data;
}
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(plain(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value)}
export async function saveCourseMediaDraft(client,state,activities){
 scope(state.course_slug,state.course_version);if(!Number.isInteger(state.revision)||state.revision<0)fail('إصدار مسودة الوسائط غير صالح.');
 state.assets.forEach(a=>validateMediaAsset(a,state.course_slug,state.course_version));validateCourseMediaDraft(state.draft,activities,state.assets,state.course_slug,state.course_version);const userId=await identity(client);
 const saved=checkMediaResponse(await call(client,'admin_save_course_media',{p_slug:state.course_slug,p_version:state.course_version,p_expected_revision:state.revision,p_draft:state.draft}),state.course_slug,state.course_version,activities);
 await sameIdentity(client,userId);if(saved.revision!==state.revision+1||canonical(saved.draft)!==canonical(state.draft))fail('تعذر تأكيد بيانات الوسائط المحفوظة.');return saved;
}
export async function signedCourseMediaUrl(client,asset,slug,version){
 validateMediaAsset(asset,slug,version);const userId=await identity(client);const {data,error}=await client.storage.from(COURSE_MEDIA_BUCKET).createSignedUrl(asset.object_path,300);
 if(error)fail('تعذر فتح ملف الدورة.');let url;try{url=new URL(data?.signedUrl)}catch{fail('رابط ملف الدورة غير صالح.')}
 if(url.origin!==origin||url.username||url.password||url.hash||url.pathname!=='/storage/v1/object/sign/'+COURSE_MEDIA_BUCKET+'/'+asset.object_path)fail('رابط ملف الدورة غير صالح.');await sameIdentity(client,userId);return url.href;
}
