import fs from 'node:fs';
import {validateActivities} from '../admin/course-authoring.mjs';
import {validateLearningDesign} from '../admin/learning-design.mjs';
const root=new URL('../content/authoring/data-skills/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8'));
const units=read('unit-authoring.json');
for(const kind of ['excel','powerbi']){
 const original=read(`${kind}-draft.json`),sourceUnits=units[kind];
 if(sourceUnits.length!==8)throw Error('Each curriculum needs eight units');
 const activities=[],skills=[],activitySkills={};
 for(const [i,u] of sourceUnits.entries()){
  const code=`${kind}-unit-${i+1}`,lesson=`${kind}-unit-${i+1}-lesson`,check=`${kind}-unit-${i+1}-review`;
  skills.push({code,title:u.title,outcome:u.outcome});
  activities.push({key:lesson,type:'content',title:`${i+1}. ${u.title}`,body:`الهدف: ${u.outcome}\n\n${u.explanation}\n\nمثال تطبيقي:\n${u.example}\n\nتدريبك:\n${u.exercise}`});
  activities.push({key:check,type:'scenario',title:`مراجعة الوحدة ${i+1}`,prompt:u.question,options:u.options,correctIndex:u.correctIndex});
  activitySkills[lesson]=[code];activitySkills[check]=[code];
 }
 // Original worked example remains available after the curriculum as a guided lab.
 for(const activity of original.activities.filter(a=>a.type==='content')){
  const a={...activity,title:`مختبر موجه: ${activity.title}`};activities.push(a);activitySkills[a.key]=skills.map(s=>s.code);
 }
 const taskKey=`${kind}-final-project`;
 activities.push({key:taskKey,type:'practical_task',title:'تسليم المشروع العملي للمراجعة',prompt:sourceUnits[7].exercise+'\nالقبول يتطلب مراجعة فعلية للملف وفق المعايير، مع تصحيح الأخطاء الأساسية. لا يوجد تقييم آلي لملفات Excel أو PBIX في هذه المسودة.'});
 activitySkills[taskKey]=skills.map(s=>s.code);
 const rows=kind==='excel'?[
 ['الصيغ واختبار التغيير','40% للصيغ: صافي الطلب الأول 675، وصيغ الصفوف تتبع مراجعها. تغيير الكمية إلى 4 يزيد الصافي والإجمالي 225، ثم تعاد القيمة الأصلية.',40],
 ['مطابقة الملخص','الإجمالي 29828 والرياض 9028 والعدد 24 والمتوسط 1242.83 عند العرض. يطابق الجدول المحوري المصدر بعد التحديث.',30],
 ['البيانات والعرض','عناوين وأنواع واضحة، ومعرفات طلبات فريدة، وتنسيق مناسب للمبالغ والنسب، وصفحة تقرير تقرأ دون شرح إضافي.',20],
 ['تفسير النتيجة','يشرح لماذا لا تتغير SUM بتصفية العرض، ويوضح الدالة الشرطية ونوع التجميع وحدود استنتاجاته.',10]
 ]:[
 ['الاستيراد والعلاقات','الجداول 24/3/4 صفًا، والأنواع صحيحة، ومفاتيح الأبعاد فريدة؛ علاقتان نشطتان 1:* باتجاه Single من الأبعاد إلى المبيعات.',30],
 ['صحة المقاييس','المبيعات 29828 والعدد24، والرياض9028 والعدد8 والمتوسط1128.50. تعمل المقاييس في السياقين وتعود بعد مسح المرشح.',30],
 ['وضوح التقرير','صفحة واحدة بمؤشرات ومقارنة ومرشح، ووحدة SAR وعناوين دقيقة وتباين واضح دون ادعاء اعتماد أو ربحية غير مثبتة.',25],
 ['التشخيص والتحقق','يشرح أثر العلاقة أو المرشح، ويثبت نجاح اختبار التحديث وإعادة المصدر الأصلي، ويوثق ثلاثة استنتاجات وحدودها.',15]
 ];
 const design={skills,activitySkills,rubrics:{[taskKey]:{title:'مراجعة المشروع العملي',criteria:rows.map(([title,description,weight])=>({title,description,weight}))}}};
 const draft={...original,scope:'Eight newly authored curriculum units plus original guided sample; editorial and application QA pending.',activities,learning_design:design,planned_units:sourceUnits.map((u,i)=>({...original.planned_units[i],status:'authored_draft',activity_key:`${kind}-unit-${i+1}-lesson`})),review_notes:['All eight units have draft explanation, worked example, exercise and review; this is not a claim of final course completeness.','Original numeric sample questions replaced by unit-specific multiple-choice review with varied correct-answer positions.','No interactive simulation, account progress, database import, course activation or certification linkage this round.','Practical projects require human file review. No PBIX is supplied or tested.','Eight-unit structure does not substantiate original 6–9-hour duration estimates; learner timing remains to be measured.','References checked against Microsoft documentation on 2026-10-15; actual Excel and Power BI execution remains pending.']};
 validateActivities(activities);validateLearningDesign(design,activities);
 fs.writeFileSync(new URL(`${kind}-curriculum-draft.json`,root),JSON.stringify(draft,null,2)+'\n');
 console.log(`${kind}: ${activities.length} activities, ${skills.length} skills, practical rubric 100%`);
}
