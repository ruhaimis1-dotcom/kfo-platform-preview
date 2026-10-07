import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCompanyDashboard,loadCompanyMembers,loadCompanyTrainingReport,
  loadCompanyCertificates,assignCompanyCourse
} from '../business/company-data.mjs';

function clientFor(result){
  const calls=[];
  return {
    calls,
    rpc:async(name,args)=>{calls.push([name,args]);return typeof result==='function'?result(name,args):result}
  };
}

test('company readers use organization-scoped RPCs',async()=>{
  const c=clientFor({data:[],error:null});
  await loadCompanyMembers(c,'org-1');
  await loadCompanyTrainingReport(c,'org-1');
  await loadCompanyCertificates(c,'org-1');
  assert.deepEqual(c.calls.map(x=>x[0]),[
    'company_member_directory','company_training_report','company_certificate_ledger'
  ]);
  assert.ok(c.calls.every(([,args])=>args.p_organization_id==='org-1'));
});

test('dashboard uses scoped company RPC',async()=>{
  const c=clientFor({data:{active_members:3},error:null});
  const data=await loadCompanyDashboard(c,'org-1');
  assert.equal(data.active_members,3);
  assert.equal(c.calls[0][0],'company_training_dashboard');
});

test('assignment adapter sends membership ids and version without user ids',async()=>{
  const c=clientFor({data:[{enrollment_id:'e1'}],error:null});
  await assignCompanyCourse(c,{organizationId:'org-1',membershipIds:['m1'],courseSlug:'course-a',courseVersion:2,dueAt:null});
  const [name,args]=c.calls[0];
  assert.equal(name,'assign_company_course');
  assert.deepEqual(args.p_membership_ids,['m1']);
  assert.equal(args.p_course_version,2);
  assert.equal(Object.hasOwn(args,'user_id'),false);
});

test('assignment adapter rejects incomplete requests before RPC',async()=>{
  const c=clientFor({data:[],error:null});
  await assert.rejects(()=>assignCompanyCourse(c,{organizationId:'org-1',membershipIds:[],courseSlug:'x',courseVersion:1}),/غير مكتملة/);
  assert.equal(c.calls.length,0);
});

test('RPC errors remain closed',async()=>{
  const c=clientFor({data:null,error:{message:'denied'}});
  await assert.rejects(()=>loadCompanyMembers(c,'org-1'),/تعذر تحميل الموظفين/);
});
