import {loadReviewDetail,submitReview,downloadReviewFile} from './review-data.mjs';
export function mountReviewQueue({document,client,tbody,rows,detailHost,reload,download}){
 let selection=0;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 tbody.replaceChildren(); detailHost.replaceChildren();
 if(!rows.length){const tr=el('tr'),td=el('td','لا توجد مهام بانتظار المراجعة.');td.colSpan=5;tr.append(td);tbody.append(tr);return}
 for(const row of rows){
  const tr=el('tr');
  for(const [label,value] of [['المتعلم',row.display_name],['الدورة',row.course_slug],['النشاط',row.activity_key],['الحالة','بانتظار المراجعة']]){const td=el('td',value||'—');td.dataset.label=label;tr.append(td)}
  const td=el('td'),open=el('button','فتح المهمة');open.type='button';open.className='admin-button';td.dataset.label='المراجعة';td.append(open);tr.append(td);tbody.append(tr);
  open.addEventListener('click',async()=>{
   const token=++selection;detailHost.replaceChildren(el('p','جارٍ تحميل المهمة…'));open.disabled=true;
   try{
    const detail=await loadReviewDetail(client,row.evidence_id);if(token!==selection)return;
    const title=el('h2',detail.activity_title),answer=el('pre',detail.evidence_type==='file'?'الملف محفوظ بشكل خاص. استخدم زر التنزيل لقراءته.':String(detail.payload?.response??detail.payload?.text??JSON.stringify(detail.payload,null,2)));answer.className='review-answer';
    const message=el('p');message.setAttribute('role','status');
    const form=el('form'),fields=[];
    const field=(caption,node)=>{const label=el('label',caption);label.append(node);form.append(label);fields.push(node);return node};
    const rubric=field('معيار التقييم',el('select'));const empty=el('option','بدون معيار محدد');empty.value='';rubric.append(empty);
    for(const r of detail.rubrics){const option=el('option',r.title);option.value=r.id;rubric.append(option)}
    const criteria=el('pre');criteria.className='review-answer';form.append(criteria);
    rubric.addEventListener('change',()=>{const items=detail.rubrics.find(r=>r.id===rubric.value)?.criteria||[];criteria.textContent=items.map(item=>item.title+' · '+item.weight+'٪').join('\n')});
    const status=field('قرار المراجعة',el('select'));for(const [value,text] of [['','اختر القرار'],['passed','اجتاز المهمة'],['needs_revision','تحتاج تعديلًا'],['failed','لم يجتز المهمة']]){const option=el('option',text);option.value=value;status.append(option)}
    const score=field('الدرجة من ١٠٠',el('input'));score.type='number';score.min='0';score.max='100';score.step='0.01';score.required=true;
    const feedback=field('ملاحظات للمتدرب',el('textarea'));feedback.maxLength=4000;
    const save=el('button','حفظ قرار المراجعة');save.type='submit';save.className='admin-button primary';form.append(save);fields.push(save);
    let busy=false;
    form.addEventListener('submit',async event=>{
     event.preventDefault();if(busy)return;busy=true;fields.forEach(n=>n.disabled=true);message.textContent='جارٍ حفظ القرار…';
     try{await submitReview(client,detail,{status:status.value,score:score.value,feedback:feedback.value,rubricId:rubric.value||null});message.textContent='تم حفظ قرار المراجعة. جارٍ تحديث القائمة…';await reload()}
     catch(error){message.textContent=error.message;}
     finally{busy=false;fields.forEach(n=>n.disabled=false)}
    });
    detailHost.replaceChildren(title,el('p','راجع الإجابة والمعيار قبل تسجيل القرار. اجتياز المهمة لا يصدر الشهادة حتى تكتمل بقية متطلبات الدورة.'),answer);
    if(detail.evidence_type==='file'){
     const button=el('button','تنزيل ملف المهمة');button.type='button';button.className='admin-button';detailHost.append(button);
     button.addEventListener('click',async()=>{if(button.disabled)return;button.disabled=true;try{await download(await downloadReviewFile(client,detail.evidence_id));message.textContent='تم تجهيز ملف المهمة للتنزيل.'}catch(error){message.textContent=error.message}finally{button.disabled=false}});
    }
    detailHost.append(form,message);
   }catch(error){if(token===selection)detailHost.replaceChildren(el('p',error.message))}finally{open.disabled=false}
  });
 }
}
