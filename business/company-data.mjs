function unwrap(data,error,message){
  if(error) throw new Error(message);
  return data;
}
export async function loadCompanyContext(client,organizationId){
  const {data,error}=await client.rpc('my_company_portal_context',{p_organization_id:organizationId});
  return unwrap(data,error,'تعذر تحميل سياق الشركة.');
}
export async function loadCompanyDashboard(client,organizationId){
  const {data,error}=await client.rpc('company_training_dashboard',{p_organization_id:organizationId});
  return unwrap(data,error,'تعذر تحميل لوحة التدريب.');
}
export async function loadCompanyMembers(client,organizationId){
  const {data,error}=await client.rpc('company_member_directory',{p_organization_id:organizationId});
  const rows=unwrap(data,error,'تعذر تحميل الموظفين.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل الموظفين.');
  return rows;
}
export async function loadCompanyTrainingReport(client,organizationId){
  const {data,error}=await client.rpc('company_training_report',{p_organization_id:organizationId});
  const rows=unwrap(data,error,'تعذر تحميل تقرير التدريب.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل تقرير التدريب.');
  return rows;
}
export async function loadCompanyCertificates(client,organizationId){
  const {data,error}=await client.rpc('company_certificate_ledger',{p_organization_id:organizationId});
  const rows=unwrap(data,error,'تعذر تحميل شهادات الشركة.');
  if(!Array.isArray(rows)) throw new Error('تعذر تحميل شهادات الشركة.');
  return rows;
}
export async function assignCompanyCourse(client,{organizationId,membershipIds,courseSlug,courseVersion,dueAt=null}){
  if(!organizationId||!Array.isArray(membershipIds)||!membershipIds.length||!courseSlug||!courseVersion){
    throw new Error('بيانات التكليف غير مكتملة.');
  }
  const {data,error}=await client.rpc('assign_company_course',{
    p_organization_id:organizationId,
    p_membership_ids:membershipIds,
    p_course_slug:courseSlug,
    p_course_version:courseVersion,
    p_due_at:dueAt
  });
  const rows=unwrap(data,error,'تعذر إنشاء التكليف.');
  if(!Array.isArray(rows)) throw new Error('تعذر إنشاء التكليف.');
  return rows;
}
