const statuses=new Set(['passed','needs_revision','failed']);
export async function loadReviewDetail(client,evidenceId){
 const {data,error}=await client.rpc('admin_learning_evidence_detail',{p_evidence_id:evidenceId});
 if(error||!data||data.evidence_id!==evidenceId||!Array.isArray(data.rubrics))throw new Error('تعذر فتح المهمة للمراجعة. حدّث القائمة وحاول مجددًا.');
 return data;
}
export async function submitReview(client,detail,{status,score,feedback,rubricId=null}){
 if(!statuses.has(status)||String(score).trim()===''||!Number.isFinite(Number(score))||Number(score)<0||Number(score)>100)throw new Error('اختر القرار وأدخل درجة من ٠ إلى ١٠٠.');
 feedback=String(feedback||'').trim();
 if(feedback.length>4000||((status==='needs_revision'||status==='failed')&&!feedback))throw new Error('اكتب ملاحظات تساعد المتدرب على تحسين المهمة، بحد أقصى ٤٠٠٠ حرف.');
 if(rubricId&&!detail.rubrics.some(r=>r.id===rubricId))throw new Error('معيار التقييم غير متاح لهذه الدورة.');
 const {data,error}=await client.rpc('admin_submit_evidence_review',{p_evidence_id:detail.evidence_id,p_expected_submitted_at:detail.submitted_at,p_rubric_id:rubricId,p_score:Number(score),p_feedback:feedback,p_status:status});
 if(error||!data||data.id!==detail.evidence_id||data.review_status!==status)throw new Error('لم يتم تأكيد حفظ القرار. حدّث القائمة قبل المحاولة مجددًا.');
 return data;
}
export async function downloadReviewFile(client,evidenceId){
 const {data:rows,error}=await client.rpc('learning_evidence_file',{p_evidence_id:evidenceId});
 if(error||!Array.isArray(rows)||rows.length!==1||!rows[0].object_path)throw new Error('تعذر الوصول إلى ملف المهمة.');
 const {data,error:downloadError}=await client.storage.from('kfo-learning-evidence').download(rows[0].object_path);
 if(downloadError||!data)throw new Error('تعذر تنزيل ملف المهمة.');
 return {blob:data,name:rows[0].original_name.replace(/[\\/\u0000-\u001f]/g,'_')};
}
