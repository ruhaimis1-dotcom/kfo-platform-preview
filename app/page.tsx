/**
 * Preserve the existing static preview while the approved product UI is built
 * in its own design gate. This frame is a visual reference, never an app shell.
 */
export default function PreviewPage() {
  return (
    <main style={{ width: '100%', height: '100dvh' }}>
      <iframe
        src="/kfo-preview.html"
        title="معاينة كفو المرجعية — ليست التطبيق النهائي"
        style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
      />
    </main>
  );
}
