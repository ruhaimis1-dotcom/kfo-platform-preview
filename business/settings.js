const menu = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
function closeMenu(){sidebar.classList.remove('open');document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=!sidebar.classList.contains('open');sidebar.classList.toggle('open',open);document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open))});
document.addEventListener('click',event=>{if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!menu.contains(event.target))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});

const sections=[...document.querySelectorAll('.settings-panel')];
const links=[...document.querySelectorAll('.settings-nav a')];
function selectSection(){
  const id=decodeURIComponent(location.hash.slice(1));
  const selected=sections.find(section=>section.id===id)||sections[0];
  sections.forEach(section=>{section.hidden=section!==selected});
  links.forEach(link=>{if(link.getAttribute('href')===`#${selected.id}`)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
  document.title=`${selected.dataset.title} — إعدادات الشركة — كفو`;
}
window.addEventListener('hashchange',selectSection);selectSection();

const nameInput=document.querySelector('#portal-name');
const welcomeInput=document.querySelector('#welcome-copy');
const previewName=document.querySelector('#portal-preview-name');
const previewCopy=document.querySelector('#portal-preview-copy');
function updatePreview(){previewName.textContent=nameInput.value.trim()||'أكاديمية الشركة';previewCopy.textContent=welcomeInput.value.trim()||'مرحبًا بك في مساحة التعلم الخاصة بالشركة.'}
[nameInput,welcomeInput].forEach(input=>input.addEventListener('input',updatePreview));
document.querySelector('#reset-brand').addEventListener('click',()=>{nameInput.value='أكاديمية الشركة';welcomeInput.value='مرحبًا بك في مساحة التعلم الخاصة بالشركة.';updatePreview();nameInput.focus()});
