import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateContent } from '../learning/content-contract.mjs';
import { renderCatalogue, renderCourse } from '../learning/render.mjs';

const content = JSON.parse(await readFile(new URL('../content/free-courses.json', import.meta.url), 'utf8'));
test('initial Arabic course pack contains complete lessons, practice and review explanations', () => {
  const courses = validateContent(content);
  assert.equal(courses.length, 3);
  for (const course of courses) {
    assert.equal(course.lessons.length, 4);
    assert.equal(course.assessment.questions.length, 8);
    for (const lesson of course.lessons) {
      const words = lesson.body.join(' ').trim().split(/\s+/).length;
      assert.ok(words >= 300, `${course.slug}/${lesson.id} has only ${words} words`);
      assert.ok(/[\u0600-\u06ff]/.test(lesson.body.join(' ')));
      assert.ok(lesson.exercise.length > 30);
    }
    for (const question of course.assessment.questions) assert.ok(question.explanation.length > 30);
  }
});
test('course import rejects unsafe routes, duplicate lesson identity and invalid answers', () => {
  for (const mutate of [
    c => { c.courses[0].slug = '../workspace'; },
    c => { c.courses.push(c.courses[0]); },
    c => { c.courses[0].lessons[1].id = c.courses[0].lessons[0].id; },
    c => { c.courses[0].assessment.questions[0].correctIndex = 999; },
    c => { c.courses[0].lessons[0].body = []; },
  ]) {
    const changed = structuredClone(content); mutate(changed);
    assert.throws(() => validateContent(changed));
  }
});
test('course rendering treats lesson and question content as text rather than HTML', () => {
  const course = structuredClone(content.courses[0]);
  const attack = '<img src=x onerror="alert(1)">';
  course.title = attack; course.lessons[0].body[0] = attack;
  course.assessment.questions[0].options[0] = attack;
  course.assessment.questions[0].explanation = attack;
  for (const html of [renderCatalogue([course]), renderCourse(course)]) {
    assert.equal(html.includes(attack), false);
    assert.ok(html.includes('&lt;img'));
  }
});
test('every published course has reachable lesson anchors and a clearly formative review', () => {
  for (const course of content.courses) {
    const html = renderCourse(course);
    for (const lesson of course.lessons) assert.ok(html.includes(`id="lesson-${lesson.id}"`));
    assert.ok(html.includes('مراجعة ذاتية'));
    assert.ok(html.includes('لا تمنح شهادة'));
    assert.equal(html.includes('localStorage'), false);
  }
});
