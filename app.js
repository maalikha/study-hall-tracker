const $=id=>document.getElementById(id);
let type='study',inf='informed',photo=null,items=[],view='add',sel=null;
const now0=new Date();let cy=now0.getFullYear(),cm=now0.getMonth();

let db;
const open=()=>new Promise(r=>{try{const q=indexedDB.open('proof',1);q.onupgradeneeded=()=>q.result.createObjectStore('e',{keyPath:'id'});q.onsuccess=()=>{db=q.result;r()};q.onerror=()=>r()}catch(e){r()}});
const tx=(m,f)=>new Promise(r=>{if(!db)return r(null);try{const s=db.transaction('e',m).objectStore('e');const q=f(s);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});

const pad=n=>String(n).padStart(2,'0');
const toLocal=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const key=d=>{d=new Date(d);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const fmt=s=>new Date(s).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const ikey=i=>key(i.taken||i.date);
const byDay=()=>{const m={};for(const i of items)(m[ikey(i)]=m[ikey(i)]||[]).push(i);return m};

function exifDate(buf){try{const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return null;let o=2;
while(o<v.byteLength){const m=v.getUint16(o);o+=2;if(m===0xFFDA)break;const len=v.getUint16(o);
if(m===0xFFE1&&v.getUint32(o+2)===0x45786966){const t=o+8,le=v.getUint16(t)===0x4949,g16=p=>v.getUint16(p,le),g32=p=>v.getUint32(p,le);
const find=(ifd,tag)=>{const n=g16(ifd);for(let i=0;i<n;i++){const e=ifd+2+i*12;if(g16(e)===tag)return g32(e+8)}return null};
const ex=find(t+g32(t+4),0x8769);if(ex==null)return null;const dt=find(t+ex,0x9003);if(dt==null)return null;
let s='';for(let i=0;i<19;i++)s+=String.fromCharCode(v.getUint8(t+dt+i));
const m2=s.match(/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/);return m2?`${m2[1]}-${m2[2]}-${m2[3]}T${m2[4]}:${m2[5]}`:null}
o+=len}}catch(e){}return null}
async function compress(file){const bmp=await createImageBitmap(file);const sc=Math.min(1,1280/Math.max(bmp.width,bmp.height));
const c=document.createElement('canvas');c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);
c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.8)}

/* tabs */
function setView(v){view=v;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
['add','month','year'].forEach(x=>$('v-'+x).hidden=x!==v);render()}
$('tabs').onclick=e=>{if(e.target.dataset.v)setView(e.target.dataset.v)};

/* add form */
function setType(t){type=t;document.querySelectorAll('#types button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
$('photoPart').hidden=t==='absent';$('absentPart').hidden=t!=='absent'}
$('types').onclick=e=>{if(e.target.dataset.t)setType(e.target.dataset.t)};
$('inf').onclick=e=>{const v=e.target.dataset.v;if(!v)return;inf=v;document.querySelectorAll('#inf button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))};
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;
try{photo=await compress(f)}catch(err){photo=null;alert('Could not read that image.');return}
$('pick').innerHTML=`<img src="${photo}" alt="preview">`;
let ex=null;try{ex=exifDate(await f.arrayBuffer())}catch(e){}
if(ex){$('ptime').value=ex;$('autoNote').textContent='Photo time read from the photo itself.'}
else{$('ptime').value=toLocal(new Date(f.lastModified||Date.now()));$('autoNote').textContent='Photo time taken from the file date. Check it is right.'}};
$('save').onclick=async()=>{
const nowIso=new Date().toISOString();let e;
if(type==='absent'){if(!$('adate').value)return alert('Pick the date.');
e={id:Date.now(),type,informed:inf,date:new Date($('adate').value+'T00:00').toISOString(),submitted:nowIso}}
else{if(!photo)return alert('Add the photo first.');if(!$('ptime').value)return alert('Set the photo time.');
e={id:Date.now(),type,photo,taken:new Date($('ptime').value).toISOString(),submitted:nowIso}}
$('save').disabled=true;await tx('readwrite',s=>s.put(e));items.push(e);
const d=new Date(e.taken||e.date);cy=d.getFullYear();cm=d.getMonth();sel=ikey(e);
photo=null;$('file').value='';$('pick').innerHTML='<span>📷 Tap to add photo</span>';$('ptime').value='';$('autoNote').textContent='';
$('save').disabled=false;setView('month')};

/* renderers */
function card(i){let badge,body;
if(i.type==='absent'){const n=i.informed==='informed';badge=`<span class="badge ${n?'b-inf':'b-not'}">${n?'✅':'❌'} Absent · ${n?'Informed':'Not informed'}</span>`;
body=`<div class="t"><span>Submitted:</span> ${fmt(i.submitted)}</div>`}
else{badge=`<span class="badge ${i.type==='study'?'b-study':'b-club'}">${i.type==='study'?'📚 Study Hall':'🛠️ Club Work'}</span>`;
body=`<div class="t"><span>Photo taken:</span> ${fmt(i.taken)}</div><div class="t"><span>Submitted:</span> ${fmt(i.submitted)}</div>`}
return `<div class="item" data-id="${i.id}">${i.photo?`<img src="${i.photo}" alt="proof" data-big="1">`:''}<div class="in"><div class="row">${badge}</div>${body}</div></div>`}

function counts(list){return {s:list.filter(i=>i.type==='study').length,c:list.filter(i=>i.type==='club').length,a:list.filter(i=>i.type==='absent').length}}
function statHtml(c){return `<span style="background:var(--g2);color:var(--g)">📚 ${c.s} study</span><span style="background:var(--b2);color:var(--b)">🛠️ ${c.c} club</span><span style="background:var(--r2);color:var(--r)">🚫 ${c.a} absent</span>`}

function renderMonth(){
$('mt').textContent=`${MN[cm]} ${cy}`;
const map=byDay(),first=new Date(cy,cm,1).getDay(),days=new Date(cy,cm+1,0).getDate(),tk=key(new Date());
$('mstats').innerHTML=statHtml(counts(items.filter(i=>{const d=new Date(i.taken||i.date);return d.getFullYear()===cy&&d.getMonth()===cm})));
let h=['S','M','T','W','T','F','S'].map(d=>`<div class="dow">${d}</div>`).join('');
for(let i=0;i<first;i++)h+='<div class="cell blank"></div>';
for(let d=1;d<=days;d++){const k=`${cy}-${pad(cm+1)}-${pad(d)}`,l=map[k]||[];
const ph=l.find(x=>x.photo),ab=l.find(x=>x.type==='absent');
let cls='cell'+(k===tk?' today':'')+(k===sel?' sel':'');
if(!ph&&ab)cls+=ab.informed==='informed'?' abs-i':' abs-n';
const ic=l.map(x=>x.type==='study'?'📚':x.type==='club'?'🛠️':x.informed==='informed'?'✅':'❌');
h+=`<button class="${cls}" data-k="${k}">${ph?`<img src="${ph.photo}" alt="">`:''}<span class="n">${d}</span><span class="ic">${[...new Set(ic)].join('')}</span></button>`}
$('mgrid').innerHTML=h;
const l=sel?(map[sel]||[]):[];
$('dayDetail').innerHTML=sel?`<div class="dt">${new Date(sel+'T00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`+(l.length?l.map(card).join('')+'<div class="empty">Double-tap an entry to delete it.</div>':'<div class="empty">No entry for this day.</div>'):'<div class="empty">Tap a date to see the proof.</div>'}

function renderYear(){
$('yt').textContent=cy;const map=byDay();
$('ystats').innerHTML=statHtml(counts(items.filter(i=>new Date(i.taken||i.date).getFullYear()===cy)));
let h='';
for(let m=0;m<12;m++){const first=new Date(cy,m,1).getDay(),days=new Date(cy,m+1,0).getDate();let g='';
for(let i=0;i<first;i++)g+='<i class="e"></i>';
for(let d=1;d<=days;d++){const l=map[`${cy}-${pad(m+1)}-${pad(d)}`]||[];let c='';
if(l.some(x=>x.type==='study'))c='s';else if(l.some(x=>x.type==='club'))c='c';else if(l.some(x=>x.type==='absent')){c=l.find(x=>x.type==='absent').informed==='informed'?'ai':'an'}
g+=`<i class="${c}"></i>`}
const n=items.filter(i=>{const d=new Date(i.taken||i.date);return d.getFullYear()===cy&&d.getMonth()===m}).length;
h+=`<button class="mini" data-m="${m}"><h4>${MN[m].slice(0,3)}<span style="color:var(--mut);font-weight:400">${n||''}</span></h4><div class="mg">${g}</div></button>`}
$('ygrid').innerHTML=h}

function render(){if(view==='month')renderMonth();if(view==='year')renderYear()}

$('pm').onclick=()=>{cm--;if(cm<0){cm=11;cy--}sel=null;renderMonth()};
$('nm').onclick=()=>{cm++;if(cm>11){cm=0;cy++}sel=null;renderMonth()};
$('py').onclick=()=>{cy--;renderYear()};$('ny').onclick=()=>{cy++;renderYear()};
$('mgrid').onclick=e=>{const b=e.target.closest('[data-k]');if(b){sel=b.dataset.k;renderMonth()}};
$('ygrid').onclick=e=>{const b=e.target.closest('[data-m]');if(b){cm=Number(b.dataset.m);sel=null;setView('month')}};
let lastTap=0,lastId=null,tapTimer=null;
async function delItem(id){if(!confirm('Delete this entry?'))return;await tx('readwrite',s=>s.delete(Number(id)));items=items.filter(i=>String(i.id)!==id);renderMonth()}
$('dayDetail').addEventListener('click',e=>{const it=e.target.closest('.item');if(!it)return;const id=it.dataset.id,t=Date.now();
if(lastId===id&&t-lastTap<350){clearTimeout(tapTimer);lastTap=0;lastId=null;delItem(id);return}
lastTap=t;lastId=id;clearTimeout(tapTimer);
if(e.target.tagName==='IMG'){const src=e.target.src;tapTimer=setTimeout(()=>{$('big').firstElementChild.src=src;$('big').style.display='flex'},350)}});
$('bk').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(items)],{type:'application/json'}));a.download='proof-backup-'+key(new Date())+'.json';a.click()};
$('rs').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const arr=JSON.parse(await f.text());for(const x of arr){await tx('readwrite',s=>s.put(x));if(!items.some(i=>i.id===x.id))items.push(x)}render();alert('Restored '+arr.length+' entries.')}catch(err){alert('Invalid backup file.')}};
$('big').onclick=()=>$('big').style.display='none';

(async()=>{try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}$('adate').value=toLocal(new Date()).slice(0,10);await open();items=(await tx('readonly',s=>s.getAll()))||[];render()})();