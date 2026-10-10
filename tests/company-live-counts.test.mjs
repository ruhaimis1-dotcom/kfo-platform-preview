import test from 'node:test';
import assert from 'node:assert/strict';
import {browserFixture,runController} from './helpers/browser-script.mjs';

test('live employee hydration replaces preview metrics and clears unsupported counts',async()=>{
 const ui=browserFixture(),metrics=[0,1,2].map(i=>ui.get('metric'+i));
 metrics.forEach(m=>m.querySelector('strong').textContent='١٢٨');
 ui.document.querySelectorAll=s=>s==='.d1-overview .d1-stat'?metrics:[];
 ui.get('#team-filter').value='all';ui.get('#status-filter').value='all';
 ui.window.kfoCompanyLive={'kfo:company-members':{data:[{membership_id:'a',membership_status:'active'},{membership_id:'b',membership_status:'inactive'},{membership_id:'c',membership_status:'active'}]}};
 await runController('business/employees.js',{...ui,Option:class{constructor(text,value){this.text=text;this.value=value}}});
 assert.equal(metrics[0].querySelector('strong').textContent,'٢');
 assert.equal(metrics[0].querySelector('small').textContent,'ضمن نطاق إدارتك');
 assert.equal(metrics[1].querySelector('strong').textContent,'—');
 assert.equal(metrics[2].querySelector('strong').textContent,'—');
 assert.equal(ui.get('.d1-footnote').textContent,'تعرض القائمة عضويات الشركة ضمن نطاق إدارتك.');
 assert.equal(ui.get('#teams-panel .d1-count').textContent,'دليل الفرق قيد التجهيز');
});

test('live dashboard assignment count follows server data instead of sample rows',async()=>{
 const ui=browserFixture();
 ui.window.kfoCompanyLive={'kfo:company-dashboard':{data:{assignments:0}}};
 await runController('business/business.js',ui);
 assert.equal(ui.get('.assignments').querySelector('.quiet').textContent,'٠ تكليفًا مؤسسيًا');
 ui.window.dispatchEvent({type:'kfo:company-dashboard',detail:{data:{assignments:7}}});
 assert.equal(ui.get('.assignments').querySelector('.quiet').textContent,'٧ تكليفًا مؤسسيًا');
 assert.equal(ui.get('.metrics')['aria-label'],'مؤشرات تدريب الشركة');
});

test('live report captions and certificate badge follow totals including empty state',async()=>{
 const ui=browserFixture(),captions=[0,1,2].map(i=>ui.get('caption'+i));
 ui.document.querySelectorAll=s=>s==='.insight-metrics .flow-metric small'?captions:[];
 ui.document.querySelector=s=>s==='[data-page=orders]'?null:ui.get(s);
 ui.window.kfoCompanyLive={'kfo:company-report':{report:[{course_slug:'customer-service-reference',total_assignments:7,completed_assignments:2,active_assignments:5}],certificates:[{course_slug:'customer-service-reference',certificate_code:'QA'}]}};
 await runController('business/insights.js',{...ui,setTimeout,clearTimeout});
 assert.equal(captions[1].textContent,'من أصل ٧ تكليفًا');
 assert.equal(ui.get('.insight-badge').textContent,'١ شهادة في السجل');
 ui.window.dispatchEvent({type:'kfo:company-report',detail:{report:[],certificates:[]}});
 assert.equal(captions[1].textContent,'من أصل ٠ تكليفًا');
 assert.equal(ui.get('.insight-badge').textContent,'٠ شهادة في السجل');
 assert.equal(ui.get('.insight-metrics')['aria-label'],'مؤشرات تدريب الشركة');
});
