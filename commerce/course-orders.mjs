const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function orderOutcome(row,{organizationId=null,slug,version,quantity=1}={}){
 if(!row||!uuid(row.id)||row.currency!=='SAR'||row.course_slug!==slug||row.course_version!==version||!Number.isSafeInteger(row.amount_minor)||row.amount_minor<0)throw new Error('تعذر التحقق من الطلب. راجع السجل قبل المحاولة مجددًا.');
 if(organizationId&&(row.organization_id!==organizationId||row.quantity!==quantity||!Number.isSafeInteger(row.unit_amount_minor)||row.unit_amount_minor<0||row.amount_minor!==row.unit_amount_minor*quantity))throw new Error('بيانات طلب الشركة غير متطابقة.');
 if(row.status==='free_confirmed'&&row.amount_minor===0&&(organizationId||uuid(row.enrollment_id)))return 'free';
 if(row.status==='awaiting_payment'&&row.amount_minor>0&&(organizationId||row.enrollment_id===null))return 'payment';
 throw new Error('لم نتلق حالة طلب معتمدة. راجع سجل الطلبات.');
}
export function requestKey(storage,scope,cart,generate){
 const slot='kfo:course-order:'+scope+':'+JSON.stringify(cart);let value;
 try{value=storage.getItem(slot);if(value&&!uuid(value))throw new Error();if(!value){value=generate();if(!uuid(value))throw new Error();storage.setItem(slot,value);if(storage.getItem(slot)!==value)throw new Error()}}catch{throw new Error('تعذر حفظ مفتاح إعادة المحاولة في المتصفح. تحقق من إتاحة تخزين الجلسة قبل إنشاء الطلب.');}return value;
}
export async function createCourseOrder(client,{userId,organizationId=null,slug,version,quantity=1,key}){
 if(!uuid(userId)||organizationId&&!uuid(organizationId)||!uuid(key)||!slug||!Number.isInteger(version)||version<1||!Number.isInteger(quantity)||quantity<1||quantity>10000)throw new Error('بيانات الطلب غير صالحة.');
 const {data:identity,error:authError}=await client.auth.getUser();if(authError||identity?.user?.id!==userId)throw new Error('تغيرت جلسة الحساب. أعد تحميل الصفحة قبل الطلب.');
 const args={p_course_slug:slug,p_course_version:version,p_request_key:key};if(organizationId){args.p_organization_id=organizationId;args.p_quantity=quantity}
 const {data,error}=await client.rpc(organizationId?'create_company_course_order':'create_my_course_order',args);
 if(error)throw new Error('تعذر تأكيد إنشاء الطلب. راجع السجل، ثم أعد المحاولة بنفس البيانات.');
 return {row:data,outcome:orderOutcome(data,{organizationId,slug,version,quantity})};
}
export async function loadCourseOrders(client,organizationId=null){
 const args=organizationId?{p_organization_id:organizationId}:undefined;
 const [offers,history]=await Promise.all([client.rpc(organizationId?'company_course_offers':'my_course_offers',args),client.rpc(organizationId?'company_course_order_history':'my_course_order_history',args)]);
 if(offers.error||history.error||!Array.isArray(offers.data)||!Array.isArray(history.data))throw new Error('تعذر تحميل عروض الدورات وسجل الطلبات.');
 for(const o of offers.data)if(typeof o.course_slug!=='string'||typeof o.title!=='string'||!Number.isInteger(o.course_version)||o.course_version<1||!Number.isSafeInteger(o.unit_amount_minor)||o.unit_amount_minor<0||o.currency!=='SAR')throw new Error('بيانات عروض الدورات غير صالحة.');
 for(const row of history.data)orderOutcome(row,{organizationId,slug:row.course_slug,version:row.course_version,quantity:row.quantity||1});
 return {offers:offers.data,history:history.data};
}
export async function mountCourseOrders({document,client,userId,organizationId=null,storage,generate}){
 const form=document.querySelector('#course-order-form'),status=document.querySelector('#course-order-status'),history=document.querySelector('#course-order-history'),payment=document.querySelector('#course-payment-step');
 if(form.dataset.bound)return;form.dataset.bound='true';
 const select=form.elements.course,quantity=form.elements.quantity,submit=form.querySelector('[type=submit]');
 let data=await loadCourseOrders(client,organizationId),busy=false,confirmed=null;
 const money=minor=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR'}).format(minor/100);
 const chosen=()=>data.offers[Number(select.value)];
 function drawHistory(){history.replaceChildren();for(const row of data.history){const item=document.createElement('article'),p=document.createElement('p');p.textContent=row.course_slug+' · '+row.id+' · '+money(row.amount_minor)+' · '+(row.status==='free_confirmed'?'طلب مجاني مؤكد':'بانتظار ربط الدفع');item.append(p);if(!organizationId&&row.status==='free_confirmed'){const a=document.createElement('a');a.href='/workspace';a.textContent='عرض دوراتي';item.append(a)}history.append(item)}if(!history.children.length)history.textContent='لا توجد طلبات مسجلة بعد.'}
 function estimate(){const offer=chosen(),q=organizationId?Number(quantity.value):1;document.querySelector('#course-order-total').textContent=offer&&Number.isInteger(q)&&q>0&&q<=10000?'الإجمالي المعروض: '+money(offer.unit_amount_minor*q)+' — يعتمد التأكيد على سعر الخادم.':'اختر دورة وحدد العدد.';submit.textContent=offer?.unit_amount_minor===0?'تأكيد الطلب المجاني':'المتابعة إلى خطوة الدفع';submit.disabled=busy||!offer||!!confirmed;}
 select.replaceChildren();data.offers.forEach((o,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=o.title+' · إصدار '+o.course_version+' · '+money(o.unit_amount_minor);select.append(option)});select.value=data.offers.length?'0':'';
 drawHistory();form.hidden=false;estimate();
 for(const field of [select,quantity])field.addEventListener('change',()=>{if(!busy){confirmed=null;payment.hidden=true;estimate()}});
 document.querySelector('#course-orders-refresh').addEventListener('click',async()=>{if(busy)return;busy=true;estimate();try{const result=await loadCourseOrders(client,organizationId);data.history=result.history;drawHistory();status.textContent='تم تحديث السجل. الأسعار المعروضة تتحدث عند إعادة تحميل الصفحة.'}catch(error){status.textContent=error.message}finally{busy=false;estimate()}});
 form.addEventListener('submit',async event=>{event.preventDefault();if(busy||confirmed)return;const offer=chosen(),q=organizationId?Number(quantity.value):1;if(!offer||!Number.isInteger(q)||q<1||q>10000){status.textContent='اختر الدورة وحدد عددًا صحيحًا من 1 إلى 10000.';return}busy=true;select.disabled=true;quantity.disabled=true;estimate();status.textContent='جارٍ تأكيد الطلب…';try{const cart={slug:offer.course_slug,version:offer.course_version,quantity:q};const key=requestKey(storage,userId+':'+(organizationId||'personal'),cart,generate);const result=await createCourseOrder(client,{userId,organizationId,...cart,key});confirmed=result.row.id;payment.hidden=result.outcome!=='payment';status.textContent=result.outcome==='payment'?'وصل الطلب إلى خطوة الدفع. ربط نيو ليب قيد التجهيز؛ لم يُحصّل مبلغ ولم تُفتح الدورة.':organizationId?'تم تأكيد الطلب المجاني. عدد المستفيدين في الطلب لا ينشئ رصيد مقاعد تجاريًا؛ كلّف فريقك من صفحة التكليفات.':'تم تأكيد الطلب المجاني وربطه بدوراتك.';data.history=[result.row,...data.history.filter(r=>r.id!==result.row.id)];drawHistory()}catch(error){status.textContent=error.message}finally{busy=false;select.disabled=false;quantity.disabled=false;estimate()}});
}
