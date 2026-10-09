import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
const js=await readFile(new URL('../auth/workspace.js',import.meta.url),'utf8');
test('workspace does not require SU organization role for independent learner',()=>{assert.equal(/r\.code === 'SU'/.test(js),false);assert.match(js,/loadLearnerHome/);assert.match(js,/Boolean\(home\.profile\) \|\| home\.enrollments\.length > 0/)});
test('workspace distinguishes personal and organization enrollments',()=>{assert.match(js,/context_type === 'organization'/);assert.match(js,/context_type === 'personal'/);assert.match(js,/دورة شخصية/);assert.match(js,/دورة جهة العمل/)});
