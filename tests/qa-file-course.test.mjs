import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {courseSource} from '../learning/course-source.mjs';
import {runtimeState} from '../learning/activity-runtime.mjs';
import {renderActivity} from '../learning/activity-renderer.mjs';
test('temporary file QA route does not change the normal reference course',()=>{
 assert.equal(courseSource('/learn'),'/assets/reference/customer-service-reference.json');
 assert.equal(courseSource('/qa/files'),'/assets/reference/qa-private-file.json');
 assert.equal(courseSource('/qa/other'),'/assets/reference/customer-service-reference.json');
});
test('temporary file QA course uses the same blocked pending-evidence runtime',async()=>{
 const course=JSON.parse(await readFile(new URL('../content/reference/qa-private-file.json',import.meta.url),'utf8'));
 const state=runtimeState(course,[{activity_key:'qa-file',review_status:'pending'}]);
 assert.equal(state.complete,false);assert.equal(state.next.state,'awaiting_review');
 assert.match(renderActivity(course.activities[0]),/type="file"/);
});
