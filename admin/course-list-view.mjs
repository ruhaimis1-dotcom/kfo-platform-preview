const normalize=value=>String(value??'').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').toLocaleLowerCase('ar');
export function filterCourseList(rows,{search='',state='all'}={}){
 const terms=normalize(search).trim().split(/\s+/).filter(Boolean);
 return rows.filter(row=>terms.every(term=>normalize(row.title+' '+row.course_slug).includes(term))&&(state==='all'||state==='published'&&row.published||state==='draft'&&!row.published||state==='unready'&&!row.runtime_ready));
}
export function drawCourseList({document,list,rows,selected,onSelect}){
 list.replaceChildren();
 for(const [published,title] of [[true,'الدورات المنشورة'],[false,'المسودات والدورات غير المنشورة']]){
  const group=rows.filter(row=>Boolean(row.published)===published);if(!group.length)continue;
  const section=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');heading.textContent=title;grid.className='editor-course-grid';section.append(heading,grid);
  for(const row of group){
   const card=document.createElement('article'),h=document.createElement('h4'),state=document.createElement('p'),price=document.createElement('p'),button=document.createElement('button');card.className='editor-course-card';h.textContent=row.title;state.textContent='إصدار '+row.course_version+' · '+(row.runtime_ready?'نسخة التعلم جاهزة':'نسخة التعلم تحتاج تجهيزًا');price.textContent=Number(row.unit_amount_minor)===0?'مجانية':new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR'}).format(row.unit_amount_minor/100)+' · إتمام الدفع متوقف حتى ربط البوابة';button.type='button';button.className='admin-button';button.textContent='تحرير الدورة';button.setAttribute('aria-label','تحرير '+row.title);button.setAttribute('aria-pressed',String(selected?.course_slug===row.course_slug&&selected?.course_version===row.course_version));button.addEventListener('click',()=>onSelect(row));card.append(h,state,price,button);grid.append(card);
  }list.append(section);
 }
 if(!rows.length){const p=document.createElement('p');p.textContent='لا توجد دورات مطابقة للبحث.';list.append(p)}
}
