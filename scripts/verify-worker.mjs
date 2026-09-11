import {Miniflare} from 'miniflare';
import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const mf=new Miniflare({cf:false,modules:true,scriptPath:'dist/server/index.js',modulesRules:[{type:'ESModule',include:['**/*.js','**/*.mjs'],fallthrough:true}],compatibilityDate:'2026-06-01',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{ADMIN_BOOTSTRAP_KEY:'test-only-key'},logRequests:false});
try{
 const db=await mf.getD1Database('DB');const sql=readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort().map(f=>readFileSync('drizzle/'+f,'utf8')).join('--> statement-breakpoint');for(const statement of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
 for(const route of ['/','/about','/events','/businesses','/vouchers','/membership','/sponsor','/donate','/contact','/privacy','/member','/admin']){
  const r=await mf.dispatchFetch('https://slk.test'+route);assert.equal(r.status,200,route);const text=await r.text();const body=text.slice(text.indexOf('<body'));assert.ok(body.includes('class="slk-app"'),route+' missing application body');assert.ok(body.includes('class="logo"'),route+' missing visible navigation');if(['/member','/admin'].includes(route))assert.ok(body.includes('Opening your account…'),route+' missing stable account loading state');assert.ok(!text.includes('Missing Supabase'),route+' still accesses original database');
 }
 const response=await mf.dispatchFetch('https://slk.test/api/public');assert.equal(response.status,200);assert.equal((await response.json()).entities.length,6);
 const request=new Request('https://slk.test/api/signin',{method:'POST',headers:{Origin:'https://slk.test','Content-Type':'application/json','oai-authenticated-user-id':'worker-test','oai-authenticated-user-email':'worker@example.test'},body:'{}'});
 assert.equal((await mf.dispatchFetch(request.url,{method:request.method,headers:Object.fromEntries(request.headers),body:await request.text()})).status,200);
 const form=new FormData();form.append('file',new File([readFileSync('public/brand-heart.png')],'heart.png',{type:'image/png'}));
 const upload=new Request('https://slk.test/api/upload',{method:'POST',headers:{Origin:'https://slk.test','oai-authenticated-user-id':'worker-test'},body:form});
 const ur=await mf.dispatchFetch(upload.url,{method:'POST',headers:Object.fromEntries(upload.headers),body:Buffer.from(await upload.arrayBuffer())});assert.equal(ur.status,200);const ud=await ur.json();
 const media=await mf.dispatchFetch('https://slk.test'+ud.url);assert.equal(media.status,200);assert.equal(media.headers.get('content-type'),'image/png');assert.ok((await media.arrayBuffer()).byteLength>1000);

 const join=await mf.dispatchFetch('https://slk.test/api/auth/signup',{method:'POST',headers:{origin:'https://slk.test','content-type':'application/json'},body:JSON.stringify({name:'Cloudflare Member',email:'cloudflare@example.test',password:'Worker supported passphrase',consent:true})});
 assert.equal(join.status,200,await join.clone().text());
 const cookie=join.headers.getSetCookie().find(c=>c.startsWith('__Host-slk_session=')).split(';')[0];
 const account=await mf.dispatchFetch('https://slk.test/api/member',{headers:{cookie}});assert.equal(account.status,200);assert.equal((await account.json()).user.email,'cloudflare@example.test');
 const login=await mf.dispatchFetch('https://slk.test/api/auth/login',{method:'POST',headers:{origin:'https://slk.test','content-type':'application/json'},body:JSON.stringify({email:'cloudflare@example.test',password:'Worker supported passphrase'})});assert.equal(login.status,200,await login.clone().text());

 await db.prepare("UPDATE users SET membership='active',expires='2099-12-31' WHERE email=?").bind('cloudflare@example.test').run();
 const memberPost=(path,body)=>mf.dispatchFetch('https://slk.test/api'+path,{method:'POST',headers:{origin:'https://slk.test','content-type':'application/json',cookie},body:JSON.stringify(body)});
 const claimed=await memberPost('/claim',{id:'voucher-example'});assert.equal(claimed.status,200);const claim=await claimed.json();
 const wallet=await mf.dispatchFetch('https://slk.test/api/wallet',{headers:{cookie}});const stored=(await wallet.json()).claims.find(c=>c.id===claim.id);assert.equal(stored.redeemable,true);
 const redeemed=await memberPost('/redeem',{id:claim.id,confirm:true});assert.equal(redeemed.status,200);const receipt=await redeemed.json();assert.equal(receipt.claim.status,'redeemed');assert.equal(receipt.claim.receipt.code,claim.code);
 assert.equal((await memberPost('/redeem',{id:claim.id,confirm:true})).status,409);
 for(const [route,heading] of [['/membership','You belong'],['/sponsor','Good business.'],['/donate','Give a little love.']]){
   const page=await mf.dispatchFetch('https://slk.test'+route);const html=await page.text();assert.ok(html.includes(heading),route+' missing redesigned heading');assert.ok(html.includes('Get involved'),route+' missing navigation dropdown');
 }
 console.log('PASS: claim/wallet/redemption works in the built Worker and redesigned involvement routes render their content.');
 console.log('PASS: email/password signup and login work in Cloudflare WebCrypto with D1 and session cookies; no ChatGPT headers.');
 console.log('PASS: all 12 routes render through the built Cloudflare Worker; D1-backed API, sign-in initialization and R2 image upload/read respond correctly.');
}finally{await mf.dispose()}
