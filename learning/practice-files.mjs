// Only synthetic practice data is public. Answer workbooks and authoring JSON never ship.
const entries={
 'excel-basics':[{name:'KFO_Excel_Practice.xlsx',label:'تحميل ملف تمرين Excel'}],
 'power-bi-basics':[{name:'Sales.csv',label:'تحميل جدول المبيعات'},{name:'Branches.csv',label:'تحميل جدول الفروع'},{name:'Products.csv',label:'تحميل جدول المنتجات'}]
};
export function coursePracticeFiles(slug,version){if(version!==1||!Object.hasOwn(entries,slug))return [];return entries[slug].map(({name,label})=>({name,label,href:`/assets/practice/data-skills-v1/${name}`}))}
export function mountPracticeFiles({document,host,course,activity}){
 if(!['content','practical_task'].includes(activity?.type))return;
 const files=coursePracticeFiles(course?.slug,course?.version);if(!files.length)return;
 const section=document.createElement('section');section.className='course-practice-files';section.setAttribute('aria-label','ملفات التطبيق');
 const title=document.createElement('h3');title.textContent='ملفات التطبيق';section.append(title);
 const note=document.createElement('p');note.textContent='بيانات تدريبية مصطنعة. نزّل الملفات وطبّق في البرنامج؛ تنزيلها لا يُكمل النشاط ولا يقيّم ملفك.';section.append(note);
 for(const file of files){const link=document.createElement('a');link.href=file.href;link.download=file.name;link.textContent=file.label;section.append(link)}host.append(section);
}
