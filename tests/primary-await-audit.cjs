const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const parser={exports:{}};vm.runInNewContext(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],{exports:parser.exports,module:parser});
const failures=[];let count=0;
for(const file of ['gateway/public/index.html','gateway/public/assets/business-registers.js']){
 const raw=fs.readFileSync(file,'utf8');const sources=file.endsWith('.html')?[...raw.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]):[raw];
 for(const code of sources){const ast=parser.exports.parse(code,{ecmaVersion:'latest',locations:true});
  function visit(node,parent){if(!node?.type)return;if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&['persist','cloudCacheExact','primaryEnable'].includes(node.callee.name)){count++;if(!['AwaitExpression','YieldExpression'].includes(parent?.type))failures.push(file+':'+node.loc.start.line+' '+node.callee.name);}
   for(const v of Object.values(node)){if(Array.isArray(v))for(const n of v)visit(n,node);else if(v?.type)visit(v,node);}}
  visit(ast,null);
 }
}
assert.deepEqual(failures,[]);assert(count>50);console.log('PASS '+count+' primary write call sites await the commit result');
