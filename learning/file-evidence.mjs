const BUCKET='kfo-learning-evidence';
const MAX_BYTES=10*1024*1024;
const TYPES={pdf:'application/pdf',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'};

export function validateEvidenceFile(file){
  if(!file||!Number.isInteger(file.size)||file.size<=0||file.size>MAX_BYTES)throw new Error('اختر ملفًا لا يتجاوز حجمه 10 ميجابايت.');
  const ext=String(file.name||'').split('.').pop().toLowerCase();
  const mime=TYPES[ext];
  if(!mime||(file.type&&file.type!==mime))throw new Error('الملفات المسموحة: PDF وExcel وCSV وPNG وJPEG.');
  return {name:file.name,mime,size:file.size};
}

export async function uploadFileEvidence(client,session,course,activity,file){
  if(session.kind!=='enrolled')throw new Error('حفظ التطبيق يتطلب التحاقًا نشطًا.');
  const meta=validateEvidenceFile(file);
  const {data:row,error:activityError}=await client.from('course_activities').select('id,activity_type').eq('course_slug',course.slug).eq('course_version',course.version).eq('activity_key',activity.key).maybeSingle();
  if(activityError||!row||row.activity_type!=='file_evidence')throw new Error('تعذر التحقق من نشاط رفع الملف.');
  const {data:prepared,error:prepareError}=await client.rpc('prepare_my_evidence_upload',{p_enrollment_id:session.enrollment.id,p_activity_id:row.id,p_original_name:meta.name,p_mime_type:meta.mime,p_size_bytes:meta.size});
  const prefix=session.userId+'/'+session.enrollment.id+'/'+row.id+'/';
  if(prepareError||prepared?.bucket!==BUCKET||!prepared.object_path?.startsWith(prefix))throw new Error('تعذر تجهيز رفع الملف.');
  const storage=client.storage.from(BUCKET);
  const {error:uploadError}=await storage.upload(prepared.object_path,file,{contentType:meta.mime,upsert:false});
  if(uploadError)throw new Error('تعذر رفع الملف. حاول مرة أخرى.');
  const {data:saved,error:finalizeError}=await client.rpc('finalize_verified_file_evidence',{p_enrollment_id:session.enrollment.id,p_activity_id:row.id,p_object_path:prepared.object_path,p_original_name:meta.name,p_expected_mime:meta.mime,p_expected_size:meta.size});
  if(finalizeError||!saved||saved.review_status!=='pending'){
    // Delete only an unfinalized own upload; RLS protects submitted evidence.
    await storage.remove([prepared.object_path]).catch(()=>{});
    throw new Error('تعذر تأكيد إرسال الملف. أعد المحاولة.');
  }
  return {activity_key:activity.key,review_status:saved.review_status,evidence_id:saved.id};
}
