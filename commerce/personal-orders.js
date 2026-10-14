import {createClient} from '@supabase/supabase-js';
import {mountCourseOrders} from './course-orders.mjs';
const client=createClient('https://ktkdcfxeaicbykdurlfg.supabase.co','sb_publishable_P6NrKFErT6ntjXg2UMWbPw_OtRapbiF');
async function main(){const {data,error}=await client.auth.getUser();if(error||!data?.user){location.href='/login';return}await mountCourseOrders({document,client,userId:data.user.id,storage:sessionStorage,generate:()=>crypto.randomUUID()})}
main().catch(error=>{document.querySelector('#course-order-status').textContent=error.message});
