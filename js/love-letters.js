(()=> {
const $=s=>document.querySelector(s),client=()=>window.ayfarSupabase,esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const page=html=>{$("#home").classList.add("hidden");$("#page").classList.remove("hidden");$("#pagebody").innerHTML=html};
let activeLetter=null;
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
   card.innerHTML='<div class="love-sparkle" aria-hidden="true">♡</div><small>FROM AYOUB 🌙</small><h2>إلى فرحتي 🌸</h2><article class="letter-paper">'+esc(activeLetter.letter_body).replace(/\n/g,"<br>")+'</article><p class="love-foot">احتفظي بهذه الكلمات، وغدًا حكاية أخرى ♡</p><button id="close-love-letter" class="primary" type="button">أكملت القراءة</button>';
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
 page('<div class="panel star-panel"><div class="bigheart">⭐</div><small class="eyebrow">AYOUB’S STAR BALANCE</small><h2>نجوم أيوب عند فرحتي</h2><div class="star-total">'+Number(wallet.balance).toLocaleString("ar-MA")+' ⭐</div><p>'+(["farhati","farahati"].includes(role)?"هذا رصيد أيوب، وأنتِ وحدكِ من تستطيعين تغييره.":"هذا رصيدك عند فرحتي. يمكنك مشاهدته وسجل تغييره فقط.")+'</p>'+(["farhati","farahati"].includes(role)?'<form id="star-form"><label class="field">عدد النجوم (موجب للإضافة وسالب للخصم)</label><input id="star-delta" class="text" type="number" step="1" required placeholder="مثال: 5 أو -2"><label class="field">السبب أو الاتفاق (اختياري)</label><input id="star-reason" class="text" maxlength="160" placeholder="مثلاً: على اتفاقنا اليوم"><button class="primary" type="submit">تحديث رصيد أيوب ⭐</button><p id="star-status" class="notice"></p></form>':'<p class="notice">صلاحية تعديل النجوم محفوظة لفرحتي وحدها.</p>')+'<h3>سجل النجوم</h3><div class="star-history">'+((history||[]).map(x=>'<div><b class="'+(x.delta>0?'plus':'minus')+'">'+(x.delta>0?'+':'')+x.delta+' ⭐</b><span>'+esc(x.reason||"تغيير في الرصيد")+'</span><small>'+new Date(x.changed_at).toLocaleString("ar-MA")+'</small></div>').join("")||'<p>لا توجد تغييرات بعد.</p>')+'</div><button class="secondary-action" id="star-back">العودة</button></div>');
 $("#star-back").onclick=()=>{location.reload()};
 const form=$("#star-form");if(form)form.onsubmit=async e=>{e.preventDefault();const delta=Number($("#star-delta").value),status=$("#star-status");if(!Number.isSafeInteger(delta)||!delta){status.textContent="أدخلي عددًا صحيحًا غير صفر.";return}const {data,error}=await client().rpc("change_ayfar_stars",{p_delta:delta,p_reason:$("#star-reason").value});if(error){status.textContent=error.message;return}status.textContent="تم تحديث الرصيد إلى "+Number(data).toLocaleString("ar-MA")+" نجمة.";setTimeout(renderStars,700)};
}
function composeLetter(){
 page('<div class="panel"><div class="bigheart">💌</div><small class="eyebrow">A LETTER FOR FARAHATI</small><h2>اكتب رسالة جديدة</h2><p>ستصل الرسائل واحدة تلو الأخرى، رسالة واحدة في اليوم، بعد قراءة السابقة.</p><form id="letter-form"><label class="field">نص الرسالة</label><textarea id="letter-body" class="text" rows="8" maxlength="10000" required placeholder="اكتب لها ما تريد أن تقرأه..."></textarea><button class="primary" type="submit">أضفها إلى قائمة رسائلها ♡</button><p id="letter-status" class="notice"></p></form><button class="secondary-action" id="letter-back">العودة</button></div>');
 $("#letter-back").onclick=()=>location.reload();
 $("#letter-form").onsubmit=async e=>{e.preventDefault();const body=$("#letter-body").value.trim(),status=$("#letter-status");if(!body)return;const {error}=await client().from("love_letters").insert({body});if(error){status.textContent="تعذر حفظ الرسالة: "+error.message;return}status.textContent="أُضيفت الرسالة إلى قائمة الانتظار ❤️";$("#letter-body").value=""};
}
document.addEventListener("DOMContentLoaded",()=>{
 const home=document.querySelector("#home");
 if(home){
  const card=document.createElement("button");card.className="feature star-feature";card.id="star-wallet";card.innerHTML='<span>⭐</span><small>OUR STAR PROMISE</small><b>نجوم أيوب عند فرحتي</b><em>رصيد مشترك · فرحتي تعدّله وأيوب يتابع الرصيد وسجل التغييرات</em>';
  const features=home.querySelector(".features");if(features)features.insertBefore(card,home.querySelector("#rating"));
  card.onclick=renderStars;
  const compose=document.createElement("button");compose.className="feature message-feature";compose.id="compose-love";compose.style.display=window.WorldStore.get().active==="ayoub"?"block":"none";compose.innerHTML='<span>✉</span><small>LETTERS FROM AYOUB</small><b>اكتب رسالة لفرحتي</b><em>أضف رسالة جديدة إلى قائمة رسائلها اليومية</em>';
  const msg=home.querySelector("#messages");if(msg&&msg.parentNode)msg.parentNode.insertBefore(compose,msg.nextSibling);
  compose.onclick=composeLetter;
 }
});
window.AYFAR_on_enter=(role)=>{const compose=$("#compose-love");if(compose)compose.style.display=role==="ayoub"?"block":"none";checkDailyLetter()};
})();
