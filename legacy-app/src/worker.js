const CANONICAL_GATEWAY='https://area-ledger-ai-gateway.areamaibab.workers.dev';
const CLIENT_CONTRACT='v1005-canonical-gateway';

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer'
    }
  });
}

function gatewayPath(pathname){
  return pathname==='/health'||pathname==='/ready'||pathname.startsWith('/v1/');
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/legacy-health'){
      return json({ok:true,service:'area-ledger-legacy-app',protocol:'1',clientContract:CLIENT_CONTRACT,canonicalGateway:CANONICAL_GATEWAY});
    }
    if(gatewayPath(url.pathname)){
      const target=new URL(url.pathname+url.search,CANONICAL_GATEWAY);
      const headers=new Headers(request.headers);
      headers.set('X-AREA-Legacy-App','g');
      return fetch(new Request(target.toString(),{
        method:request.method,
        headers,
        body:['GET','HEAD'].includes(request.method)?undefined:request.body,
        redirect:'manual'
      }));
    }
    return env.ASSETS.fetch(request);
  }
};
