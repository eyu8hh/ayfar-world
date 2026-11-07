(()=> {
const $=s=>document.querySelector(s),client=()=>window.ayfarSupabase,esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const page=html=>{$("#home").classList.add("hidden");$("#page").classList.remove("hidden");$("#pagebody").innerHTML=html};
let activeLetter=null;
function wrapHandwrittenLines(ctx,value,maxWidth){
 const lines=[];
 String(value||"").replace(/\r/g,"").split("\n").forEach(paragraph=>{
  if(!paragraph.trim()){lines.push("");return;}
  let line="";
  for(const word of paragraph.split(/\s+/)){
   const candidate=line?line+" "+word:word;
   if(line&&ctx.measureText(candidate).width>maxWidth){lines.push(line);line=word;}
   else if(!line&&ctx.measureText(word).width>maxWidth){
    let chunk="";
    for(const character of Array.from(word)){
     const next=chunk+character;
     if(chunk&&ctx.measureText(next).width>maxWidth){lines.push(chunk);chunk=character;}
     else chunk=next;
    }
    line=chunk;
   }else line=candidate;
  }
  if(line)lines.push(line);
 });
 return lines;
}
async function saveDailyLetterImage(button){
 const status=$("#letter-export-status");
 if(!activeLetter?.letter_body){if(status)status.textContent="تعذر العثور على نص الرسالة.";return;}
 if(!button||button.disabled)return;
 button.disabled=true;
 button.textContent="نكتب رسالتكِ على الورق…";
 if(status){status.classList.remove("is-error");status.textContent="نجهّز ورقتكِ بخط اليد…";}
 try{
  if(document.fonts?.load)await Promise.race([document.fonts.load('46px "Aref Ruqaa"'),new Promise(resolve=>setTimeout(resolve,1400))]);
  const canvas=document.createElement("canvas"),width=1080,pad=132,maxTextWidth=816;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("هذا المتصفح لا يدعم تجهيز الصورة.");
  let fontSize=46,lineHeight=68,lines=[];
  for(let attempt=0;attempt<8;attempt++){
   ctx.font=fontSize+'px "Aref Ruqaa","Noto Naskh Arabic",serif';
   lines=wrapHandwrittenLines(ctx,activeLetter.letter_body,maxTextWidth);
   if(470+lines.length*lineHeight+330<=16000||fontSize<=32)break;
   fontSize-=2;lineHeight=Math.round(fontSize*1.48);
  }
  const bodyTop=440,signatureSpace=300;
  const height=Math.max(1500,bodyTop+lines.length*lineHeight+signatureSpace);
  if(height>18000)throw new Error("الرسالة طويلة جداً لتجهيزها في صورة واحدة على هذا الجهاز.");
  canvas.width=width;canvas.height=height;
  const g=ctx.createLinearGradient(0,0,width,height);
  g.addColorStop(0,"#f3e8e5");g.addColorStop(.52,"#f8efea");g.addColorStop(1,"#efe3df");
  ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  ctx.beginPath();
  ctx.moveTo(54,48);ctx.lineTo(width-58,52);ctx.lineTo(width-48,height-56);ctx.lineTo(60,height-50);ctx.closePath();
  const paper=ctx.createLinearGradient(70,55,width-40,height-60);
  paper.addColorStop(0,"#fffdf8");paper.addColorStop(.56,"#fff9ef");paper.addColorStop(1,"#fbf1e5");
  ctx.fillStyle=paper;ctx.fill();
  ctx.strokeStyle="rgba(150,112,89,.25)";ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<420;i++){
   const x=76+(i*137)%928,y=68+(i*251)%(height-136);
   ctx.fillStyle=i%3===0?"rgba(145,105,79,.045)":"rgba(255,255,255,.36)";
   ctx.fillRect(x,y,i%5===0?2:1,i%4===0?3:1);
  }
  ctx.direction="rtl";ctx.textAlign="center";
  ctx.fillStyle="#9b6679";ctx.font='22px "Noto Sans Arabic",sans-serif';
  ctx.fillText("AYFAR WORLD  ·  رسائلنا اليومية",width/2,132);
  ctx.fillStyle="#70243f";ctx.font='66px "Aref Ruqaa","Noto Naskh Arabic",serif';
  ctx.fillText("إلى فرحتي",width/2,244);
  ctx.strokeStyle="rgba(177,112,137,.55)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(330,284);ctx.quadraticCurveTo(width/2,297,750,284);ctx.stroke();
  const dateSource=activeLetter.created_at?new Date(activeLetter.created_at):new Date();
  const safeDate=Number.isNaN(dateSource.getTime())?new Date():dateSource;
  const dateLabel=new Intl.DateTimeFormat("ar-MA",{dateStyle:"long"}).format(safeDate);
  ctx.textAlign="right";ctx.direction="rtl";ctx.fillStyle="#927681";
  ctx.font='23px "Noto Sans Arabic",sans-serif';ctx.fillText(dateLabel,width-pad,350);
  ctx.fillStyle="#4b2b3a";ctx.font=fontSize+'px "Aref Ruqaa","Noto Naskh Arabic",serif';
  let y=bodyTop;
  for(const line of lines){if(line)y+=lineHeight;else y+=Math.round(lineHeight*.62);if(line)ctx.fillText(line,width-pad,y,maxTextWidth);}
  const signatureY=y+112;
  ctx.fillStyle="#70243f";ctx.font='54px "Aref Ruqaa","Noto Naskh Arabic",serif';
  ctx.fillText("بكل الحب، أيوب",width-pad,signatureY);
  ctx.textAlign="left";ctx.font='48px Georgia,serif';ctx.fillStyle="rgba(151,76,103,.62)";
  ctx.fillText("♡",pad,signatureY+10);
  ctx.textAlign="center";ctx.font='18px "Noto Sans Arabic",sans-serif';ctx.fillStyle="#9b7c83";
  ctx.fillText("كلمات صغيرة… تبقى قريبة من القلب",width/2,height-104);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  if(!blob)throw new Error("لم نتمكن من إنشاء ملف الصورة.");
  const objectUrl=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=objectUrl;const filenameDate=[safeDate.getFullYear(),String(safeDate.getMonth()+1).padStart(2,"0"),String(safeDate.getDate()).padStart(2,"0")].join("-");link.download="ayfar-letter-"+filenameDate+".png";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(objectUrl),20000);
  if(status)status.textContent="أصبحت رسالتكِ صورة PNG؛ تحققي من التنزيلات.";
 }catch(error){
  if(status){status.classList.add("is-error");status.textContent=error?.message||"تعذر حفظ الصورة. حاولي مرة أخرى.";}
 }finally{
  button.disabled=false;button.textContent="احتفظي بالرسالة كصورة";
 }
}

async function checkDailyLetter(){
 if(!["farhati","farahati"].includes(window.WorldStore.get().active))return;
 const {data,error}=await client().rpc("get_daily_love_letter");
 if(error){console.error("Daily letter:",error.message);return}
 if(!data||!data.length)return;
 activeLetter=data[0];
 showEnvelope();
}
function showEnvelope(){
 if(document.getElementById("love-overlay"))return;
 const overlay=document.createElement("div");
 overlay.id="love-overlay";
 overlay.setAttribute("role","presentation");
 overlay.innerHTML='<div class="love-card" role="dialog" aria-modal="true" aria-labelledby="daily-letter-title"><div class="love-sparkle" aria-hidden="true">✦　♡　✦</div><small>JUST FOR YOU · FROM AYOUB</small><h2 id="daily-letter-title">رسالة صغيرة تنتظركِ يا فرحتي</h2><p>هناك كلمات اختارها أيوب لتصلكِ اليوم...</p><button id="open-love-envelope" class="envelope" type="button"><span aria-hidden="true">💌</span><b>افتحي ظرفكِ</b></button><div class="love-foot">رسالة واحدة في اليوم، لأن بعض الكلمات تستحق وقتها ♡</div></div>';
 document.body.appendChild(overlay);
 const openingCard=overlay.querySelector(".love-card");
 openingCard?.classList.add("is-entering");
 requestAnimationFrame(()=>openingCard?.classList.remove("is-entering"));
 const button=$("#open-love-envelope");
 button?.addEventListener("click",async()=>{
  if(button.disabled)return;
  button.disabled=true;
  button.setAttribute("aria-busy","true");
  const card=overlay.querySelector(".love-card");
  card?.classList.add("is-opening");
  button.querySelector("b").textContent="نفتح رسالتكِ...";
  const foot=overlay.querySelector(".love-foot");
  if(foot){foot.setAttribute("role","status");foot.setAttribute("aria-live","polite");foot.textContent="لحظة صغيرة... كلمات أيوب في طريقها إليكِ ♡";}
  try{
   const {data,error}=await client().rpc("open_daily_love_letter",{p_letter_id:activeLetter.letter_id});
   if(error)throw error;
   if(!data)throw new Error("يبدو أن رسالة اليوم فُتحت من قبل. حدّثي الصفحة للتحقق من الرسالة التالية.");
   card?.classList.remove("is-opening");
   card?.classList.add("is-revealing");
   card.innerHTML='<div class="love-sparkle" aria-hidden="true">♡</div><small>FROM AYOUB 🌙</small><h2>إلى فرحتي 🌸</h2><article class="letter-paper">'+esc(activeLetter.letter_body).replace(/\n/g,"<br>")+'</article><p class="love-foot">احتفظي بهذه الكلمات، وغدًا حكاية أخرى ♡</p><div class="letter-export-actions"><button id="save-love-letter" class="letter-save-button" type="button">احتفظي بالرسالة كصورة</button><p id="letter-export-status" class="letter-export-status" role="status" aria-live="polite"></p></div><button id="close-love-letter" class="primary" type="button">أكملت القراءة</button>';
   $("#save-love-letter")?.addEventListener("click",event=>saveDailyLetterImage(event.currentTarget));
   $("#close-love-letter")?.addEventListener("click",()=>overlay.remove());
  }catch(error){
   card?.classList.remove("is-opening");
   button.disabled=false;
   button.removeAttribute("aria-busy");
   button.querySelector("b").textContent="إعادة المحاولة";
   if(foot){foot.textContent=error?.message||"تعذر فتح الرسالة. حاولي مرة أخرى.";foot.classList.add("is-error");}
  }
 });
}

async function renderStars(){
 const {data:wallet,error}=await client().from("ayfar_star_wallet").select("balance").eq("id",1).single();
 if(error){page('<div class="panel"><h2>تعذر تحميل النجوم</h2><p>'+esc(error.message)+'</p></div>');return}
 const role=window.WorldStore.get().active;
 const {data:history}=await client().from("ayfar_star_history").select("delta,balance_after,reason,changed_at").order("changed_at",{ascending:false}).limit(30);
 page('<div class="panel star-panel"><div class="bigheart">⭐</div><small class="eyebrow">AYOUB’S STAR BALANCE</small><h2>نجوم أيوب عند فرحتي</h2><div class="star-total">'+Number(wallet.balance).toLocaleString("ar-MA")+' ⭐</div><p>'+(["farhati","farahati"].includes(role)?"هذا رصيد أيوب، وأنتِ وحدكِ من تستطيعين تغييره.":"هذا رصيدك عند فرحتي. يمكنك مشاهدته وسجل تغييره فقط.")+'</p>'+(["farhati","farahati"].includes(role)?'<form id="star-form"><label class="field">عدد النجوم (موجب للإضافة وسالب للخصم)</label><input id="star-delta" class="text" type="number" step="1" required placeholder="مثال: 5 أو -2"><label class="field">السبب أو الاتفاق (اختياري)</label><input id="star-reason" class="text" maxlength="160" placeholder="مثلاً: على اتفاقنا اليوم"><button class="primary" type="submit">تحديث رصيد أيوب ⭐</button><p id="star-status" class="notice"></p></form>':'<p class="notice">صلاحية تعديل النجوم محفوظة لفرحتي وحدها.</p>')+'<h3>سجل النجوم</h3><div class="star-history">'+((history||[]).map(x=>'<div><b class="'+(x.delta>0?'plus':'minus')+'">'+(x.delta>0?'+':'')+x.delta+' ⭐</b><span>'+esc(x.reason||"تغيير في الرصيد")+'</span><small>'+new Date(x.changed_at).toLocaleString("ar-MA")+'</small></div>').join("")||'<p>لا توجد تغييرات بعد.</p>')+'</div><button type="button" class="secondary-action" id="star-back">العودة</button></div>');
 $("#star-back").onclick=()=>{location.reload()};
 const form=$("#star-form");if(form)form.onsubmit=async e=>{e.preventDefault();const delta=Number($("#star-delta").value),status=$("#star-status");if(!Number.isSafeInteger(delta)||!delta){status.textContent="أدخلي عددًا صحيحًا غير صفر.";return}const {data,error}=await client().rpc("change_ayfar_stars",{p_delta:delta,p_reason:$("#star-reason").value});if(error){status.textContent=error.message;return}status.textContent="تم تحديث الرصيد إلى "+Number(data).toLocaleString("ar-MA")+" نجمة.";setTimeout(renderStars,700)};
}
function composeLetter(){
 page('<div class="panel"><div class="bigheart">💌</div><small class="eyebrow">A LETTER FOR FARAHATI</small><h2>اكتب رسالة جديدة</h2><p>ستصل الرسائل واحدة تلو الأخرى، رسالة واحدة في اليوم، بعد قراءة السابقة.</p><form id="letter-form"><label class="field">نص الرسالة</label><textarea id="letter-body" class="text" rows="8" maxlength="10000" required placeholder="اكتب لها ما تريد أن تقرأه..."></textarea><button class="primary" type="submit">أضفها إلى قائمة رسائلها ♡</button><p id="letter-status" class="notice"></p></form><button type="button" class="secondary-action" id="letter-back">العودة</button></div>');
 $("#letter-back").onclick=()=>location.reload();
 $("#letter-form").onsubmit=async e=>{e.preventDefault();const body=$("#letter-body").value.trim(),status=$("#letter-status");if(!body)return;const {error}=await client().from("love_letters").insert({body});if(error){status.textContent="تعذر حفظ الرسالة: "+error.message;return}status.textContent="أُضيفت الرسالة إلى قائمة الانتظار ❤️";$("#letter-body").value=""};
}
document.addEventListener("DOMContentLoaded",()=>{
 const home=document.querySelector("#home");
 if(home){
  const card=document.createElement("button");card.type="button";card.className="feature star-feature";card.id="star-wallet";card.innerHTML='<span>⭐</span><small>OUR STAR PROMISE</small><b>نجوم أيوب عند فرحتي</b><em>رصيد مشترك · فرحتي تعدّله وأيوب يتابع الرصيد وسجل التغييرات</em>';
  const features=home.querySelector(".features");if(features)features.insertBefore(card,home.querySelector("#rating"));
  card.onclick=renderStars;
  const compose=document.createElement("button");compose.type="button";compose.className="feature message-feature";compose.id="compose-love";compose.style.display=window.WorldStore.get().active==="ayoub"?"block":"none";compose.innerHTML='<span>✉</span><small>LETTERS FROM AYOUB</small><b>اكتب رسالة لفرحتي</b><em>أضف رسالة جديدة إلى قائمة رسائلها اليومية</em>';
  const msg=home.querySelector("#messages");if(msg&&msg.parentNode)msg.parentNode.insertBefore(compose,msg.nextSibling);
  compose.onclick=composeLetter;
 }
});
window.AYFAR_on_enter=(role)=>{const compose=$("#compose-love");if(compose)compose.style.display=role==="ayoub"?"block":"none";checkDailyLetter()};
})();
