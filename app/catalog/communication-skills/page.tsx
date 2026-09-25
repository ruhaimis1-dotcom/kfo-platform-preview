import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'مهارات التواصل الفعّال | كفو' };

const lessons = [
  ['الوحدة الأولى: أساسيات التواصل', 'مفهوم وأهمية التواصل الفعّال', '20 دقيقة'],
  ['الوحدة الأولى: أساسيات التواصل', 'عناصر عملية التواصل', '25 دقيقة'],
  ['الوحدة الثانية: مهارات الإنصات والحوار', 'مهارات الإنصات الفعّال', '25 دقيقة'],
  ['الوحدة الثالثة: تطبيقات عملية', 'تطبيقات التواصل في بيئة العمل', '30 دقيقة'],
];

export default function CommunicationCoursePage() {
  return <>
    <header className="topbar"><div className="topbar-inner">
      <a className="brand approved-brand" href="/" aria-label="كفو — الرئيسية"><img src="/images/checkpoint/kfo-logo-preview.png" alt="كفو KFO" /></a>
      <nav className="main-nav" aria-label="التنقل الرئيسي"><a href="/">الرئيسية</a><a className="catalog-current" href="/catalog">الدورات</a><a href="/paths">المسارات</a><a href="/business/dashboard">كفو للأعمال</a><a href="/partners">شركاء التدريب</a></nav>
      <div className="top-actions"><a className="button button-primary button-small" href="/register">إنشاء حساب</a><a className="button button-secondary button-small" href="/login">تسجيل الدخول</a></div>
    </div></header>
    <main className="course-detail-page">
      <section className="course-detail-intro"><div className="section-wrap"><p className="catalog-breadcrumb"><a href="/">الرئيسية</a><span>/</span><a href="/catalog">الدورات</a><span>/</span><span>مهارات التواصل الفعّال</span></p><h1>مهارات التواصل الفعّال</h1><p>تعلّم كيف تعبّر عن أفكارك بوضوح وتبني علاقات مهنية أفضل.</p><div className="course-tags"><span>التواصل</span><span>مبتدئ</span><span>العربية</span></div></div></section>
      <div className="course-detail-layout section-wrap">
        <aside className="course-purchase"><strong>149 ر.س</strong><a className="button button-primary" href="/register">اشترِ الدورة</a>
          <dl><div><dt>المدة</dt><dd>4 ساعات</dd></div><div><dt>المستوى</dt><dd>مبتدئ</dd></div><div><dt>اللغة</dt><dd>العربية</dd></div><div><dt>الوصول</dt><dd>12 شهرًا</dd></div></dl>
          <a className="button button-secondary" href="/catalog">أهدِ الدورة</a><a className="button button-secondary" href="/business/dashboard">شراء مقاعد لفريقك</a><p>بيانات الدورة والسعر توضيحية للمعاينة.</p>
        </aside>
        <div className="course-detail-content">
          <div className="course-video-preview"><img src="/images/checkpoint/business-team-preview.jpg" alt="مدربة تشرح مهارات التواصل في بيئة تدريبية" /><span className="play-preview" aria-hidden="true">▶</span></div>
          <section className="course-info-box"><h2>ماذا ستتعلم؟</h2><div className="learning-outcomes"><span>الإنصات الفعّال</span><span>إدارة الحوار</span><span>تقديم الأفكار بوضوح</span><span>تحسين التواصل المهني</span></div></section>
          <section className="course-info-box"><h2>لمن هذه الدورة؟</h2><p>للموظفين وقادة الفرق وكل من يرغب في تطوير تواصله المهني.</p></section>
          <section className="course-info-box"><h2>محتوى الدورة</h2><div className="lesson-list">{lessons.map(([unit, lesson, duration], i) => <div className="lesson-row" key={lesson}><span>{unit}</span><span>{i + 1}.&nbsp; {lesson}</span><small>{duration}</small></div>)}</div></section>
          <div className="course-info-row"><section className="course-info-box"><h2>مقدم التدريب</h2><p>اسم مقدم التدريب<br />نبذة مقدم التدريب تظهر هنا.</p></section><section className="course-info-box"><h2>التقييم والشهادة</h2><p>تصدر الشهادة بعد إكمال الدورة واجتياز التقييم.</p></section></div>
        </div>
      </div>
      <section className="related-courses section-wrap"><h2>دورات ذات صلة</h2><div className="related-cards"><a href="/catalog">تجربة العميل <span>عرض الكتالوج ←</span></a><a href="/catalog">قيادة فرق العمل <span>عرض الكتالوج ←</span></a><a href="/catalog">أساسيات إدارة المشاريع <span>عرض الكتالوج ←</span></a></div></section>
    </main>
    <footer className="catalog-footer"><div className="section-wrap"><a className="brand approved-brand" href="/" aria-label="كفو — الرئيسية"><img src="/images/checkpoint/kfo-logo-preview.png" alt="كفو KFO" /></a><p>معرفة تنمو معك.</p><span>© كفو — جميع الحقوق محفوظة</span></div></footer>
  </>;
}
