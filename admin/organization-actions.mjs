const reserved=new Set(['www','api','app','admin','business','learn','partner','partners','auth','assets','static','status','support','mail','ftp','staging']);
export function validateOrganization({displayName,slug,ownerEmail}){
 const name=String(displayName??'').trim(),key=String(slug??'').trim().toLowerCase(),email=String(ownerEmail??'').trim().toLowerCase();
 if([...name].length<2||[...name].length>120||/[\u0000-\u001f\u007f]/.test(name))throw new Error('اكتب اسم شركة من حرفين إلى 120 حرفًا.');
 if(!/^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/.test(key)||reserved.has(key))throw new Error('اكتب معرفًا متاحًا بحروف إنجليزية وأرقام وشرطة، بحد أقصى 40 حرفًا.');
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('اكتب بريد مسؤول الشركة بشكل صحيح.');
 return {p_display_name:name,p_slug:key,p_owner_email:email};
}
export async function createOrganization(client,input){
 const {data,error}=await client.rpc('admin_create_organization',validateOrganization(input));
 if(error){
  if(error.code==='23505')throw new Error('معرف الشركة مستخدم بالفعل. راجع سجل الشركات قبل إعادة المحاولة.');
  if(error.code==='42501')throw new Error('إضافة الشركات متاحة لمسؤول المنصة فقط.');
  if(error.message?.includes('confirmed owner account required'))throw new Error('يجب أن يسجل مسؤول الشركة حسابًا في كفو ويؤكد بريده أولًا.');
  throw new Error('تعذر تأكيد إضافة الشركة. راجع السجل قبل إعادة المحاولة.');
 }
 if(typeof data!=='string'||!data.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))throw new Error('لم نتلق تأكيدًا لإضافة الشركة. راجع السجل قبل إعادة المحاولة.');
 return data;
}
export function mountOrganizationForm({document,client,reload}){
 const form=document.querySelector('#admin-create-organization');if(!form||form.dataset.bound)return;
 form.dataset.bound='true';
 const open=document.querySelector('#admin-add-organization'),cancel=form.querySelector('[data-cancel]'),submit=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');
 const controls=[...form.querySelectorAll('input,button')];
 open.disabled=false;
 open.addEventListener('click',()=>{form.hidden=false;open.setAttribute('aria-expanded','true');form.elements.displayName.focus()});
 cancel.addEventListener('click',()=>{form.hidden=true;open.setAttribute('aria-expanded','false');open.focus()});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submit.disabled)return;
  const input={displayName:form.elements.displayName.value,slug:form.elements.slug.value,ownerEmail:form.elements.ownerEmail.value};
  controls.forEach(c=>c.disabled=true);open.disabled=true;status.textContent='جارٍ إضافة الشركة…';let created=false;
  try{await createOrganization(client,input);created=true;form.reset();status.textContent='تمت إضافة الشركة وربط مسؤولها. نطاق الشركة بانتظار تفعيل الاستضافة.';await reload()}
  catch(error){status.textContent=created?'أُضيفت الشركة، لكن تعذر تحديث السجل. حدّث الصفحة قبل إضافة أي شركة أخرى.':error.message}
  finally{controls.forEach(c=>c.disabled=false);open.disabled=false}
 });
}
