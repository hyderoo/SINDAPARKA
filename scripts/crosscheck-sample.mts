import { z } from "../src/lib/who";
const out:any[]=[]; let s=12345; const r=()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296};
for(let i=0;i<1500;i++){const sex=r()<.5?"L":"P";const age=Math.floor(r()*61);
 const h=Math.round((45+ (age*1.0+ r()*10) *1.0 + 0)*10)/10; const hh=Math.min(Math.max(h,45),120);
 const w=Math.round((2+ age*0.18 + r()*3)*10)/10;
 out.push({sex,age,h:hh,w,hfa:z("hfa",sex,age,hh),wfa:z("wfa",sex,age,w),wfh:z("wfh",sex,age,w,hh),bfa:null});}
console.log(JSON.stringify(out));
