(()=> {
  const supa=()=>window.ayfarSupabase;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const localDate=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const questions=[
    "ما التفصيل الصغير الذي يجعلك تشعر بأنني أفكر فيك؟",
    "لو استطعنا قضاء يوم كامل معاً دون أي التزامات، كيف تحب أن نقضيه؟",
    "ما المكان الذي تتمنى أن نزوره معاً أولاً؟",
    "ما أكثر ذكرى بسيطة بيننا تحب أن تعيشها مرة أخرى؟",
    "ما الشيء الذي تتمنى أن نتعلمه معاً؟",
    "متى تشعر أنني أفهمك دون أن تشرح؟",
    "ما العادة الجميلة التي تريد أن نصنعها معاً؟",
    "لو كتبنا رسالة لأنفسنا بعد سنة، ماذا تتمنى أن نقول فيها؟",
    "ما نوع المفاجآت التي تسعدك أكثر؟",
    "ما الأغنية أو اللحن الذي يذكرك بنا؟",
    "ما أكثر شيء يجعلك تضحك مهما كان يومك متعباً؟",
    "ما حلم صغير يمكننا البدء بتحقيقه هذا الشهر؟",
    "ما الوجبة التي تريد أن نحضرها معاً؟",
    "ما الصفة التي تحبها في طريقتنا معاً؟",
    "ما الشيء الذي تريد أن نجربه لأول مرة؟",
    "كيف يبدو موعدنا المثالي في رأيك؟",
    "ما أجمل كلمة تحب سماعها مني؟",
    "ما أكثر شيء يجعلك تشعر بالطمأنينة؟",
    "لو امتلكنا عطلة مفاجئة غداً، أين نذهب؟",
    "ما تفصيل تتمنى ألا يتغير بيننا أبداً؟",
    "ما المهارة التي يمكن أن نتحدى بعضنا لتعلمها؟",
    "ما أكثر موقف شعرت فيه أننا فريق واحد؟",
    "ما الشيء الذي تحب أن نحتفل به حتى لو كان صغيراً؟",
    "لو اخترنا لوناً يمثل عالمنا، ماذا تختار ولماذا؟",
    "ما نشاط بسيط يمكن أن يحوّل مساءً عادياً إلى ذكرى؟",
    "ما أكثر شيء تتطلع إليه في أيامنا القادمة؟",
    "ما السؤال الذي تتمنى أن أسألك إياه أكثر؟",
    "ما الشيء الذي تريد أن نشكر أنفسنا عليه اليوم؟",
    "لو صنعنا تقليداً خاصاً بنا، ماذا سيكون؟",
    "ما أجمل طريقة ننهي بها يوماً طويلاً معاً؟"
  ];
  const activities=[
    {kind:"خفيفة",title:"موعد القهوة الهادئ",desc:"حضّرا مشروبكما المفضل، واختارا موضوعاً واحداً تتحدثان عنه بعيداً عن الهاتف."},
    {kind:"حديث",title:"ثلاثة أشياء ممتنة لها",desc:"يذكر كل واحد ثلاثة أشياء جميلة حدثت له اليوم، ثم يستمع الآخر دون مقاطعة."},
    {kind:"إبداع",title:"ارسم ما تتخيله",desc:"ارسموا شيئاً يرمز إلى عالمكما خلال خمس دقائق، ثم اكشفا الرسمين."},
    {kind:"عن بُعد",title:"شاهدوا الشيء نفسه",desc:"اختارا مقطعاً قصيراً أو حلقة وشاهداها في الوقت نفسه، ثم تبادلا أكثر لقطة أعجبتكما."},
    {kind:"خفيفة",title:"اختيار عشوائي للعشاء",desc:"اكتبا ثلاثة أطباق، واتركا القرعة تختار ما ستتناولانه في المرة القادمة."},
    {kind:"حديث",title:"حكاية من الطفولة",desc:"يروي كل واحد ذكرى من طفولته لم يسبق له أن حكاها بالتفصيل."},
    {kind:"إبداع",title:"قائمة أحلام من خمس نقاط",desc:"أضيفا خمسة أشياء تريدان تجربتها معاً إلى قائمة أحلامكما."},
    {kind:"عن بُعد",title:"جولة صور",desc:"اختار كل واحد خمس صور من هاتفه تحكي شيئاً عن أسبوعه، واشرحا قصتها."},
    {kind:"خفيفة",title:"تحدي الأغنية",desc:"أرسل كل واحد أغنية تصف مزاجه الآن، وحاولا تخمين سبب الاختيار."},
    {kind:"حديث",title:"أسئلة بلا استعجال",desc:"اختارا سؤالاً عميقاً واحداً، وخذا وقتكما للإجابة بصدق وهدوء."},
    {kind:"إبداع",title:"ابتكار شعار لعالمنا",desc:"صمما معاً عبارة قصيرة وشعاراً بسيطاً يعبّران عن AYFAR WORLD."},
    {kind:"عن بُعد",title:"موعد افتراضي",desc:"ارتديا ما تحبان، جهزا مشروباً، واجعلا مكالمتكما موعداً حقيقياً."},
    {kind:"خفيفة",title:"خمن اختياري",desc:"اختار كل واحد شيئاً يحبه، وعلى الآخر تخمينه عبر خمسة أسئلة فقط."},
    {kind:"حديث",title:"رسالة صوتية قصيرة",desc:"سجل كل واحد رسالة صوتية مدتها دقيقة يذكر فيها شيئاً يقدّره في الآخر."},
    {kind:"إبداع",title:"قصة من جملة وجملة",desc:"ابدآ قصة؛ يضيف كل واحد جملة بالتناوب حتى تصلا إلى نهاية مضحكة."},
    {kind:"عن بُعد",title:"جولة في مكانكما",desc:"أجريا مكالمة فيديو، وعرّف كل واحد الآخر على زاوية يحبها في مكانه."},
    {kind:"خفيفة",title:"اختيار فيلم للمستقبل",desc:"جهزا قائمة بثلاثة أفلام، واتفقا على أول فيلم لموعدكما القادم."},
    {kind:"حديث",title:"كيف أساندك؟",desc:"اسأل كل واحد الآخر: ما أفضل طريقة أساندك بها عندما يكون يومك صعباً؟"},
    {kind:"إبداع",title:"تصميم بطاقة",desc:"اصنعا بطاقة رقمية صغيرة لبعضكما باستخدام لونين ورمز واحد وكلمات قليلة."},
    {kind:"عن بُعد",title:"وجبة في الوقت نفسه",desc:"حضّرا وجبة بسيطة في الوقت نفسه، ثم تناولاها معاً عبر مكالمة."},
    {kind:"خفيفة",title:"مسابقة معلومات",desc:"اختارا خمس أسئلة ثقافية من لعبة AYFAR وتنافسا على النقاط."},
    {kind:"حديث",title:"ذكرى تستحق التوثيق",desc:"اختارا ذكرى مشتركة واكتبا تفاصيلها في رسالة تحتفظان بها."},
    {kind:"إبداع",title:"خريطة أمنيات",desc:"حددا ثلاثة أماكن تريدان زيارتها، وابحثا عن أفضل وقت لتحقيق أول زيارة."},
    {kind:"عن بُعد",title:"قراءة متزامنة",desc:"اقرآ النص القصير نفسه، ثم تبادلا الجملة التي بقيت في الذهن."},
    {kind:"خفيفة",title:"تحدي الصور",desc:"التقطا صورة لشيء بلون تختارانه، ثم قارنا النتيجتين."},
    {kind:"حديث",title:"شيء أريد قوله",desc:"امنحا كل واحد دقيقتين ليقول شيئاً كان يريد مشاركته دون مقاطعة."},
    {kind:"إبداع",title:"قائمة تشغيل مشتركة",desc:"أضيفا ثلاث أغانٍ لكل واحد إلى قائمة تشغيل تجمع ذوقكما."},
    {kind:"عن بُعد",title:"لعبة التخمين",desc:"اختاروا غرضاً قريباً، وقدّموا تلميحات متدرجة حتى يخمنه الطرف الآخر."},
    {kind:"خفيفة",title:"موعد المشي",desc:"إذا أمكن، اخرجا في نزهة قصيرة وتبادلا صور التفاصيل الجميلة التي تلاحظانها."},
    {kind:"حديث",title:"اتفاق صغير للأسبوع",desc:"اختارا عادة بسيطة تريدان الالتزام بها معاً خلال الأيام السبعة القادمة."}
  ];
  const surprises=[
    ["رسالة امتنان","أرسل للطرف الآخر رسالة قصيرة تذكر فيها ثلاثة أشياء تقدّرها فيه."],
    ["موعد من اختياره","دع الطرف الآخر يختار نشاط موعدكما القادم دون اعتراضات."],
    ["صورة وذكرى","أرسل صورة قديمة أو حديثة، واحكِ لماذا اخترتها."],
    ["أغنية إهداء","اختر أغنية وأهدها للطرف الآخر مع سبب الاختيار."],
    ["خمس دقائق اهتمام","اترك كل شيء جانباً وامنح الطرف الآخر خمس دقائق من الاستماع الكامل."],
    ["وعد صغير","اختر وعداً بسيطاً تستطيع تنفيذه خلال هذا الأسبوع ونفّذه."],
    ["رسالة للمستقبل","اكتب رسالة قصيرة تفتحانها في موعد تحددانه لاحقاً."],
    ["مفاجأة لطيفة","حضّر مشروباً أو وجبة يحبها الطرف الآخر دون إخباره مسبقاً."],
    ["ذكرى بصوتك","سجّل مقطعاً صوتياً تحكي فيه أجمل تفصيل تتذكره من بداية حكايتكما."],
    ["اختيار اليوم","اترك للطرف الآخر اختيار الفيلم أو اللعبة أو الموسيقى اليوم."],
    ["ثلاثة أسباب","اذكر ثلاثة أسباب تجعلك سعيداً بوجود هذا الشخص في حياتك."],
    ["موعد بلا هواتف","اتفقا على وقت قصير تضعان فيه الهاتف جانباً وتركزان على بعضكما."]
  ];
  const todayQuestion=()=>{
    const d=new Date();const start=new Date(d.getFullYear(),0,0);const day=Math.floor((d-start)/86400000);
    return questions[(day-1)%questions.length];
  };
  const overlays=new Map();
  function createOverlay(id,kicker,title,subtitle){
    const wrap=document.createElement("div");wrap.className="dreams-overlay";wrap.id="plans-"+id+"-overlay";wrap.hidden=true;
    wrap.innerHTML='<section class="plans-tool-dialog" role="dialog" aria-modal="true" aria-labelledby="plans-'+id+'-title"><div class="plans-tool-head"><div><small>'+kicker+'</small><h2 id="plans-'+id+'-title">'+title+'</h2><p>'+subtitle+'</p></div><button class="plans-tool-close" type="button" data-plan-close aria-label="إغلاق">×</button></div><div class="plans-tool-content"></div></section>';
    document.body.appendChild(wrap);overlays.set(id,wrap);return wrap;
  }
  const daily=createOverlay("daily","A QUESTION FOR US","سؤالنا اليومي ♡","سؤال واحد كل يوم، وإجابتان تقرّبان المسافة بينكما.");
  const goals=createOverlay("goals","OUR SHARED GOALS","أهدافنا المشتركة ♡","نحوّل ما نتمنى فعله إلى خطوات صغيرة ننجزها معاً.");
  const activity=createOverlay("activity","A LITTLE IDEA FOR TODAY","ماذا نفعل اليوم؟","فكرة بسيطة تناسب مزاجكما، ويمكن تبديلها حتى تجدا ما يعجبكما.");
  const surprise=createOverlay("surprise","A LITTLE SURPRISE","صندوق المفاجآت ♡","افتحا الصندوق واكتشفا لفتة صغيرة تصنع يوماً أجمل.");
  const q$=s=>daily.querySelector(s),g$=s=>goals.querySelector(s),a$=s=>activity.querySelector(s),s$=s=>surprise.querySelector(s);
  let currentUser=null,dailyChannel=null,goalsChannel=null,answers=[],goalItems=[],selectedActivity=null,selectedMood="الكل",revealedSurprise=null;
  const role=()=>window.WorldStore?.get?.().active||"ayoub";
  const labelFor=id=>id===currentUser?.id?(role()==="ayoub"?"أيوب":"فرحتي"):(role()==="ayoub"?"فرحتي":"أيوب");
  async function requireUser(){
    if(!supa())throw new Error("خدمة المزامنة غير متاحة حالياً.");
    const {data,error}=await supa().auth.getUser();if(error||!data?.user)throw new Error("انتهت جلسة الدخول. سجّلا الدخول مجدداً.");
    currentUser=data.user;return currentUser;
  }
  function close(id){
    const wrap=overlays.get(id);if(!wrap)return;wrap.hidden=true;document.body.style.overflow="";
    if(id==="daily"&&dailyChannel){supa().removeChannel(dailyChannel);dailyChannel=null;}
    if(id==="goals"&&goalsChannel){supa().removeChannel(goalsChannel);goalsChannel=null;}
  }
  function open(id){
    const wrap=overlays.get(id);if(!wrap)return;wrap.hidden=false;document.body.style.overflow="hidden";
    if(id==="daily")openDaily();if(id==="goals")openGoals();if(id==="activity")openActivity();if(id==="surprise")openSurprise();
  }
  document.addEventListener("click",e=>{
    const closeButton=e.target.closest("[data-plan-close]");if(closeButton){const wrap=closeButton.closest(".dreams-overlay");for(const [id,node] of overlays)if(node===wrap)close(id);return;}
    if(e.target.classList.contains("dreams-overlay")){for(const [id,node] of overlays)if(node===e.target)close(id);}
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){for(const [id,node] of overlays)if(!node.hidden)close(id);}});
  document.querySelectorAll("[data-plan-open]").forEach(el=>el.addEventListener("click",()=>open(el.dataset.planOpen)));
  function setFeedback(root,msg){const el=root.querySelector("[data-feedback]");if(el)el.textContent=msg||"";}
  async function loadAnswers(date){
    const {data,error}=await supa().from("ayfar_daily_answers").select("*").eq("question_date",date).order("created_at",{ascending:true});
    if(error)throw error;answers=data||[];renderDaily(date);
  }
  function renderDaily(date){
    const mine=answers.find(x=>x.user_id===currentUser.id);
    const other=answers.find(x=>x.user_id!==currentUser.id);
    const q=todayQuestion();
    q$(".plans-tool-content").innerHTML='<div class="daily-question-card"><small>سؤال '+new Intl.DateTimeFormat("ar-MA",{day:"numeric",month:"long"}).format(new Date())+'</small><h3>'+esc(q)+'</h3></div><form class="plans-tool-form" data-daily-form><label for="daily-answer">إجابتك</label><textarea id="daily-answer" maxlength="1000" required placeholder="اكتب إجابتك بصراحة...">'+esc(mine?.answer||"")+'</textarea><button class="plans-tool-primary" type="submit">حفظ إجابتي ♡</button><div class="plans-tool-feedback" data-feedback></div></form><div class="daily-answers">'+(mine?'<article class="daily-answer"><b>'+labelFor(mine.user_id)+' · إجابتك</b><p>'+esc(mine.answer)+'</p></article>':'<div class="daily-waiting">لم ترسلا إجاباتكما بعد. ابدأ بإجابتك اليوم ♡</div>')+(other?'<article class="daily-answer"><b>'+labelFor(other.user_id)+' · إجابة الطرف الآخر</b><p>'+esc(other.answer)+'</p></article>':'<div class="daily-waiting">إجابة الطرف الآخر ستظهر هنا عندما يرسلها.</div>')+'</div>';
    q$("[data-daily-form]").addEventListener("submit",async e=>{
      e.preventDefault();const answer=q$("#daily-answer").value.trim();if(!answer){setFeedback(daily,"اكتب إجابتك أولاً.");return;}
      const btn=q$("[data-daily-form] button");btn.disabled=true;setFeedback(daily,"جارٍ حفظ إجابتك…");
      const {error}=await supa().from("ayfar_daily_answers").upsert({question_date:date,user_id:currentUser.id,answer},{onConflict:"question_date,user_id"});
      btn.disabled=false;if(error){setFeedback(daily,"تعذر الحفظ: "+error.message);return;}
      await loadAnswers(date);setFeedback(daily,"وصلت إجابتك إلى مساحتكما ♡");
    });
  }
  async function openDaily(){
    const content=q$(".plans-tool-content");content.innerHTML='<div class="plan-tool-empty">نحضّر سؤال اليوم…</div>';
    try{await requireUser();const date=localDate(new Date());await loadAnswers(date);
      if(!dailyChannel)dailyChannel=supa().channel("ayfar-daily-answers-live").on("postgres_changes",{event:"*",schema:"public",table:"ayfar_daily_answers"},()=>loadAnswers(date).catch(e=>setFeedback(daily,e.message))).subscribe();
    }catch(e){content.innerHTML='<div class="plan-tool-empty">'+esc(e.message)+'</div>';}
  }
  async function loadGoals(){
    const {data,error}=await supa().from("ayfar_shared_goals").select("*").order("created_at",{ascending:false});
    if(error)throw error;goalItems=data||[];renderGoals();
  }
  function renderGoals(){
    const done=goalItems.filter(g=>g.progress===100).length;
    g$(".plans-tool-content").innerHTML='<div class="goals-summary"><span><b>'+goalItems.length+'</b>كل الأهداف</span><span><b>'+done+'</b>اكتملت</span><span><b>'+Math.max(0,goalItems.length-done)+'</b>قيد العمل</span></div><form class="plans-tool-form" data-goal-form><label for="goal-title">هدف جديد</label><input id="goal-title" maxlength="120" required placeholder="مثلاً: نخطط لأول رحلة معاً"><label for="goal-details">تفاصيل (اختياري)</label><textarea id="goal-details" maxlength="500" placeholder="ما الخطوات أو التفاصيل التي نريد تذكرها؟"></textarea><label for="goal-date">موعد مستهدف (اختياري)</label><input id="goal-date" type="date"><button class="plans-tool-primary" type="submit">إضافة إلى أهدافنا ♡</button><div class="plans-tool-feedback" data-feedback></div></form><div class="shared-goals-list">'+(goalItems.length?goalItems.map(g=>'<article class="shared-goal" data-goal-id="'+esc(g.id)+'"><div class="shared-goal-top"><h3>'+esc(g.title)+'</h3><span>'+ (g.progress===100?'✓':'♡')+'</span></div>'+(g.details?'<p>'+esc(g.details)+'</p>':'')+(g.target_date?'<time>الموعد المستهدف: '+esc(g.target_date)+'</time>':'')+'<div class="shared-goal-progress"><input type="range" min="0" max="100" step="5" value="'+Number(g.progress||0)+'" data-goal-progress aria-label="نسبة إنجاز '+esc(g.title)+'"><b>'+Number(g.progress||0)+'%</b></div><div class="shared-goal-actions"><button type="button" data-goal-delete>حذف الهدف</button></div></article>').join(""):'<div class="plan-tool-empty">لا توجد أهداف بعد. أضيفا أول هدف، ولو كان صغيراً ✨</div>')+'</div>';
    g$("[data-goal-form]").addEventListener("submit",async e=>{
      e.preventDefault();const title=g$("#goal-title").value.trim(),details=g$("#goal-details").value.trim(),target_date=g$("#goal-date").value||null;if(!title)return;
      const btn=g$("[data-goal-form] button");btn.disabled=true;setFeedback(goals,"جارٍ إضافة الهدف…");
      const {error}=await supa().from("ayfar_shared_goals").insert({title,details,target_date,created_by:currentUser.id});
      btn.disabled=false;if(error){setFeedback(goals,"تعذر الحفظ: "+error.message);return;}await loadGoals();setFeedback(goals,"أُضيف الهدف إلى رحلتكما ♡");
    });
  }
  async function openGoals(){
    g$(".plans-tool-content").innerHTML='<div class="plan-tool-empty">نفتح قائمة أهدافكما…</div>';
    try{await requireUser();await loadGoals();if(!goalsChannel)goalsChannel=supa().channel("ayfar-shared-goals-live").on("postgres_changes",{event:"*",schema:"public",table:"ayfar_shared_goals"},()=>loadGoals().catch(e=>setFeedback(goals,e.message))).subscribe();}
    catch(e){g$(".plans-tool-content").innerHTML='<div class="plan-tool-empty">'+esc(e.message)+'</div>';}
  }
  goals.addEventListener("input",e=>{
    if(!e.target.matches("[data-goal-progress]"))return;
    const card=e.target.closest("[data-goal-id]");const label=card?.querySelector(".shared-goal-progress b");if(label)label.textContent=e.target.value+"%";
  });
  goals.addEventListener("change",async e=>{
    if(!e.target.matches("[data-goal-progress]"))return;
    const card=e.target.closest("[data-goal-id]");if(!card)return;
    const {error}=await supa().from("ayfar_shared_goals").update({progress:Number(e.target.value)}).eq("id",card.dataset.goalId);
    if(error){setFeedback(goals,"تعذر تحديث التقدم: "+error.message);return;}await loadGoals();setFeedback(goals,"تم تحديث تقدمكما ♡");
  });
  goals.addEventListener("click",async e=>{
    const btn=e.target.closest("[data-goal-delete]");if(!btn)return;
    const card=btn.closest("[data-goal-id]");if(!card||!confirm("هل تريدان حذف هذا الهدف؟"))return;
    const {error}=await supa().from("ayfar_shared_goals").delete().eq("id",card.dataset.goalId);
    if(error){setFeedback(goals,"تعذر الحذف: "+error.message);return;}await loadGoals();setFeedback(goals,"تم حذف الهدف.");
  });
  function openActivity(){
    selectedActivity=null;selectedMood="الكل";
    a$(".plans-tool-content").innerHTML='<div class="plans-tool-form"><label for="activity-mood">ما المزاج الذي يناسبكما؟</label><select id="activity-mood"><option>الكل</option><option>خفيفة</option><option>حديث</option><option>إبداع</option><option>عن بُعد</option></select><button class="plans-tool-primary" type="button" data-pick-activity>اقترحوا لنا فكرة ♡</button></div><div class="plan-suggestions" data-suggestion><div class="plan-tool-empty">اختارا المزاج، ثم اكشفا فكرة اليوم.</div></div><div class="plans-tool-feedback" data-feedback></div>';
    a$("#activity-mood").addEventListener("change",e=>selectedMood=e.target.value);
    const pickActivity=()=>{
      const pool=activities.filter(x=>selectedMood==="الكل"||x.kind===selectedMood).filter(x=>x.title!==selectedActivity?.title);
      const item=pool[Math.floor(Math.random()*pool.length)]||activities[0];selectedActivity=item;
      a$("[data-suggestion]").innerHTML='<article class="plan-suggestion"><small>فكرة من '+esc(item.kind)+'</small><h3>'+esc(item.title)+'</h3><p>'+esc(item.desc)+'</p></article><div class="plan-tool-row"><button type="button" class="plan-tool-secondary" data-pick-activity>فكرة أخرى ↻</button><button type="button" class="plan-tool-secondary" data-activity-done>سنجرّبها ♡</button></div>';
      a$("[data-pick-activity]").addEventListener("click",pickActivity);
      a$("[data-activity-done]").addEventListener("click",()=>setFeedback(activity,"اتفقنا! نتمنى لكما وقتاً جميلاً معاً ♡"));
    };
    a$("[data-pick-activity]").addEventListener("click",pickActivity);
  }
  function openSurprise(){
    revealedSurprise=null;
    const reveal=()=>{
      const pool=surprises.filter(x=>x[0]!==revealedSurprise?.[0]);revealedSurprise=pool[Math.floor(Math.random()*pool.length)]||surprises[0];
      s$(".plans-tool-content").innerHTML='<div class="plan-surprise-stage"><div><div class="plan-surprise-gift">💝</div><small>مفاجأتكما لهذا اليوم</small><h3>'+esc(revealedSurprise[0])+'</h3><p>'+esc(revealedSurprise[1])+'</p><button class="plans-tool-primary" type="button" data-reveal-surprise>مفاجأة أخرى ↻</button></div></div><div class="plans-tool-feedback" data-feedback></div>';
      s$("[data-reveal-surprise]").addEventListener("click",reveal);
    };
    s$(".plans-tool-content").innerHTML='<div class="plan-surprise-stage"><div><div class="plan-surprise-gift">🎁</div><small>هناك شيء لطيف ينتظركما</small><h3>هل أنتما مستعدان؟</h3><p>لا تعرفان ما الذي يخفيه الصندوق. افتحاه معاً واكتشفا مفاجأة صغيرة.</p><button class="plans-tool-primary" type="button" data-reveal-surprise>افتحا الصندوق ✨</button></div></div><div class="plans-tool-feedback" data-feedback></div>';
    s$("[data-reveal-surprise]").addEventListener("click",reveal);
  }
})();