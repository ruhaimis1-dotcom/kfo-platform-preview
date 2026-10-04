// Public teaching content only; this is not an official assessment or enrolment API.
export function validateContent(content) {
  if (content?.version !== 1 || !Array.isArray(content.courses) || !content.courses.length) throw new Error('Invalid course package');
  const slugs = new Set();
  const text = value => typeof value === 'string' && value.trim().length > 0;
  for (const course of content.courses) {
    if (!text(course.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.slug) || course.slug.length > 80 || slugs.has(course.slug)
      || course.version !== 1 || !text(course.title) || !text(course.summary)
      || !Array.isArray(course.objectives) || !course.objectives.length || !course.objectives.every(text)
      || !Array.isArray(course.lessons) || !course.lessons.length) throw new Error('Invalid course');
    slugs.add(course.slug);
    const ids = new Set();
    for (const lesson of course.lessons) {
      if (!text(lesson.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.id) || ids.has(lesson.id) || !text(lesson.title)
        || !Array.isArray(lesson.body) || !lesson.body.length || !lesson.body.every(text) || !text(lesson.exercise)) throw new Error('Invalid lesson');
      ids.add(lesson.id);
    }
    const questions = course.assessment?.questions;
    if (!Array.isArray(questions) || !questions.length) throw new Error('Missing review');
    const questionIds = new Set();
    for (const question of questions) {
      if (!text(question.id) || questionIds.has(question.id) || !text(question.prompt) || !text(question.explanation)
        || !Array.isArray(question.options) || question.options.length < 2 || !question.options.every(text)
        || new Set(question.options).size !== question.options.length || !Number.isInteger(question.correctIndex)
        || question.correctIndex < 0 || question.correctIndex >= question.options.length) throw new Error('Invalid review question');
      questionIds.add(question.id);
    }
  }
  return content.courses;
}
