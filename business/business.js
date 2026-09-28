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
  toast.textContent = `${button.dataset.action}: هذا الإجراء يظهر ضمن المعاينة التصميمية وسيفعّل في مرحلة التنفيذ.`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
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
