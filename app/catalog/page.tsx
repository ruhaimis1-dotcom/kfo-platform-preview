import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الدورات | كفو',
  description: 'اكتشف الدورات التدريبية في كفو.',
};

const catalogCourses = [
  { title: 'مهارات التواصل الفعّال', category: 'التواصل', duration: '4 ساعات', level: 'مبتدئ', price: '149 ر.س', image: '/images/checkpoint/course-communication-preview.jpg' },
  { title: 'تحليل البيانات', category: 'التقنية', duration: '8 ساعات', level: 'متوسط', price: '249 ر.س', image: '/images/checkpoint/course-data-preview.jpg' },
  { title: 'أساسيات إدارة المشاريع', category: 'الأعمال', duration: '6 ساعات', level: 'مبتدئ', price: '199 ر.س', image: '/images/checkpoint/course-projects-preview.jpg' },
  { title: 'تجربة العميل', category: 'التواصل', duration: 'ساعتان', level: 'مبتدئ', price: '99 ر.س', image: '/images/checkpoint/course-customer-preview.jpg' },
  { title: 'أساسيات التسويق الرقمي', category: 'التقنية', duration: '3 ساعات', level: 'مبتدئ', price: 'مجاني', image: '/images/checkpoint/course-marketing-preview.jpg' },
  { title: 'قيادة فرق العمل', category: 'القيادة', duration: '5 ساعات', level: 'متوسط', price: '179 ر.س', image: '/images/checkpoint/course-leadership-preview.jpg' },
];

const filters = [
  { title: 'المجال', items: ['الأعمال', 'التقنية', 'القيادة', 'التواصل'] },
  { title: 'المستوى', items: ['مبتدئ', 'متوسط', 'متقدم'] },
  { title: 'المدة', items: ['أقل من ساعتين', '1–2 ساعات', 'أكثر من 6 ساعات'] },
  { title: 'اللغة', items: ['العربية', 'الإنجليزية'] },
  { title: 'السعر', items: ['مجاني', 'مدفوع'] },
];

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = '', category = '' } = await searchParams;
  const visibleCourses = catalogCourses.filter(course => {
    const matchesQuery = !q.trim() || `${course.title} ${course.category}`.includes(q.trim());
    const matchesCategory = !category || course.category === category;
    return matchesQuery && matchesCategory;
  });
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand approved-brand" href="/" aria-label="كفو — الرئيسية"><img src="/images/checkpoint/kfo-logo-preview.png" alt="كفو KFO" /></a>
          <nav className="main-nav" aria-label="التنقل الرئيسي">
            <a href="/">الرئيسية</a><a className="catalog-current" href="/catalog" aria-current="page">الدورات</a><a href="/paths">المسارات</a><a href="/business/dashboard">كفو للأعمال</a><a href="/partners">شركاء التدريب</a>
          </nav>
          <div className="top-actions"><a className="button button-primary button-small" href="/register">إنشاء حساب</a><a className="button button-secondary button-small" href="/login">تسجيل الدخول</a></div>
        </div>
      </header>
      <main className="catalog-page">
        <section className="catalog-intro">
          <div className="catalog-intro-inner">
            <p className="catalog-breadcrumb"><a href="/">الرئيسية</a><span>/</span><span>الدورات</span></p>
            <h1>اكتشف ما يطوّر مهاراتك</h1>
            <p>دورات عملية تناسب أهدافك وخطوتك القادمة.</p>
            <form className="catalog-search" action="/catalog" method="get">
              <label className="sr-only" htmlFor="course-search">ابحث عن دورة أو مهارة</label><input id="course-search" name="q" placeholder="ابحث عن دورة أو مهارة" />
              <button className="button button-primary" type="submit">بحث</button>
            </form>
            <div className="catalog-categories" aria-label="مجالات الدورات"><a className={!category ? 'selected' : ''} href="/catalog">الكل</a><a className={category === 'الأعمال' ? 'selected' : ''} href="/catalog?category=الأعمال">الأعمال</a><a className={category === 'التقنية' ? 'selected' : ''} href="/catalog?category=التقنية">التقنية</a><a className={category === 'القيادة' ? 'selected' : ''} href="/catalog?category=القيادة">القيادة</a><a className={category === 'التواصل' ? 'selected' : ''} href="/catalog?category=التواصل">التواصل</a></div>
          </div>
        </section>
        <section className="catalog-results section-wrap" aria-labelledby="available-courses">
          <aside className="catalog-filters">
            <div className="filter-title"><b>الفلاتر</b><a href="/catalog">مسح الكل</a></div>
            {filters.map(group => <fieldset className="catalog-filter-group" key={group.title}><legend>{group.title}</legend>{group.items.map(item => <label key={item}><input type="checkbox" /> <span>{item}</span></label>)}</fieldset>)}
            <label className="provider-select">مقدم التدريب<select defaultValue="all"><option value="all">جميع الشركاء</option><option value="kfo">كفو</option></select></label>
          </aside>
          <div className="catalog-listing">
            <div className="catalog-listing-head"><div><h2 id="available-courses">الدورات المتاحة</h2><span>عرض {visibleCourses.length} دورات</span></div><label className="sort-select">ترتيب حسب<select defaultValue="latest"><option value="latest">الأحدث</option><option value="title">الاسم</option></select></label></div>
            <div className="catalog-card-grid">{visibleCourses.map(course => <article className="catalog-course-card" key={course.title}>
              {course.title === 'مهارات التواصل الفعّال' ? <a className="catalog-course-image" href="/catalog/communication-skills" aria-label={`عرض ${course.title}`}><img src={course.image} alt="" /><span>{course.category}</span></a> : <div className="catalog-course-image"><img src={course.image} alt="" /><span>{course.category}</span></div>}
              <div className="catalog-course-body"><h3>{course.title === 'مهارات التواصل الفعّال' ? <a href="/catalog/communication-skills">{course.title}</a> : course.title}</h3><p>مقدم التدريب: شريك تدريبي معتمد</p><div className="catalog-course-meta"><span>{course.level}</span><span>◷ {course.duration}</span></div><div className="catalog-course-bottom"><b>{course.price}</b>{course.title === 'مهارات التواصل الفعّال' ? <a href="/catalog/communication-skills">عرض التفاصيل <span aria-hidden="true">←</span></a> : <span>تفاصيل الدورة</span>}</div></div>
            </article>)}</div>
            {visibleCourses.length === 0 && <p className="catalog-empty">لا توجد دورات تطابق بحثك. جرّب كلمة أو مجالًا آخر.</p>}
            <p className="catalog-disclaimer">بيانات الدورات والأسعار توضيحية للمعاينة.</p>
            <nav className="catalog-pagination" aria-label="صفحات الدورات"><a href="/catalog" aria-disabled="true">السابق</a><a className="page-current" href="/catalog" aria-current="page">1</a><a href="/catalog?page=2">2</a><a href="/catalog?page=3">3</a><a href="/catalog?page=2">التالي</a></nav>
          </div>
        </section>
      </main>
      <footer className="catalog-footer"><div className="section-wrap"><a className="brand approved-brand" href="/" aria-label="كفو — الرئيسية"><img src="/images/checkpoint/kfo-logo-preview.png" alt="كفو KFO" /></a><p>معرفة تنمو معك.</p><span>© كفو — جميع الحقوق محفوظة</span></div></footer>
    </>
  );
}
