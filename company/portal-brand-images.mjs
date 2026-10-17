import {validBrandKey} from './brand-images.mjs';
export async function loadPortalImageUrls(client,organizationId,branding){
 const {data:identity,error}=await client.auth.getUser();if(error||!identity?.user?.id||branding?.organization_id!==organizationId)throw Error('images unavailable');
 const result={};for(const kind of ['logo','cover']){const key=branding[kind+'_object_key'];if(key===null||key===undefined)continue;if(!validBrandKey(key,organizationId,kind))throw Error('invalid tenant image');
  const {data,error:signError}=await client.storage.from('kfo-company-brand').createSignedUrl(key,300);if(signError)continue;
  const url=new URL(data?.signedUrl);if(url.protocol!=='https:'||url.hostname!=='ktkdcfxeaicbykdurlfg.supabase.co'||url.port||url.username||url.password||url.pathname!=='/storage/v1/object/sign/kfo-company-brand/'+key)throw Error('invalid image URL');result[kind]=url.href;
 }
 const {data:latest,error:authError}=await client.auth.getUser();if(authError||latest?.user?.id!==identity.user.id)throw Error('session changed');return result;
}
export function applyPortalImages({document,organizationId,urls}){
 if(document.body.dataset.organizationId!==organizationId)return;
 for(const [kind,selector] of [['logo','.tenant'],['cover','main']]){if(!urls[kind])continue;const parent=document.querySelector(selector);if(!parent)continue;const image=document.createElement('img');image.className='company-portal-'+kind;image.alt=kind==='logo'?'شعار الشركة':'غلاف الشركة';image.addEventListener('error',()=>{image.hidden=true;image.removeAttribute('src')});image.src=urls[kind];parent.prepend(image)}
}
