import {courseSource} from './course-source.mjs';
import {createClient} from '@supabase/supabase-js';
import {runtimeState,recommendNext} from './activity-runtime.mjs';
import {renderActivity} from './activity-renderer.mjs';
import {resolveEnrollment,saveLessonCompletion} from './enrollment-session.mjs';
import {loadActivityRecords,submitEvidence} from './evidence-session.mjs';
import {attachMyReviewFeedback} from './review-feedback.mjs';
import {uploadFileEvidence} from './file-evidence.mjs';
import {loadSkillMeasurements,summarizeSkills} from './skill-session.mjs';
import {submitOfficialAssessment} from './enrollment-session.mjs';
import {renderOfficialAssessment,collectOfficialAnswers} from './official-assessment-ui.mjs';

async function main(){
const client=createClient('https://ktkdcfxeaicbykdurlfg.supabase.co','sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
const course=await fetch(courseSource(location.pathname)).then(r=>{if(!r.ok)throw new Error('تعذر تحميل الدورة');return r.json()});
const assessmentBank=await fetch('/assets/reference/customer-service-assessment.json').then(r=>{if(!r.ok)throw new Error('تعذر تحميل التقييم');return r.json()});
let records=[],current=0;
const qs=new URLSearchParams(location.search),enrollmentId=qs.get('enrollment');
const session=await resolveEnrollment(client,enrollmentId,course.slug,course.version);
if(session.kind==='signed-out'){location.href='/login';return}
let skillRows=[];
if(session.kind==='enrolled'){records=await attachMyReviewFeedback(client,session,await loadActivityRecords(client,session,course));skillRows=await loadSkillMeasurements(client,session)}
const title=document.getElementById('course-title'),activity=document.getElementById('activity'),nav=document.getElementById('activity-nav'),skills=document.getElementById('skills'),progressValue=document.getElementById('progress-value'),progressBar=document.getElementById('progress-bar'),message=document.getElementById('activity-message'),primary=document.getElementById('primary-action'),previous=document.getElementById('previous'),coachTitle=document.getElementById('coach-title'),coachCopy=document.getElementById('coach-copy'),measurement=document.getElementById('measurement');
title.textContent=course.title;
function renderSkills(){skills.replaceChildren();const summaries=summarizeSkills(course,skillRows);for(const item of summaries){const el=document.createElement('div');el.className='skill';const delta=item.delta==null?'':(' · '+(item.delta>=0?'+':'')+item.delta+' نقطة');el.textContent=item.title+(item.post==null?'':(' · '+item.post+'%'))+delta;skills.append(el)}}renderSkills();
function state(){return runtimeState({slug:course.slug,version:course.version,activities:course.activities},records)}
function render(){const st=state(),a=st.activities[current];activity.innerHTML=renderActivity(a);if(a.type==='assessment'&&session.kind==='enrolled'){const host=activity.querySelector('[data-official-assessment]');host.innerHTML=renderOfficialAssessment(assessmentBank);host.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();message.textContent='';try{const payload=collectOfficialAnswers(event.currentTarget,assessmentBank);const result=await submitOfficialAssessment(client,session,payload.questionIds,payload.answers);message.textContent=result.passed?('اجتزت التقييم بنسبة '+Math.round(result.score_percent)+'%'+(result.certificate_code?' · صدرت شهادتك '+result.certificate_code:'')):('نتيجتك '+Math.round(result.score_percent)+'%. راجع المهارات المطلوبة ثم حاول مجددًا.');if(result.passed){records=records.filter(r=>r.activity_key!==a.key);records.push({activity_key:a.key,completed_at:new Date().toISOString()});skillRows=await loadSkillMeasurements(client,session);renderSkills();render()}}catch(error){message.textContent=error.message||'تعذر إرسال التقييم.'}})}nav.replaceChildren();st.activities.forEach((item,i)=>{const b=document.createElement('button');b.className='activity-link';b.dataset.state=item.state;b.setAttribute('aria-current',i===current?'true':'false');b.innerHTML='<span class="dot"></span><span>'+(i+1)+'. '+item.title+'</span>';b.addEventListener('click',()=>{if(i<=firstBlockedIndex(st))current=i;render()});nav.append(b)});const done=st.activities.filter(x=>x.state==='completed').length,pct=Math.round(done/st.activities.length*100);progressValue.textContent=pct+'%';progressBar.style.width=pct+'%';previous.disabled=current===0;primary.textContent=a.type==='assessment'?'ابدأ التقييم الرسمي':needsEvidence(a.type)?'أرسل للمراجعة':'أكمل النشاط';const rec=recommendNext(st);coachTitle.textContent=rec.kind==='remediate'?'راجع وحسّن تطبيقك':rec.kind==='wait_review'?'بانتظار المراجعة':rec.kind==='complete'?'أكملت الرحلة':'خطوتك التالية';coachCopy.textContent=rec.kind==='wait_review'?'أرسلت المهمة بنجاح. لا نعتبرها مجتازة حتى تتم مراجعتها.':rec.kind==='remediate'?'راجع الملاحظات ثم أعد المحاولة.':'ركز على النشاط الحالي ثم انتقل لما بعده.';if(a.record?.review_feedback)coachCopy.textContent+=' ملاحظات المراجع: '+a.record.review_feedback;measurement.innerHTML=(a.skillCodes||[]).map(code=>'<div class="measure">'+(course.skills.find(s=>s.code===code)?.title||code)+'</div>').join('')}
function firstBlockedIndex(st){const i=st.activities.findIndex(x=>x.required!==false&&x.state!=='completed');return i<0?st.activities.length-1:i}
function needsEvidence(t){return['reflection','practical_task','file_evidence'].includes(t)}
previous.addEventListener('click',()=>{if(current>0){current--;render()}});
primary.addEventListener('click',async()=>{
 if(primary.disabled)return;
 primary.disabled=true;
 message.textContent='';
 try{
  const st=state(),a=st.activities[current];
  if(a.type==='assessment'){
   message.textContent=session.kind!=='enrolled'?'التقييم الرسمي متاح فقط من دورة مسجلة في حسابك.':'أكمل نموذج التقييم داخل النشاط ثم أرسله.';
   return;
  }
  if(needsEvidence(a.type)){
   const input=activity.querySelector('[data-evidence]');
   if(!input||(input.type==='file'?!input.files?.length:!input.value.trim())){
    message.textContent='أكمل التطبيق قبل الإرسال.';return;
   }
   if(session.kind!=='enrolled'){message.textContent='حفظ التطبيق يتطلب فتح الدورة من حسابك.';return;}
   const saved=input.type==='file'
    ?await uploadFileEvidence(client,session,course,a,input.files[0])
    :await submitEvidence(client,session,course,a,{response:input.value});
   records=records.filter(r=>r.activity_key!==a.key);records.push(saved);
   message.textContent='تم إرسال التطبيق للمراجعة.';
  }else{
   const completedAt=new Date().toISOString();
   if(session.kind==='enrolled'){
    const saved=await saveLessonCompletion(client,session,a.key);
    records=records.filter(r=>r.activity_key!==a.key);
    records.push({activity_key:a.key,completed_at:saved?.completed_at||completedAt});
    message.textContent='تم إكمال النشاط وحفظ تقدمك.';
   }else{
    records=records.filter(r=>r.activity_key!==a.key);
    records.push({activity_key:a.key,completed_at:completedAt});
    message.textContent='اكتمل النشاط في العرض العام دون حفظ التقدم.';
   }
   if(current<course.activities.length-1)current++;
  }
  render();
 }catch(error){message.textContent=error?.message||'تعذر حفظ التطبيق. حاول مرة أخرى.';}
 finally{primary.disabled=false;}
});
document.getElementById('exit-course').addEventListener('click',()=>location.href='/workspace');
render();
}

main().catch(error=>{
  console.error(error);
  const message=document.getElementById('activity-message');
  if(message) message.textContent=error?.message||'تعذر تشغيل الدورة.';
});
