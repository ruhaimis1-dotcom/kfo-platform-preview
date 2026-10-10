let people = [
  {name:'نورة العتيبي', detail:'noura@example.com', team:'خدمة العملاء', branch:'الرياض', state:'active', course:'تكليفان جاريان', initial:'ن'},
  {name:'أحمد القحطاني', detail:'ahmad@example.com', team:'العمليات', branch:'الرياض', state:'active', course:'تكليف جارٍ', initial:'أ'},
  {name:'ريم الحربي', detail:'reem@example.com', team:'المبيعات', branch:'جدة', state:'active', course:'تكليف يقترب موعده', initial:'ر'},
  {name:'خالد الدوسري', detail:'khalid@example.com', team:'العمليات', branch:'الدمام', state:'active', course:'لم يبدأ التدريب', initial:'خ'},
  {name:'سارة الفهد', detail:'sara@example.com', team:'الموارد البشرية', branch:'الرياض', state:'pending', course:'لم تُقبل الدعوة بعد', initial:'س'},
];
let liveMode=false;
const teams = [['العمليات',34],['المبيعات',28],['خدمة العملاء',22],['الموارد البشرية',18],['المالية',14],['التقنية',12]];
const rows = document.querySelector('#employee-rows');
const count = document.querySelector('#result-count');
const search = document.querySelector('#employee-search');
const team = document.querySelector('#team-filter');
const status = document.querySelector('#status-filter');
const empty = document.querySelector('#empty-results');
const safe = value => { const node = document.createElement('span'); node.textContent = value ?? ''; return node.innerHTML; };

function renderPeople(){
  const q = search.value.trim().toLocaleLowerCase('ar');
  const matches = people.filter(person => (team.value === 'all' || person.team === team.value)
    && (status.value === 'all' || person.state === status.value)
    && (!q || (person.name+' '+person.detail).toLocaleLowerCase('ar').includes(q)));
  rows.innerHTML = matches.map(person => `<tr data-membership-id="${safe(person.membershipId||'')}"><td><span class="person"><span class="initials" aria-hidden="true">${safe(person.initial)}</span><span><strong>${safe(person.name)}</strong><small>${safe(person.detail)}</small></span></span></td><td data-label="الفريق">${safe(person.team)}</td><td data-label="الفرع">${safe(person.branch)}</td><td data-label="العضوية"><span class="status ${person.state === 'active' ? 'done' : 'due'}">${person.state === 'active' ? 'نشط' : 'غير نشط'}</span></td><td data-label="تدريب الشركة">${safe(person.course)}</td></tr>`).join('');
  const filtered = Boolean(q) || team.value !== 'all' || status.value !== 'all';
  count.textContent = liveMode
    ? (matches.length ? `${matches.length.toLocaleString('ar-SA')} عضوًا ضمن نطاق صلاحيتك` : 'لا توجد نتائج')
    : (!filtered ? 'أمثلة من الموظفين' : matches.length ? `نتائج البحث: ${matches.length.toLocaleString('ar-SA')}` : 'لا توجد نتائج');
  empty.hidden = matches.length > 0;
}
function renderPreviewTeams(){
  document.querySelector('#team-grid').innerHTML=teams.map(([name,total])=>`<article class="team-card"><div class="team-icon" aria-hidden="true"><svg class="icon"><use href="#i-users"/></svg></div><h3>${safe(name)}</h3><p>فريق ضمن الشركة النموذجية</p><strong>${total.toLocaleString('ar-SA')} موظفًا</strong></article>`).join('');
}
function hydrateMembers(payload){
  const members=payload?.data;
  if(!Array.isArray(members))return;
  liveMode=true;
  const summary=document.querySelector('.d1-overview');
  summary?.setAttribute('aria-label','ملخص عضويات الشركة ضمن صلاحيتك');
  const metrics=[...document.querySelectorAll('.d1-overview .d1-stat')];
  if(metrics[0]){
    metrics[0].querySelector('span').textContent='أعضاء نشطون';
    metrics[0].querySelector('strong').textContent=members.filter(m=>m.membership_status==='active').length.toLocaleString('ar-SA');
    metrics[0].querySelector('small').textContent='ضمن نطاق إدارتك';
  }
  for(const index of [1,2])if(metrics[index]){
    metrics[index].querySelector('strong').textContent='—';
    metrics[index].querySelector('small').textContent=index===1?'سجل الدعوات قيد التجهيز':'دليل الفرق قيد التجهيز';
  }
  const foot=document.querySelector('.d1-footnote');
  if(foot)foot.textContent='تعرض القائمة عضويات الشركة ضمن نطاق إدارتك.';
  const teamCount=document.querySelector('#teams-panel .d1-count');
  if(teamCount)teamCount.textContent='دليل الفرق قيد التجهيز';
  const teamCopy=document.querySelector('#teams-panel .d1-panel-head p');
  if(teamCopy)teamCopy.textContent='سيظهر هيكل الفرق عند اكتمال ربط الفروع والأقسام.';
  people=members.map(member=>{
    const name=(member.display_name||'عضو الشركة').trim();
    return {
      membershipId:member.membership_id,
      name,
      detail:member.headline||'عضوية شركة',
      team:member.department_id?'قسم محدد':'بدون قسم محدد',
      branch:member.branch_id?'فرع محدد':'على مستوى الشركة',
      state:member.membership_status||'active',
      course:'عرض التدريب من التقارير',
      initial:name.charAt(0)||'م'
    };
  });
  const labels=['بدون قسم محدد','قسم محدد'].filter(label=>people.some(p=>p.team===label));
  team.replaceChildren(new Option('كل الأقسام','all'),...labels.map(label=>new Option(label,label)));
  document.querySelector('#team-grid').innerHTML='<article class="team-card"><div class="team-icon" aria-hidden="true"><svg class="icon"><use href="#i-users"/></svg></div><h3>هيكلة الفرق</h3><p>سيظهر توزيع الفروع والأقسام هنا عند اكتمال ربط الهيكل التنظيمي.</p><strong>'+people.length.toLocaleString('ar-SA')+' عضوًا</strong></article>';
  document.querySelectorAll('.preview-note').forEach(note=>note.textContent='قائمة الأعضاء محدثة حسب نطاق إدارتك.');
  renderPeople();
}
[search,team,status].forEach(control => control.addEventListener('input',renderPeople));
document.querySelector('#clear-filters').addEventListener('click',()=>{search.value='';team.value='all';status.value='all';renderPeople();search.focus()});
renderPreviewTeams();
const employeesTab=document.querySelector('#employees-tab'),teamsTab=document.querySelector('#teams-tab');
function showTab(which){const isEmployees=which==='employees';employeesTab.setAttribute('aria-selected',String(isEmployees));teamsTab.setAttribute('aria-selected',String(!isEmployees));document.querySelector('#employees-panel').hidden=!isEmployees;document.querySelector('#teams-panel').hidden=isEmployees;}
employeesTab.addEventListener('click',()=>showTab('employees'));teamsTab.addEventListener('click',()=>showTab('teams'));
const sidebar=document.querySelector('#sidebar'), menu=document.querySelector('.menu-button');
const closeMenu=()=>{sidebar.classList.remove('open');document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')};
menu.addEventListener('click',()=>{const open=!sidebar.classList.contains('open');sidebar.classList.toggle('open',open);document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open))});
document.addEventListener('click',event=>{if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!menu.contains(event.target))closeMenu()});
const dialog=document.querySelector('#invite-dialog'),open=document.querySelector('#invite-open'),close=document.querySelector('#invite-close'),cancel=document.querySelector('#invite-cancel'),done=document.querySelector('#invite-done'),form=document.querySelector('#invite-form'),confirmation=document.querySelector('#invite-confirm');
let returnFocus;
function showDialog(){returnFocus=document.activeElement;form.reset();form.hidden=false;confirmation.hidden=true;dialog.hidden=false;document.body.style.overflow='hidden';form.elements.name.focus()}
function hideDialog(){dialog.hidden=true;document.body.style.overflow='';returnFocus?.focus()}
open.addEventListener('click',showDialog);[close,cancel,done].forEach(button=>button.addEventListener('click',hideDialog));dialog.addEventListener('click',event=>{if(event.target===dialog)hideDialog()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!dialog.hidden)hideDialog();else closeMenu()}});
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;document.querySelector('#invite-summary').textContent=`${form.elements.name.value.trim()} — ${form.elements.email.value.trim()} — ${form.elements.team.value}. إرسال الدعوة سيتم تفعيله عند اكتمال ربط الدعوات.`;form.hidden=true;confirmation.hidden=false;done.focus()});
window.addEventListener('kfo:company-members',event=>hydrateMembers(event.detail));
if(window.kfoCompanyLive?.['kfo:company-members'])hydrateMembers(window.kfoCompanyLive['kfo:company-members']);
renderPeople();
