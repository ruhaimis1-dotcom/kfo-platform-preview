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
