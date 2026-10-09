import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const paths=[
  '../index.html',
  '../auth/auth.css',
  '../auth/workspace.css',
  '../business/business.css',
  '../admin/admin.css',
  '../learning/learning.css',
  '../learning/intelligent-player.css'
];

test('KFO core visual files do not reintroduce prohibited drift colors',async()=>{
  const prohibited=['#D9FF5A','#17251F','#18211D','#103B2E','#267A43'];
  for(const path of paths){
    const content=(await readFile(new URL(path,import.meta.url),'utf8')).toUpperCase();
    for(const token of prohibited){
      assert.equal(content.includes(token),false,`${path} contains ${token}`);
    }
  }
});

test('KFO approved brand tokens remain present in primary surfaces',async()=>{
  const required=['#04180F','#123B32','#205E1E','#419B2A','#F4F6F8','#E7EEE9'];
  for(const path of ['../index.html','../auth/auth.css','../business/business.css','../admin/admin.css','../learning/learning.css','../learning/intelligent-player.css']){
    const content=(await readFile(new URL(path,import.meta.url),'utf8')).toUpperCase();
    for(const token of required){
      assert.equal(content.includes(token),true,`${path} missing ${token}`);
    }
  }
});

test('homepage and login avoid decorative linear gradients',async()=>{
  const home=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const auth=await readFile(new URL('../auth/auth.css',import.meta.url),'utf8');
  assert.equal(/linear-gradient\(/i.test(home),false);
  assert.equal(/radial-gradient\(/i.test(auth),false);
});

test('primary light logo is exactly the approved logo asset',async()=>{
  const approved=await readFile(new URL('../logo-approved.png',import.meta.url));
  const applied=await readFile(new URL('../upload/logo.png',import.meta.url));
  assert.equal(Buffer.compare(approved,applied),0);
});
