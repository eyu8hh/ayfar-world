(()=> {
  const db=()=>window.ayfarSupabase, $=s=>document.querySelector(s);
  let user=null,channel=null,rows=[],loading=false,activeUserId=null;
  const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const icons={daily_rating:"💗",star_change:"⭐",routine_status:"🌿",habit_checkin:"🌱",pet_care:"🐾",music_added:"🎧"};
  function ensureButton(){
    const top=$("#home-top");if(!top||$("#notification-bell"))return;
    const b=document.createElement("button");b.id="notification-bell";b.type="button";b.setAttribute("aria-label","الإشعارات");b.innerHTML='<span aria-hidden="true">♧</span><i id="notification-count" hidden>0</i>';
    const brand=top.querySelector(".brand");top.insertBefore(b,brand||null);b.addEventListener("click",openCenter);
  }
  function updateBadge(){
    const badge=$("#notification-count");if(!badge)return;
    const count=rows.filter(x=>!x.read_at).length;badge.textContent=count>99?"99+":String(count);badge.hidden=!count;
  }
  async function refresh(){
    if(!user||loading)return;loading=true;
    const {data,error}=await db().from("ayfar_notifications").select("*").order("created_at",{ascending:false}).limit(60);
    loading=false;if(error){console.warn("AYFAR notifications:",error.message);return;}
    rows=data||[];updateBadge();
  }
  function formatDate(value){return new Intl.DateTimeFormat("ar-MA",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
  async function openNotification(id,eventType){
    const item=rows.find(row=>row.id===id);
    if(item&&!item.read_at){
      const stamp=new Date().toISOString();
      const {error}=await db().from("ayfar_notifications").update({read_at:stamp}).eq("id",id);
      if(!error){rows=rows.map(row=>row.id===id?{...row,read_at:stamp}:row);updateBadge();}
    }
    const home=$("#home"),page=$("#page");
    if(page)page.classList.add("hidden");
    if(home)home.classList.remove("hidden");
    const targets={
      star_change:"#star-wallet",
      daily_rating:"#rating",
      routine_status:"#home-routine",
      habit_checkin:"#home-routine",
      pet_care:"#home-pets",
      music_added:"#home-routine"
    };
    const target=document.querySelector(targets[eventType]||"#home-overview");
    if(target){
      if(target.matches("button"))target.click();
      else target.scrollIntoView({behavior:"smooth",block:"start"});
    }
  }
  async function openCenter(){
    await refresh();
    const body=$("#pagebody"),home=$("#home"),page=$("#page");if(!body||!home||!page)return;
    const list=rows.length?rows.map(n=>'<article class="notification-item '+(n.read_at?"read":"unread")+'" data-notification-id="'+esc(n.id)+'"><span class="notification-icon">'+(icons[n.event_type]||"♡")+'</span><div class="notification-copy"><b>'+esc(n.title)+'</b><p>'+esc(n.body)+'</p><small>'+formatDate(n.created_at)+'</small></div>'+(n.read_at?"":'<span class="notification-dot"></span>')+'<button type="button" class="notification-open" data-notification-open="'+esc(n.id)+'" data-event-type="'+esc(n.event_type)+'">عرض النشاط <span aria-hidden="true">↗</span></button></article>').join(""):'<div class="notification-empty"><span>♡</span><b>لا توجد إشعارات بعد</b><p>عندما تقوم فرحتي أو أيوب بنشاط مشترك، ستجدان تفاصيله هنا.</p></div>';
    home.classList.add("hidden");page.classList.remove("hidden");
    body.innerHTML='<section class="panel notifications-panel"><div class="notification-heading"><div><small class="eyebrow">OUR SHARED ACTIVITY</small><h2>إشعارات عالمنا</h2><p>كل جديد بينكما في مكان واحد.</p></div><span>🔔</span></div><div class="notification-list">'+list+'</div><button type="button" class="secondary-action" id="notifications-back">العودة إلى عالمنا</button></section>';
    $("#notifications-back").onclick=()=>{page.classList.add("hidden");home.classList.remove("hidden");};
    body.querySelectorAll("[data-notification-open]").forEach(button=>button.addEventListener("click",()=>openNotification(button.dataset.notificationOpen,button.dataset.eventType)));
  }
  async function init(){
    ensureButton();const {data:{user:current}}=await db().auth.getUser();if(!current)return;if(activeUserId!==current.id){if(channel)await db().removeChannel(channel);channel=null;rows=[];activeUserId=current.id;}user=current;
    await refresh();
    if(!channel)channel=db().channel("ayfar-notifications-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"ayfar_notifications",filter:"recipient_id=eq."+user.id},payload=>{
      rows=[payload.new,...rows].slice(0,60);updateBadge();
      if(!$("#page").classList.contains("hidden"))return;
      const toast=$("#toast");if(toast){toast.textContent="إشعار جديد: "+payload.new.title;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),3200);}
    }).subscribe();
    if(!window.__ayfarNotificationPoll)window.__ayfarNotificationPoll=setInterval(refresh,30000);
  }
  window.AYFAR_Notifications={init,open:openCenter,refresh};
  document.addEventListener("DOMContentLoaded",ensureButton);
})();