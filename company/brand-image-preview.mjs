const limits={logo:{maxBytes:2*1024*1024,minWidth:64,minHeight:64,maxWidth:4096,maxHeight:4096},cover:{maxBytes:5*1024*1024,minWidth:800,minHeight:240,maxWidth:8192,maxHeight:4096}};
export async function validateBrandImage(file,kind,{decode=globalThis.createImageBitmap}={}){
 const rule=Object.hasOwn(limits,kind)&&limits[kind];
 if(!rule||!file||!Number.isInteger(file.size)||file.size<=0||file.size>rule.maxBytes)throw new Error('حجم الصورة غير مناسب. الحد الأقصى للشعار ٢ م.ب وللغلاف ٥ م.ب.');
 if(!['image/png','image/jpeg'].includes(file.type))throw new Error('اختر صورة PNG أو JPEG.');
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(file.type==='image/png'?!png:!jpeg)throw new Error('محتوى الملف لا يطابق نوع الصورة.');
 let bitmap;
 try{bitmap=await decode(file);const {width,height}=bitmap;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<rule.minWidth||height<rule.minHeight||width>rule.maxWidth||height>rule.maxHeight||width*height>24_000_000)throw new Error('أبعاد الصورة غير مناسبة. الشعار من ٦٤ إلى ٤٠٩٦ بكسل، والغلاف من ٨٠٠×٢٤٠ إلى ٨١٩٢×٤٠٩٦ بكسل وبحد أقصى ٢٤ مليون بكسل.');
 return {width,height,size:file.size,type:file.type};
 }catch(error){if(error?.message?.startsWith('أبعاد'))throw error;throw new Error('تعذر قراءة الصورة. اختر ملفًا سليمًا.')}finally{bitmap?.close?.()}
}
// Local preview only. Validation must also be enforced by the future storage endpoint.
export function mountBrandImagePreview({document,window,validate=validateBrandImage,url=globalThis.URL}){
 const controllers=[];
 for(const kind of ['logo','cover']){
  const input=document.querySelector(`#brand-${kind}-file`),image=document.querySelector(`#brand-${kind}-preview`),status=document.querySelector(`#brand-${kind}-status`),reset=document.querySelector(`#brand-${kind}-reset`);
  if(!input||!image||!status||!reset)continue;
  let sequence=0,currentUrl=null;
  function clear(){if(currentUrl){url.revokeObjectURL(currentUrl);currentUrl=null}image.removeAttribute('src');image.hidden=true}
  function cancel(){sequence++;clear();input.value='';status.textContent='';reset.disabled=true}
  const change=async()=>{const id=++sequence;clear();const file=input.files?.[0];reset.disabled=!file;if(!file){status.textContent='';return}status.textContent='جارٍ فحص الصورة…';try{const info=await validate(file,kind);if(id!==sequence)return;currentUrl=url.createObjectURL(file);image.src=currentUrl;image.hidden=false;status.textContent=`معاينة محلية · ${info.width} × ${info.height} بكسل. لم تُرفع أو تُحفظ الصورة.`}catch(error){if(id!==sequence)return;input.value='';reset.disabled=true;status.textContent=error.message}};
  input.addEventListener('change',change);reset.addEventListener('click',cancel);
  controllers.push(()=>{cancel();input.removeEventListener('change',change);reset.removeEventListener('click',cancel)});
 }
 const dispose=()=>{for(const stop of controllers)stop();window?.removeEventListener('pagehide',dispose)};
 window?.addEventListener('pagehide',dispose,{once:true});return dispose;
}
