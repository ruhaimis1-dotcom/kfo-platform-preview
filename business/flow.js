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

const toast = document.querySelector('#toast');
let toastTimer;
document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
  toast.textContent = `${button.dataset.preview}: إجراء توضيحي غير مفعّل في المعاينة.`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}));

if (document.querySelector('[data-page=courses]')) {
  const search = document.querySelector('#course-search');
  const kind = document.querySelector('#course-kind');
  const cards = [...document.querySelectorAll('.flow-course')];
  const empty = document.querySelector('#course-empty');
  function filterCourses() {
    const query = search.value.trim().toLocaleLowerCase('ar');
    let visible = 0;
    cards.forEach(card => {
      card.hidden = (kind.value !== 'all' && card.dataset.kind !== kind.value)
        || Boolean(query && !card.dataset.title.toLocaleLowerCase('ar').includes(query));
      if (!card.hidden) visible += 1;
    });
    empty.hidden = visible > 0;
  }
  search.addEventListener('input', filterCourses);
  kind.addEventListener('change', filterCourses);
}

if (document.querySelector('[data-page=assignments]')) {
  const courses = {
    customer: { name: 'أساسيات تجربة العميل', seats: 12 },
    safety: { name: 'السلامة في بيئة العمل', seats: 8 },
    communication: { name: 'مهارات التواصل المهني', seats: 4 },
    onboarding: { name: 'دليل الانضمام للشركة', seats: null },
    policy: { name: 'سياسات العمل الداخلية', seats: null },
  };
  const teamSizes = { operations: 34, sales: 28, support: 22 };
  const select = document.querySelector('#assign-course');
  const scope = [...document.querySelectorAll('input[name=scope]')];
  const people = document.querySelector('#assign-people');
  const team = document.querySelector('#assign-team');
  const teamSelect = document.querySelector('#team-choice');
  const deadline = document.querySelector('#assign-deadline');
  const checkboxes = [...people.querySelectorAll('input[type=checkbox]')];
  const action = document.querySelector('#review-button');
  const dialog = document.querySelector('#flow-confirm');
  const close = document.querySelector('#confirm-close');
  let returnFocus;
  const queryCourse = new URLSearchParams(location.search).get('course');
  if (Object.hasOwn(courses, queryCourse)) select.value = queryCourse;

  function updateReview() {
    const isTeam = scope.find(radio => radio.checked)?.value === 'team';
    people.hidden = isTeam;
    team.hidden = !isTeam;
    const chosen = courses[select.value];
    const selected = checkboxes.filter(box => box.checked).map(box => box.value);
    const count = isTeam ? teamSizes[teamSelect.value] : selected.length;
    const needsSeat = chosen.seats !== null;
    const sufficient = !needsSeat || count <= chosen.seats;
    const valid = count > 0 && Boolean(deadline.value) && sufficient;
    document.querySelector('#review-course').textContent = chosen.name;
    document.querySelector('#review-people').textContent = isTeam ? `${teamSelect.selectedOptions[0].textContent}` : selected.length ? `${selected.length.toLocaleString('ar-SA')} موظفين` : 'لم يُحدَّد موظف';
    document.querySelector('#review-date').textContent = deadline.value || 'لم يُحدَّد موعد';
    document.querySelector('#review-needed').textContent = needsSeat ? count.toLocaleString('ar-SA') : 'لا يلزم مقعد';
    document.querySelector('#review-available').textContent = needsSeat ? chosen.seats.toLocaleString('ar-SA') : 'محتوى الشركة';
    const note = document.querySelector('#review-note');
    note.classList.toggle('warning', !valid);
    note.textContent = !count ? 'اختر موظفًا واحدًا على الأقل للمراجعة.'
      : !deadline.value ? 'حدد موعدًا نهائيًا للتكليف.'
      : !sufficient ? 'الرصيد لهذه الدورة لا يكفي للمستفيدين المختارين. قلّل العدد أو راجع شراء مقاعد إضافية.'
      : needsSeat ? 'الرصيد كافٍ في هذه المعاينة. يُتحقق من الاستحقاق والمقاعد الفعلية عند التنفيذ.'
      : 'هذا محتوى خاص بالشركة؛ لا يستهلك مقاعد دورات كفو.';
    action.disabled = !valid;
  }
  [select, teamSelect, deadline, ...scope, ...checkboxes].forEach(input => input.addEventListener('change', updateReview));
  action.addEventListener('click', () => {
    updateReview();
    if (action.disabled) return;
    returnFocus = document.activeElement;
    document.querySelector('#confirm-copy').textContent = `تظهر هنا مراجعة ${document.querySelector('#review-course').textContent} لـ${document.querySelector('#review-people').textContent} حتى ${deadline.value}. لا تُنشئ هذه المعاينة تكليفًا ولا تخصم رصيدًا أو ترسل إشعارًا.`;
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    close.focus();
  });
  function closeDialog() {
    dialog.hidden = true;
    document.body.style.overflow = '';
    returnFocus?.focus();
  }
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.hidden) closeDialog(); });
  updateReview();
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
