const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const only=(v,keys)=>object(v)&&Object.keys(v).every(k=>keys.includes(k));
const text=(v,min,max)=>typeof v==='string'&&[...v.trim()].length>=min&&[...v].length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
const code=v=>typeof v==='string'&&v.length<=80&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
export const emptyDesign=()=>({skills:[],activitySkills:{},rubrics:{}});
export function validateLearningDesign(design,activities){
 if(!only(design,['skills','activitySkills','rubrics'])||!Array.isArray(design.skills)||design.skills.length>30||!object(design.activitySkills)||!object(design.rubrics)||new TextEncoder().encode(JSON.stringify(design)).length>150000)throw Error('تحقق من بيانات المهارات ومعايير التقييم.');
 const skills=new Set(),byKey=new Map(activities.map(a=>[a.key,a]));
 for(const s of design.skills){if(!only(s,['code','title','outcome'])||!code(s.code)||skills.has(s.code)||!text(s.title,2,160)||!text(s.outcome,2,1000))throw Error('لكل مهارة معرف فريد وعنوان ونتيجة تعلم مطلوبة.');skills.add(s.code)}
 for(const [key,codes] of Object.entries(design.activitySkills)){if(!byKey.has(key)||!Array.isArray(codes)||codes.length>30||new Set(codes).size!==codes.length||codes.some(c=>!skills.has(c)))throw Error('اربط النشاط بمهارات موجودة دون تكرار.');}
 for(const [key,rubric] of Object.entries(design.rubrics)){if(byKey.get(key)?.type!=='practical_task'||!only(rubric,['title','criteria'])||!text(rubric.title,2,160)||!Array.isArray(rubric.criteria)||rubric.criteria.length<1||rubric.criteria.length>10)throw Error('معايير التقييم متاحة للمهام التطبيقية، من 1 إلى 10 معايير.');const seen=new Set();let sum=0;for(const c of rubric.criteria){if(!only(c,['title','description','weight'])||!text(c.title,2,160)||seen.has(c.title.trim())||!text(c.description,2,1000)||!Number.isInteger(c.weight)||c.weight<1||c.weight>100)throw Error('لكل معيار عنوان مختلف ووصف ووزن صحيح من 1 إلى 100.');seen.add(c.title.trim());sum+=c.weight}if(sum!==100)throw Error('مجموع أوزان معايير المهمة يجب أن يساوي 100%.');}
 return design;
}
// Stable comparison across JSON object property ordering, including user supplied keys.
export const canonicalDesign=design=>JSON.stringify([design.skills.map(s=>[s.code,s.title,s.outcome]),Object.entries(design.activitySkills).sort(([a],[b])=>a.localeCompare(b)),Object.entries(design.rubrics).sort(([a],[b])=>a.localeCompare(b)).map(([key,r])=>[key,r.title,r.criteria.map(c=>[c.title,c.description,c.weight])])]);
