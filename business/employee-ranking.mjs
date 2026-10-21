const normalize=value=>String(value??'').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').toLocaleLowerCase('ar');
const metrics={completed_courses:'عدد الدورات',average_score:'متوسط الدرجات',training_hours:'ساعات التدريب'};
export function validateRanking(rows,organizationId){
 if(!Array.isArray(rows))throw Error('تعذر التحقق من بيانات الترتيب.');
 const ids=new Set();
 for(const row of rows){
  if(row.organization_id!==organizationId||typeof row.membership_id!=='string'||ids.has(row.membership_id))throw Error('تعذر التحقق من نطاق بيانات الترتيب.');
  ids.add(row.membership_id);
  for(const key of Object.keys(metrics))if(row[key]!==null&&(typeof row[key]!=='number'||!Number.isFinite(row[key])||row[key]<0))throw Error('بيانات الترتيب غير مكتملة.');
  if(!Number.isInteger(row.completed_courses)||row.average_score>100)throw Error('بيانات الترتيب غير صالحة.');
 }
 return rows;
}
export function selectRanking(rows,{metric='completed_courses',limit=5,search='',department='all'}={}){
 if(!Object.hasOwn(metrics,metric)||![5,10].includes(Number(limit)))throw Error('خيار ترتيب غير صالح.');
 return rows.filter(r=>r.completed_courses>0&&r[metric]!==null&&(department==='all'||(r.department_id??'none')===department)&&normalize(r.display_name).includes(normalize(search.trim())))
 .sort((a,b)=>b[metric]-a[metric]||a.membership_id.localeCompare(b.membership_id)).slice(0,Number(limit));
}
export async function loadEmployeeRanking(client,organizationId){
 const {data,error}=await client.rpc('company_employee_training_ranking',{p_organization_id:organizationId});
 if(error)throw Error('تعذر تحميل ترتيب الموظفين.');
 return validateRanking(data,organizationId);
}
export function mountEmployeeRanking({document,host,rows}){
 host.replaceChildren();host.className='flow-panel employee-ranking';
 const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node};
 host.append(make('h2','الأكثر إنجازًا في التدريب'),make('p','حسب الدورات المكتملة ضمن نطاق صلاحياتك. ساعات التدريب تظهر عند توفر مدد موثوقة للدورات.'));
 const filters=make('div');filters.className='ranking-filters';
 const control=(text,node)=>{const label=make('label',text);label.append(node);filters.append(label);return node};
 const search=control('اسم الموظف',make('input'));search.type='search';
 const options=(label,values)=>{const select=control(label,make('select'));for(const [value,text] of values){const option=make('option',text);option.value=value;select.append(option)}return select};
 const metric=options('الترتيب حسب',Object.entries(metrics));
 const limit=options('عدد الموظفين',[['5','أفضل 5'],['10','أفضل 10']]);
 const departments=new Map(rows.map(r=>[r.department_id??'none',r.department_name||'دون قسم']));
 const department=options('القسم',[['all','جميع الأقسام'],...departments]);
 const status=make('p');status.setAttribute('role','status');const wrapper=make('div');wrapper.className='ranking-table';const table=make('table');wrapper.append(table);
 function draw(){table.replaceChildren();const selected=selectRanking(rows,{metric:metric.value,limit:Number(limit.value),search:search.value,department:department.value});const head=make('thead'),header=make('tr');for(const title of ['الترتيب','الموظف','القسم',...Object.values(metrics)])header.append(make('th',title));head.append(header);const body=make('tbody');selected.forEach((r,index)=>{const tr=make('tr');for(const value of [index+1,r.display_name||'موظف الشركة',r.department_name||'دون قسم',r.completed_courses,r.average_score,r.training_hours])tr.append(make('td',value===null?'—':String(value)));body.append(tr)});table.append(head,body);status.textContent=selected.length?'عرض '+selected.length+' موظفين':'لا توجد نتائج مكتملة للخيارات المحددة.'}
 search.addEventListener('input',draw);for(const node of [metric,limit,department])node.addEventListener('change',draw);host.append(filters,status,wrapper);draw();
}
