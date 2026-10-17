import {validateReleaseBundle} from './release-contract.mjs';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export async function loadEnrolledRelease(client,enrollmentId){
 if(!enrollmentId)return null;
 if(!uuid(enrollmentId))throw Error('رابط الالتحاق غير صالح.');
 const identity=await client.auth.getUser();if(identity.error||!identity.data?.user)return {session:{kind:'signed-out'}};
 const userId=identity.data.user.id;
 const response=await client.from('learning_enrollments').select('id,user_id,course_slug,course_version,context_type,status').eq('id',enrollmentId).eq('user_id',userId).maybeSingle();
 const e=response.data;if(response.error||!e||e.id!==enrollmentId||e.user_id!==userId||e.status!=='active'||!['personal','organization'].includes(e.context_type))throw Error('تعذر فتح هذا الالتحاق.');
 // Legacy reference assets remain scoped to their exact course and version.
 if(e.course_slug==='customer-service-reference'&&e.course_version===1||e.course_slug==='qa-private-file'&&e.course_version===1)return null;
 const {data,error}=await client.rpc('my_course_release',{p_enrollment_id:enrollmentId});
 if(error||!data)throw Error('إصدار هذه الدورة غير متاح للتعلم بعد. لم نعرض دورة أخرى بدلًا منه.');
 if(data.status!=='enrolled_release'||data.enrollment_id!==enrollmentId||data.user_id!==userId)throw Error('تعذر التحقق من ملكية إصدار الدورة.');
 validateReleaseBundle({...data,status:'prepared_for_review'},{course_slug:e.course_slug,course_version:e.course_version});
 const fresh=await client.auth.getUser();if(fresh.error||fresh.data?.user?.id!==userId)throw Error('تغير الحساب. أعد تحميل الدورة.');
 return {course:data.runtime,assessmentBank:data.assessment,session:{kind:'enrolled',enrollment:e,userId}};
}
