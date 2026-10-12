import {downloadReviewFile} from './review-data.mjs';

// Read-only attachment access. Authorization remains in the existing file RPC and Storage RLS.
export async function mountSavedEvidenceFile({document,client,host,evidenceId,download}){
 const el=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node};
 host.hidden=false;
 host.replaceChildren(el('p','جارٍ تحميل مرفق المهمة…'));
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evidenceId||'')){
  host.replaceChildren(el('p','رابط المرفق غير صالح.'));return;
 }
 try{
  const file=await downloadReviewFile(client,evidenceId);
  const title=el('h2','مرفق المهمة المحفوظة');
  const note=el('p','عرض المرفق لا يغيّر قرار المراجعة أو تقدم المتدرب.');
  const name=el('p',file.name);
  const button=el('button','تنزيل ملف المهمة');button.type='button';button.className='admin-button';
  const message=el('p','');message.setAttribute('role','status');
  host.replaceChildren(title,note,name,button,message);
  button.addEventListener('click',async()=>{
   if(button.disabled)return;button.disabled=true;
   try{await download(file);message.textContent='تم تجهيز المرفق للتنزيل.'}
   catch{message.textContent='تعذر تجهيز التنزيل. حاول مجددًا.'}
   finally{button.disabled=false}
  });
  // Small CSV/text files are shown as plain text; other types are download-only.
  if(/\.(csv|txt)$/i.test(file.name)&&file.blob.size<=65536){
   const preview=el('pre',await file.blob.text());preview.className='review-answer';
   host.append(el('h3','معاينة محتوى الملف'),preview);
  }
 }catch{
  host.replaceChildren(el('p','المرفق غير متاح لهذا الحساب أو تعذر تحميله.'));
 }
}
