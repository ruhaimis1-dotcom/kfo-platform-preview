export const visuals = {
  'work-priorities': {
    alt: 'زميلان يرتبان بطاقات المهام في مكتب سعودي',
    lessonId: 'work-priorities-02', title: 'قيّم الأثر مع الموعد', kind: 'matrix',
    items: [['أثر مرتفع · موعد قريب','ابدأ بها ونسّق الاعتماديات'],['أثر مرتفع · موعد أبعد','احجز لها وقتًا في الخطة'],['أثر أقل · موعد قريب','حدد نطاقًا مناسبًا ونسّق التنفيذ'],['أثر أقل · موعد أبعد','راجع الحاجة قبل تخصيص الوقت']],
    note: 'الترتيب يتغير بحسب أثر التأخر وما يعتمد عليه الآخرون؛ لا تكفي سرعة التنفيذ وحدها.',
    summary: [['وضّح','فعل ومخرج ومستلم وموعد ومعيار قبول'],['رتّب','الأثر والموعد والاعتماديات'],['خطط','نتائج أساسية ومساحة للمقاطعات'],['راجع','المكتمل والعوائق والتحسين التالي']],
  },
  'professional-communication': {
    alt: 'زميلان يتحاوران بانتباه في اجتماع مهني',
    lessonId: 'professional-communication-02', title: 'تحقق من الفهم قبل التنفيذ', kind: 'steps',
    items: [['استمع','اترك مساحة لشرح الطلب'],['اسأل','ابدأ بسؤال مفتوح ثم وضّح التفاصيل'],['أعد الصياغة','لخّص ما فهمته واطلب التصحيح'],['ثبّت الاتفاق','إجراء ومسؤول وموعد']],
    note: 'مثال: فهمت أن المطلوب مراجعة أرقام الفرع قبل الحادية عشرة؛ هل هذا صحيح؟',
    summary: [['اكتب بوضوح','هدف وسياق وطلب وموعد'],['تحقق من الفهم','استماع وأسئلة وإعادة صياغة'],['وثّق التسليم','المكتمل والمتبقي والملفات والعوائق'],['ناقش الوقائع','سلوك وأثر وسؤال وطلب عملي']],
  },
  'customer-service': {
    alt: 'موظفة خدمة عملاء تساعد عميلًا عند مكتب الاستقبال',
    lessonId: 'customer-service-03', title: 'من الشكوى إلى المتابعة', kind: 'steps',
    items: [['استمع وتحقق','اجمع الوقائع وافهم الأثر'],['حدد الخطوة','اعرض إجراءً ضمن صلاحيتك'],['صعّد عند الحاجة','اطلب قرارًا من الجهة المختصة'],['تابع وأغلق','حدّث العميل وتحقق وفق السياسة']],
    note: 'رفع الشكوى ليس حلًا لها. موعد التحديث يختلف عن موعد الحل، ولا يُضمن تعويض دون موافقة.',
    summary: [['افهم الحاجة','تحقق من الطلب عبر القناة المعتمدة'],['اضبط التوقعات','لا تعد بموعد أو قرار غير مؤكد'],['عالج وصعّد','وقائع وأثر وقرار مطلوب وصاحب متابعة'],['تعلّم من التكرار','حسّن سببًا محددًا وقِس أثر التغيير']],
  },
};

export function renderCover(course, compact = false) {
  const visual = visuals[course.slug];
  if (!visual) return '';
  const sizes = compact ? '(max-width:700px) 100vw, (max-width:1000px) 50vw, 33vw' : '(max-width:700px) 100vw, 740px';
  return `<img class="course-cover${compact ? ' card-cover' : ''}" src="/assets/course-images/${course.slug}-960.webp" srcset="/assets/course-images/${course.slug}-480.webp 480w, /assets/course-images/${course.slug}-960.webp 960w" sizes="${sizes}" width="960" height="640" loading="${compact ? 'lazy' : 'eager'}" decoding="async" alt="${visual.alt}">`;
}
export function renderLessonVisual(course, lesson) {
  const visual = visuals[course.slug];
  if (!visual || visual.lessonId !== lesson.id) return '';
  return `<figure class="teaching-visual"><figcaption>${visual.title}</figcaption><ol class="visual-grid ${visual.kind}">${visual.items.map(([title, detail], index) => `<li><span class="visual-number">${index + 1}</span><strong>${title}</strong><p>${detail}</p></li>`).join('')}</ol><p class="visual-note">${visual.note}</p></figure>`;
}
export function renderSummary(course) {
  const visual = visuals[course.slug];
  if (!visual) return '';
  return `<section class="course-summary" id="summary"><span class="eyebrow">احتفظ بالفكرة وطبقها</span><h2>ملخص الدورة</h2><ol class="visual-grid summary-grid">${visual.summary.map(([title, detail], index) => `<li><span class="visual-number">${index + 1}</span><strong>${title}</strong><p>${detail}</p></li>`).join('')}</ol></section>`;
}
