const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs=text=>text.split(/\n\s*\n/).filter(p=>p.trim()).map(p=>'<p>'+escape(p.trim()).replaceAll('\n','<br>')+'</p>').join('');
// Recognize only the authored KFO lesson grammar. All content remains escaped text.
export function renderLessonContent(content){
 if(!Array.isArray(content))return '';
 return content.map(value=>{
  const text=String(value??'');
  const match=text.match(/^الهدف: ([^\n]+)\n\n([\s\S]+)\n\nمثال تطبيقي:\n([\s\S]+)\n\nتدريبك:\n([\s\S]+)$/);
  if(!match)return paragraphs(text);
  const [,outcome,explanation,example,exercise]=match;
  return '<div class="kfo-lesson"><section class="kfo-lesson-outcome"><h3>وش بتتعلم؟</h3><p>'+escape(outcome)+'</p></section><section class="kfo-lesson-explanation"><h3>افهم الفكرة</h3>'+paragraphs(explanation)+'</section><section class="kfo-lesson-example"><h3>شوف المثال</h3>'+paragraphs(example)+'</section><section class="kfo-lesson-exercise"><h3>جرّب بنفسك</h3>'+paragraphs(exercise)+'</section></div>';
 }).join('');
}
