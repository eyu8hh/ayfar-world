(()=> {
 const $=s=>document.querySelector(s), sb=window.ayfarSupabase, body=$("#pagebody");
 const bank=[["سبايدرمان","أبطال خارقون"],["باتمان","أبطال خارقون"],["سوبرمان","أبطال خارقون"],["آيرون مان","أبطال خارقون"],["المرأة الخارقة","أبطال خارقون"],["هاري بوتر","خيال وسينما"],["إلسا","خيال وسينما"],["شيرلوك هولمز","خيال وسينما"],["جاك سبارو","خيال وسينما"],["سيمبا","كرتون وأنمي"],["سبونج بوب","كرتون وأنمي"],["بيكاتشو","كرتون وأنمي"],["ناروتو","كرتون وأنمي"],["لوفي","كرتون وأنمي"],["ماريو","كرتون وألعاب"],["سونيك","كرتون وألعاب"],["توم","كرتون وأنمي"],["جيري","كرتون وأنمي"],["سندريلا","خيال وسينما"],["علاء الدين","خيال وسينما"],["مستر بين","شخصيات معروفة"],["Wednesday","خيال وسينما"],["ميكي ماوس","كرتون وأنمي"],["شريك","كرتون وأنمي"]];
 let role=null, state=null, timer=null, busy=false, lastRendered="";
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const label=p=>p==="ayoub"?"أيوب 🌙":"فرحتي 🌸";
 const toast=t=>{const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)};
 const call=async(name,args)=>{const {data,error}=await sb.rpc(name,args||{});if(error)throw error;return data};
 const shell=inner=>{body.innerHTML='<div class="panel character-panel"><div class="character-top"><span class="game-mark">🎭</span><span class="game-kicker">AYFAR WORLD · ONLINE GAME</span></div>'+inner+'</div>'};
 function stop(){if(timer){clearInterval(timer);timer=null}}
 async function refresh(){try{const next=await call("character_game_get");const signature=JSON.stringify(next);if(signature!==lastRendered){state=next;lastRendered=signature;render()}}catch(e){stop();shell('<h2>تعذر تحميل اللعبة</h2><p>'+esc(e.message)+'</p><p class="notice">تأكد من تشغيل ملف إعداد اللعبة في Supabase.</p><button class="secondary-action" id="cg-back">العودة</button>');$("#cg-back").onclick=()=>$("#back").click()}}
 async function act(name,payload){if(busy)return;busy=true;try{state=await call("character_game_act",{action_name:name,payload:payload||{}});lastRendered=JSON.stringify(state);render()}catch(e){toast(e.message||"تعذر تنفيذ الخطوة")}finally{busy=false}}
 function render(){
  if(!state)return;
  const own=state.picks?.[role], other=role==="ayoub"?"farhati":"ayoub", asker=state.asker;
  if(state.finished||state.stage==="result"){
   const p=state.picks||{},t=state.turns||{};
   shell('<div class="bigheart">🏆</div><small class="eyebrow">نهاية المباراة</small><h2>أحسنتم يا أيوب وفرحتي!</h2><div class="result-grid"><article><span>🌙</span><b>أيوب</b><strong>'+(t.ayoub?.points||0)+' نقاط</strong><em>الشخصية: '+esc(p.ayoub)+'</em></article><article><span>🌸</span><b>فرحتي</b><strong>'+(t.farahati?.points||t.farhati?.points||0)+' نقاط</strong><em>الشخصية: '+esc(p.farhati)+'</em></article></div><button class="primary" id="cg-new">مباراة جديدة</button> <button class="secondary-action" id="cg-back">العودة</button>');
   $("#cg-new").onclick=()=>act("reset");$("#cg-back").onclick=()=>{stop();$("#back").click()};return;
  }
  if(!own){
   shell('<small class="eyebrow">اختيار سري من هاتفك</small><h2>اختر شخصيتك يا '+label(role)+'</h2><p>لن تظهر الشخصية للطرف الآخر. اختر شخصية واحدة فقط.</p><div class="privacy-note">🔒 اختيارك سري ومحفوظ في قاعدة البيانات.</div><div class="character-grid">'+bank.map((c,i)=>'<button class="character-choice" data-pick="'+i+'"><span>❔</span><b>'+c[0]+'</b><small>'+c[1]+'</small></button>').join("")+'</div><button class="secondary-action" id="cg-back">العودة</button>');
   body.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>act("pick",{character:bank[+b.dataset.pick][0]}));$("#cg-back").onclick=()=>{stop();$("#back").click()};return;
  }
  if(state.stage==="pick"){
   shell('<div class="bigheart">⏳</div><h2>تم حفظ اختيارك السري</h2><p>ننتظر '+label(other)+' ليختار شخصيته من هاتفه.</p><div class="privacy-note">ستبدأ اللعبة تلقائياً عندما يختار الطرفان.</div><button class="secondary-action" id="cg-back">العودة</button>');
   $("#cg-back").onclick=()=>{stop();$("#back").click()};return;
  }
  if(state.stage==="ask"){
   if(asker!==role){shell('<div class="bigheart">💭</div><h2>الدور الآن لـ '+label(asker)+'</h2><p>انتظر حتى يطرح الطرف الآخر سؤاله. ستظهر لك الخطوة التالية تلقائياً.</p><div class="score-strip"><span>أسئلتك: '+(state.turns?.[role]?.questions||0)+'/15</span><span>تخميناتك: '+(state.turns?.[role]?.attempts||0)+'</span></div>');return}
   shell('<small class="eyebrow">دورك لطرح السؤال</small><h2>اسأل عن شخصية '+label(other)+'</h2><div class="score-strip"><span>أسئلتك: '+(state.turns?.[role]?.questions||0)+'/15</span><span>تخمينات خاطئة: '+(state.turns?.[role]?.attempts||0)+'</span></div><label class="field">اكتب سؤالاً إجابته نعم أو لا</label><textarea id="cg-question" class="text" rows="2" maxlength="180" placeholder="مثلاً: هل الشخصية من الأبطال الخارقين؟"></textarea><button class="primary" id="cg-send">إرسال السؤال</button>');
   $("#cg-send").onclick=()=>{const q=$("#cg-question").value.trim();if(q.length<2)return toast("اكتب السؤال أولاً");act("question",{question:q})};return;
  }
  if(state.stage==="answer"){
   if(asker===role){shell('<h2>تم إرسال سؤالك</h2><p>بانتظار إجابة '+label(other)+'...</p><div class="question-card">'+esc(state.question)+'</div>');return}
   shell('<small class="eyebrow">أجب من هاتفك</small><h2>سؤال من '+label(asker)+'</h2><div class="question-card">'+esc(state.question)+'</div><p>أجب بصدق بنعم أو لا.</p><div class="answer-actions"><button class="answer-yes" id="cg-yes">نعم</button><button class="answer-no" id="cg-no">لا</button></div>');
   $("#cg-yes").onclick=()=>act("answer",{answer:"yes"});$("#cg-no").onclick=()=>act("answer",{answer:"no"});return;
  }
  if(state.stage==="guess"){
   if(asker!==role){shell('<h2>الطرف الآخر يفكر في التخمين</h2><p>بانتظار '+label(asker)+'...</p><div class="question-card">'+esc(state.question)+'<br>الإجابة: '+(state.answer==="yes"?"نعم":"لا")+'</div>');return}
   shell('<small class="eyebrow">حان وقت التخمين</small><h2>ما الشخصية التي اختارها '+label(other)+'؟</h2><div class="question-card">'+esc(state.question)+'<br>الإجابة: '+(state.answer==="yes"?"نعم":"لا")+'</div><label class="field">اختر الشخصية</label><select id="cg-guess" class="text"><option value="">اختر...</option>'+bank.map(c=>'<option>'+esc(c[0])+'</option>').join("")+'</select><button class="primary" id="cg-submit">تأكيد التخمين</button>');
   $("#cg-submit").onclick=()=>{const v=$("#cg-guess").value;if(!v)return toast("اختر شخصية");act("guess",{guess:v})};return;
  }
 }
 document.addEventListener("click",e=>{const b=e.target.closest('[data-game="characters"]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();role=window.WorldStore?.get()?.active;if(role==="farahati")role="farhati";if(!["ayoub","farhati"].includes(role)){toast("سجّل الدخول أولاً");return}stop();lastRendered="";$("#home").classList.add("hidden");$("#page").classList.remove("hidden");refresh();timer=setInterval(refresh,3000)},true);
 window.addEventListener("beforeunload",stop);
})();