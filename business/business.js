const menu = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
const closeMenu = () => {
  sidebar.classList.remove('open');
  document.body.classList.remove('menu-open');
  menu.setAttribute('aria-expanded', 'false');
};
menu.addEventListener('click', () => {
  const open = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

let toastTimer;
const toast = document.querySelector('#toast');
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
  toast.textContent = `${button.dataset.action}: إجراء توضيحي غير مفعّل بعد.`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2500);
}));

const scenario = document.querySelector('#scenario');
const content = document.querySelector('#dashboard-content');
const statePanel = document.querySelector('#state-panel');
const retry = document.querySelector('#retry');
const actionBar = document.querySelector('.action-bar');
const actionButtons = Object.fromEntries([...actionBar.querySelectorAll('[data-action]')].map(button => [button.dataset.action, button]));

function showScenario(value) {
  const isNew = value === 'new';
  const hasError = value === 'error';
  const noSeats = value === 'no-seats';
  document.body.dataset.scenario = value;
  content.hidden = isNew || hasError;
  statePanel.hidden = !(isNew || hasError);
  actionBar.hidden = hasError;
  retry.hidden = !hasError;
  if (isNew) {
    document.querySelector('#state-title').textContent = 'ابدأ بإضافة فريقك';
    document.querySelector('#state-copy').textContent = 'لا يوجد موظفون أو تكليفات بعد. أضف موظفاً ثم خصص التدريب المناسب له.';
  } else if (hasError) {
    document.querySelector('#state-title').textContent = 'تعذر تحميل لوحة التدريب';
    document.querySelector('#state-copy').textContent = 'لم نتمكن من عرض البيانات. جرّب إعادة التحميل؛ لا تُعرض أرقام قديمة على أنها حديثة.';
  }
  document.querySelector('#heading-help').textContent = isNew ? 'خطوتك الأولى هي إضافة الموظفين.' : noSeats ? 'تحتاج إلى مقاعد إضافية قبل تكليف دورات جديدة.' : hasError ? 'حالة توضيحية لتعذر تحميل البيانات.' : 'تابع جاهزية فريقك وتقدم التكليفات من مكان واحد.';
  document.querySelector('#seat-count').textContent = noSeats ? '٠' : '٢٤';
  document.querySelector('#seat-caption').textContent = noSeats ? 'لا توجد مقاعد متاحة للتكليف' : 'جاهزة للتكليف';
  document.querySelector('#seat-alert-title').textContent = noSeats ? 'نفدت المقاعد المتاحة' : 'مقاعد بانتظار التكليف';
  document.querySelector('#seat-alert-copy').textContent = noSeats ? 'اشترِ مقاعد قبل تكليف موظفين جدد.' : '٢٤ مقعداً متاحاً ضمن رصيد الشركة.';
  const primary = isNew ? 'إضافة موظف' : noSeats ? 'شراء مقاعد' : 'تكليف دورة';
  Object.entries(actionButtons).forEach(([name, button]) => {
    button.classList.toggle('primary', name === primary);
    button.classList.toggle('secondary', name !== primary);
    button.disabled = name === 'تكليف دورة' && (isNew || noSeats);
    if (button.disabled) button.title = isNew ? 'أضف موظفاً أولاً' : 'اشترِ مقاعد أولاً';
    else button.removeAttribute('title');
  });
  const remaining = ['تكليف دورة', 'إضافة موظف', 'شراء مقاعد'].filter(name => name !== primary);
  actionBar.replaceChildren(actionButtons[primary], ...remaining.map(name => actionButtons[name]));
}
scenario.addEventListener('change', () => showScenario(scenario.value));
retry.addEventListener('click', () => { scenario.value = 'active'; showScenario('active'); });
showScenario(scenario.value);


window.addEventListener('kfo:company-dashboard',event=>{
  const data=event.detail?.data||{};
  const metrics=[...document.querySelectorAll('.metrics .metric')];
  const n=value=>Number(value||0).toLocaleString('ar-SA');
  if(metrics[0]){metrics[0].querySelector('strong').textContent=n(data.active_members);metrics[0].querySelector('small').textContent='عضوية نشطة ضمن نطاق صلاحيتك'}
  if(metrics[1]){metrics[1].querySelector('strong').textContent=n(data.assignments);metrics[1].querySelector('small').textContent='تكليفات الشركة ضمن نطاق صلاحيتك'}
  if(metrics[2]){
    const total=Number(data.assignments||0),done=Number(data.completed_assignments||0);
    const pct=total?Math.round(done/total*100):0;
    metrics[2].querySelector('strong').textContent=pct.toLocaleString('ar-SA')+'٪';
    metrics[2].querySelector('small').textContent=n(done)+' مكتملة من '+n(total);
  }
  if(metrics[3]){metrics[3].querySelector('strong').textContent='—';metrics[3].querySelector('small').textContent='رصيد المقاعد ينتظر بوابة التجارة'}
  document.querySelector('.sample-tag')?.replaceChildren(document.createTextNode('بيانات فعلية'));
  if(scenario)scenario.closest('.scenario').hidden=true;
  const progress=document.querySelector('.progress-panel');
  if(progress){
    const total=Number(data.assignments||0),done=Number(data.completed_assignments||0),active=Number(data.active_assignments||0);
    const quiet=progress.querySelector('.quiet'); if(quiet)quiet.textContent=n(total)+' تكليفًا مؤسسيًا';
    const donut=progress.querySelector('.donut');
    if(donut){donut.setAttribute('aria-label',n(done)+' مكتمل، '+n(active)+' نشط');const strong=donut.querySelector('strong');if(strong)strong.textContent=n(total)}
    const legend=[...progress.querySelectorAll('.legend > div')];
    if(legend[0]){legend[0].querySelector('strong').textContent=n(done);legend[0].querySelector('span:nth-child(2)').textContent='مكتمل'}
    if(legend[1]){legend[1].querySelector('strong').textContent=n(active);legend[1].querySelector('span:nth-child(2)').textContent='نشط'}
    if(legend[2])legend[2].hidden=true;
  }
  const alerts=document.querySelector('.alerts-panel');
  if(alerts){
    const items=[...alerts.querySelectorAll('.alert')];
    if(items[0]){items[0].querySelector('strong').textContent='تكليفات تقترب من موعدها';items[0].querySelector('p').textContent=n(data.due_within_7_days)+' تكليفات موعدها خلال ٧ أيام.'}
    if(items[1])items[1].hidden=true;
    const count=alerts.querySelector('.count');if(count)count.textContent=Number(data.due_within_7_days||0)>0?'١':'٠';
    const foot=alerts.querySelector('.panel-foot');if(foot)foot.textContent='التنبيهات هنا مبنية على تكليفات الشركة فقط.';
  }
  const assignments=document.querySelector('.assignments');
  if(assignments){
    assignments.querySelector('.table-scroll')?.setAttribute('hidden','');
    const foot=assignments.querySelector('.table-foot');
    if(foot)foot.textContent='تفاصيل قائمة التكليفات ستظهر بعد ربط استعلام القائمة. المؤشرات أعلاه فعلية ولا تشمل التعلم الشخصي.';
  }
});
window.addEventListener('kfo:company-error',event=>{
  if(scenario)scenario.closest('.scenario').hidden=true;
  content.hidden=true;statePanel.hidden=false;actionBar.hidden=true;retry.hidden=true;
  document.querySelector('#state-title').textContent='تعذر تحميل بيانات الشركة';
  document.querySelector('#state-copy').textContent=event.detail?.message||'لم نعرض بيانات توضيحية بدل البيانات الفعلية.';
});
