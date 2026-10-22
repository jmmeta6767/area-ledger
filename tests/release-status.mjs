// Read-only deployment inventory. Does not call private ledger or Google APIs.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function parseAppBuild(html){
 const match=String(html).match(/var APP_BUILD=(\{[^\n]+\});/);if(!match)throw Error('BUILD_IDENTITY_MISSING');
 const build=JSON.parse(match[1]);if(!Number.isInteger(build.version)||!(/^[a-f0-9]{40}$/).test(build.sha||'')||!['production','staging'].includes(build.environment))throw Error('BUILD_IDENTITY_INVALID');return build;
}
export async function inspectRelease(origin,expectedSha){
 const url=new URL(origin);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('HTTPS_ORIGIN_REQUIRED');
 const response=await fetch(new URL('/',url),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('HTTP_'+response.status);
 const build=parseAppBuild(await response.text());return {origin:url.origin,build,expectedSha:expectedSha||null,matchesExpected:expectedSha?build.sha===expectedSha:null};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),origins=[];let expected='',output='';
 for(let i=0;i<args.length;i++){if(args[i]==='--origin')origins.push(args[++i]);else if(args[i]==='--expected-sha')expected=args[++i];else if(args[i]==='--out')output=args[++i];else throw Error('Unknown argument '+args[i]);}
 if(!origins.length||expected&&!/^[a-f0-9]{40}$/.test(expected))throw Error('Use --origin https://... [--expected-sha 40-char-sha] [--out evidence.json]');
 const results=await Promise.all(origins.map(async origin=>{try{return await inspectRelease(origin,expected);}catch(error){return {origin,error:error.message};}}));
 const evidence={checkedAt:new Date().toISOString(),readOnly:true,results};console.log(JSON.stringify(evidence,null,2));if(output)fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
 if(results.some(r=>r.error||r.matchesExpected===false))process.exitCode=1;
}
