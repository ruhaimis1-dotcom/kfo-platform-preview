export function referenceCourseSummary(rows){
  if(!Array.isArray(rows))throw new Error('تعذر تحميل تكليفات الدورة.');
  const row=rows.find(item=>item.course_slug==='customer-service-reference'&&Number(item.course_version)===1);
  const result={total:0,active:0,completed:0};
  if(!row)return result;
  for(const [key,field] of [['total','total_assignments'],['active','active_assignments'],['completed','completed_assignments']]){
    const count=Number(row[field]);
    if(!Number.isSafeInteger(count)||count<0)throw new Error('تعذر تحميل تكليفات الدورة.');
    result[key]=count;
  }
  if(result.active+result.completed>result.total)throw new Error('تعذر تحميل تكليفات الدورة.');
  return result;
}

export async function loadAssignableCourses(client,organizationId){
 const {data,error}=await client.rpc('company_assignable_courses',{p_organization_id:organizationId});
 if(error||!Array.isArray(data))throw Error('تعذر تحميل الدورات المتاحة للتكليف.');
 const seen=new Set();for(const row of data){const key=row.course_slug+':'+row.course_version;if(typeof row.course_slug!=='string'||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.course_slug)||!Number.isInteger(row.course_version)||row.course_version<1||typeof row.title!=='string'||!row.title.trim()||seen.has(key))throw Error('بيانات مكتبة التدريب غير صالحة.');seen.add(key)}return data;
}
export function renderAssignableLibrary(document,rows){
 const grid=document.querySelector('#course-grid');grid.replaceChildren();
 for(const row of rows){const card=document.createElement('article');card.className='flow-course';card.dataset.kind='available';card.dataset.title=row.title;const body=document.createElement('div');body.className='flow-course-body';const title=document.createElement('h3');title.textContent=row.title;const details=document.createElement('p');details.textContent='دورة مجانية متاحة للتكليف · إصدار '+row.course_version;const link=document.createElement('a');link.className='flow-card-link';link.textContent='تكليف هذه الدورة';link.href='/business/assignments?course='+encodeURIComponent(row.course_slug)+'&version='+row.course_version;body.append(title,details,link);card.append(body);grid.append(card)}
 document.querySelector('#course-kind').closest('label').hidden=true;
 document.querySelector('#course-empty').hidden=rows.length>0;
}
