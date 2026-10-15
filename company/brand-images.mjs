import {validateBrandImage} from './brand-image-preview.mjs';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const bucket='kfo-company-brand';
export function validBrandKey(key,org,kind){return key===null||typeof key==='string'&&key.startsWith(`${org}/${kind}/`)&&/^[0-9a-f-]{36}\/(logo|cover)\/[0-9a-f-]{36}\.(png|jpg)$/.test(key)&&uuid(key.split('/')[2].split('.')[0])}
async function user(client){const r=await client.auth.getUser();if(r.error||!uuid(r.data?.user?.id))throw new Error('سجّل الدخول مجددًا قبل حفظ الصورة.');return r.data.user.id}
export async function loadBrandImages(client,org){if(!uuid(org))throw new Error('الشركة غير صالحة.');const r=await client.rpc('company_brand_images',{p_organization_id:org});if(r.error||!r.data||!['logo','cover'].every(k=>validBrandKey(r.data[k],org,k)))throw new Error('تعذر تحميل صور الشركة.');return r.data}
export async function saveBrandImage(client,org,kind,file,expectedKey,{validate=validateBrandImage,randomUUID=()=>crypto.randomUUID()}={}){
 if(!uuid(org)||!['logo','cover'].includes(kind)||!validBrandKey(expectedKey,org,kind))throw new Error('بيانات الصورة غير صالحة.');
 await validate(file,kind);const owner=await user(client),id=randomUUID();if(!uuid(id))throw new Error('تعذر تجهيز الصورة.');
 const key=`${org}/${kind}/${id.toLowerCase()}.${file.type==='image/png'?'png':'jpg'}`;
 const uploaded=await client.storage.from(bucket).upload(key,file,{upsert:false,contentType:file.type,cacheControl:'300'});
 if(uploaded.error||uploaded.data?.path!==key)throw new Error('تعذر تأكيد رفع الصورة. حدّث الصفحة قبل إعادة المحاولة.');
 if(await user(client)!==owner)throw new Error('تغير الحساب أثناء الرفع. أعد تحميل الصفحة.');
 const result=await client.rpc('save_company_brand_image',{p_organization_id:org,p_kind:kind,p_object_key:key,p_expected_key:expectedKey});
 if(result.error)throw new Error(result.error.code==='40001'?'تغيرت الصورة من جلسة أخرى. أعد تحميل الصفحة قبل الحفظ.':'تعذر تأكيد حفظ الصورة. أعد تحميل الصفحة للتحقق قبل المحاولة مجددًا.');
 if(result.data?.kind!==kind||result.data?.object_key!==key)throw new Error('تعذر تأكيد الصورة المحفوظة. أعد تحميل الصفحة.');
 if(await user(client)!==owner)throw new Error('تغير الحساب أثناء الحفظ. أعد تحميل الصفحة.');return key;
}
export async function mountCompanyBrandImages({document,client,organizationId}){
 const state=await loadBrandImages(client,organizationId);let busy=false;
 async function show(kind){const image=document.querySelector(`#brand-${kind}-saved`),note=document.querySelector(`#brand-${kind}-saved-status`);image.hidden=true;image.removeAttribute('src');if(state[kind]===null){note.textContent='لم تُحفظ صورة بعد.';return}const r=await client.storage.from(bucket).createSignedUrl(state[kind],300);if(r.error||typeof r.data?.signedUrl!=='string'){note.textContent='الصورة محفوظة، وتعذر تحميل معاينتها.';return}const url=new URL(r.data.signedUrl);if(url.protocol!=='https:'||url.hostname!=='ktkdcfxeaicbykdurlfg.supabase.co'){note.textContent='تعذر التحقق من رابط المعاينة.';return}image.src=url.href;image.hidden=false;note.textContent='الصورة المحفوظة حاليًا.'}
 for(const kind of ['logo','cover']){
  const button=document.querySelector(`#brand-${kind}-save`),input=document.querySelector(`#brand-${kind}-file`),status=document.querySelector(`#brand-${kind}-status`);
  button.addEventListener('click',async()=>{if(busy)return;const file=input.files?.[0];if(!file){status.textContent='اختر صورة أولًا.';return}busy=true;const controls=[...document.querySelectorAll('.brand-image-picker input,.brand-image-picker button')];controls.forEach(c=>c.disabled=true);status.textContent='جارٍ رفع الصورة وحفظها…';try{state[kind]=await saveBrandImage(client,organizationId,kind,file,state[kind]);status.textContent='تم رفع الصورة وحفظها للشركة.';await show(kind)}catch(error){status.textContent=error.message}finally{busy=false;controls.forEach(c=>c.disabled=false)}});
  await show(kind);
 }
}
