export async function inviteEmployee(client,{organizationId,email,isCurrent=()=>true}){
 const normalized=String(email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)||normalized.length>254)throw Error('أدخل بريدًا إلكترونيًا صحيحًا.');
 const {data:identity,error}=await client.auth.getUser();if(error||!identity?.user?.id||!isCurrent())throw Error('تغيرت جلسة الشركة. أعد تحميل الصفحة.');
 const {data,error:rpcError}=await client.rpc('invite_employee_by_email',{p_organization_id:organizationId,p_email:normalized});
 if(rpcError)throw Error('تعذر إنشاء الدعوة. يلزم حساب كفو مؤكد للبريد، وصلاحية إدارة الأعضاء، وألا يكون الحساب عضوًا بالفعل.');
 if(typeof data!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data))throw Error('تعذر تأكيد نتيجة الدعوة. حدّث قائمة الموظفين قبل المحاولة مجددًا.');
 const {data:latest,error:authError}=await client.auth.getUser();if(authError||latest?.user?.id!==identity.user.id||!isCurrent())throw Error('تغيرت الجلسة بعد الطلب. حدّث قائمة الموظفين للتحقق من الدعوة.');
 return data;
}
