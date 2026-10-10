import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Minimal DOM for controller logic; this does not replace browser/layout QA.
export function browserFixture(){
  const nodes=new Map(),events=[],redirects=[];
  function node(){
    const classes=new Set(),listeners=new Map(),queries=new Map();
    return {children:[],dataset:{},style:{},textContent:'',innerHTML:'',value:'',disabled:false,
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
      append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},
      setAttribute(name,value){this[name]=value},
      removeAttribute(name){delete this[name]},querySelectorAll(){return []},closest(key){return this.querySelector('parent:'+key)},
      querySelector(key){if(!queries.has(key))queries.set(key,node());return queries.get(key)},
      addEventListener(name,fn){listeners.set(name,fn)},async fire(name,event={}){return listeners.get(name)?.(event)}
    };
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
  const document={body:node(),getElementById:get,createElement:node,createTextNode:text=>({textContent:text}),querySelector:get,querySelectorAll:()=>[],addEventListener(){}};
  const location={pathname:'/admin/dashboard',search:'',replace:path=>redirects.push(path)};
  const handlers=new Map();
  const window={location,addEventListener:(name,fn)=>handlers.set(name,fn),dispatchEvent:event=>{events.push(event);return handlers.get(event.type)?.(event)}};
  return {document,location,window,get,events,redirects,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}};
}

export async function runController(relativePath,globals,entry){
  let source=await readFile(new URL('../../'+relativePath,import.meta.url),'utf8');
  source=source.replace(/^import .*;\s*$/gm,'');
  source=entry==='render'?source.replace(/render\(\);\s*$/,'globalThis.ready=render();'):source.replace(/main\(\)\.catch/,'globalThis.ready=main().catch');
  const context=vm.createContext({...globals,URLSearchParams,console});
  vm.runInContext(source,context,{filename:relativePath});
  await context.ready;
  return context;
}

export async function adminFixture(memberships,{signedOut=false,accessError=false}={}){
  const ui=browserFixture();
  await runController('admin/admin-runtime.js',{...ui,createClient:()=>({}),
    loadWorkspace:async()=>({kind:signedOut?'signed-out':'ready',memberships,userId:'u',email:'u@example.test'}),
    loadAccessContext:async()=>({kind:accessError?'error':'ready'}),attachAccessContext:()=>memberships},'main');
  return ui;
}

export async function workspaceFixture(memberships,{profile=null,enrollments=[],signedOut=false}={}){
  const ui=browserFixture();
  await runController('auth/workspace.js',{...ui,
    createClient:()=>({auth:{onAuthStateChange(){}}}),
    loadWorkspace:async()=>({kind:signedOut?'signed-out':'ready',memberships,userId:'u',email:'u@example.test'}),
    loadAccessContext:async()=>({kind:'ready'}),attachAccessContext:()=>memberships,
    loadLearnerHome:async()=>({profile,enrollments,dashboard:{},notifications:[],certificates:[]}),
    canManageSettings:()=>false,updateMyProfile:async()=>{},markNotificationRead:async()=>{}
  },'render');
  return ui;
}
