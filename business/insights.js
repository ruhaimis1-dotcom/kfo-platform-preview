const menu = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
function closeMenu() {
  sidebar.classList.remove('open');
  document.body.classList.remove('menu-open');
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  const open = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu();
});
const toast = document.querySelector('#toast');
let toastTimer;
document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
  toast.textContent = `${button.dataset.preview}: مستند توضيحي غير متاح للتنزيل في هذه المعاينة.`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}));
if (document.querySelector('[data-page=reports]')) {
  const search = document.querySelector('#report-search');
  const kind = document.querySelector('#report-kind');
  const rows = [...document.querySelectorAll('#report-rows tr')];
  const empty = document.querySelector('#report-empty');
  function filter() {
    const q = search.value.trim().toLocaleLowerCase('ar');
    let visible = 0;
    rows.forEach(row => {
      row.hidden = (kind.value !== 'all' && row.dataset.kind !== kind.value)
        || Boolean(q && !row.dataset.title.toLocaleLowerCase('ar').includes(q));
      if (!row.hidden) visible += 1;
    });
    empty.hidden = visible > 0;
  }
  search.addEventListener('input', filter);
  kind.addEventListener('change', filter);
}
if (document.querySelector('[data-page=orders]')) {
  const tabs = [...document.querySelectorAll('.insight-tabs button')];
  const rows = [...document.querySelectorAll('#order-rows tr')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(item => item.setAttribute('aria-selected', String(item === tab)));
    rows.forEach(row => { row.hidden = tab.dataset.filter !== 'all' && row.dataset.state !== tab.dataset.filter; });
  }));
  const dialog = document.querySelector('#order-dialog');
  const close = document.querySelector('#order-dialog-close');
  let returnFocus;
  rows.forEach(row => row.querySelector('.insight-detail').addEventListener('click', () => {
    returnFocus = document.activeElement;
    const content = document.querySelector('#order-dialog-copy');
    content.replaceChildren();
    const summary = document.createElement('p');
    summary.textContent = `الطلب ${row.dataset.order}: ${row.dataset.seats} مقعدًا لدورة ${row.dataset.course}، بقيمة توضيحية ${row.dataset.amount}.`;
    const state = document.createElement('p');
    state.className = row.dataset.state === 'pending' ? 'insight-status-note' : '';
    state.textContent = row.dataset.state === 'paid'
      ? 'الدفع مؤكد في المثال، والفاتورة متاحة عند التنفيذ الفعلي بعد التحقق من السجل المالي.'
      : 'الدفع بانتظار التحقق؛ لا فاتورة صادرة ولا تضاف هذه المقاعد إلى الرصيد.';
    content.append(summary, state);
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    close.focus();
  }));
  function closeDialog() {
    dialog.hidden = true;
    document.body.style.overflow = '';
    returnFocus?.focus();
  }
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.hidden) closeDialog(); });
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
