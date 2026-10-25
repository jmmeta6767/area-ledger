const fs=require('node:fs'),vm=require('node:vm');
function appContext(){
 const storage=new Map(),writes=[],timers=new Map(),listeners={},nodes={};let sequence=0;
 const node=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){},appendChild(){},focus(){},innerHTML:''});
 const c={console,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,URL,parseFloat,isFinite,isNaN,AbortController,
  setTimeout(fn){timers.set(++sequence,fn);return sequence;},clearTimeout(id){timers.delete(id);},navigator:{onLine:true},
  location:{protocol:'https:',origin:'https://ledger.test',hostname:'ledger.test',reload(){c.reloads++;}},history:{pushState(){},replaceState(){}},window:{addEventListener(){},scrollTo(){}},
  document:{addEventListener(k,f){(listeners[k]??=[]).push(f);},getElementById(id){return nodes[id]||null;},querySelector(){return null;},querySelectorAll(){return [];},documentElement:node(),body:node(),createElement:node},
  localStorage:{getItem(k){return storage.get(k)||null;},setItem(k,v){writes.push([k,v]);storage.set(k,v);},removeItem(k){storage.delete(k);}},sessionStorage:{getItem(){return null;},setItem(){},removeItem(){}},reloads:0};
 const html=fs.readFileSync('gateway/public/index.html','utf8'),code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n').replace(/\nboot\(\);/,'\n');
 vm.createContext(c);vm.runInContext(code,c);c.render=()=>{};c.toast=message=>c.lastToast=message;c.go=()=>{};c.idbPut=async()=>true;c.idbRead=async()=>null;c.idbSet=async()=>true;
 c.S=c.emptyState();c.S.projects=[{id:'p',name:'โครงการทดสอบ',status:'active'}];c.U.view='add';c.U.draft=c.newDraft('out','p');c.U.runtimeActionStamps=Object.create(null);
 function action(a){c.U.runtimeActionStamps=Object.create(null);const target={dataset:{act:a},getAttribute(k){return k==='data-act'?a:null;},closest(){return this;}};for(const f of listeners.click||[])f({target,preventDefault(){},stopPropagation(){}});}
 return {c,storage,writes,timers,nodes,action};
}
module.exports={appContext};
