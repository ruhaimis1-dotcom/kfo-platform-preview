import {validateReleaseBundle} from './release-contract.mjs';
export async function loadReleasePreview(client,id){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('رابط الإصدار غير صالح.');
 const {data,error}=await client.rpc('admin_course_release_preview',{p_release_id:id});if(error)throw new Error('معاينة الإصدار محصورة بإدارة المنصة، أو أن الحزمة غير موجودة.');
 validateReleaseBundle(data,{release_id:id});return {course:data.runtime,assessmentBank:data.assessment,session:{kind:'preview',releaseId:id}};
}
