import { completeLesson } from '../auth/learner-actions.mjs';
export async function resolveEnrollment(client,enrollmentId,courseSlug,courseVersion){
 if(!enrollmentId)return {kind:'public'};
 const{data:identity,error:identityError}=await client.auth.getUser();if(identityError||!identity?.user)return{kind:'signed-out'};
 const{data,error}=await client.from('learning_enrollments').select('id,user_id,course_slug,course_version,context_type,status').eq('id',enrollmentId).eq('user_id',identity.user.id).maybeSingle();
 if(error||!data||data.status!=='active'||data.course_slug!==courseSlug||data.course_version!==courseVersion)throw new Error('تعذر فتح هذا الالتحاق.');
 return{kind:'enrolled',enrollment:data,userId:identity.user.id};
}
export async function saveLessonCompletion(client,session,lessonId){if(session.kind!=='enrolled')return null;return completeLesson(client,session.enrollment.id,lessonId)}
export async function submitOfficialAssessment(client,session,questionIds,answers){if(session.kind!=='enrolled')throw new Error('الاختبار الرسمي يتطلب التحاقًا نشطًا.');const{data,error}=await client.rpc('submit_official_assessment',{p_enrollment_id:session.enrollment.id,p_question_ids:questionIds,p_answers:answers});if(error||!data)throw new Error('تعذر إرسال الاختبار الرسمي.');return data}