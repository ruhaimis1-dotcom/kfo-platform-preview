import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
const html=await readFile(new URL('../learning/player.html',import.meta.url),'utf8');const js=await readFile(new URL('../learning/intelligent-player.js',import.meta.url),'utf8');
test('player exposes skill journey progress coach and focused activity stage',()=>{for(const id of ['skills','activity-nav','progress-value','activity','coach-title','measurement'])assert.match(html,new RegExp('id="'+id+'"'))});
test('player never marks submitted evidence as completed before review',()=>{assert.match(js,/review_status:'pending'/);assert.equal(/review_status:'passed'/.test(js),false)});
test('official assessment is unavailable to public untracked course',()=>{assert.match(js,/التقييم الرسمي متاح فقط من دورة مسجلة في حسابك/)});
test('player coach handles remediation review and completion states',()=>{for(const state of ['remediate','wait_review','complete'])assert.ok(js.includes(state))});
test('player does not pretend MVP draft evidence is persisted remotely',()=>{assert.match(js,/مسودة مراجعة في تجربة الـMVP/)});
