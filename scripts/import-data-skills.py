"""Extract reviewed KFO HTML without executing its scripts. Outputs authoring-only drafts."""
import sys,json,re,base64,hashlib
from pathlib import Path
from html.parser import HTMLParser
class Node:
 def __init__(self,tag='',attrs=()): self.tag=tag;self.attrs=dict(attrs);self.children=[]
 def text(self): return ' '.join((x.text() if isinstance(x,Node) else x) for x in self.children).strip()
 def all(self,tag=None,**attrs):
  found=[]
  for c in self.children:
   if isinstance(c,Node):
    if (tag is None or c.tag==tag) and all(c.attrs.get(k)==v for k,v in attrs.items()):found.append(c)
    found+=c.all(tag,**attrs)
  return found
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.root=Node();self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in ['input','img','br','meta','link','hr','source','wbr']:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,d):self.stack[-1].children.append(d.strip())
def extract(source,destination):
 raw=source.read_bytes();text=raw.decode('utf-8');p=Parser();p.feed(text);root=p.root
 # Only JSON declarations are parsed. No JavaScript evaluation.
 files=json.loads(re.search(r'const FILES\s*=\s*(\{[^\n]+\});',text).group(1))
 allowed={'Sales.csv','Branches.csv','Products.csv','KFO_Excel_Practice.xlsx','KFO_Excel_Answers.xlsx'}
 if set(files)!=allowed:raise ValueError('Unexpected embedded attachment list')
 destination.mkdir(parents=True,exist_ok=True);(destination/'files').mkdir(exist_ok=True)
 manifest=[]
 for name,value in files.items():
  data=base64.b64decode(value,validate=True);(destination/'files'/name).write_bytes(data)
  manifest.append({'name':name,'size':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 outlines=root.all('ol',**{'class':'outline'})
 titles={'excel':'أساسيات Excel للموظف العملي','powerbi':'أساسيات Power BI: من البيانات إلى التقرير'}
 for index,kind in enumerate(['excel','powerbi']):
  section=root.all('section',id=kind)[0];activities=[]
  for i,step in enumerate(section.all('details'),1):
   title=step.all('summary')[0].text();title=re.sub(r'^\d+\s*','',title)
   body='\n\n'.join(n.text() for n in step.all('p'))
   activities.append({'key':f'{kind}-step-{i}','type':'content','title':title,'body':body})
  for i,quiz in enumerate(section.all('fieldset'),1):
   prompt=quiz.all('legend')[0].text();choices=[n.text() for n in quiz.all('label',**{'class':'choice'})]
   if not choices:choices=({'excel':{1:['675','750','75'],3:['29,828','9,028','24']},'powerbi':{2:['9,028','29,828','1,242.83']}}[kind][i])
   activities.append({'key':f'{kind}-check-{i}','type':'scenario','title':f'مراجعة تطبيقية {i}','prompt':prompt,'options':choices,'correctIndex':0})
  practice=section.all('div',**{'class':'practice'})[0]
  activities.append({'key':f'{kind}-practice','type':'practical_task','title':'التطبيق في البرنامج الفعلي','prompt':'\n'.join(n.text() for n in practice.all('label'))+'\nسلّم ملف التطبيق وشرحًا موجزًا للنتائج للمراجعة. الإقرار الذاتي أو أسئلة المراجعة لا يكفيان لإثبات التطبيق.'})
  plan=[{'number':i,'title':li.all('strong')[0].text(),'description':li.all('span')[0].text(),'exercise':li.all('small')[0].text(),'status':'outline_only'} for i,li in enumerate(outlines[index].all('li'),1)]
  draft={'course_slug':'excel-basics' if kind=='excel' else 'power-bi-basics','course_version':1,'revision':0,'title':titles[kind],'status':'draft','published':False,'runtime_ready':False,'source_sha256':hashlib.sha256(raw).hexdigest(),'scope':'Imported sample lesson only; roadmap units are not complete.','activities':activities,'learning_design':{'skills':[],'activitySkills':{},'rubrics':{}},'planned_units':plan,'attachments':[m for m in manifest if (m['name'].endswith('.xlsx') if kind=='excel' else m['name'].endswith('.csv'))],'review_notes':['Numeric input questions converted to multiple choice; correct option remains first pending assessment review.','Interactive arithmetic/report simulations are not ported in this draft.','No account progress, certificate entitlement, upload or publication has occurred.','Practice evidence requires actual file review; no PBIX is included.']}
  (destination/f'{kind}-draft.json').write_text(json.dumps(draft,ensure_ascii=False,indent=2)+'\n')
 (destination/'source-manifest.json').write_text(json.dumps({'source_filename':source.name,'source_sha256':hashlib.sha256(raw).hexdigest(),'files':manifest},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':extract(Path(sys.argv[1]),Path(sys.argv[2]))
