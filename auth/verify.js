import {createClient} from '@supabase/supabase-js';
import {verifyCertificate} from './certificate-verification.mjs';
const client=createClient('https://ktkdcfxeaicbykdurlfg.supabase.co','sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const form=document.querySelector('#verify-form'),code=document.querySelector('#code'),status=document.querySelector('#verify-result'),button=form.querySelector('button');
code.value=new URLSearchParams(location.search).get('code')||'';
form.addEventListener('submit',async event=>{event.preventDefault();if(button.disabled)return;button.disabled=true;status.textContent='جارٍ التحقق…';try{const result=await verifyCertificate(client,code.value);status.textContent=result.status==='valid'?'الشهادة سارية · '+(result.course_title||result.course_slug)+' · إصدار '+result.course_version:result.status==='revoked'?'هذه الشهادة ملغاة.':'لا توجد شهادة متاحة بهذا الرمز.'}catch(error){status.textContent=error.message}finally{button.disabled=false}});
