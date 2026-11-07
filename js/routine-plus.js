(()=> {
  const $=s=>document.querySelector(s), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let db=null,user=null,role="ayoub",tab="schedule",schedules=[],habits=[],checks=[],busy=false,channel=null,poll=null;
  const dateKey=h=>{const d=new Date();if(h.frequency==="weekly"){const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset)}return d.toISOString().slice(0,10)};
  const days=[["الأحد",0],["الإثنين",1],["الثلاثاء",2],["الأربعاء",3],["الخميس",4],["الجمعة",5],["السبت",6]];
  const root=()=>$("#routine-plus-app"),label=r=>r==="ayoub"?"أيوب 🌙":"فرحتي 🌸",dayNames=a=>(a||[]).map(n=>days.find(d=>d[1]===n)?.[0]).join("، ");
  function render(){
    const el=root();if(!el)return;
    el.innerHTML='<div class="routine-plus"><div class="routine-plus-head"><div><small>خطوات صغيرة تصنع يوماً أجمل</small><h4>جدولنا وعاداتنا 🌿</h4></div><span>♡</span></div><div class="routine-plus-tabs"><button type="button" data-plus-tab="schedule" class="'+(tab==="schedule"?"active":"")+'">جدولي الأسبوعي</button><button type="button" data-plus-tab="habits" class="'+(tab==="habits"?"active":"")+'">عاداتنا اليومية</button></div>'+(tab==="schedule"?renderSchedule():renderHabits())+'</div>';
  }
  function renderSchedule(){
    const today=new Date().getDay(),items=schedules.filter(x=>(x.days||[]).includes(today)).sort((a,b)=>a.start_time.localeCompare(b.start_time));
    return '<section class="routine-plus-section"><div class="routine-plus-subtitle"><b>برنامج اليوم</b><small>'+new Intl.DateTimeFormat("ar-MA",{weekday:"long",day:"numeric",month:"long"}).format(new Date())+'</small></div>'+(items.length?items.map(x=>'<article class="routine-schedule-card"><time>'+esc(x.start_time.slice(0,5))+(x.end_time?' – '+esc(x.end_time.slice(0,5)):'')+'</time><div><b>'+esc(x.title)+'</b><small>'+label(x.user_id===user.id?role:(role==="ayoub"?"farahati":"ayoub"))+' · '+esc(x.category)+'</small></div>'+(x.user_id===user.id?'<button type="button" data-delete-schedule="'+x.id+'" aria-label="حذف">×</button>':'<span class="routine-shared-tag">مشترك</span>')+'</article>').join(""):'<div class="routine-plus-empty">لا توجد أنشطة مجدولة لهذا اليوم. أضيفا أول موعد إلى أسبوعكما ♡</div>')+'</section><form id="routine-schedule-form" class="routine-plus-form"><b>أضف نشاطاً إلى أسبوعك</b><input class="routine-input" name="title" maxlength="80" required placeholder="مثلاً: الدراسة، الغداء، مكالمتنا…"><div class="routine-plus-fields"><label>من <input class="routine-input" type="time" name="start" required value="09:00"></label><label>إلى <input class="routine-input" type="time" name="end"></label></div><label class="routine-field-label">يتكرر في الأيام</label><div class="routine-days">'+days.map(d=>'<label><input type="checkbox" name="days" value="'+d[1]+'" '+([1,2,3,4,5].includes(d[1])?'checked':'')+'><span>'+d[0].slice(0,1)+'</span></label>').join("")+'</div><div class="routine-plus-fields"><label>التصنيف<select class="routine-select" name="category"><option>يومي</option><option>عمل ودراسة</option><option>راحة</option><option>رياضة</option><option>وقت لنا</option><option>عناية</option></select></label><label>الخصوصية<select class="routine-select" name="visibility"><option value="shared">يظهر للطرف الآخر</option><option value="private">خاص بي</option></select></label></div><button class="routine-plus-submit" type="submit" '+(busy?'disabled':'')+'>أضف إلى جدولي ♡</button><p class="routine-plus-feedback" id="routine-plus-feedback" role="status"></p></form>';
  }
  function renderHabits(){
    const today=new Date().toISOString().slice(0,10),my=habits.filter(h=>h.user_id===user.id),partner=habits.filter(h=>h.user_id!==user.id);
    const card=h=>{const done=checks.some(c=>c.habit_id===h.id&&c.check_date===dateKey(h));return '<article class="routine-habit-card '+(done?'done':'')+'"><button type="button" class="routine-habit-check" data-check-habit="'+h.id+'" data-checked="'+(done?'1':'0')+'">'+(done?'✓':esc(h.icon))+'</button><div><b>'+esc(h.title)+'</b><small>'+(h.frequency==="weekly"?"عادة أسبوعية":"عادة يومية")+' · '+(done?'أُنجزت اليوم':'بانتظار خطوة صغيرة')+'</small></div>'+(h.user_id===user.id?'<button type="button" class="routine-habit-delete" data-delete-habit="'+h.id+'">×</button>':'<span class="routine-shared-tag">لكما</span>')+'</article>'};
    return '<section class="routine-plus-section"><div class="routine-plus-subtitle"><b>عادات أيوب</b><small>خطواتك الصغيرة يا أيوب</small></div>'+(my.length?my.map(card).join(""):'<div class="routine-plus-empty">أضف عادة تحب الالتزام بها.</div>')+(partner.length?'<div class="routine-plus-subtitle"><b>عادات فرحتي</b><small>يمكنك تشجيعها بالتأشير عند إنجازها معاً</small></div>'+partner.map(card).join(""):'')+'</section><form id="routine-habit-form" class="routine-plus-form"><b>أضف عادة جديدة</b><input class="routine-input" name="title" maxlength="80" required placeholder="مثلاً: شرب الماء، القراءة، المشي…"><div class="routine-plus-fields"><label>رمز العادة<input class="routine-input" name="icon" maxlength="8" value="🌱"></label><label>التكرار<select class="routine-select" name="frequency"><option value="daily">يومية</option><option value="weekly">أسبوعية</option></select></label></div><label class="routine-field-label">من يرى هذه العادة؟</label><select class="routine-select" name="visibility"><option value="shared">نشاركها معاً</option><option value="private">خاصة بي</option></select><button class="routine-plus-submit" type="submit" '+(busy?'disabled':'')+'>أضف العادة ♡</button><p class="routine-plus-feedback" id="routine-plus-feedback" role="status"></p></form>';
  }
  async function load(){
    if(!db||!user)return;
    const now=new Date(),today=now.toISOString().slice(0,10),monday=new Date(now);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));const weekStart=monday.toISOString().slice(0,10);const [s,h,c]=await Promise.all([db.from("ayfar_routine_schedule").select("*").order("start_time"),db.from("ayfar_habits").select("*").order("created_at"),db.from("ayfar_habit_checkins").select("*").in("check_date",[today,weekStart])]);
    if(s.error||h.error||c.error){const el=root();if(el)el.innerHTML='<div class="routine-plus-empty">تعذر تحميل الجدول والعادات: '+esc((s.error||h.error||c.error).message)+'</div>';return}
    schedules=s.data||[];habits=h.data||[];checks=c.data||[];render();
  }
  async function submitSchedule(form){
    const f=new FormData(form),selected=f.getAll("days").map(Number);
    if(!selected.length){$("#routine-plus-feedback").textContent="اختر يوماً واحداً على الأقل.";return}
    if(f.get("end")&&f.get("end")<=f.get("start")){$("#routine-plus-feedback").textContent="وقت النهاية يجب أن يكون بعد البداية.";return}
    busy=true;render();
    const {error}=await db.from("ayfar_routine_schedule").insert({user_id:user.id,title:String(f.get("title")).trim(),category:f.get("category"),start_time:f.get("start"),end_time:f.get("end")||null,days:selected,visibility:f.get("visibility")});
    busy=false;if(error){const el=$("#routine-plus-feedback");if(el)el.textContent="تعذر الحفظ: "+error.message;return}await load();
  }
  async function submitHabit(form){
    const f=new FormData(form);busy=true;render();
    const {error}=await db.from("ayfar_habits").insert({user_id:user.id,title:String(f.get("title")).trim(),icon:String(f.get("icon")||"🌱"),frequency:f.get("frequency"),visibility:f.get("visibility")});
    busy=false;if(error){const el=$("#routine-plus-feedback");if(el)el.textContent="تعذر الحفظ: "+error.message;return}await load();
  }
  async function toggleHabit(id,done){
    const h=habits.find(x=>x.id===id);if(!h)return;
    if(done){const {error}=await db.from("ayfar_habit_checkins").delete().eq("habit_id",id).eq("check_date",dateKey(h));if(error)alert(error.message)}
    else{const {error}=await db.from("ayfar_habit_checkins").insert({habit_id:id,habit_owner:h.user_id,checked_by:user.id,check_date:dateKey(h)});if(error)alert(error.message)}
    await load();
  }
  async function init(){
    db=window.ayfarSupabase;if(!db)return;const {data}=await db.auth.getUser();user=data?.user;if(!user)return;
    const {data:p}=await db.from("profiles").select("role").eq("id",user.id).single();role=String(p?.role||"ayoub").toLowerCase();
    await load();
    if(!channel)channel=db.channel("ayfar-routine-plus").on("postgres_changes",{event:"*",schema:"public",table:"ayfar_routine_schedule"},load).on("postgres_changes",{event:"*",schema:"public",table:"ayfar_habits"},load).on("postgres_changes",{event:"*",schema:"public",table:"ayfar_habit_checkins"},load).subscribe();
    if(poll)clearInterval(poll);poll=setInterval(load,25000);
  }
  const el=root();if(el){
    el.addEventListener("click",async e=>{
      const t=e.target.closest("[data-plus-tab]");if(t){tab=t.dataset.plusTab;render();return}
      const d=e.target.closest("[data-delete-schedule]");if(d&&confirm("حذف هذا النشاط من الجدول؟")){await db.from("ayfar_routine_schedule").delete().eq("id",d.dataset.deleteSchedule);await load();return}
      const h=e.target.closest("[data-delete-habit]");if(h&&confirm("حذف هذه العادة وسجلها؟")){await db.from("ayfar_habits").delete().eq("id",h.dataset.deleteHabit);await load();return}
      const c=e.target.closest("[data-check-habit]");if(c)toggleHabit(c.dataset.checkHabit,c.dataset.checked==="1");
    });
    el.addEventListener("submit",e=>{if(e.target.id==="routine-schedule-form"){e.preventDefault();submitSchedule(e.target)}if(e.target.id==="routine-habit-form"){e.preventDefault();submitHabit(e.target)}});
  }
  let routineTouchStart=null;
  if(el){
    el.addEventListener("touchstart",event=>{const t=event.changedTouches?.[0];if(t)routineTouchStart={x:t.clientX,y:t.clientY}},{passive:true});
    el.addEventListener("touchend",event=>{const t=event.changedTouches?.[0];if(!t||!routineTouchStart)return;const dx=t.clientX-routineTouchStart.x,dy=t.clientY-routineTouchStart.y;routineTouchStart=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.25){tab=dx<0?"habits":"schedule";render()}},{passive:true});
  }
  window.AYFAR_RoutinePlus={init};
})();