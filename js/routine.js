(()=> {
  const supa=()=>window.ayfarSupabase;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const modes=[
    {id:"daily",name:"يومي",icon:"☀️",items:[["wake","🌅","استيقظت للتو"],["sleep","😴","نائم / نائمة"],["breakfast","🥐","أتناول الفطور"],["lunch","🍽️","وقت الغداء"],["dinner","🍲","وقت العشاء"],["coffee","☕","قهوة واستراحة"],["shower","🚿","أستعد / عناية شخصية"],["quiet","🕯️","وقت هادئ لنفسي"]]},
    {id:"work",name:"العمل والدراسة",icon:"💻",items:[["work","💼","في العمل"],["study","📚","أدرس الآن"],["meeting","🗣️","اجتماع / حصة"],["course","🎓","أتعلم شيئاً جديداً"],["reading","📖","أقرأ"],["focus","🎧","وقت تركيز"],["break","🧃","استراحة قصيرة"]]},
    {id:"home",name:"البيت",icon:"🏡",items:[["clean","🧹","ترتيب وتنظيف"],["cook","👩‍🍳","أطبخ"],["laundry","🧺","غسيل الملابس"],["organize","🗂️","أنظم أغراضي"],["family","🏠","وقت مع العائلة"],["garden","🪴","أعتني بالنباتات"]]},
    {id:"wellness",name:"الصحة والعناية",icon:"🌿",items:[["gym","🏋️","تمرين رياضي"],["walk","🚶","أتمشى"],["run","🏃","أركض"],["selfcare","🧴","عناية بنفسي"],["rest","🛋️","أرتاح قليلاً"],["meditate","🌱","تأمل / هدوء"]]},
    {id:"fun",name:"الترفيه",icon:"🎮",items:[["game","🎮","ألعب الآن"],["movie","🎬","أشاهد فيلماً"],["series","📺","أتابع مسلسلاً"],["music","🎵","أستمع للموسيقى"],["social","📱","أتصفح هاتفي"],["creative","🎨","وقت إبداعي"],["hobby","🧩","أمارس هوايتي"]]},
    {id:"out",name:"الخروج والتنقل",icon:"🚗",items:[["commute","🚗","في الطريق"],["bus","🚌","في المواصلات"],["shopping","🛍️","أتسوق"],["errands","📍","أقضي مشاوير"],["outing","🌆","في نزهة"],["travel","✈️","أسافر / أتنقل"]]},
    {id:"social",name:"الناس والتواصل",icon:"💬",items:[["friends","🫂","مع الأصدقاء"],["call","📞","في مكالمة"],["visit","🚪","في زيارة"],["date","💗","موعد خاص"],["alone","🌙","أحتاج بعض الوقت وحدي"],["available","💚","متاح / متاحة الآن"]]},
    {id:"together",name:"لحظاتنا",icon:"♡",items:[["miss","💌","أفكر فيك"],["waiting","⏳","أنتظر مكالمتنا"],["watchtogether","🍿","نشاهد شيئاً معاً"],["listentogether","🎧","نستمع للموسيقى معاً"],["talk","💬","أريد أن نتحدث"],["plan","🗓️","أخطط لشيء لنا"]]}
  ];
  const moods=[["happy","😄","سعيد"],["love","🥰","مليء بالمحبة"],["calm","😌","هادئ"],["focused","🧠","مركز"],["excited","🤩","متحمس"],["playful","😜","مرح"],["tired","😴","متعب"],["stressed","😣","مضغوط"],["sad","😔","حزين"],["anxious","🫤","قلق"],["low","🌧️","مزاجي منخفض"],["space","🌙","أحتاج هدوءاً"]];
  let user=null,role="ayoub",statuses=[],music=[],channel=null,poll=null,activeTab="now",activeMode="daily",draftActivity="coffee",draftMood="calm",busy=false,ready=false;
  const root=()=>$("#routine-app");
  const activityById=id=>modes.flatMap(m=>m.items).find(x=>x[0]===id)||["available","💚","متاح الآن"];
  const moodById=id=>moods.find(x=>x[0]===id);
  const currentMode=()=>modes.find(m=>m.id===activeMode)||modes[0];
  function timeAgo(value){
    if(!value)return "الآن";
    const mins=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));
    if(mins<1)return "بدأ للتو";
    if(mins<60)return "منذ "+mins+" دقيقة";
    const hrs=Math.floor(mins/60);
    if(hrs<24)return "منذ "+hrs+" ساعة";
    return "منذ "+Math.floor(hrs/24)+" يوم";
  }
  function personCard(who,label,avatar){
    const item=statuses.find(s=>s.user_id===who);
    const mine=who===user?.id;
    if(!item)return '<article class="routine-person '+(who==="ayoub"?"ayoub":"farahati")+'"><div class="routine-person-head"><span class="routine-avatar">'+avatar+'</span><div><b>'+label+'</b><small>'+(mine?"مساحتك اليومية":"مساحة الطرف الآخر")+'</small></div></div><div class="routine-private">لم يشارك '+(mine?"حالة حالية بعد":"حالة حالية الآن")+' ♡</div></article>';
    const expired=item.expires_at&&new Date(item.expires_at).getTime()<Date.now();
    const activity=activityById(item.activity_key);
    const mood=moodById(item.mood);
    return '<article class="routine-person '+(who==="ayoub"?"ayoub":"farahati")+'"><div class="routine-person-head"><span class="routine-avatar">'+avatar+'</span><div><b>'+label+'</b><small>'+(mine?"أنت الآن":"ما يفعله الآن")+' · '+esc(timeAgo(item.started_at))+'</small></div></div>'+(expired?'<div class="routine-private">انتهى الوقت المحدد لهذا النشاط.</div>':'<div class="routine-activity-icon">'+esc(activity[1])+'</div><h5>'+esc(item.activity_label||activity[2])+'</h5><p>'+esc(item.note||"")+'</p>'+(item.share_mood&&mood?'<span class="routine-mood">'+mood[1]+' '+esc(mood[2])+'</span>':'')+'</article>');
  }
  function renderNow(){
    const mode=currentMode(),own=statuses.find(s=>s.user_id===user?.id);
    const activityButtons=mode.items.map(x=>'<button type="button" class="'+(draftActivity===x[0]?"selected":"")+'" data-routine-activity="'+x[0]+'">'+x[1]+' '+esc(x[2])+'</button>').join("");
    const modeButtons=modes.map(m=>'<button type="button" class="'+(activeMode===m.id?"active":"")+'" data-routine-mode="'+m.id+'">'+m.icon+' '+esc(m.name)+'</button>').join("");
    const moodButtons=moods.map(m=>'<button type="button" class="'+(draftMood===m[0]?"selected":"")+'" data-routine-mood="'+m[0]+'">'+m[1]+' '+esc(m[2])+'</button>').join("");
    return '<div class="routine-section-title"><h4>ماذا يحدث الآن؟</h4><small>تتحدث تلقائياً بين الهاتفين</small></div><div class="routine-people">'+personCard("ayoub","أيوب","🌙")+personCard("farahati","فرحتي","🌸")+'</div><form class="routine-compose" id="routine-status-form"><h4>حدّث حالتك الآن</h4><p>اختر ما تفعله، ودع الطرف الآخر يشعر بأنه قريب من يومك.</p><span class="routine-field-label">اختر نمط اللحظة</span><div class="routine-mode-list">'+modeButtons+'</div><span class="routine-field-label">ماذا تفعل الآن؟</span><div class="routine-activity-list">'+activityButtons+'</div><span class="routine-field-label">كيف مزاجك؟</span><div class="routine-mood-list">'+moodButtons+'</div><label class="routine-field-label" for="routine-note">تفصيل صغير (اختياري)</label><textarea class="routine-input routine-note" id="routine-note" maxlength="160" placeholder="مثلاً: أراجع دروسي، وبعدها سأكون متاحاً للمكالمة…">'+esc(own?.note||"")+'</textarea><div class="routine-form-row"><div><label class="routine-field-label" for="routine-duration">المدة المتوقعة</label><select class="routine-select" id="routine-duration"><option value="0">حتى أغيّرها بنفسي</option><option value="15">15 دقيقة</option><option value="30">30 دقيقة</option><option value="60">ساعة</option><option value="120">ساعتان</option><option value="240">4 ساعات</option><option value="480">8 ساعات</option></select></div><div><label class="routine-field-label" for="routine-visibility">من يرى حالتي؟</label><select class="routine-select" id="routine-visibility"><option value="shared" '+(own?.visibility!=="private"?"selected":"")+'>نشاركها معاً</option><option value="private" '+(own?.visibility==="private"?"selected":"")+'>خاصة بي</option></select></div></div><label class="routine-check-row"><span>أشارك مزاجي مع الطرف الآخر</span><input id="routine-share-mood" type="checkbox" '+(own?.share_mood!==false?"checked":"")+'></label><div class="routine-actions"><button type="submit" '+(busy?"disabled":"")+'>حفظ حالتي ♡</button><button class="secondary" type="button" data-routine-finish>انتهيت / متاح الآن</button></div><div class="routine-feedback" id="routine-feedback" role="status" aria-live="polite"></div><div class="routine-duration-note">يمكنك جعل حالتك خاصة في أي وقت. انتهاء المدة لا يحذفها؛ بل يوضح للطرف الآخر أن النشاط انتهى.</div></form>';
  }
  function parseYoutube(raw){
    try{
      const u=new URL(raw.trim()),host=u.hostname.toLowerCase().replace(/^www\./,"");
      if(!["youtube.com","m.youtube.com","music.youtube.com","youtu.be","youtube-nocookie.com"].includes(host))return null;
      const list=u.searchParams.get("list");
      if(list&&/^[A-Za-z0-9_-]{6,80}$/.test(list))return {media_type:"playlist",youtube_id:list};
      let id="";
      if(host==="youtu.be")id=u.pathname.split("/").filter(Boolean)[0]||"";
      else if(u.pathname==="/watch")id=u.searchParams.get("v")||"";
      else {const parts=u.pathname.split("/").filter(Boolean);if(["embed","shorts","live"].includes(parts[0]))id=parts[1]||"";else if(parts[0]==="playlist")return null;}
      if(!/^[A-Za-z0-9_-]{6,20}$/.test(id))return null;
      return {media_type:"video",youtube_id:id};
    }catch(_){return null;}
  }
  function renderMusic(){
    return '<div class="routine-section-title"><h4>موسيقى عالمنا 🎧</h4><small>قوائم وأغانٍ نضيفها معاً</small></div><form class="routine-music-form" id="routine-music-form"><h4>أضف قائمة أو أغنية من YouTube</h4><p>ضع رابط قائمة تشغيل كاملة أو رابط أغنية. ستظهر للطرف الآخر ويمكنه تشغيلها من هنا.</p><label class="routine-field-label" for="routine-music-title">اسم القائمة / الأغنية</label><input class="routine-input" id="routine-music-title" maxlength="100" placeholder="مثلاً: أغاني الطريق أو أغنيتنا"><label class="routine-field-label" for="routine-music-url">رابط YouTube</label><input class="routine-input" id="routine-music-url" type="url" required placeholder="https://www.youtube.com/playlist?list=…"><label class="routine-field-label" for="routine-music-mood">أجواء القائمة</label><select class="routine-select" id="routine-music-mood"><option value="عام">متنوعة</option><option value="رومانسية">رومانسية ♡</option><option value="هادئة">هادئة 🌙</option><option value="حماسية">حماسية ⚡</option><option value="ذكريات">ذكرياتنا ✨</option><option value="للطريق">للطريق 🚗</option></select><div class="routine-actions"><button type="submit" '+(busy?"disabled":"")+'>أضف إلى موسيقانا ♡</button></div><div class="routine-feedback" id="routine-music-feedback" role="status" aria-live="polite"></div></form><div class="routine-music-list">'+(music.length?music.map(item=>'<article class="routine-music-item"><iframe loading="lazy" title="'+esc(item.title)+'" src="https://www.youtube-nocookie.com/embed/'+(item.media_type==="playlist"?"videoseries?list=":"")+encodeURIComponent(item.youtube_id)+'" allow="accelerometer; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><div class="routine-music-copy"><div><b>'+esc(item.title)+'</b><small>'+(item.media_type==="playlist"?"قائمة تشغيل":"أغنية")+' · '+esc(item.mood||"متنوعة")+' · أضافها '+(item.added_by===user?.id?"أنت":item.added_by_role==="ayoub"?"أيوب":"فرحتي")+'</small></div><a href="https://www.youtube.com/'+(item.media_type==="playlist"?"playlist?list=":"watch?v=")+encodeURIComponent(item.youtube_id)+'" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div><button class="routine-music-remove" type="button" data-routine-music-delete="'+esc(item.id)+'">إزالة من قائمتنا</button></article>').join(""):'<div class="routine-music-empty">لم نضف موسيقانا بعد.<br>ابدأ بأول قائمة تشغيل تحب أن تسمعها فرحتي معك. ♡</div>')+'</div><div class="routine-privacy-note">المشغل من YouTube الرسمي. لا يبدأ التشغيل تلقائياً، وقد يتطلب تسجيل الدخول أو الاتصال بالإنترنت حسب إعدادات YouTube.</div>';
  }
  function render(){
    if(!root())return;
    root().innerHTML='<div class="routine-workspace"><div class="routine-tabs"><button type="button" data-routine-tab="now" class="'+(activeTab==="now"?"active":"")+'">روتيننا الآن</button><button type="button" data-routine-tab="music" class="'+(activeTab==="music"?"active":"")+'">موسيقى عالمنا ♫</button></div>'+(activeTab==="now"?renderNow():renderMusic())+'</div>';
  }
  async function loadAll(){
    if(!user||!supa())return;
    const [s,m]=await Promise.all([
      supa().from("ayfar_routine_status").select("*"),
      supa().from("ayfar_shared_music").select("*").order("created_at",{ascending:false})
    ]);
    if(s.error||m.error){
      const msg=(s.error?.message||m.error?.message||"تعذر تحميل المساحة");
      if(root())root().innerHTML='<div class="routine-empty">تعذر تحميل روتيننا وموسيقانا.<br>'+esc(msg)+'<br>تأكد من تشغيل ترحيل قاعدة البيانات أولاً.</div>';
      return;
    }
    statuses=s.data||[];
    music=(m.data||[]).map(item=>({...item,added_by_role:item.added_by===user.id?role:(item.added_by_role||"")}));
    render();
  }
  async function saveStatus(){
    if(busy||!user)return;
    const activity=activityById(draftActivity),duration=Number($("#routine-duration")?.value||0),visibility=$("#routine-visibility")?.value||"shared";
    const now=new Date(),expires=duration?new Date(now.getTime()+duration*60000).toISOString():null;
    const payload={user_id:user.id,activity_key:activity[0],activity_label:activity[2],category:activeMode,mood:draftMood,note:$("#routine-note")?.value.trim()||"",visibility,share_mood:!!$("#routine-share-mood")?.checked,duration_minutes:duration,started_at:now.toISOString(),expires_at:expires};
    busy=true;const feedback=$("#routine-feedback");if(feedback)feedback.textContent="جارٍ حفظ حالتك…";render();
    const {error}=await supa().from("ayfar_routine_status").upsert(payload,{onConflict:"user_id"});
    busy=false;
    if(error){if(feedback)feedback.textContent="تعذر الحفظ: "+error.message;else render();return;}
    await loadAll();
  }
  async function finishStatus(){
    if(busy||!user)return;
    const now=new Date().toISOString();
    busy=true;
    const {error}=await supa().from("ayfar_routine_status").upsert({user_id:user.id,activity_key:"available",activity_label:"متاح / متاحة الآن",category:"social",mood:draftMood,note:"",visibility:"shared",share_mood:true,duration_minutes:0,started_at:now,expires_at:null},{onConflict:"user_id"});
    busy=false;
    if(error){const f=$("#routine-feedback");if(f)f.textContent="تعذر تحديث الحالة: "+error.message;return;}
    await loadAll();
  }
  async function addMusic(){
    if(busy||!user)return;
    const url=$("#routine-music-url")?.value||"",parsed=parseYoutube(url),title=$("#routine-music-title")?.value.trim(),mood=$("#routine-music-mood")?.value||"عام";
    const feedback=$("#routine-music-feedback");
    if(!parsed){if(feedback)feedback.textContent="الرابط غير صالح. استخدم رابط قائمة تشغيل أو فيديو من YouTube.";return;}
    busy=true;if(feedback)feedback.textContent="نضيفها إلى موسيقانا…";render();
    const {error}=await supa().from("ayfar_shared_music").insert({title:title|| (parsed.media_type==="playlist"?"قائمة موسيقية مشتركة":"أغنية من عالمنا"),youtube_url:url.trim(),youtube_id:parsed.youtube_id,media_type:parsed.media_type,mood,added_by:user.id});
    busy=false;
    if(error){if(root())root().innerHTML='<div class="routine-empty">تعذر إضافة الرابط: '+esc(error.message)+'</div>';return;}
    await loadAll();
    activeTab="music";render();
  }
  async function deleteMusic(id){
    if(busy||!confirm("هل تريد إزالة هذا العنصر من موسيقانا المشتركة؟"))return;
    busy=true;const {error}=await supa().from("ayfar_shared_music").delete().eq("id",id);busy=false;
    if(error){const f=$("#routine-music-feedback");if(f)f.textContent="تعذر الحذف: "+error.message;return;}
    await loadAll();
  }
  async function init(activeRole){
    if(!supa()||!root())return;
    const {data,error}=await supa().auth.getUser();
    if(error||!data?.user)return;
    user=data.user;
    const {data:profile}=await supa().from("profiles").select("role").eq("id",user.id).single();
    role=String(profile?.role||activeRole||"ayoub").toLowerCase()==="farahati"||String(profile?.role||activeRole||"").toLowerCase()==="farhati"?"farahati":"ayoub";
    await loadAll();
    if(!channel){
      channel=supa().channel("ayfar-routine-and-music")
        .on("postgres_changes",{event:"*",schema:"public",table:"ayfar_routine_status"},loadAll)
        .on("postgres_changes",{event:"*",schema:"public",table:"ayfar_shared_music"},loadAll)
        .subscribe();
    }
    if(poll)clearInterval(poll);
    poll=setInterval(loadAll,20000);
    ready=true;
  }
  const el=root();
  if(el){
    el.addEventListener("click",event=>{
      const tab=event.target.closest("[data-routine-tab]");if(tab){activeTab=tab.dataset.routineTab;render();return;}
      const mode=event.target.closest("[data-routine-mode]");if(mode){activeMode=mode.dataset.routineMode;draftActivity=currentMode().items[0][0];render();return;}
      const activity=event.target.closest("[data-routine-activity]");if(activity){draftActivity=activity.dataset.routineActivity;render();return;}
      const mood=event.target.closest("[data-routine-mood]");if(mood){draftMood=mood.dataset.routineMood;render();return;}
      if(event.target.closest("[data-routine-finish]")){finishStatus();return;}
      const del=event.target.closest("[data-routine-music-delete]");if(del)deleteMusic(del.dataset.routineMusicDelete);
    });
    el.addEventListener("submit",event=>{
      if(event.target.id==="routine-status-form"){event.preventDefault();saveStatus();}
      if(event.target.id==="routine-music-form"){event.preventDefault();addMusic();}
    });
  }
  window.AYFAR_Routine={init};
})();