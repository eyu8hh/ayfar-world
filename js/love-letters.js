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
let dailyLetterImageBlob=null;
let dailyLetterImageUrl=null;
async function createDailyLetterImage(){
 if(!activeLetter?.letter_body)throw new Error("تعذر العثور على نص الرسالة.");
 if(dailyLetterImageBlob)return dailyLetterImageBlob;
 if(document.fonts?.load)await Promise.race([document.fonts.load('46px "Aref Ruqaa"'),new Promise(resolve=>setTimeout(resolve,1400))]);
 const canvas=document.createElement("canvas"),width=1080,pad=132,maxTextWidth=816;
 const ctx=canvas.getContext("2d");
 if(!ctx)throw new Error("هذا المتصفح لا يدعم تجهيز الصورة.");
 const themes=[
  {name:"linen",outer:["#e8d8c8","#f5e9dc","#d8c4b3"],paper:["#fffdf7","#f8f0e3"],ink:"#503c37",accent:"#9a5264",line:"rgba(133,78,82,.32)"},
  {name:"garden",outer:["#dce7d9","#edf1e6","#c8d9c9"],paper:["#fffef7","#f3f0df"],ink:"#354b3e",accent:"#547c5b",line:"rgba(84,124,91,.34)"},
  {name:"sunset",outer:["#572f45","#a85e65","#e2a078"],paper:["#fff4e9","#f6dfce"],ink:"#573443",accent:"#a84e61",line:"rgba(168,78,97,.36)"},
  {name:"bluehour",outer:["#263b55","#536a7c","#a2a8a2"],paper:["#fffdf4","#edf0e8"],ink:"#2e4052",accent:"#6b8792",line:"rgba(78,111,132,.38)"},
  {name:"kraft",outer:["#9a795b","#c7a47c","#806047"],paper:["#f5e5c9","#ead4ae"],ink:"#49382d",accent:"#8c493c",line:"rgba(125,77,52,.36)"},
  {name:"rose",outer:["#e9cbd2","#f5e4e4","#d9b7c0"],paper:["#fffafa","#f7e9e9"],ink:"#583747",accent:"#a64e70",line:"rgba(166,78,112,.34)"}
 ];
 const theme=themes[Math.floor(Math.random()*themes.length)];
 let fontSize=46,lineHeight=68,lines=[];
 for(let attempt=0;attempt<8;attempt++){
  ctx.font=fontSize+'px "Aref Ruqaa","Noto Naskh Arabic",serif';
  lines=wrapHandwrittenLines(ctx,activeLetter.letter_body,maxTextWidth);
  if(470+lines.length*lineHeight+330<=16000||fontSize<=32)break;
  fontSize-=2;lineHeight=Math.round(fontSize*1.48);
 }
 const bodyTop=440,height=Math.max(1500,bodyTop+lines.length*lineHeight+330);
 if(height>18000)throw new Error("الرسالة طويلة جداً لتجهيزها في صورة واحدة على هذا الجهاز.");
 canvas.width=width;canvas.height=height;
 const outer=ctx.createLinearGradient(0,0,width,height);
 theme.outer.forEach((color,i)=>outer.addColorStop(i/(theme.outer.length-1),color));
 ctx.fillStyle=outer;ctx.fillRect(0,0,width,height);
 if(theme.name==="bluehour"){
  for(let i=0;i<95;i++){const x=(i*173)%width,y=(i*271)%height;ctx.fillStyle="rgba(255,255,255,.45)";ctx.beginPath();ctx.arc(x,y,(i%3)+1,0,Math.PI*2);ctx.fill();}
 }else if(theme.name==="garden"||theme.name==="rose"){
  ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=theme.accent;ctx.lineWidth=5;
  for(const side of [0,1]){const x=side?width-35:35;ctx.beginPath();ctx.moveTo(x,90);ctx.bezierCurveTo(side?width-180:180,220,side?width-10:10,320,side?width-160:160,440);ctx.stroke();for(let j=0;j<6;j++){const yy=130+j*48;ctx.beginPath();ctx.ellipse(x+(side?-1:1)*(j%2?28:48),yy,24,9,-.6,0,Math.PI*2);ctx.fillStyle=theme.accent;ctx.fill();}}
  ctx.restore();
 }
 const inset=theme.name==="kraft"?48:58;
 ctx.save();ctx.shadowColor="rgba(34,24,22,.28)";ctx.shadowBlur=38;ctx.shadowOffsetY=18;
 ctx.fillStyle=theme.paper[0];ctx.fillRect(inset,inset,width-inset*2,height-inset*2);ctx.restore();
 const paperGrad=ctx.createLinearGradient(inset,inset,width-inset,height-inset);
 paperGrad.addColorStop(0,theme.paper[0]);paperGrad.addColorStop(1,theme.paper[1]);
 ctx.fillStyle=paperGrad;ctx.fillRect(inset,inset,width-inset*2,height-inset*2);
 ctx.strokeStyle=theme.line;ctx.lineWidth=3;
 if(theme.name==="kraft"){
  ctx.setLineDash([10,9]);ctx.strokeRect(86,86,width-172,height-172);ctx.setLineDash([]);
 }else{
  ctx.strokeRect(82,82,width-164,height-164);
  ctx.globalAlpha=.55;ctx.lineWidth=1;ctx.strokeRect(96,96,width-192,height-192);ctx.globalAlpha=1;
 }
 for(let i=0;i<520;i++){const x=72+(i*137)%936,y=70+(i*251)%(height-140);ctx.fillStyle=i%3===0?"rgba(115,86,66,.045)":"rgba(255,255,255,.32)";ctx.fillRect(x,y,i%5===0?3:1,i%4===0?2:1);}
 ctx.direction="rtl";ctx.textAlign="center";ctx.fillStyle=theme.accent;ctx.font='23px "Noto Sans Arabic",sans-serif';
 ctx.fillText(theme.name==="bluehour"?"كلمات تحت ضوء المساء":"رسائل من أيوب",width/2,132);
 ctx.fillStyle=theme.ink;ctx.font='68px "Aref Ruqaa","Noto Naskh Arabic",serif';ctx.fillText("إلى فرحتي",width/2,244);
 ctx.strokeStyle=theme.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(330,284);ctx.quadraticCurveTo(width/2,297,750,284);ctx.stroke();
 const dateSource=activeLetter.created_at?new Date(activeLetter.created_at):new Date(),safeDate=Number.isNaN(dateSource.getTime())?new Date():dateSource;
 ctx.textAlign="right";ctx.direction="rtl";ctx.fillStyle=theme.accent;ctx.font='23px "Noto Sans Arabic",sans-serif';
 ctx.fillText(new Intl.DateTimeFormat("ar-MA",{dateStyle:"long"}).format(safeDate),width-pad,350);
 ctx.fillStyle=theme.ink;ctx.font=fontSize+'px "Aref Ruqaa","Noto Naskh Arabic",serif';
 let y=bodyTop;
 for(const line of lines){if(line)y+=lineHeight;else y+=Math.round(lineHeight*.62);if(line)ctx.fillText(line,width-pad,y,maxTextWidth);}
 const signatureY=y+112;
 ctx.fillStyle=theme.accent;ctx.font='56px "Aref Ruqaa","Noto Naskh Arabic",serif';ctx.fillText("بكل الحب، أيوب",width-pad,signatureY);
 ctx.save();ctx.translate(pad+62,signatureY-18);
 ctx.strokeStyle=theme.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,22);ctx.bezierCurveTo(-72,-26,-22,-62,0,-26);ctx.bezierCurveTo(22,-62,72,-26,0,22);ctx.stroke();ctx.restore();
 ctx.textAlign="center";ctx.font='18px "Noto Sans Arabic",sans-serif';ctx.fillStyle=theme.accent;
 ctx.fillText("كلمات صغيرة… تبقى قريبة من القلب",width/2,height-104);
 dailyLetterImageBlob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
 if(!dailyLetterImageBlob)throw new Error("لم نتمكن من إنشاء ملف الصورة.");
 dailyLetterImageUrl=URL.createObjectURL(dailyLetterImageBlob);
 return dailyLetterImageBlob;
}
async function renderDailyLetterImagePreview(){
 const preview=$("#daily-letter-image-preview"),status=$("#letter-export-status"),button=$("#save-love-letter");
 if(!preview)return;
 if(status)status.textContent="نكتب رسالتكِ على ورقة جديدة…";
 try{
  await createDailyLetterImage();
  const image=document.createElement("img");image.src=dailyLetterImageUrl;image.alt="رسالة مكتوبة بخط اليد من أيوب إلى فرحتي";image.className="daily-letter-handwritten-image";
  preview.replaceChildren(image);
  const fallback=$(".letter-text-fallback");if(fallback)fallback.hidden=true;
  if(status)status.textContent="رسالتكِ أصبحت ورقة مكتوبة بخط اليد ❤️";
  if(button){button.disabled=false;button.textContent="احتفظي بالصورة";}
 }catch(error){
  const fallback=$(".letter-text-fallback");if(fallback)fallback.hidden=false;
  if(status){status.classList.add("is-error");status.textContent=error?.message||"تعذر تجهيز صورة الرسالة.";}
  if(button){button.disabled=false;button.textContent="حاولي تجهيز الصورة مجدداً";}
 }
}
async function saveDailyLetterImage(button){
 const status=$("#letter-export-status");
 if(!button||button.disabled)return;
 button.disabled=true;button.textContent="نجهّز الصورة…";
 try{
  const blob=await createDailyLetterImage(),url=dailyLetterImageUrl||URL.createObjectURL(blob);
  const date=activeLetter?.created_at?new Date(activeLetter.created_at):new Date();
  const safeDate=Number.isNaN(date.getTime())?new Date():date;
  const filenameDate=[safeDate.getFullYear(),String(safeDate.getMonth()+1).padStart(2,"0"),String(safeDate.getDate()).padStart(2,"0")].join("-");
  const link=document.createElement("a");link.href=url;link.download="ayfar-letter-"+filenameDate+".png";document.body.appendChild(link);link.click();link.remove();
  if(status)status.textContent="حُفظت صورة رسالتكِ في التنزيلات ❤️";
 }catch(error){if(status){status.classList.add("is-error");status.textContent=error?.message||"تعذر حفظ الصورة. حاولي مرة أخرى.";}}
 finally{button.disabled=false;button.textContent="احتفظي بالصورة";}
}

async function checkDailyLetter(){
 if(!["farhati","farahati"].includes(window.WorldStore.get().active))return;
 const {data,error}=await client().rpc("get_daily_love_letter");
 if(error){console.error("Daily letter:",error.message);return}
 if(!data||!data.length)return;
 activeLetter=data[0];
 dailyLetterImageBlob=null;
 if(dailyLetterImageUrl){URL.revokeObjectURL(dailyLetterImageUrl);dailyLetterImageUrl=null;}
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
   card.innerHTML='<div class="love-sparkle" aria-hidden="true">♡</div><small>FROM AYOUB 🌙</small><h2>إلى فرحتي 🌸</h2><div id="daily-letter-image-preview" class="daily-letter-image-preview" aria-live="polite"><div class="daily-letter-image-loading">نحضّر لكِ رسالة اليوم… ♡</div></div><article class="letter-paper letter-text-fallback">'+esc(activeLetter.letter_body).replace(/\n/g,"<br>")+"</article><p class=\"love-foot\">كلماتكِ اليوم لها ورقتها الخاصة، وغداً حكاية جديدة ♡</p><div class=\"letter-export-actions\"><button id=\"save-love-letter\" class=\"letter-save-button\" type=\"button\" disabled>نجهّز الصورة…</button><p id=\"letter-export-status\" class=\"letter-export-status\" role=\"status\" aria-live=\"polite\">نكتبها لكِ بخط اليد…</p></div><button id=\"close-love-letter\" class=\"primary\" type=\"button\">أكملت القراءة</button>';
   renderDailyLetterImagePreview();
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
 page('<div class="panel star-panel"><div class="bigheart">⭐</div><small class="eyebrow">AYOUB’S STAR BALANCE</small><h2>نجوم أيوب عند فرحتي</h2><div class="star-total">'+Number(wallet.balance).toLocaleString("ar-MA")+' ⭐</div><p>'+(["farhati","farahati"].includes(role)?"هذا رصيد أيوب، وأنتِ وحدكِ من تستطيعين تغييره.":"هذا رصيدك عند فرحتي. يمكنك مشاهدته وسجل تغييره فقط.")+'</p>'+(["farhati","farahati"].includes(role)?'<form id="star-form"><label class="field">عدد النجوم (موجب للإضافة وسالب للخصم)</label><input id="star-delta" class="text" type="number" step="1" required placeholder="مثال: 5 أو -2"><label class="field" for="star-reason">سبب إضافة النجوم أو خصمها</label><input id="star-reason" class="text" maxlength="160" required placeholder="مثلاً: التزام بوعدنا اليوم"><button class="primary" type="submit">تحديث رصيد أيوب ⭐</button><p id="star-status" class="notice"></p></form>':'<p class="notice">صلاحية تعديل النجوم محفوظة لفرحتي وحدها.</p>')+'<h3>سجل النجوم</h3><div class="star-history">'+((history||[]).map(x=>'<div><b class="'+(x.delta>0?'plus':'minus')+'">'+(x.delta>0?'+':'')+x.delta+' ⭐</b><span>'+esc(x.reason||"تغيير في الرصيد")+'</span><small>'+"وقت الإضافة: "+new Date(x.changed_at).toLocaleString("ar-MA")+'</small></div>').join("")||'<p>لا توجد تغييرات بعد.</p>')+'</div><button type="button" class="secondary-action" id="star-back">العودة</button></div>');
 $("#star-back").onclick=()=>{location.reload()};
 const form=$("#star-form");if(form)form.onsubmit=async e=>{e.preventDefault();const delta=Number($("#star-delta").value),status=$("#star-status");if(!Number.isSafeInteger(delta)||!delta){status.textContent="أدخلي عدداً صحيحاً غير صفر.";return}const reason=$("#star-reason").value.trim();if(!reason){status.textContent="اكتبي سبب التغيير حتى يبقى محفوظاً في السجل.";$("#star-reason").focus();return}const {data,error}=await client().rpc("change_ayfar_stars",{p_delta:delta,p_reason:reason});if(error){status.textContent=error.message;return}status.textContent="تم تحديث الرصيد إلى "+Number(data).toLocaleString("ar-MA")+" نجمة.";setTimeout(renderStars,700)};
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
