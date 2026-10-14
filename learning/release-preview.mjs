import {validateRuntimeCourse} from './activity-runtime.mjs';
const hasAnswers=v=>!!v&&typeof v==='object'&&Object.entries(v).some(([key,item])=>['correctIndex','correct_answers','assessment_key'].includes(key)||hasAnswers(item));
export async function loadReleasePreview(client,id){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('رابط الإصدار غير صالح.');
 const {data,error}=await client.rpc('admin_course_release_preview',{p_release_id:id});if(error)throw new Error('معاينة الإصدار محصورة بإدارة المنصة، أو أن الحزمة غير موجودة.');
 if(data?.release_id!==id||data.status!=='prepared_for_review'||data.runtime?.slug!==data.course_slug||data.runtime?.version!==data.course_version||data.assessment?.courseSlug!==data.course_slug||data.assessment?.courseVersion!==data.course_version||!Array.isArray(data.runtime?.skills)||!Array.isArray(data.assessment?.questions)||hasAnswers(data))throw new Error('تعذر التحقق من حزمة المعاينة.');
 validateRuntimeCourse(data.runtime);return {course:data.runtime,assessmentBank:data.assessment,session:{kind:'preview',releaseId:id}};
}
