import {createClient} from '@supabase/supabase-js';
import {endAccountSession} from './account-actions.mjs';
const buttons=[...document.querySelectorAll('[data-account-exit]')];
if(buttons.length){
 const client=createClient('https://ktkdcfxeaicbykdurlfg.supabase.co','sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
 let busy=false;
 buttons.forEach(button=>button.addEventListener('click',async()=>{
  if(busy)return;busy=true;buttons.forEach(b=>b.disabled=true);
  const status=document.querySelector('#account-action-status');
  if(status)status.textContent='جارٍ إنهاء الجلسة…';
  try{await endAccountSession(client,{switchAccount:button.dataset.accountExit==='switch',storage:sessionStorage,navigate:path=>location.replace(path)})}
  catch(error){if(status)status.textContent=error.message;busy=false;buttons.forEach(b=>b.disabled=false)}
 }));
}
