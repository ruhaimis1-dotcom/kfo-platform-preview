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
  let liveMode=false;
  let courses = {
    customer: { name: 'أساسيات تجربة العميل', seats: 12, slug:null, version:1 },
    safety: { name: 'السلامة في بيئة العمل', seats: 8, slug:null, version:1 },
    communication: { name: 'مهارات التواصل المهني', seats: 4, slug:null, version:1 },
    onboarding: { name: 'دليل الانضمام للشركة', seats: null, slug:null, version:1 },
    policy: { name: 'سياسات العمل الداخلية', seats: null, slug:null, version:1 },
  };
  const teamSizes = { operations: 34, sales: 28, support: 22 };
  const select = document.querySelector('#assign-course');
  const scope = [...document.querySelectorAll('input[name=scope]')];
  const people = document.querySelector('#assign-people');
  const team = document.querySelector('#assign-team');
  const teamSelect = document.querySelector('#team-choice');
  const deadline = document.querySelector('#assign-deadline');
  const action = document.querySelector('#review-button');
  const dialog = document.querySelector('#flow-confirm');
  const close = document.querySelector('#confirm-close');
  let returnFocus;

  const today = new Date();
  const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  deadline.min = localDate(today);
  if (deadline.value <= deadline.min) {
    const next = new Date(today);
    next.setDate(next.getDate() + 17);
    deadline.value = localDate(next);
  }
  const arabicDate = value => value
    ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
    : 'لم يُحدَّد موعد';
  const boxes=()=>[...people.querySelectorAll('input[type=checkbox]')];

  function updateReview() {
    const isTeam = scope.find(radio => radio.checked)?.value === 'team';
    people.hidden = isTeam;
    team.hidden = !isTeam;
    const chosen = courses[select.value];
    const selected = boxes().filter(box => box.checked).map(box => box.value);
    const count = isTeam ? teamSizes[teamSelect.value] : selected.length;
    const needsSeat = !liveMode && chosen?.seats !== null;
    const sufficient = liveMode || !needsSeat || count <= chosen.seats;
    const validDate = Boolean(deadline.value) && deadline.value >= deadline.min;
    const valid = Boolean(chosen) && count > 0 && validDate && sufficient && (!liveMode || !isTeam);
    document.querySelector('#review-course').textContent = chosen?.name||'—';
    document.querySelector('#review-people').textContent = isTeam ? teamSelect.selectedOptions[0]?.textContent||'فريق'
      : selected.length === 1 ? 'موظف واحد' : selected.length === 2 ? 'موظفان' : selected.length ? `${selected.length.toLocaleString('ar-SA')} موظفين` : 'لم يُحدَّد موظف';
    document.querySelector('#review-date').textContent = arabicDate(deadline.value);
    document.querySelector('#review-needed').textContent = liveMode ? count.toLocaleString('ar-SA') : needsSeat ? count.toLocaleString('ar-SA') : 'لا يلزم مقعد';
    document.querySelector('#review-available').textContent = liveMode ? 'يُتحقق عند الإسناد' : needsSeat ? chosen.seats.toLocaleString('ar-SA') : 'محتوى الشركة';
    const note = document.querySelector('#review-note');
    note.classList.toggle('warning', !valid);
    note.textContent = !count ? 'اختر موظفًا واحدًا على الأقل.'
      : liveMode && isTeam ? 'تكليف فريق كامل ينتظر ربط دليل الفرق؛ استخدم موظفين محددين الآن.'
      : !validDate ? 'حدد موعدًا نهائيًا من اليوم أو بعده.'
      : !sufficient ? 'الرصيد لهذه الدورة لا يكفي للمستفيدين المختارين.'
      : liveMode ? 'سيظهر التدريب للموظفين المختارين ضمن تدريب الشركة.'
      : needsSeat ? 'الرصيد كافٍ في هذه المعاينة.'
      : 'هذا محتوى خاص بالشركة؛ لا يستهلك مقاعد دورات كفو.';
    action.disabled = !valid;
  }

  function bindInputs(){
    [select, teamSelect, deadline, ...scope, ...boxes()].forEach(input => {
      if(!input.dataset.bound){input.addEventListener('change', updateReview);input.dataset.bound='1'}
    });
  }
  function hydrateMembers(payload){
    const members=payload?.data;
    if(!Array.isArray(members))return;
    liveMode=true;
    courses={
      'customer-service-reference':{
        name:'خدمة العملاء: من الفهم إلى الأثر',seats:null,slug:'customer-service-reference',version:1
      }
    };
    select.replaceChildren(new Option('خدمة العملاء: من الفهم إلى الأثر','customer-service-reference'));
    people.replaceChildren();
    for(const member of members){
      const label=document.createElement('label');
      const input=document.createElement('input');
      input.type='checkbox';input.value=member.membership_id;
      const name=(member.display_name||'عضو الشركة').trim();
      label.append(input,document.createTextNode(' '+name+' '));
      const small=document.createElement('small');
      small.textContent=member.branch_id?'ضمن فرع محدد':'على مستوى الشركة';
      label.append(small);people.append(label);
    }
    const teamRadio=scope.find(x=>x.value==='team');
    if(teamRadio){teamRadio.disabled=true;teamRadio.checked=false}
    const peopleRadio=scope.find(x=>x.value==='people');if(peopleRadio)peopleRadio.checked=true;
    team.hidden=true;people.hidden=false;
    action.textContent='إسناد التدريب';
    const head=document.querySelector('#assignment-form .flow-panel-head p');
    if(head)head.textContent='اختر الموظفين وحدد الموعد النهائي لإسناد التدريب.';
    document.querySelectorAll('.preview-note').forEach(note=>note.textContent='المستفيدون محدثون حسب أعضاء الشركة المتاحين لك.');
    bindInputs();updateReview();
  }

  action.addEventListener('click', async () => {
    updateReview();
    if (action.disabled) return;
    const chosen=courses[select.value];
    const selected=boxes().filter(box=>box.checked).map(box=>box.value);
    returnFocus = document.activeElement;
    if(liveMode){
      action.disabled=true;
      const note=document.querySelector('#review-note');
      note.textContent='جارٍ إنشاء التكليف…';
      try{
        const rows=await window.kfoAssignCompanyCourse({
          membershipIds:selected,
          courseSlug:chosen.slug,
          courseVersion:chosen.version,
          dueAt:deadline.value?`${deadline.value}T23:59:59Z`:null
        });
        document.querySelector('#confirm-title').textContent='تم إنشاء التكليف';
        document.querySelector('#confirm-copy').textContent=`تم إنشاء ${rows.length.toLocaleString('ar-SA')} تكليفًا مؤسسيًا. سيظهر للموظفين في تعلمهم الوظيفي.`;
        dialog.hidden=false;document.body.style.overflow='hidden';close.focus();
      }catch(error){
        note.classList.add('warning');
        note.textContent=error?.message||'تعذر إنشاء التكليف.';
      }finally{updateReview()}
      return;
    }
    document.querySelector('#confirm-copy').textContent = `دورة: ${document.querySelector('#review-course').textContent}؛ المستفيدون: ${document.querySelector('#review-people').textContent}؛ الموعد النهائي: ${arabicDate(deadline.value)}. هذه معاينة تصميم فقط.`;
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
  window.addEventListener('kfo:company-members',event=>hydrateMembers(event.detail));
  if(window.kfoCompanyLive?.['kfo:company-members'])hydrateMembers(window.kfoCompanyLive['kfo:company-members']);
  bindInputs();updateReview();
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
