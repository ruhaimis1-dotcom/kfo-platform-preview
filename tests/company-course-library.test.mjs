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
