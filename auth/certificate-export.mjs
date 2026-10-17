import {loadCertificateDetails} from './certificate-details.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function certificateDocument(record){
 if(!/^KFO-[A-F0-9]{16}$/.test(record.code||'')||typeof record.courseTitle!=='string'||!record.courseTitle.trim()||!Number.isInteger(record.courseVersion)||record.courseVersion<1||![record.completedAt,record.issuedAt].every(v=>Number.isFinite(Date.parse(v)))||typeof record.score!=='number'||!Number.isFinite(record.score)||record.score<0||record.score>100)throw Error('تعذر تجهيز سجل الشهادة.');
 const date=value=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{dateStyle:'long',timeZone:'Asia/Riyadh'}).format(new Date(value));
 return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>سجل إتمام الدورة — ${escape(record.code)}</title><style>body{font-family:Tahoma,Arial,sans-serif;color:#173319;background:#f5f7f4;margin:0;padding:40px;line-height:1.9}main{max-width:850px;margin:auto;background:white;border:2px solid #205e1e;padding:48px}h1{font-size:32px;color:#205e1e}h2{font-size:26px}dl{display:grid;grid-template-columns:160px 1fr;gap:12px}dd{margin:0;overflow-wrap:anywhere}footer{border-top:1px solid #ccd8cb;margin-top:32px;padding-top:20px;font-size:14px}@media print{@page{size:A4;margin:15mm}body{padding:0;background:white}main{padding:24px;break-inside:avoid}}@media(max-width:600px){body{padding:12px}main{padding:20px}dl{display:block}dt{font-weight:bold}dd{margin-bottom:12px}}</style></head><body><main><p>كفو · KFO</p><h1>سجل إتمام الدورة</h1><h2>${escape(record.courseTitle)}</h2><dl><dt>رمز الشهادة</dt><dd dir="ltr">${escape(record.code)}</dd><dt>إصدار الدورة</dt><dd>${record.courseVersion}</dd><dt>تاريخ الإكمال</dt><dd>${escape(date(record.completedAt))}</dd><dt>تاريخ الإصدار</dt><dd>${escape(date(record.issuedAt))}</dd><dt>نتيجة التقييم</dt><dd>${record.score}%</dd></dl><footer>نسخة شخصية من سجل الإتمام في حساب كفو، جرى التحقق من صلاحيتها عند التنزيل. لا تتضمن اسم حامل ثابتًا أو رابط تحقق عام، ولا تمثل اعتمادًا مهنيًا خارجيًا. راجع حسابك للاطلاع على الحالة الحالية؛ قد تُلغى الشهادة بعد تنزيل هذه النسخة.<p>للطباعة أو الحفظ بصيغة PDF، افتح هذا الملف واستخدم أمر الطباعة في المتصفح.</p></footer></main></body></html>`;
}
export function mountCertificateExport({document,host,client,id,isCurrent=()=>true,urlApi=URL,BlobType=Blob,schedule=setTimeout}){
 const button=document.createElement('button'),status=document.createElement('p');button.type='button';button.textContent='تنزيل سجل الإتمام للطباعة';status.setAttribute('role','status');status.setAttribute('aria-live','polite');host.append(button,status);
 button.addEventListener('click',async()=>{
  if(button.disabled||!isCurrent())return;button.disabled=true;status.textContent='جارٍ إعادة التحقق من الشهادة…';
  let url;
  try{const record=await loadCertificateDetails(client,id);if(!isCurrent())return;
   const content=certificateDocument(record);url=urlApi.createObjectURL(new BlobType([content],{type:'text/html;charset=utf-8'}));
   const link=document.createElement('a');link.href=url;link.download=record.code+'.html';host.append(link);try{link.click()}finally{link.remove()}
   status.textContent='تم تجهيز سجل الإتمام. افتح الملف للطباعة أو الحفظ بصيغة PDF.';
  }catch(error){if(isCurrent())status.textContent=error.message||'تعذر تنزيل سجل الإتمام.'}
  finally{if(url)schedule(()=>urlApi.revokeObjectURL(url),1000);button.disabled=false}
 });return {button,status};
}
