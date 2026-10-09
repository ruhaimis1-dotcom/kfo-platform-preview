import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const home=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('homepage uses approved KFO positioning',()=>{
  for(const text of [
    'طوّر موظفيك وراقب أثر التعلّم على العمل',
    'التدريب لا يكفي إذا ما عرفت أثره',
    'من تحديد الاحتياج إلى قياس الأثر',
    'كل ما تحتاجه لإدارة تطوير فريقك',
    'تجربة تعلم بسيطة وواضحة للموظف',
    'كفو لا يقيس المشاهدة فقط',
    'اعرف أين يقف فريقك الآن',
    'شهادة بعد استيفاء المتطلبات، لا بمجرد المشاهدة'
  ]) assert.equal(home.includes(text),true,text);
});

test('homepage has no fabricated performance metrics or old placeholder copy',()=>{
  for(const text of [
    '92%','248','4.8/5','1,284','صورة أصلية منفصلة عن النص',
    'مؤشر الجاهزية','تعلّم تشغيلي لفريق أكثر جاهزية'
  ]) assert.equal(home.includes(text),false,text);
});

test('homepage avoids decorative arrow CTAs',()=>{
  assert.equal(home.includes('←'),false);
  assert.equal(home.includes('→'),false);
});

test('homepage links real product areas instead of fake embedded dashboards',()=>{
  assert.equal(home.includes('onclick="show('),false);
  assert.equal(home.includes('class="screen"'),false);
  assert.equal(home.includes('href="/catalog"'),true);
  assert.equal(home.includes('href="/login"'),true);
});
