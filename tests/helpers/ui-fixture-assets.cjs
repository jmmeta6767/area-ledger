/* Local, isolated UI fixtures must render the same styles/artwork as the app. */
const fs=require('node:fs'),path=require('node:path');
const publicRoot=path.resolve(__dirname,'../../gateway/public');
const types={'.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
function reply(pathname,html){
 if(pathname==='/'||pathname==='/index.html')return {status:200,contentType:'text/html; charset=utf-8',body:html};
 try{
  const file=path.resolve(publicRoot,'.'+decodeURIComponent(pathname)),relative=path.relative(publicRoot,file),type=types[path.extname(file).toLowerCase()];
  if(!type||relative.startsWith('..')||path.isAbsolute(relative)||!fs.statSync(file).isFile())return null;
  const real=fs.realpathSync(file);if(!real.startsWith(fs.realpathSync(publicRoot)+path.sep))return null;
  return {status:200,contentType:type,body:fs.readFileSync(file)};
 }catch(_){return null;}
}
function fixtureRoute(origin,html){return route=>{const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();const result=reply(url.pathname,html);return result?route.fulfill(result):route.abort();};}
function fixtureHttp(html){return (request,response)=>{const result=reply(new URL(request.url,'http://fixture.test').pathname,html);response.statusCode=result?result.status:404;response.setHeader('Content-Type',result?result.contentType:'text/plain');response.end(result?result.body:'Fixture asset unavailable');};}
module.exports={fixtureRoute,fixtureHttp,reply};
