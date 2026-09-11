import {Miniflare} from 'miniflare';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const mf=new Miniflare({cf:false,modules:true,scriptPath:'dist/server/index.js',modulesRules:[{type:'ESModule',include:['**/*.js','**/*.mjs'],fallthrough:true}],compatibilityDate:'2026-06-01',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{ADMIN_BOOTSTRAP_KEY:'test-only-key'},logRequests:false});
try{
 const db=await mf.getD1Database('DB');const sql=readFileSync('drizzle/0000_chilly_blade.sql','utf8');for(const statement of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
 for(const route of ['/','/about','/events','/businesses','/vouchers','/membership','/sponsor','/donate','/contact','/privacy','/member','/admin']){
  const r=await mf.dispatchFetch('https://slk.test'+route);assert.equal(r.status,200,route);const text=await r.text();const body=text.slice(text.indexOf('<body'));assert.ok(body.includes('class="slk-app"'),route+' missing application body');assert.ok(body.includes('class="logo"'),route+' missing visible navigation');if(['/member','/admin'].includes(route))assert.ok(body.includes('Good to have you here.'),route+' missing sign-in screen');assert.ok(!text.includes('Missing Supabase'),route+' still accesses original database');
 }
 const response=await mf.dispatchFetch('https://slk.test/api/public');assert.equal(response.status,200);assert.equal((await response.json()).entities.length,6);
 const request=new Request('https://slk.test/api/signin',{method:'POST',headers:{Origin:'https://slk.test','Content-Type':'application/json','oai-authenticated-user-id':'worker-test','oai-authenticated-user-email':'worker@example.test'},body:'{}'});
 assert.equal((await mf.dispatchFetch(request.url,{method:request.method,headers:Object.fromEntries(request.headers),body:await request.text()})).status,200);
 const form=new FormData();form.append('file',new File([readFileSync('public/brand-heart.png')],'heart.png',{type:'image/png'}));
 const upload=new Request('https://slk.test/api/upload',{method:'POST',headers:{Origin:'https://slk.test','oai-authenticated-user-id':'worker-test'},body:form});
 const ur=await mf.dispatchFetch(upload.url,{method:'POST',headers:Object.fromEntries(upload.headers),body:Buffer.from(await upload.arrayBuffer())});assert.equal(ur.status,200);const ud=await ur.json();
 const media=await mf.dispatchFetch('https://slk.test'+ud.url);assert.equal(media.status,200);assert.equal(media.headers.get('content-type'),'image/png');assert.ok((await media.arrayBuffer()).byteLength>1000);
 console.log('PASS: all 12 routes render through the built Cloudflare Worker; D1-backed API, sign-in initialization and R2 image upload/read respond correctly.');
}finally{await mf.dispose()}
