import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'التحقق من الشهادات | كفو' };
const sampleCode = 'KFO-2026-00124';

export default async function VerifyCertificatePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = '' } = await searchParams;
  const sampleShown = code.trim().toUpperCase() === sampleCode;
  const invalidCode = Boolean(code.trim()) && !sampleShown;
  return <>
    <header className="topbar"><div className="topbar-inner">
      <a className="brand approved-brand" href="/" aria-label="كفو — الرئيسية"><img src="/images/checkpoint/kfo-logo-preview.png" alt="كفو KFO" /></a>
      <nav className="main-nav" aria-label="التنقل الرئيسي"><a href="/">الرئيسية</a><a href="/catalog">الدورات</a></nav>
    </div></header>
    <main className="verify-page">
      <div className="verify-content">
        <h1>التحقق من الشهادة</h1>
        <p>تحقق من صحة الشهادة وبيانات إصدارها.</p>
        <form className="certificate-search" action="/verify-certificate" method="get">
          <label htmlFor="certificate-number">رقم الشهادة</label>
          <div><input id="certificate-number" name="code" value={code} placeholder="أدخل رقم الشهادة" /><button className="button button-accent" type="submit">تحقق</button></div>
        </form>
        {sampleShown && <section className="certificate-result" aria-live="polite"><span className="sample-check" aria-hidden="true">✓</span><h2>نموذج نتيجة التحقق</h2><p>هذه بيانات عينة من مرجع التصميم، وليست تحققًا من سجل فعلي.</p><dl><div><dt>اسم المتدرب</dt><dd>أحمد محمد</dd></div><div><dt>الدورة</dt><dd>مهارات التواصل الفعّال</dd></div><div><dt>الجهة المصدرة</dt><dd>كفو</dd></div><div><dt>تاريخ الإصدار</dt><dd>20 سبتمبر 2026</dd></div><div><dt>رقم الشهادة</dt><dd>{sampleCode}</dd></div></dl></section>}
        {invalidCode && <p className="certificate-not-found" role="status">هذه المعاينة لا تتصل بسجل الشهادات الفعلي؛ لم نتمكن من التحقق من هذا الرقم.</p>}
        {!code.trim() && <div className="certificate-empty" aria-hidden="true"><span>✓</span></div>}
        <p className="certificate-preview-note">بيانات توضيحية للمعاينة — لا تمثل سجلًا حقيقيًا.</p>
      </div>
    </main>
    <footer className="verify-footer"><div className="section-wrap"><div><a href="/contact">المساعدة</a><a href="/about">الخصوصية</a></div><a className="brand" href="/" aria-label="كفو — الرئيسية"><span>كفو<small>KFO</small></span></a><p>معرفة تنمو معك.</p></div></footer>
  </>;
}
