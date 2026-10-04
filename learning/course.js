const search = document.querySelector('#course-search');
if (search) {
  const cards = [...document.querySelectorAll('[data-course-card]')];
  const normalize = (value) => value.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').toLocaleLowerCase('ar');
  search.addEventListener('input', () => {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const card of cards) {
      const text = normalize(card.dataset.search);
      card.hidden = !terms.every((term) => text.includes(term));
      if (!card.hidden) count++;
    }
    document.querySelector('#course-count').textContent = `${count} دورات`;
    document.querySelector('#search-empty').hidden = count !== 0;
  });
}

const form = document.querySelector('#self-check');
if (form) {
  const questions = [...form.querySelectorAll('[data-question]')];
  const result = document.querySelector('#review-result');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    let correct = 0;
    for (const question of questions) {
      const selected = question.querySelector('input:checked');
      const matched = selected.value === question.dataset.correct;
      if (matched) correct++;
      const feedback = question.querySelector('.answer-feedback');
      feedback.hidden = false;
      feedback.dataset.kind = matched ? 'correct' : 'review';
      feedback.textContent = `${matched ? 'إجابة صحيحة.' : 'راجع هذه الفكرة.'} ${feedback.dataset.explanation}`;
    }
    result.hidden = false;
    result.textContent = `أجبت عن ${correct} من ${questions.length} أسئلة بشكل صحيح. اقرأ التفسيرات وارجع إلى الدروس عند الحاجة.`;
    result.focus();
  });
  form.addEventListener('reset', () => {
    result.hidden = true;
    for (const question of questions) question.querySelector('.answer-feedback').hidden = true;
  });
}

const lessonLinks = [...document.querySelectorAll('.course-sidebar a')];
if (lessonLinks.length) {
  const updateCurrent = () => {
    const current = window.location.hash || '#overview';
    for (const link of lessonLinks) {
      if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  window.addEventListener('hashchange', updateCurrent);
  updateCurrent();
}
