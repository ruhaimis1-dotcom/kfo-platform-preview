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
  const body = document.querySelector('#report-rows');
  const empty = document.querySelector('#report-empty');
  const courseNames={
    'work-priorities':'تنظيم العمل والأولويات',
    'professional-communication':'التواصل المهني الواضح',
    'customer-service':'أساسيات خدمة العملاء',
    'customer-service-reference':'خدمة العملاء: من الفهم إلى الأثر'
  };
  let reportRows=[...body.querySelectorAll('tr')];

  function filter() {
    const q = search.value.trim().toLocaleLowerCase('ar');
    let visible = 0;
    reportRows.forEach(row => {
      row.hidden = Boolean(q && !row.dataset.title.toLocaleLowerCase('ar').includes(q));
      if (!row.hidden) visible += 1;
    });
    empty.hidden = visible > 0;
  }
  function hydrateReport(payload){
    const report=payload?.report,certificates=payload?.certificates;
    if(!Array.isArray(report)||!Array.isArray(certificates))return;
    body.replaceChildren();
    for(const item of report){
      const title=courseNames[item.course_slug]||item.course_slug;
      const tr=document.createElement('tr');
      tr.dataset.kind='organization';
      tr.dataset.title=title;
      const notStarted=Math.max(0,Number(item.total_assignments||0)-Number(item.active_assignments||0)-Number(item.completed_assignments||0));
      tr.innerHTML=`<td data-label="الدورة"><strong>${title}</strong><small>إصدار ${Number(item.course_version||1).toLocaleString('ar-SA')}</small></td><td data-label="التكليفات">${Number(item.total_assignments||0).toLocaleString('ar-SA')}</td><td data-label="مكتمل">${Number(item.completed_assignments||0).toLocaleString('ar-SA')}</td><td data-label="قيد التعلم">${Number(item.active_assignments||0).toLocaleString('ar-SA')}</td><td data-label="لم يبدأ">${notStarted.toLocaleString('ar-SA')}</td>`;
      body.append(tr);
    }
    reportRows=[...body.querySelectorAll('tr')];
    kind.closest('label').hidden=true;
    const total=report.reduce((s,x)=>s+Number(x.total_assignments||0),0);
    const completed=report.reduce((s,x)=>s+Number(x.completed_assignments||0),0);
    const activeCerts=certificates.filter(x=>!x.revoked_at).length;
    const metrics=[...document.querySelectorAll('.insight-metrics .flow-metric strong')];
    if(metrics[0])metrics[0].textContent=total.toLocaleString('ar-SA');
    if(metrics[1])metrics[1].textContent=completed.toLocaleString('ar-SA');
    if(metrics[2])metrics[2].textContent=activeCerts.toLocaleString('ar-SA');

    const certHost=document.querySelector('.insight-cert-list');
    certHost.replaceChildren();
    for(const cert of certificates){
      const article=document.createElement('article');
      article.className='insight-cert';
      const title=courseNames[cert.course_slug]||cert.course_slug;
      article.innerHTML=`<span class="insight-cert-icon"><svg class="icon" aria-hidden="true"><use href="#i-report"/></svg></span><div><strong></strong><small></small></div><span class="status"></span><button type="button">عرض الرمز</button>`;
      article.querySelector('strong').textContent=cert.display_name||'موظف الشركة';
      article.querySelector('small').textContent=title+' · إصدار '+Number(cert.course_version||1).toLocaleString('ar-SA');
      const state=article.querySelector('.status');
      state.textContent=cert.revoked_at?'ملغاة':'سارية';
      state.classList.add(cert.revoked_at?'due':'done');
      article.querySelector('button').addEventListener('click',()=>{
        toast.textContent='رمز الشهادة: '+cert.certificate_code;
        toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true},3000);
      });
      certHost.append(article);
    }
    if(!certificates.length)certHost.innerHTML='<p class="flow-footnote">لا توجد شهادات مرتبطة بتكليفات الشركة ضمن نطاق صلاحيتك.</p>';
    document.querySelectorAll('.preview-note').forEach(note=>note.textContent='التقارير محدثة لتدريب الشركة فقط.');
    filter();
  }
  search.addEventListener('input', filter);
  kind.addEventListener('change', filter);
  window.addEventListener('kfo:company-report',event=>hydrateReport(event.detail));
  if(window.kfoCompanyLive?.['kfo:company-report'])hydrateReport(window.kfoCompanyLive['kfo:company-report']);
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
