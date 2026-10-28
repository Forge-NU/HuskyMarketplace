// Import exact *committed* draft legal copy from Bina's original prototype branch.
// Safe static content only. This does not modify source docs or access Supabase.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const repo=path.resolve(root,'../..');
const fn=path.join(root,'lib/photo-policies.ts');
let output={};
for(const name of ['terms','privacy']){
 let text=null;
 const relative=`docs/photographic-ui/${name}.html`;
 const local=path.join(repo,relative);
 if(fs.existsSync(local))text=fs.readFileSync(local,'utf8');
 if(!text){try{text=execFileSync('git',['show',`origin/feature/photographic-ui-integration:${relative}`],{cwd:repo,encoding:'utf8',maxBuffer:1024*1024})}catch{}}
 const match=text?.match(/<div class="policy-body">([\s\S]*?)<\/div>\s*<div class="policy-links">/i);
 if(!match){console.log(`Original ${name} text unavailable; using safe draft fallback.`);continue}
 let html=match[1]
   .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
   .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,'')
   .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi,'')
   .replace(/javascript:/gi,'')
   .replace(/href="(terms|privacy|safety)\.html"/gi,'href="/$1"');
 output[name]=html;
}
if(Object.keys(output).length){
 const current=fs.readFileSync(fn,'utf8');
 const prior=Object.fromEntries([...current.matchAll(/^\s*(terms|privacy):\s*`([\s\S]*?)`,?$/gm)].map(x=>[x[1],x[2]]));
 const final={terms:output.terms||prior.terms||'',privacy:output.privacy||prior.privacy||''};
 fs.writeFileSync(fn,'// Imported from repository prototype draft policies. Not final launch policies.\nexport const POLICY_HTML: Record<string,string> = '+JSON.stringify(final,null,2)+';\n');
 console.log('Imported original prototype policy text: '+Object.keys(output).join(', '));
}
