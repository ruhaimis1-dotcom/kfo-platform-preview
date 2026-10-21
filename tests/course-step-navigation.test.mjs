import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../learning/course.js',import.meta.url),'utf8');
test('course step navigation displays one section and falls back safely',()=>{
 const sections=['overview','lesson-one','summary','review'].map(id=>({id,hidden:false}));const cover={hidden:false};const links=sections.map(s=>({getAttribute:()=> '#'+s.id,setAttribute(n,v){this[n]=v},removeAttribute(n){delete this[n]}}));const events={};let scrolls=0;
 const document={querySelector(s){return s==='.course-reading > .course-cover'?cover:s==='.course-reading'?{scrollIntoView(){scrolls++}}:null},querySelectorAll(s){return s==='.course-sidebar a'?links:s==='.course-reading > section'?sections:[]}};
 const window={location:{hash:'#lesson-one'},addEventListener:(name,fn)=>events[name]=fn};vm.runInNewContext(source,{document,window});assert.deepEqual(sections.filter(s=>!s.hidden).map(s=>s.id),['lesson-one']);assert.equal(cover.hidden,true);window.location.hash='#unknown';events.hashchange();assert.deepEqual(sections.filter(s=>!s.hidden).map(s=>s.id),['overview']);assert.equal(cover.hidden,false);assert.equal(scrolls,1);
});
