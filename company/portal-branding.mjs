import {whiteContrast} from './portal-colors.mjs';
export async function loadPortalBranding(client,organizationId){
 const {data:identity,error}=await client.auth.getUser();if(error||!identity?.user?.id)throw Error('branding unavailable');
 const {data,error:readError}=await client.from('tenant_branding').select('organization_id,portal_name,welcome_copy,primary_color,secondary_color').eq('organization_id',organizationId).maybeSingle();
 const {data:latest,error:authError}=await client.auth.getUser();if(readError||authError||latest?.user?.id!==identity.user.id||!data||data.organization_id!==organizationId)throw Error('branding unavailable');
 return data;
}
export function applyPortalBranding({document,organizationId,branding}){
 if(document.body.dataset.organizationId!==organizationId||branding?.organization_id!==organizationId)return false;
 const text=(v,max)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v)?v.trim():'';
 const portal=text(branding.portal_name,60),welcome=text(branding.welcome_copy,180);
 for(const [key,value] of [['--green',branding.primary_color],['--deep',branding.secondary_color]]){try{if(whiteContrast(value)>=4.5)document.body.style.setProperty(key,value)}catch{}}
 if(portal)document.querySelectorAll('.tenant small').forEach(el=>el.textContent=portal);
 const main=document.querySelector('main');if(main&&welcome){let note=document.querySelector('#company-welcome');if(!note){note=document.createElement('p');note.id='company-welcome';note.className='flow-footnote';main.prepend(note)}note.textContent=welcome}
 return true;
}
