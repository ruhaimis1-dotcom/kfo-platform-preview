export async function attachMyReviewFeedback(client,session,records){
 if(session.kind!=='enrolled'||!records.some(r=>r.evidence_id))return records;
 const {data,error}=await client.rpc('my_learning_review_feedback',{p_enrollment_id:session.enrollment.id});
 if(error||!Array.isArray(data))throw new Error('تعذر تحميل ملاحظات المراجع. أعد فتح الدورة.');
 const byEvidence=new Map(data.map(r=>[r.evidence_id,r]));
 return records.map(r=>({...r,review_feedback:byEvidence.get(r.evidence_id)?.feedback||''}));
}
