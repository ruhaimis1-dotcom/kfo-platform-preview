import branches from './data-skills-lab-data.json' with {type:'json'};
export function trainingNumber(value){if(typeof value==='number')return Number.isFinite(value)?value:NaN;if(typeof value!=='string'||!value.trim())return NaN;const text=value.trim().replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace('٫','.');return /^\d+(?:\.\d+)?$/.test(text)?Number(text):NaN}
export function excelLabResult(quantity,discount){const q=trainingNumber(quantity),d=trainingNumber(discount);if(!Number.isInteger(q)||q<1||q>100||!Number.isFinite(d)||d<0||d>100)throw Error('أدخل كمية صحيحة من 1 إلى 100 وخصمًا من 0 إلى 100.');return {quantity:q,discount:d,subtotal:q*250,discountAmount:q*250*d/100,total:q*250*(1-d/100)}}
export function branchLabResult(id){const row=branches.find(b=>b.id===id);if(!row)throw Error('اختر فرعًا من القائمة.');return {...row,average:row.total/row.count}}
export function predictionFeedback(prediction,result,explanation){const value=trainingNumber(prediction);if(!Number.isFinite(value))return {correct:false,message:'اكتب توقعك كرقم دون فواصل آلاف أو كلمة ريال، ثم جرّب.'};const correct=Math.abs(value-result)<0.005;return {correct,message:(correct?'توقعك صحيح. ':'راجع توقعك. ')+explanation}}
const money=value=>new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export function mountDataSkillsLab({document,host,course,activity}){
 if(course?.version!==1||activity?.type!=='content')return;
 const excel=course.slug==='excel-basics'&&activity.key==='excel-unit-2-lesson',powerbi=course.slug==='power-bi-basics'&&activity.key==='powerbi-unit-6-lesson';if(!excel&&!powerbi)return;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 const section=node('section');section.className='kfo-learning-lab';section.setAttribute('aria-label','تجربة تدريبية');section.append(node('h3',excel?'جرّب حساب صافي الطلب':'جرّب أثر اختيار الفرع'));
 section.append(node('p','محاكاة تعليمية داخل كفو ببيانات مصطنعة؛ لا تشغّل Excel أو Power BI، ولا تحفظ درجة أو تثبت إتقان البرنامج.'));
 const form=node('form');section.append(form);
 function field(labelText,tag='input'){const label=node('label',labelText),control=node(tag);label.append(control);form.append(label);return control}
 let quantity,discount,branch;
 if(excel){quantity=field('الكمية — سعر الوحدة 250 ريالًا');quantity.type='number';quantity.min='1';quantity.max='100';quantity.step='1';quantity.value='3';discount=field('الخصم % — اكتب 10 لخصم 10% في هذه المحاكاة');discount.type='number';discount.min='0';discount.max='100';discount.step='any';discount.value='10'}
 else{branch=field('اختر الفرع','select');for(const b of branches){const option=node('option',b.name);option.value=b.id;branch.append(option)}branch.value='all'}
 const prediction=field(excel?'توقع صافي الطلب بالريال':'توقع صافي مبيعات الفرع بالريال');prediction.type='text';prediction.inputMode='decimal';prediction.autocomplete='off';
 const check=node('button','تحقق وافهم النتيجة');check.type='submit';const reset=node('button','ابدأ التجربة من جديد');reset.type='button';form.append(check,reset);
 const feedback=node('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');const explanation=node('p');section.append(feedback,explanation);
 const clear=()=>{feedback.textContent='';explanation.textContent='';delete feedback.dataset.correct};
 for(const control of [quantity,discount,branch,prediction].filter(Boolean))control.addEventListener('input',clear);
 if(branch)branch.addEventListener('change',clear);
 form.addEventListener('submit',event=>{event.preventDefault();try{
  const result=excel?excelLabResult(quantity.value,discount.value):branchLabResult(branch.value);
  const why=excel?`قبل الخصم ${money(result.subtotal)} ريال، وقيمة الخصم ${money(result.discountAmount)} ريال؛ الصافي ${money(result.total)} ريال. نسبة الخصم في صيغة Excel تكتب ${result.discount/100} أو ${result.discount}%.`:`${result.name}: ${money(result.total)} ريال عبر ${result.count} طلبًا؛ متوسط الطلب ${money(result.average)} ريال. التصفية تختار طلبات الفرع ثم تحسب المبيعات والعدد والمتوسط من جديد.`;
  const answer=predictionFeedback(prediction.value,result.total,why);feedback.textContent=answer.message;feedback.dataset.correct=String(answer.correct);
  explanation.textContent=Number.isFinite(trainingNumber(prediction.value))?(excel?'اختبر كمية 4 مع خصم 10%: قارن الزيادة، ثم أعد الكمية إلى 3.':'اختر الرياض ثم امسح التحديد. داخل Power BI الحقيقي، بقاء الإجمالي يستدعي فحص العلاقة وحقل المرشح والتفاعلات.'):'';
 }catch(error){feedback.textContent=error.message;delete feedback.dataset.correct;explanation.textContent=''}});
 reset.addEventListener('click',()=>{if(excel){quantity.value='3';discount.value='10'}else branch.value='all';prediction.value='';clear()});host.append(section);
}
