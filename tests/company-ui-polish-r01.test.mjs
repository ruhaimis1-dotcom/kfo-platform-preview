import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const files=[
  '../business/dashboard.html',
  '../business/employees.html',
  '../business/assignments.html',
  '../business/reports.html',
  '../business/settings.html',
  '../business/company-runtime.js',
  '../business/company-live.js',
  '../business/business.js',
  '../business/employees.js',
  '../business/flow.js',
  '../business/insights.js'
];

const content=(await Promise.all(files.map(async path=>readFile(new URL(path,import.meta.url),'utf8')))).join('\n');

test('company portal user-facing copy avoids technical integration language',()=>{
  for(const phrase of ['بوابة شركة محمية','بيانات فعلية','Enrollment','معاينة التأكيد','أنشئ تكليفًا توضيحيًا']){
    assert.equal(content.includes(phrase),false,phrase);
  }
});

test('company portal does not use decorative arrow glyph in polished copy',()=>{
  assert.equal(content.includes('←'),false);
  assert.equal(content.includes('→'),false);
});

test('company portal polished headings are present',()=>{
  for(const phrase of ['لوحة التطوير والتدريب','أعضاء الشركة','أنشئ تكليفًا تدريبيًا','تقارير التدريب','إدارة المساحة']){
    assert.equal(content.includes(phrase),true,phrase);
  }
});
