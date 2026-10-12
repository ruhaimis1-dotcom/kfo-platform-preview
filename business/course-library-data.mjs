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
