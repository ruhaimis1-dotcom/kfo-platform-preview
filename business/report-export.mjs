import {loadCompanyTrainingReport} from './company-data.mjs';
const titles={'customer-service-reference':'خدمة العملاء: من الفهم إلى الأثر','work-priorities':'تنظيم العمل والأولويات','professional-communication':'التواصل المهني الواضح','customer-service':'أساسيات خدمة العملاء','excel-basics':'أساسيات Excel','power-bi-basics':'أساسيات Power BI'};
const cell=value=>'"'+String(value).replace(/^[\s\uFEFF]*[=+\-@]/,match=>"'"+match).replaceAll('"','""')+'"';
export function companyReportCsv(rows){
 if(!Array.isArray(rows))throw Error('تعذر تجهيز التقرير.');
 const data=[['الدورة','معرف الدورة','الإصدار','إجمالي التكليفات','مكتمل','قيد التعلم','حالات أخرى']];
 const seen=new Set();
 for(const row of rows){const key=row.course_slug+':'+row.course_version;
  if(typeof row.course_slug!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.course_slug)||!Number.isSafeInteger(row.course_version)||row.course_version<1||seen.has(key))throw Error('بيانات التقرير غير صالحة.');seen.add(key);
  const values=['total_assignments','completed_assignments','active_assignments'].map(k=>{const n=row[k];if((typeof n!=='number'&&typeof n!=='string')||!/^\d+$/.test(String(n))||!Number.isSafeInteger(Number(n)))throw Error('أعداد التقرير غير صالحة.');return Number(n)});
  const [total,completed,active]=values;if(completed+active>total)throw Error('أعداد التقرير غير متطابقة.');
  data.push([Object.hasOwn(titles,row.course_slug)?titles[row.course_slug]:row.course_slug,row.course_slug,row.course_version,total,completed,active,total-completed-active]);
 }
 return '\uFEFF'+data.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
export function mountReportExport({document,client,organizationId,urlApi=URL,BlobType=Blob,schedule=setTimeout}){
 const button=document.querySelector('#report-export'),status=document.querySelector('#report-export-status');
 if(!button||button.dataset.bound)return;button.dataset.bound='1';button.disabled=false;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;button.disabled=true;status.textContent='جارٍ تحديث التقرير والتحقق من الصلاحية…';let url;
  const current=()=>document.body.dataset.organizationId===organizationId;
  try{
   const {data:identity,error}=await client.auth.getUser();if(error||!identity?.user?.id||!current())throw Error('تغيرت جلسة الشركة. أعد تحميل الصفحة.');
   const rows=await loadCompanyTrainingReport(client,organizationId);
   const {data:latest,error:authError}=await client.auth.getUser();if(authError||latest?.user?.id!==identity.user.id||!current())throw Error('تغيرت جلسة الشركة. أعد تحميل الصفحة.');
   url=urlApi.createObjectURL(new BlobType([companyReportCsv(rows)],{type:'text/csv;charset=utf-8'}));
   const link=document.createElement('a');link.href=url;link.download='KFO-training-report-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(link);try{link.click()}finally{link.remove()}
   status.textContent='تم تجهيز كامل تقرير تدريب الشركة ضمن صلاحياتك، دون بيانات التعلم الشخصي.';
  }catch(error){status.textContent=error.message||'تعذر تصدير التقرير.'}
  finally{if(url)schedule(()=>urlApi.revokeObjectURL(url),1000);button.disabled=false}
 });
}
