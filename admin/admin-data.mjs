function unwrap(data,error,message){
  if(error) throw new Error(message);
  return data;
}
export async function loadAdminOverview(client){
  const {data,error}=await client.rpc('admin_platform_overview');
  return unwrap(data,error,'تعذر تحميل ملخص المنصة.');
}
export async function loadAdminOrganizations(client){
  const {data,error}=await client.rpc('admin_organization_directory');
  const rows=unwrap(data,error,'تعذر تحميل الشركات.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل الشركات.');
  return rows;
}
export async function loadAdminMemberships(client){
  const {data,error}=await client.rpc('admin_membership_directory');
  const rows=unwrap(data,error,'تعذر تحميل المستخدمين والصلاحيات.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل المستخدمين والصلاحيات.');
  return rows;
}
export async function loadAdminCourses(client){
  const {data,error}=await client.rpc('admin_course_directory');
  const rows=unwrap(data,error,'تعذر تحميل الدورات.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل الدورات.');
  return rows;
}
export async function loadAdminCertificates(client){
  const {data,error}=await client.rpc('admin_certificate_directory');
  const rows=unwrap(data,error,'تعذر تحميل الشهادات.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل الشهادات.');
  return rows;
}
export async function loadAdminReviewQueue(client){
  const {data,error}=await client.rpc('admin_evidence_review_queue');
  const rows=unwrap(data,error,'تعذر تحميل طابور المراجعة.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل طابور المراجعة.');
  return rows;
}
export async function loadAdminActivity(client){
  const {data,error}=await client.rpc('admin_audit_log');
  const rows=unwrap(data,error,'تعذر تحميل سجل النشاط.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل سجل النشاط.');
  return rows;
}
