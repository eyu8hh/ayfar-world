(()=> {
  const supa=()=>window.ayfarSupabase;
  const $=selector=>document.querySelector(selector);
  const TIME_ZONE="Africa/Casablanca";
  let userId=null,channel=null,requestId=0;
  const card=document.createElement("section");
  card.className="home-next-event";card.id="home-next-event";
  card.setAttribute("aria-labelledby","home-next-event-title");
  card.innerHTML=`
    <div class="home-next-event-copy">
      
      <h3 id="home-next-event-title">موعدنا القادم</h3>
      <p class="home-next-event-name" id="home-next-event-name">نبحث عن موعدنا القادم…</p>
      <div class="home-next-event-meta" id="home-next-event-meta" aria-live="polite"></div>
    </div>
    <button type="button" class="home-next-event-action" id="home-next-event-open">افتح تقويمنا <i class="bi bi-arrow-up-left" aria-hidden="true"></i></button>`;
  const home=$("#home-overview"),anniversary=$("#home-overview .home-anniversary");
  if(home&&anniversary)anniversary.insertAdjacentElement("afterend",card);
  $("#home-next-event-open")?.addEventListener("click",()=>document.querySelector("[data-open-calendar]")?.click());
  function show(name,meta){
    const title=$("#home-next-event-name"),detail=$("#home-next-event-meta");
    if(title)title.textContent=name;if(detail)detail.textContent=meta||"";
  }
  function dateKey(value){
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(value);
    const part=type=>parts.find(item=>item.type===type)?.value||"";
    return part("year")+"-"+part("month")+"-"+part("day");
  }
  function offsetMinutes(value){
    const zone=new Intl.DateTimeFormat("en-US",{timeZone:TIME_ZONE,timeZoneName:"longOffset"}).formatToParts(value).find(item=>item.type==="timeZoneName")?.value||"GMT";
    const match=/GMT([+-])(\d{2}):(\d{2})/.exec(zone);
    return match?(match[1]==="-"?-1:1)*(Number(match[2])*60+Number(match[3])):0;
  }
  function dayStartIso(value){
    const [year,month,day]=dateKey(value).split("-").map(Number);
    const utcMidnight=Date.UTC(year,month-1,day);
    const offset=offsetMinutes(new Date(utcMidnight+60*60*1000));
    return new Date(utcMidnight-offset*60000).toISOString();
  }
  function dateParts(value,allDay){
    const date=new Date(value);if(Number.isNaN(date.getTime()))return "";
    const day=new Intl.DateTimeFormat("ar-MA",{timeZone:TIME_ZONE,weekday:"long",day:"numeric",month:"long"}).format(date);
    return allDay?day+" · طوال اليوم":day+" · "+new Intl.DateTimeFormat("ar-MA",{timeZone:TIME_ZONE,hour:"2-digit",minute:"2-digit"}).format(date);
  }
  async function load(){
    if(!userId||!supa())return;
    const seq=++requestId;show("نبحث عن موعدنا القادم…","");
    const now=new Date(),todayStart=dayStartIso(now),today=dateKey(now);
    const {data,error}=await supa().from("ayfar_shared_calendar").select("id,title,starts_at,all_day,category")
      .gte("starts_at",todayStart).order("starts_at",{ascending:true}).limit(50);
    if(seq!==requestId||!userId)return;
    if(error){show("تعذر تحميل المواعيد حالياً","يمكن فتح التقويم والمحاولة مجدداً.");return;}
    const next=(data||[]).find(item=>new Date(item.starts_at)>=now||(item.all_day&&dateKey(new Date(item.starts_at))===today));
    if(!next){show("لا يوجد موعد قادم بعد","يمكنكما إضافة لقاء أو مناسبة جديدة.");return;}
    show(next.title,dateParts(next.starts_at,next.all_day)+(next.category?" · "+next.category:""));
  }
  async function setUser(nextUser){
    const nextId=nextUser?.id||null;if(nextId===userId){if(nextId)await load();return;}
    userId=nextId;requestId++;
    if(channel&&supa()){supa().removeChannel(channel);channel=null;}
    if(!userId){show("سجّلا الدخول لعرض مواعيدكما","");return;}
    await load();
    channel=supa().channel("ayfar-home-calendar-"+userId)
      .on("postgres_changes",{event:"*",schema:"public",table:"ayfar_shared_calendar"},load).subscribe();
  }
  if(supa()){
    supa().auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>setUser(session?.user||null));});
    supa().auth.getUser().then(({data})=>{if(data?.user)setUser(data.user);});
  }
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&userId)load();});
})();
