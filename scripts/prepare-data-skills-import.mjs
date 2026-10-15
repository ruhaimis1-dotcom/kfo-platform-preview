// Generates a reviewable, atomic, create-only SQL import. Does not connect to a database.
import fs from 'node:fs';
import {validateActivities} from '../admin/course-authoring.mjs';
import {validateLearningDesign} from '../admin/learning-design.mjs';
const root=new URL('../content/authoring/data-skills/',import.meta.url);
const drafts=['excel','powerbi'].map(kind=>JSON.parse(fs.readFileSync(new URL(`${kind}-curriculum-draft.json`,root),'utf8')));
for(const d of drafts){validateActivities(d.activities);validateLearningDesign(d.learning_design,d.activities);if(d.published!==false||d.runtime_ready!==false||d.course_version!==1)throw Error('Only unpublished version 1 imports allowed')}
const payload=JSON.stringify(drafts.map(d=>({slug:d.course_slug,version:d.course_version,title:d.title,description:'مسودة للمراجعة: ثماني وحدات وشرح تطبيقي وأسئلة ومشروع عملي. لم يكتمل اختبار التطبيق أو ربط المتدرب والشهادة.',activities:d.activities,design:d.learning_design})));
const delimiter='$kfo_data_skills_import$';if(payload.includes(delimiter))throw Error('SQL delimiter collision');
process.stdout.write(`begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where email='saud@hirely.sa'),true);
set local role authenticated;
do $import$
declare d jsonb;s jsonb;payload jsonb:=${delimiter}${payload}${delimiter}::jsonb;
begin
 for d in select value from jsonb_array_elements(payload) loop
  -- Revision zero is create-only. Existing or changed course aborts both imports.
  perform public.admin_save_course_details(d->>'slug',(d->>'version')::integer,d->>'title',d->>'description',0,false,0);
  s:=public.admin_save_course_design(d->>'slug',(d->>'version')::integer,d->'activities',d->'design',0);
  if s->'activities' is distinct from d->'activities' or s->'learning_design' is distinct from d->'design' or (s->>'revision')::integer<>1 then raise exception 'import confirmation mismatch';end if;
 end loop;
end $import$;
reset role;
select o.course_slug,o.course_version,o.published,a.runtime_ready,a.revision,a.lesson_revision,jsonb_array_length(a.lesson_draft) as activities,jsonb_array_length(a.learning_design->'skills') as skills from private.course_offers o join private.course_authoring a using(course_slug,course_version) where o.course_slug in ('excel-basics','power-bi-basics');
commit;
`);
