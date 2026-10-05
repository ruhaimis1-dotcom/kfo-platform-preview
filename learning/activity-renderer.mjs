const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderActivity(a){const title='<div class="activity-head"><span class="activity-type">'+esc(label(a.type))+'</span><h2>'+esc(a.title)+'</h2></div>';switch(a.type){
case'content':return title+(a.content||[]).map(p=>'<p>'+esc(p)+'</p>').join('');
case'quick_check':case'scenario':case'error_spotting':return title+'<p>'+esc(a.prompt)+'</p>'+options(a);
case'ordering':return title+'<p>'+esc(a.prompt)+'</p><ol class="ordering">'+(a.items||[]).map(i=>'<li>'+esc(i)+'</li>').join('')+'</ol>';
case'reflection':return title+'<p>'+esc(a.prompt)+'</p><textarea data-evidence="text" rows="6"></textarea>';
case'practical_task':return title+'<p>'+esc(a.instructions)+'</p><textarea data-evidence="structured" rows="8"></textarea>';
case'file_evidence':return title+'<p>'+esc(a.instructions)+'</p><input type="file" data-evidence="file">';
case'simulation':return title+'<p>'+esc(a.prompt)+'</p><div data-simulation></div>';
case'assessment':return title+'<p>'+esc(a.instructions||'أكمل التقييم لقياس إتقانك للمهارات المستهدفة.')+'</p><div data-official-assessment></div>';
default:throw new Error('unsupported activity')}}
function options(a){return'<div class="activity-options">'+(a.options||[]).map((o,i)=>'<label><input type="radio" name="activity-answer" value="'+i+'"><span>'+esc(o)+'</span></label>').join('')+'</div>'}
function label(t){return({content:'محتوى',quick_check:'تحقق سريع',scenario:'موقف عملي',ordering:'رتّب الخطوات',error_spotting:'اكتشف الخطأ',reflection:'تأمل وتطبيق',practical_task:'مهمة عملية',file_evidence:'دليل عملي',simulation:'محاكاة',assessment:'تقييم'}[t]||t)}
