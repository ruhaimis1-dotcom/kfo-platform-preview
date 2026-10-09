-- KFO reference course engine seed — review-only until MVP Gate.
-- Requires unified_learner_context.sql and intelligent_course_engine.sql.
-- No Deploy Until MVP Gate.

insert into public.course_skills(course_slug,course_version,skill_code,title,outcome)
values
('customer-service-reference',1,'CS-DIAGNOSE','تشخيص حاجة العميل','يميز الوقائع من الافتراضات ويجمع الحد الأدنى الآمن من المعلومات.'),
('customer-service-reference',1,'CS-EXPECT','إدارة التوقعات','يقدم التزامًا واقعيًا ويفرق بين المراجعة والحل.'),
('customer-service-reference',1,'CS-ESCALATE','التصعيد المهني','يبني تصعيدًا قابلًا للتنفيذ دون تجاوز الصلاحيات.'),
('customer-service-reference',1,'CS-CLOSE','الإغلاق والتحسين','يتحقق من النتيجة ويستخرج تحسينًا تشغيليًا قابلًا للقياس.')
on conflict(course_slug,course_version,skill_code) do update
set title=excluded.title,outcome=excluded.outcome;

insert into public.course_activities(course_slug,course_version,activity_key,activity_type,title,sequence_no,required)
values
('customer-service-reference',1,'pre-check','scenario','قبل أن تبدأ: كيف تتصرف؟',1,true),
('customer-service-reference',1,'diagnose-content','content','افهم الحاجة قبل اقتراح الحل',2,true),
('customer-service-reference',1,'diagnose-error','error_spotting','اكتشف الخطأ',3,true),
('customer-service-reference',1,'expect-scenario','scenario','وعد يمكن تنفيذه',4,true),
('customer-service-reference',1,'escalation-task','practical_task','ابنِ تصعيدًا مهنيًا',5,true),
('customer-service-reference',1,'close-order','ordering','رتّب الإغلاق الصحيح',6,true),
('customer-service-reference',1,'impact-reflection','reflection','حوّل الشكوى إلى تحسين',7,true),
('customer-service-reference',1,'official-assessment','assessment','التقييم النهائي',8,true)
on conflict(course_slug,course_version,activity_key) do update
set activity_type=excluded.activity_type,title=excluded.title,sequence_no=excluded.sequence_no,required=excluded.required;

insert into public.course_activity_skills(activity_id,skill_id,weight)
select a.id,s.id,1
from (values
 ('pre-check','CS-DIAGNOSE'),
 ('diagnose-content','CS-DIAGNOSE'),
 ('diagnose-error','CS-DIAGNOSE'),
 ('expect-scenario','CS-EXPECT'),
 ('escalation-task','CS-ESCALATE'),
 ('close-order','CS-CLOSE'),
 ('impact-reflection','CS-CLOSE'),
 ('official-assessment','CS-DIAGNOSE'),
 ('official-assessment','CS-EXPECT'),
 ('official-assessment','CS-ESCALATE'),
 ('official-assessment','CS-CLOSE')
) x(activity_key,skill_code)
join public.course_activities a on a.course_slug='customer-service-reference' and a.course_version=1 and a.activity_key=x.activity_key
join public.course_skills s on s.course_slug='customer-service-reference' and s.course_version=1 and s.skill_code=x.skill_code
on conflict(activity_id,skill_id) do update set weight=excluded.weight;

insert into public.course_rubrics(course_slug,course_version,rubric_key,title,criteria)
values (
 'customer-service-reference',1,'escalation-rubric','جودة التصعيد المهني',
 '[{"code":"facts","title":"وضوح الوقائع","weight":25},{"code":"impact","title":"تحديد الأثر","weight":20},{"code":"action","title":"وضوح القرار أو الإجراء المطلوب","weight":25},{"code":"ownership","title":"المسؤول والموعد","weight":20},{"code":"professionalism","title":"لغة مهنية وحدود الصلاحية","weight":10}]'::jsonb
)
on conflict(course_slug,course_version,rubric_key) do update
set title=excluded.title,criteria=excluded.criteria;

insert into private.enrollment_assessment_keys(course_slug,course_version,question_ids,correct_answers,required_lessons,pass_percent)
values (
 'customer-service-reference',1,
 array['csr-q1','csr-q2','csr-q3','csr-q4','csr-q5','csr-q6','csr-q7','csr-q8'],
 array[1,3,1,2,1,1,1,1],
 array['pre-check','diagnose-content','diagnose-error','expect-scenario','escalation-task','close-order','impact-reflection'],
 75
)
on conflict(course_slug,course_version) do update
set question_ids=excluded.question_ids,correct_answers=excluded.correct_answers,required_lessons=excluded.required_lessons,pass_percent=excluded.pass_percent;

insert into private.assessment_question_skills(course_slug,course_version,question_id,skill_id)
select 'customer-service-reference',1,x.question_id,s.id
from (values
 ('csr-q1','CS-DIAGNOSE'),('csr-q2','CS-DIAGNOSE'),
 ('csr-q3','CS-EXPECT'),('csr-q4','CS-EXPECT'),
 ('csr-q5','CS-ESCALATE'),('csr-q6','CS-ESCALATE'),
 ('csr-q7','CS-CLOSE'),('csr-q8','CS-CLOSE')
) x(question_id,skill_code)
join public.course_skills s on s.course_slug='customer-service-reference' and s.course_version=1 and s.skill_code=x.skill_code
on conflict(course_slug,course_version,question_id,skill_id) do nothing;
