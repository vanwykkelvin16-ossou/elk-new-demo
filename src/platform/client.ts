export async function api(path:string, body?:unknown, method?:string){
 const r=await fetch('/api'+path,{method:method||(body===undefined?'GET':'POST'),headers:body!==undefined?{'Content-Type':'application/json'}:{},body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin'});
 const d=await r.json(); if(!r.ok) throw new Error(d.error||'Something went wrong. Please try again.');return d;
}
export const money=(n:number)=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(n||0);
export const dateLabel=(s:string)=>s?new Date(s+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'Date to be announced';
