(()=> {
  const supa=()=>window.ayfarSupabase;
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const pad=n=>String(n).padStart(2,"0");
  const localDate=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  const parseDate=value=>{const [y,m,d]=value.split("-").map(Number);return new Date(y,m-1,d);};
  const monthLabel=d=>new Intl.DateTimeFormat("ar-MA",{month:"long",year:"numeric"}).format(d);
  let cursor=new Date();cursor=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  let selected=localDate(new Date()),events=[],user=null,channel=null,busy=false;
  const overlay=document.createElement("div");overlay.className="dreams-overlay";overlay.id="calendar-dialog";overlay.hidden=true;
  overlay.innerHTML=`
    <section class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
      <div class="calendar-head"><div><small>OUR TIME TOGETHER</small><h2 id="calendar-title">مخطط مواعيدنا ♡</h2><p>كل موعد نخطط له هنا يظهر عندكما فوراً.</p></div><button class="calendar-close" type="button" data-calendar-close aria-label="إغلاق">×</button></div>
      <div class="calendar-monthbar"><button type="button" data-month-prev aria-label="الشهر السابق">‹</button><strong id="calendar-month"></strong><button type="button" data-month-next aria-label="الشهر التالي">›</button></div>
      <div class="calendar-weekdays"><span>الأحد</span><span>الإثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span><span>السبت</span></div>
      <div class="calendar-grid" id="calendar-grid"></div>
      <div class="calendar-agenda"><div class="calendar-agenda-head"><h3 id="calendar-day-title"></h3><small id="calendar-day-count"></small></div><div class="calendar-event-list" id="calendar-events"></div></div>
      <form class="calendar-form" id="calendar-form">
        <label for="calendar-event-title">موعد أو مناسبة جديدة</label><input id="calendar-event-title" maxlength="120" required placeholder="مثلاً: مكالمتنا الأسبوعية">
        <div class="calendar-form-row"><div><label for="calendar-event-date">التاريخ</label><input id="calendar-event-date" type="date" required></div><div><label for="calendar-event-time">الوقت (اختياري)</label><input id="calendar-event-time" type="time"></div></div>
        <label for="calendar-event-category">نوع الموعد</label><select id="calendar-event-category"><option value="خاص">موعد خاص</option><option value="مناسبة">مناسبة</option><option value="خطة">خطة مشتركة</option><option value="تذكير">تذكير</option></select>
        <label for="calendar-event-notes">تفاصيل (اختياري)</label><textarea id="calendar-event-notes" maxlength="500" placeholder="أي تفاصيل نريد تذكرها…"></textarea>
        <button class="calendar-submit" id="calendar-save" type="submit">إضافة إلى تقويمنا ♡</button><div class="calendar-feedback" id="calendar-feedback" role="status" aria-live="polite"></div>
      </form>
    </section>`;
  document.body.appendChild(overlay);
  const $=s=>overlay.querySelector(s),feedback=t=>$("#calendar-feedback").textContent=t||"";
  function dayEvents(date){return events.filter(e=>e.starts_at.slice(0,10)===date).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));}
  function render(){
    $("#calendar-month").textContent=monthLabel(cursor);
    const first=new Date(cursor.getFullYear(),cursor.getMonth(),1),offset=first.getDay(),days=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate(),prevDays=new Date(cursor.getFullYear(),cursor.getMonth(),0).getDate(),today=localDate(new Date());
    let cells="";
    for(let i=0;i<42;i++){
      let date,other=false;
      if(i<offset){date=localDate(new Date(cursor.getFullYear(),cursor.getMonth()-1,prevDays-offset+i+1));other=true;}
      else if(i>=offset+days){date=localDate(new Date(cursor.getFullYear(),cursor.getMonth()+1,i-offset-days+1));other=true;}
      else date=localDate(new Date(cursor.getFullYear(),cursor.getMonth(),i-offset+1));
      const count=dayEvents(date).length;
      cells+=`<button type="button" class="calendar-day ${other?"is-out ":""}${date===selected?"is-selected ":""}${date===today?"is-today ":""}${count?"has-events":""}" data-calendar-date="${date}" aria-label="${date}">${Number(date.slice(-2))}</button>`;
    }
    $("#calendar-grid").innerHTML=cells;
    const chosen=dayEvents(selected),d=parseDate(selected);
    $("#calendar-day-title").textContent=new Intl.DateTimeFormat("ar-MA",{weekday:"long",day:"numeric",month:"long"}).format(d);
    $("#calendar-day-count").textContent=chosen.length+" مواعيد";
    $("#calendar-events").innerHTML=chosen.length?chosen.map(e=>`<article class="calendar-event" data-event-id="${esc(e.id)}"><div class="calendar-event-main"><b>${esc(e.title)} · ${esc(e.category)}</b><time>${e.starts_at.slice(11,16)==="00:00"?"طوال اليوم":esc(e.starts_at.slice(11,16))}</time>${e.notes?`<p>${esc(e.notes)}</p>`:""}</div><button type="button" data-event-delete>حذف</button></article>`).join(""):'<div class="calendar-empty">لا توجد مواعيد في هذا اليوم.<br>أضيفا أول موعد من النموذج أدناه ♡</div>';
    $("#calendar-event-date").value=selected;
  }
  async function load(){
    const {data,error}=await supa().from("ayfar_shared_calendar").select("*").order("starts_at",{ascending:true});
    if(error){feedback("تعذر تحميل التقويم: "+error.message);return;}
    events=data||[];render();
  }
  async function open(){
    overlay.hidden=false;document.body.style.overflow="hidden";feedback("");
    if(!supa()){feedback("خدمة المزامنة غير متاحة.");return;}
    const {data,error}=await supa().auth.getUser();
    if(error||!data?.user){feedback("انتهت جلسة الدخول. سجّلا الدخول مجدداً.");return;}
    user=data.user;await load();
    if(!channel)channel=supa().channel("ayfar-shared-calendar-live").on("postgres_changes",{event:"*",schema:"public",table:"ayfar_shared_calendar"},()=>load()).subscribe();
  }
  function close(){overlay.hidden=true;document.body.style.overflow="";if(channel&&supa()){supa().removeChannel(channel);channel=null;}}
  document.querySelectorAll("[data-open-calendar]").forEach(el=>el.addEventListener("click",open));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)close();if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-open-calendar]")){e.preventDefault();open();}});
  overlay.addEventListener("click",async e=>{
    if(e.target===overlay||e.target.closest("[data-calendar-close]")){close();return;}
    if(e.target.closest("[data-month-prev]")){cursor=new Date(cursor.getFullYear(),cursor.getMonth()-1,1);render();return;}
    if(e.target.closest("[data-month-next]")){cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);render();return;}
    const day=e.target.closest("[data-calendar-date]");if(day){selected=day.dataset.calendarDate;const d=parseDate(selected);cursor=new Date(d.getFullYear(),d.getMonth(),1);render();return;}
    const del=e.target.closest("[data-event-delete]");if(del){const card=del.closest("[data-event-id]");if(!card||busy||!confirm("هل تريدان حذف هذا الموعد؟"))return;busy=true;const {error}=await supa().from("ayfar_shared_calendar").delete().eq("id",card.dataset.eventId);busy=false;if(error){feedback("تعذر الحذف: "+error.message);return;}await load();feedback("تم حذف الموعد.");}
  });
  $("#calendar-form").addEventListener("submit",async e=>{
    e.preventDefault();if(busy)return;
    const title=$("#calendar-event-title").value.trim(),date=$("#calendar-event-date").value,time=$("#calendar-event-time").value||"00:00",category=$("#calendar-event-category").value,notes=$("#calendar-event-notes").value.trim();
    if(!title||!date){feedback("أكملا عنوان الموعد وتاريخه.");return;}
    if(!user){feedback("تعذر التحقق من الحساب. أغلقي النافذة وافتحيها مجدداً.");return;}
    busy=true;$("#calendar-save").disabled=true;feedback("جارٍ حفظ الموعد…");
    const {error}=await supa().from("ayfar_shared_calendar").insert({title,starts_at:date+"T"+time+":00",category,notes,created_by:user.id});
    busy=false;$("#calendar-save").disabled=false;
    if(error){feedback("تعذر الحفظ: "+error.message);return;}
    selected=date;const d=parseDate(date);cursor=new Date(d.getFullYear(),d.getMonth(),1);$("#calendar-event-title").value="";$("#calendar-event-time").value="";$("#calendar-event-notes").value="";await load();feedback("أُضيف الموعد إلى تقويمكما ♡");
  });
})();