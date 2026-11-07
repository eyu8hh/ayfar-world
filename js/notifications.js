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
  function sectionFor(n){
    if(n.event_type==="routine_status"||n.event_type==="habit_checkin")return "home-routine";
    if(n.event_type==="pet_care")return "home-pets";
    if(n.event_type==="music_added")return "home-plans";
    return "home-overview";
  }
  async function openNotification(n){
    if(!n)return;
    if(!n.read_at){
      const stamp=new Date().toISOString();
      const {error}=await db().from("ayfar_notifications").update({read_at:stamp}).eq("id",n.id);
      if(!error){rows=rows.map(item=>item.id===n.id?{...item,read_at:stamp}:item);updateBadge();}
    }
    $("#back")?.click();
    const actions={daily_rating:"#rating",star_change:"#star-wallet"};
    const action=actions[n.event_type];
    if(action&&$(action)){ $(action).click(); return; }
    const section=sectionFor(n);
    const nav=document.querySelector('[data-home-target="'+section+'"]');
    if(nav)nav.click();
    if(n.event_type==="music_added"){
      const music=document.querySelector("[data-open-music],#shared-music,#music");
      if(music)music.click();
    }
  }
  async function openCenter(){
    await refresh();
    const body=$("#pagebody"),home=$("#home"),page=$("#page");if(!body||!home||!page)return;
    const list=rows.length?rows.map(n=>'<button type="button" class="notification-item '+(n.read_at?"read":"unread")+'" data-notification-id="'+esc(n.id)+'" aria-label="فتح: '+esc(n.title)+'"><span class="notification-icon">'+(icons[n.event_type]||"♡")+'</span><span class="notification-copy"><b>'+esc(n.title)+'</b><span>'+esc(n.body)+'</span><small>'+formatDate(n.created_at)+'</small></span>'+(n.read_at?"":'<span class="notification-dot"></span>')+'</button>').join(""):'<div class="notification-empty"><span>♡</span><b>لا توجد إشعارات بعد</b><p>عندما تقوم فرحتي أو أيوب بنشاط مشترك، ستجدان تفاصيله هنا.</p></div>';
    home.classList.add("hidden");page.classList.remove("hidden");
    body.innerHTML='<section class="panel notifications-panel"><div class="notification-heading"><div><small class="eyebrow">OUR SHARED ACTIVITY</small><h2>إشعارات عالمنا</h2><p>كل جديد بينكما في مكان واحد.</p></div><span>🔔</span></div><div class="notification-list">'+list+'</div><button class="secondary-action" id="notifications-back">العودة إلى عالمنا</button></section>';
    $("#notifications-back").onclick=()=>{$("#back").click();};
    body.querySelectorAll("[data-notification-id]").forEach(button=>button.addEventListener("click",()=>{const item=rows.find(x=>x.id===button.dataset.notificationId);openNotification(item);}));
  }
  async function init(){
    ensureButton();const {data:{user:current}}=await db().auth.getUser();if(!current)return;if(activeUserId!==current.id){if(channel)await db().removeChannel(channel);channel=null;rows=[];activeUserId=current.id;}user=current;
    await refresh();
    if(!channel)channel=db().channel("ayfar-notifications-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"ayfar_notifications",filter:"recipient_id=eq."+user.id},payload=>{
      rows=[payload.new,...rows].slice(0,60);updateBadge();
      if(!$("#page").classList.contains("hidden"))return;
      const toast=$("#toast");if(toast){toast.textContent="إشعار جديد: "+payload.new.title+" · اضغط للفتح";toast.setAttribute("role","button");toast.setAttribute("tabindex","0");toast.style.cursor="pointer";toast.onclick=()=>openNotification(payload.new);toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),5000);}
    }).subscribe();
    if(!window.__ayfarNotificationPoll)window.__ayfarNotificationPoll=setInterval(refresh,30000);
  }
  window.AYFAR_Notifications={init,open:openCenter,refresh};
  document.addEventListener("DOMContentLoaded",ensureButton);
})();