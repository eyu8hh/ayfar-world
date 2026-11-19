(()=> {
  const db=()=>window.ayfarSupabase, $=s=>document.querySelector(s);
  let user=null,channel=null,rows=[],loading=false,activeUserId=null;
  let pushPublicKey="",pushRegistration=null,pushSubscription=null,pushPreparation=null;
  const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const icons={daily_rating:"💗",star_change:"⭐",routine_status:"🌿",habit_checkin:"🌱",pet_care:"🐾",music_added:"🎧",private_message:"✉️",love_letter:"💌"};
  function ensureButton(){
    const top=$("#home-top");if(!top||$("#notification-bell"))return;
    const b=document.createElement("button");b.id="notification-bell";b.type="button";b.setAttribute("aria-label","الإشعارات");b.innerHTML='<i class="bi bi-bell" aria-hidden="true"></i><i id="notification-count" hidden>0</i>';b.title="الإشعارات";
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
  function formatDate(value){return new Intl.DateTimeFormat("ar-MA",{timeZone:"Africa/Casablanca",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
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
      music_added:"#home-routine",
      private_message:"#messages",
      love_letter:"#home-messages"
    };
    if(eventType==="love_letter")window.AYFAR_on_enter?.(window.WorldStore?.get?.().active);
    const target=document.querySelector(targets[eventType]||"#home-overview");
    if(target){
      if(target.matches("button"))target.click();
      else target.scrollIntoView({behavior:"smooth",block:"start"});
    }
  }
  function notificationPermissionLabel(){
    if(!("Notification" in window))return "هذا المتصفح لا يدعم إشعارات الهاتف";
    if(Notification.permission==="granted")return "إشعارات الهاتف مفعّلة";
    if(Notification.permission==="denied")return "الإشعارات محظورة من إعدادات المتصفح";
    return "تفعيل إشعارات الهاتف";
  }
  function isIOSHomeScreenApp(){
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    const standalone=window.matchMedia?.("(display-mode: standalone)").matches||navigator.standalone===true;
    return ios&&!standalone;
  }
  function decodeVapidKey(value){
    const padding="=".repeat((4-value.length%4)%4);
    const raw=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));
    return Uint8Array.from(raw,char=>char.charCodeAt(0));
  }
  async function preparePushSubscription(){
    if(pushPublicKey&&pushRegistration)return {registration:pushRegistration,publicKey:pushPublicKey,subscription:pushSubscription};
    if(pushPreparation)return await pushPreparation;
    pushPreparation=(async()=>{
      if(!("serviceWorker" in navigator)||!("PushManager" in window))throw new Error("Push is not supported");
      pushRegistration=await navigator.serviceWorker.ready;
      pushSubscription=await pushRegistration.pushManager.getSubscription();
      const {data,error}=await db().functions.invoke("ayfar-push",{body:{action:"public-key"}});
      if(error||!data?.publicKey)throw error||new Error("Push public key unavailable");
      pushPublicKey=data.publicKey;
      return {registration:pushRegistration,publicKey:pushPublicKey,subscription:pushSubscription};
    })();
    try{return await pushPreparation;}finally{pushPreparation=null;}
  }
  async function syncDeviceNotificationButton(){
    const button=$("#notification-enable");if(!button)return;
    if(!("Notification" in window)||!("PushManager" in window)||!("serviceWorker" in navigator)){
      button.textContent="الإشعارات الفورية غير مدعومة في هذا المتصفح";button.disabled=true;return;
    }
    if(Notification.permission==="denied"){
      button.textContent="اسمح بالإشعارات من إعدادات الهاتف";button.disabled=true;return;
    }
    if(!pushRegistration||!pushPublicKey){
      button.textContent="جارٍ تجهيز الإشعارات...";button.disabled=true;
      preparePushSubscription().then(syncDeviceNotificationButton).catch(()=>{button.textContent="تعذر تجهيز الإشعارات؛ أعد المحاولة";button.disabled=false;});
      return;
    }
    button.textContent=pushSubscription?"إيقاف إشعارات الهاتف":"تفعيل إشعارات الهاتف";
    button.disabled=false;
    button.dataset.enabled=pushSubscription?"true":"false";
  }
  async function enableDeviceNotifications(){
    const button=$("#notification-enable");
    if(!user){alert("سجّل الدخول أولاً لتفعيل إشعارات حسابك.");return;}
    if(isIOSHomeScreenApp()){
      alert("على iPhone أو iPad: افتح AYFAR WORLD في Safari، ثم اختر مشاركة ← إضافة إلى الشاشة الرئيسية. افتح التطبيق من أيقونته الجديدة ثم فعّل الإشعارات.");
      return;
    }
    if(!("Notification" in window)){alert("هذا المتصفح لا يدعم إشعارات الهاتف.");return;}
    try{
      if(!pushRegistration||!pushPublicKey){
        preparePushSubscription().then(syncDeviceNotificationButton).catch(()=>{});
        alert("يتم تجهيز الإشعارات لهذا الجهاز. انتظر لحظة ثم اضغط مرة أخرى.");
        await syncDeviceNotificationButton();return;
      }
      if(button){button.disabled=true;button.textContent="جارٍ إعداد الإشعارات...";}
      let permission=Notification.permission;
      if(permission==="default")permission=await Notification.requestPermission();
      if(permission!=="granted"){
        if(permission==="denied")alert("الإشعارات محظورة. يمكنك السماح بها من إعدادات الموقع في المتصفح أو الهاتف.");
        await syncDeviceNotificationButton();return;
      }
      let subscription=pushSubscription;
      if(subscription){
        const {error}=await db().from("ayfar_push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",subscription.endpoint);
        if(error)throw error;
        await subscription.unsubscribe();
        pushSubscription=null;
        await syncDeviceNotificationButton();
        const toast=$("#toast");if(toast){toast.textContent="تم إيقاف إشعارات هذا الجهاز.";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),3200);}
        return;
      }
      subscription=await pushRegistration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeVapidKey(pushPublicKey)});
      pushSubscription=subscription;
      const value=subscription.toJSON();
      if(!value.endpoint||!value.keys?.p256dh||!value.keys?.auth)throw new Error("لم يُرجع المتصفح بيانات اشتراك مكتملة.");
      const {error:saveError}=await db().from("ayfar_push_subscriptions").upsert({
        user_id:user.id,endpoint:value.endpoint,p256dh:value.keys.p256dh,auth:value.keys.auth,
        user_agent:String(navigator.userAgent||"").slice(0,300),updated_at:new Date().toISOString()
      },{onConflict:"endpoint"});
      if(saveError){await subscription.unsubscribe();pushSubscription=null;throw saveError;}
      await syncDeviceNotificationButton();
      const toast=$("#toast");if(toast){toast.textContent="تم تفعيل الإشعارات الفورية على هذا الجهاز.";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),3600);}
      await pushRegistration.showNotification("AYFAR WORLD ♡",{body:"أصبحت إشعارات عالمكما جاهزة على هذا الجهاز.",icon:"./assets/brand/ayfar-app-icon.jpg",dir:"rtl",lang:"ar",silent:false,tag:"ayfar-notification-ready"});
    }catch(error){
      console.warn("AYFAR push subscription:",error?.message||error);
      alert("تعذر تفعيل إشعارات الهاتف حالياً. تحقق من اتصالك وحاول مجدداً.");
      await syncDeviceNotificationButton();
    }
  }
  async function disableForLogout(){
    try{
      if(!("serviceWorker" in navigator)||!("PushManager" in window)||!user)return;
      const registration=pushRegistration||await navigator.serviceWorker.ready;
      const subscription=pushSubscription||await registration.pushManager.getSubscription();
      if(!subscription)return;
      // Remove the account binding before the session is cleared so another account
      // on this device cannot inherit the previous account's private push alerts.
      await db().from("ayfar_push_subscriptions").delete().eq("user_id",user.id).eq("endpoint",subscription.endpoint);
      await subscription.unsubscribe();
      pushSubscription=null;pushRegistration=registration;pushPublicKey="";
    }catch(error){console.warn("AYFAR push logout cleanup:",error?.message||error);}
  }
  async function showBackgroundNotification(item){
    if(!item||!("Notification" in window)||Notification.permission!=="granted"||!("serviceWorker" in navigator))return;
    try{
      const registration=await navigator.serviceWorker.ready;
      // A registered Web Push subscription already receives this event from the server.
      // Avoid showing a second local notification for the same database insert.
      if("PushManager" in window&&await registration.pushManager.getSubscription())return;
      await registration.showNotification(item.title||"إشعار جديد من AYFAR WORLD",{body:item.body||"لديك نشاط جديد في عالمكما.",icon:"./assets/brand/ayfar-app-icon.jpg",badge:"./assets/brand/ayfar-app-icon.jpg",tag:"ayfar-"+item.id,dir:"rtl",lang:"ar",silent:false,timestamp:Date.parse(item.created_at||new Date().toISOString()),data:{url:"./index.html",id:item.id,eventType:item.event_type}});
    }catch(error){console.warn("AYFAR system notification:",error);}
  }
  async function openCenter(){
    await refresh();
    const body=$("#pagebody"),home=$("#home"),page=$("#page");if(!body||!home||!page)return;
    const list=rows.length?rows.map(n=>'<article class="notification-item '+(n.read_at?"read":"unread")+'" data-notification-id="'+esc(n.id)+'"><span class="notification-icon">'+(icons[n.event_type]||"♡")+'</span><div class="notification-copy"><b>'+esc(n.title)+'</b><p>'+esc(n.body)+'</p><small>'+formatDate(n.created_at)+'</small></div>'+(n.read_at?"":'<span class="notification-dot"></span>')+'<button type="button" class="notification-open" data-notification-open="'+esc(n.id)+'" data-event-type="'+esc(n.event_type)+'">عرض النشاط <span aria-hidden="true">↗</span></button></article>').join(""):'<div class="notification-empty"><span>♡</span><b>لا توجد إشعارات بعد</b><p>عندما تقوم فرحتي أو أيوب بنشاط مشترك، ستجدان تفاصيله هنا.</p></div>';
    home.classList.add("hidden");page.classList.remove("hidden");
    body.innerHTML='<section class="panel notifications-panel"><div class="notification-heading"><div><small class="eyebrow">OUR SHARED ACTIVITY</small><h2>إشعارات عالمنا</h2><p>كل جديد بينكما في مكان واحد.</p><button type="button" class="secondary-action notification-enable" id="notification-enable">تفعيل إشعارات الهاتف</button><small class="notification-privacy">قد يظهر نص الإشعار على شاشة قفل الهاتف عند تفعيلها.</small></div><span>🔔</span></div><div class="notification-list">'+list+'</div><button type="button" class="secondary-action" id="notifications-back">العودة إلى عالمنا</button></section>';
    $("#notifications-back").onclick=()=>{page.classList.add("hidden");home.classList.remove("hidden");};
    const enableButton=$("#notification-enable");
    if(enableButton){enableButton.textContent=notificationPermissionLabel();enableButton.onclick=enableDeviceNotifications;preparePushSubscription().then(syncDeviceNotificationButton).catch(()=>syncDeviceNotificationButton());}
    body.querySelectorAll("[data-notification-open]").forEach(button=>button.addEventListener("click",()=>openNotification(button.dataset.notificationOpen,button.dataset.eventType)));
  }
  async function init(){
    ensureButton();const {data:{user:current}}=await db().auth.getUser();if(!current)return;if(activeUserId!==current.id){if(channel)await db().removeChannel(channel);channel=null;rows=[];activeUserId=current.id;}user=current;
    await refresh();
    if(!window.__ayfarNotificationMessageBound&&navigator.serviceWorker){
      navigator.serviceWorker.addEventListener("message",async event=>{
        if(event.data?.type!=="AYFAR_OPEN_NOTIFICATION")return;
        await refresh();await openCenter();
        if(event.data.id)openNotification(event.data.id,event.data.eventType);
      });
      window.__ayfarNotificationMessageBound=true;
    }
    if(!channel)channel=db().channel("ayfar-notifications-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"ayfar_notifications",filter:"recipient_id=eq."+user.id},payload=>{
      rows=[payload.new,...rows].slice(0,60);updateBadge();
      if(!$("#page").classList.contains("hidden"))return;
      const toast=$("#toast");if(toast){toast.textContent=(payload.new.title||"إشعار جديد")+(payload.new.body?" — "+payload.new.body:"");toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),4200);}
      if(document.visibilityState==="hidden")showBackgroundNotification(payload.new);
    }).subscribe();
    const params=new URLSearchParams(location.search);
    const pendingId=params.get("ayfar_notification");
    if(pendingId){
      await refresh();await openCenter();
      openNotification(pendingId,params.get("ayfar_event"));
      history.replaceState({},document.title,location.pathname+location.hash);
    }
    preparePushSubscription().then(syncDeviceNotificationButton).catch(()=>{});
    if(!window.__ayfarNotificationPoll)window.__ayfarNotificationPoll=setInterval(refresh,30000);
  }
  window.AYFAR_Notifications={init,open:openCenter,refresh,enableDeviceNotifications,disableForLogout};
  document.addEventListener("DOMContentLoaded",ensureButton);
})();