export async function loadLearnerHome(client, expectedUserId) {
 const {data:identity,error:identityError}=await client.auth.getUser();
 if(identityError||!identity?.user)return {kind:'signed-out'};
 if(identity.user.id!==expectedUserId)throw new Error('تغيرت هوية الجلسة.');
 const [profile,dashboard,enrollments,notifications,certificates]=await Promise.all([
  client.from('learner_profiles').select('user_id,display_name,avatar_path,headline').eq('user_id',expectedUserId).maybeSingle(),
  client.rpc('my_learning_dashboard'),
  client.from('learning_enrollments').select('id,user_id,context_type,organization_id,membership_id,course_slug,course_version,due_at,status').eq('user_id',expectedUserId).neq('status','cancelled'),
  client.from('learner_notifications').select('id,user_id,kind,title,body,enrollment_id,created_at,read_at').eq('user_id',expectedUserId).order('created_at',{ascending:false}).limit(10),
  client.from('learner_certificates').select('id,user_id,certificate_code,issued_at,revoked_at').eq('user_id',expectedUserId).is('revoked_at',null)
 ]);
 for(const response of [profile,dashboard,enrollments,notifications,certificates])if(response.error)throw new Error('تعذر تحميل بيانات المتدرب.');
 const lists=[enrollments.data||[],notifications.data||[],certificates.data||[]];
 if(lists.flat().some(row=>row.user_id!==expectedUserId))throw new Error('وصلت بيانات خارج نطاق المستخدم.');
 return {kind:'ready',profile:profile.data||null,dashboard:dashboard.data||{},enrollments:lists[0],notifications:lists[1],certificates:lists[2]};
}