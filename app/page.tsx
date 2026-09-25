const courses = [
  { category: 'مهارات التواصل', title: 'مهارات التواصل الفعّال', duration: '4 ساعات', level: 'مبتدئ', image: '/images/checkpoint/course-communication-preview.jpg' },
  { category: 'تحليل البيانات', title: 'تحليل البيانات واتخاذ القرار', duration: '8 ساعات', level: 'متوسط', image: '/images/checkpoint/course-data-preview.jpg' },
  { category: 'إدارة المشاريع', title: 'أساسيات إدارة المشاريع', duration: '6 ساعات', level: 'مبتدئ', image: '/images/checkpoint/course-projects-preview.jpg' },
];

const paths = [
  { title: 'القيادة والإدارة', text: 'طوّر مهاراتك القيادية والإدارية لبناء فرق أكثر ترابطًا.', icon: '↗' },
  { title: 'المهارات الرقمية', text: 'اكتسب المهارات المطلوبة في سوق العمل.', icon: '▣' },
  { title: 'تجربة العميل', text: 'طوّر مهاراتك في خدمة العملاء وبناء تجارب استثنائية.', icon: '◎' },
];

function Arrow() {
  return <span aria-hidden="true" className="arrow">←</span>;
}

function Brand({ approvedMark = false }: { approvedMark?: boolean }) {
  return <a className={approvedMark ? 'brand approved-brand' : 'brand'} href="/" aria-label="كفو — الرئيسية">
    {approvedMark ? <img src="/images/checkpoint/kfo-logo-preview.png" alt="كفو KFO" /> : <span>كفو<small>KFO</small></span>}
  </a>;
}

export default function HomePage() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Brand approvedMark />
          <nav className="main-nav" aria-label="التنقل الرئيسي">
            <a href="/catalog">الدورات</a><a href="/paths">المسارات</a><a href="/business/dashboard">كفو للأعمال</a><a href="/partners">شركاء التدريب</a>
          </nav>
          <div className="top-actions"><a className="button button-primary button-small" href="/register">إنشاء حساب</a><a className="button button-secondary button-small" href="/login">تسجيل الدخول</a></div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">معرفة تنمو معك</p>
            <h1 id="hero-title">طوّر مهاراتك<br /><em>وارفع جاهزيتك.</em></h1>
            <p className="hero-description">دورات ومسارات تدريبية للأفراد وفرق العمل، تجمع التعلم العملي ومتابعة التقدم في مكان واحد.</p>
            <div className="hero-actions"><a className="button button-accent" href="/catalog">استكشف الدورات <Arrow /></a><a className="button button-outline-light" href="/business/dashboard">كفو للأعمال</a></div>
            <div className="hero-points"><span>تعلّم عملي</span><b>•</b><span>مسارات منظمة</span><b>•</b><span>تقدّم تتابعه</span></div>
          </div>
          <div className="hero-art">
            <img src="/images/checkpoint/home-hero-training-preview.jpg" alt="مدربة تقود جلسة تعلم عملية مع أحد المشاركين" />
          </div>
        </section>

        <section className="why section-wrap" aria-labelledby="why-title">
          <div className="section-heading"><p className="eyebrow eyebrow-green">تعلم يصنع فرقًا</p><h2 id="why-title">لماذا كفو؟</h2><p>تجربة تعلم مصممة لتمكينك من بناء مهارات حقيقية لمستقبل أفضل.</p></div>
          <div className="why-grid">
            <article><span className="line-icon">▱</span><h3>تعلم عملي</h3><p>دورات تطبيقية من خبراء القطاع تركز على المهارات القابلة للتطبيق.</p></article>
            <article><span className="line-icon">◇</span><h3>مسارات منظمة</h3><p>تعلم ضمن مسارات مصممة بعناية لتتناسب مع احتياجاتك المهنية.</p></article>
            <article><span className="line-icon">⌁</span><h3>تابع تقدمك</h3><p>راقب رحلتك التعليمية وحقق أهدافك من خلال تقارير واضحة ومحددة.</p></article>
          </div>
        </section>

        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="section-wrap">
            <div className="section-title-row"><div><p className="eyebrow eyebrow-green">طوّر مهاراتك</p><h2 id="catalog-title">اكتشف الدورات</h2><p>مجموعة متنوعة من الدورات لتطوير مهاراتك في مختلف المجالات.</p></div><div className="filters" aria-label="تصفية الدورات"><button className="filter active">الكل</button><button className="filter">الأعمال</button><button className="filter">التقنية</button><button className="filter">القيادة</button></div></div>
            <div className="course-grid">{courses.map(course => <article className="course-card" key={course.title}>
              <div className="course-art"><img src={course.image} alt="" /></div>
              <div className="course-body"><p className="course-category">{course.category}</p><h3>{course.title}</h3><div className="course-meta"><span>{course.level}</span><span>◷ {course.duration}</span></div><a href="/catalog" className="text-link">عرض التفاصيل <Arrow /></a></div>
            </article>)}</div>
            <div className="center-action"><a className="button button-secondary" href="/catalog">عرض جميع الدورات <Arrow /></a></div>
          </div>
        </section>

        <section className="paths-section section-wrap" aria-labelledby="paths-title">
          <div className="section-heading"><p className="eyebrow eyebrow-green">تعلّم لهدفك</p><h2 id="paths-title">مسارات تبني مهاراتك</h2><p>اختر المسار الذي يناسبك وابدأ رحلتك نحو التميز المهني.</p></div>
          <div className="path-grid">{paths.map(path => <a className="path-card" href="/paths" key={path.title}><span className="path-icon">{path.icon}</span><span><b>{path.title}</b><small>{path.text}</small><i>تفاصيل المسار <Arrow /></i></span></a>)}</div>
        </section>

        <section className="journey">
          <div className="section-wrap"><div className="section-heading"><p className="eyebrow eyebrow-green">خطوتك القادمة</p><h2>رحلتك مع كفو</h2><p>خطوات بسيطة تبدأ بها رحلتك التعليمية وتحقق أهدافك.</p></div>
            <ol className="steps"><li><span>1</span><b>اختر تدريبك</b><small>تصفح الدورات والمسارات واختر ما يناسبك.</small></li><li><span>2</span><b>التحق بالدورة</b><small>سجّل في الدورة وابدأ التعلم فورًا.</small></li><li><span>3</span><b>تعلّم وطبّق</b><small>اكتسب المهارات المرتبطة بوظيفتك.</small></li><li><span>4</span><b>أكمل التقييم</b><small>احصل على شهادة بعد إتمام المتطلبات.</small></li></ol>
          </div>
        </section>

        <section className="business-promo section-wrap"><div className="business-copy"><p className="eyebrow eyebrow-green">كفو للأعمال</p><h2>طوّر فريقك<br />وتابع أثر التدريب.</h2><p>حلول تدريبية متكاملة لتمكين فرق العمل وبناء قدرات المنظمات، مع أدوات متابعة وقياس للأثر.</p><div className="business-features"><span>إدارة المقاعد</span><span>تعيين الدورات</span><span>متابعة النتائج</span></div><a className="button button-primary" href="/business/dashboard">اكتشف حلول الأعمال <Arrow /></a></div><div className="business-visual"><img src="/images/checkpoint/business-team-preview.jpg" alt="فريق عمل يناقش تطوير جاهزية الموظفين" /></div></section>

        <section className="partners-section"><div className="section-wrap partner-row"><div><p className="eyebrow eyebrow-green">شركاء يصنعون المعرفة</p><h2>شارك بخبرتك</h2><p>نرحب بالمدربين والمراكز التدريبية للمساهمة في بناء مستقبل أكثر جاهزية.</p></div><a className="button button-primary" href="/partners">انضم كشريك تدريب <Arrow /></a><div className="partner-types"><span><b>♙</b> مدرب مستقل</span><span><b>▥</b> مركز تدريب</span></div></div></section>

        <section className="verify-section section-wrap"><div><p className="eyebrow eyebrow-green">شهادات موثوقة</p><h2>تحقق من شهادة كفو</h2><p>تحقق من صحة الشهادات الصادرة من منصة كفو.</p></div><form className="verify-form" action="/verify-certificate"><label className="sr-only" htmlFor="certificate-code">رمز الشهادة</label><input id="certificate-code" name="code" placeholder="أدخل رمز الشهادة" /><button className="button button-primary" type="submit">تحقق من شهادة <Arrow /></button></form><div className="certificate-mini"><Brand approvedMark /><span>شهادة إتمام تدريبية</span><div /></div></section>

        <section className="final-cta"><div className="section-wrap"><p className="eyebrow">ابدأ اليوم</p><h2>خطوتك القادمة تبدأ بالتعلم</h2><p>ابدأ بناء مهاراتك لمستقبل أكثر جاهزية.</p><a className="button button-accent" href="/register">إنشاء حساب <Arrow /></a></div></section>
      </main>

      <footer className="footer"><div className="section-wrap footer-grid"><div className="footer-brand"><Brand /><p>معرفة تنمو معك</p></div><div><b>عن كفو</b><a href="/about">من نحن</a><a href="/contact">تواصل معنا</a></div><div><b>الدعم</b><a href="/contact">مركز المساعدة</a><a href="/contact">الأسئلة الشائعة</a></div><div><b>المعلومات</b><a href="/about">الشروط والأحكام</a><a href="/about">الخصوصية</a></div><div><b>حسابك</b><a href="/login">تسجيل الدخول</a><a href="/register">إنشاء حساب</a></div></div><div className="footer-bottom section-wrap"><span>© كفو — جميع الحقوق محفوظة</span><span>تعلّم عملي يرفع جاهزيتك</span></div></footer>
    </>
  );
}
