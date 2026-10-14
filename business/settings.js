const menu = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
function closeMenu(){sidebar.classList.remove('open');document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=!sidebar.classList.contains('open');sidebar.classList.toggle('open',open);document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open))});
document.addEventListener('click',event=>{if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!menu.contains(event.target))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});

function showCompanyProfile(context){const name=document.querySelector('#settings-company-name'),edit=document.querySelector('#settings-edit-name');if(!context?.organizationId)return;name.textContent=context.name||'اسم الشركة غير متاح';edit.hidden=true;edit.removeAttribute('href');if(context.canManageSettings){edit.href='/company/settings?organization='+encodeURIComponent(context.organizationId);edit.hidden=false}}
window.addEventListener('kfo:company-context',event=>showCompanyProfile(event.detail));
if(document.body.dataset.organizationId)showCompanyProfile({organizationId:document.body.dataset.organizationId,name:document.body.dataset.companyName,canManageSettings:document.body.dataset.companySettingsManage==='true'});
