const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
function serviceWorker(){
 const handlers={},cacheWrites=[];let networkCalls=0;
 const cache={put:async(...args)=>cacheWrites.push(args),match:async()=>new Response('<html>Ledger offline shell</html>')};
 const c={URL,Response,console,self:{location:{origin:'https://ledger.test'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>cache},fetch:async()=>{networkCalls++;return new Response('Google OAuth token exchange failed',{status:502})}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('gateway/public/sw.js','utf8'),c);
 return {handlers,cacheWrites,get networkCalls(){return networkCalls;}};
}
(async()=>{
 const sw=serviceWorker();
 for(const path of ['/v1/google/oauth/callback?code=synthetic&state=synthetic','/v1/google/status','/v1/files/private','/ready','/health']){
  let intercepted=false;sw.handlers.fetch({request:{method:'GET',url:'https://ledger.test'+path,mode:'navigate'},respondWith(p){intercepted=true;p.catch(()=>{});}});
  assert.equal(intercepted,false,'API/auth navigation must reach server without app-shell fallback: '+path);
 }
 assert.equal(sw.cacheWrites.length,0);assert.equal(sw.networkCalls,0);
 let shellResponse;sw.handlers.fetch({request:{method:'GET',url:'https://ledger.test/',mode:'navigate'},respondWith(p){shellResponse=p;}});
 assert.equal(await (await shellResponse).text(),'<html>Ledger offline shell</html>');
 console.log('PASS OAuth/API bypass offline shell and caches; normal app offline fallback retained');
 const ctx={URL,URLSearchParams,Request,Response,Headers,TextEncoder,TextDecoder,crypto:webcrypto,console,btoa,atob};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('gateway/src/worker.js','utf8').replace('export class GatewayState','class GatewayState').replace('export default','globalThis.worker='),ctx);
 const env={GOOGLE_CLIENT_ID:'synthetic',GOOGLE_CLIENT_SECRET:'synthetic',GOOGLE_TOKEN_KEY:'k'.repeat(32),LEDGER_DB:{prepare(){throw Error('synthetic missing schema');},batch(){}}};
 const status=await ctx.worker.fetch(new Request('https://ledger.test/v1/google/status',{headers:{'X-AREA-Gateway-Version':'1','X-AREA-Ledger-Key':'a'.repeat(32)}}),env,{});
 assert.equal(status.status,503);assert.equal((await status.json()).error,'GOOGLE_CONNECTION_READ_FAILED');
 const invalid=await ctx.worker.fetch(new Request('https://ledger.test/v1/google/oauth/callback'),env,{});
 assert.equal(invalid.status,400);assert.equal(invalid.headers.get('Cache-Control'),'no-store');
 let calls=[];env.LEDGER_DB={batch(){},prepare(sql){return {bind(...args){return {first:async()=>sql.includes('google_oauth_states')?{ledgerHash:'ledger',codeVerifier:'verifier',returnUrl:'https://ledger.test/',expiresAt:Date.now()+60000}:null,run:async()=>{calls.push(sql);return {};}}}}}};
 ctx.fetch=async()=>new Response(JSON.stringify({error:'invalid_client',error_description:'must never be echoed synthetic-secret'}),{status:401});
 const failed=await ctx.worker.fetch(new Request('https://ledger.test/v1/google/oauth/callback?code=synthetic&state=synthetic'),env,{});
 assert.equal(failed.status,502);assert.equal(failed.headers.get('Cache-Control'),'no-store');
 const text=await failed.text();assert(text.includes('invalid_client'));assert(!text.includes('synthetic-secret'));
 assert(!calls.some(x=>x.startsWith('INSERT INTO google_connections')));
 console.log('PASS missing connection schema reports 503, token failure stays visible/no-store and exposes only safe error code');
 let saved=null;env.LEDGER_DB={batch(){},prepare(sql){return {bind(...args){return {first:async()=>sql.includes('google_oauth_states')?{ledgerHash:await ctx.sha256Hex('a'.repeat(32)),codeVerifier:'verifier',returnUrl:'https://ledger.test/index.html',expiresAt:Date.now()+60000}:saved,run:async()=>{if(sql.startsWith('INSERT INTO google_connections'))saved={email:args[1],refreshTokenEnc:args[2],scopes:args[3]};return {};}}}}}};
 ctx.fetch=async url=>new Response(JSON.stringify(url.includes('userinfo')?{email:'test@example.test'}:{access_token:'synthetic-access',refresh_token:'synthetic-refresh',scope:'synthetic-scope'}));
 const success=await ctx.worker.fetch(new Request('https://ledger.test/v1/google/oauth/callback?code=synthetic&state=synthetic'),env,{});
 assert.equal(success.status,302);assert.equal(success.headers.get('Location'),'https://ledger.test/index.html?google=connected');assert.equal(success.headers.get('Cache-Control'),'no-store');
 assert(saved);assert(!saved.refreshTokenEnc.includes('synthetic-refresh'));assert.equal(await ctx.googleDecrypt(env,saved.refreshTokenEnc),'synthetic-refresh');
 const connected=await ctx.worker.fetch(new Request('https://ledger.test/v1/google/status',{headers:{'X-AREA-Gateway-Version':'1','X-AREA-Ledger-Key':'a'.repeat(32)}}),env,{});
 assert.equal((await connected.json()).connected,true);
 const html=fs.readFileSync('gateway/public/index.html','utf8'),resume=html.slice(html.indexOf('async function googleWorkspaceResume(){'),html.indexOf('async function googleWorkspaceConnect(pid){'));
 const notices=[],client={U:{},sessionStorage:{getItem:()=> 'p',removeItem(){}},cloudLedgerKey:()=> 'synthetic-ledger',render(){},toast:s=>notices.push(s),googleWorkspaceState:()=>client.st,googleWorkspaceRefresh:async()=>{},st:{status:{connected:false},error:''}};
 vm.createContext(client);vm.runInContext(resume,client);
 assert.equal(await client.googleWorkspaceResume(),false);assert.equal(notices.length,0);assert.equal(client.st.error,'GOOGLE_CONNECTION_NOT_FOUND');
 client.st={status:{connected:true},error:''};assert.equal(await client.googleWorkspaceResume(),true);assert.equal(notices.length,1);
 client.cloudLedgerKey=()=>'';client.st={};assert.equal(await client.googleWorkspaceResume(),false);assert.equal(client.st.error,'GOOGLE_LEDGER_IDENTITY_MISSING');
 console.log('PASS callback encrypts and persists connection before return; resume verifies server status and preserves existing browser identity');

})().catch(e=>{console.error(e);process.exitCode=1;});
