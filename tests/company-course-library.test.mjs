import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceCourseSummary} from '../business/course-library-data.mjs';
test('reference course counts exclude unrelated courses and versions',()=>{
  assert.deepEqual(referenceCourseSummary([
    {course_slug:'qa-private-file-20261010',course_version:1,total_assignments:99},
    {course_slug:'customer-service-reference',course_version:2,total_assignments:42},
    {course_slug:'customer-service-reference',course_version:1,total_assignments:'3',active_assignments:'2',completed_assignments:'1'}
  ]),{total:3,active:2,completed:1});
  assert.deepEqual(referenceCourseSummary([]),{total:0,active:0,completed:0});
});
test('invalid course count payloads fail instead of showing false counts',()=>{
  assert.throws(()=>referenceCourseSummary(null));
  for(const fields of [
    {total_assignments:-1,active_assignments:0,completed_assignments:0},
    {total_assignments:1,active_assignments:2,completed_assignments:0},
    {total_assignments:'bad',active_assignments:0,completed_assignments:0}
  ])assert.throws(()=>referenceCourseSummary([{course_slug:'customer-service-reference',course_version:1,...fields}]));
});

import {loadAssignableCourses,renderAssignableLibrary} from '../business/course-library-data.mjs';
import {browserFixture} from './helpers/browser-script.mjs';
test('assignable library validates course versions and duplicates and fails closed on RPC errors',async()=>{const row={course_slug:'excel-basics',course_version:1,title:'أساسيات Excel'};const client=data=>({rpc:async(name,args)=>{assert.equal(name,'company_assignable_courses');assert.equal(args.p_organization_id,'org');return {data}}});assert.deepEqual(await loadAssignableCourses(client([row]),'org'),[row]);for(const data of [null,[row,row],[{...row,course_version:'1'}],[{...row,course_slug:'<script>'}]])await assert.rejects(loadAssignableCourses(client(data),'org'));await assert.rejects(loadAssignableCourses({rpc:async()=>({error:{message:'denied'}})},'org'))});
test('library cards escape titles through text nodes and preserve exact course/version links',()=>{const ui=browserFixture();renderAssignableLibrary(ui.document,[{course_slug:'excel-basics',course_version:2,title:'<img onerror=alert(1)>'}]);const card=ui.get('#course-grid').children[0];assert.equal(card.innerHTML,'');assert.equal(card.children[0].children[0].textContent,'<img onerror=alert(1)>');assert.equal(card.children[0].children[2].href,'/business/assignments?course=excel-basics&version=2');renderAssignableLibrary(ui.document,[]);assert.equal(ui.get('#course-grid').children.length,0);assert.equal(ui.get('#course-empty').hidden,false)});
