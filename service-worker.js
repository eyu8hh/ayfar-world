const CACHE="ayfar-world-shell-v143";
const FILES=["./","./index.html","./css/app.css?v=20","./js/supabase-config.js","./js/supabase-client.js","./js/seed.js","./js/storage.js","./js/app.js","./js/plans.js","./js/calendar.js?v=2","./js/activities.js","./js/routine.js","./js/routine-plus.js","./js/pets.js","./css/routine-plus.css","./css/horizontal-layout.css?v=2","./css/visual-refresh.css?v=1","./css/typography-navigation-refresh.css?v=1","./css/design-polish.css?v=7","./css/rtl-swipe-polish.css?v=1","./css/home-dashboard.css?v=1","./css/home-dashboard-polish.css?v=1","./css/experience-quality-refresh.css?v=1","./css/notifications.css?v=1","./css/premium-ui-patterns.css?v=1","./css/individual-element-layout.css?v=1","./js/ui-enhancements.js?v=1","./js/home-dashboard.js?v=1","./js/notifications.js","./supabase/migrations/202611050004_shared_daily_ratings_notifications.sql","./js/knowledge-bank.js","./js/knowledge-bank-expansion.js","./js/games.js","./js/auth.js","./js/messages.js","./js/love-letters.js","./manifest.json","./assets/icons/icon.svg","./assets/brand/ayfar-logo.jpg","./assets/brand/ayfar-app-icon.jpg","./assets/brand/ayoub-profile.jpg","./assets/brand/farah-profile.jpg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  const isAppAsset=url.origin===self.location.origin && (/\.(html|js|css)$/.test(url.pathname)||url.pathname.endsWith("/"));
  if(isAppAsset){
    event.respondWith(fetch(event.request).then(response=>{
      if(response && response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>caches.match("./index.html"))));
});
self.addEventListener("push",event=>{
  let payload={};
  try{payload=event.data?event.data.json():{};}catch(_){payload={body:event.data?.text?.()||""};}
  const title=payload.title||"إشعار جديد من AYFAR WORLD";
  const options={
    body:payload.body||"لديك نشاط جديد في عالمكما.",
    icon:payload.icon||"./assets/brand/ayfar-app-icon.jpg",
    badge:payload.badge||"./assets/brand/ayfar-app-icon.jpg",
    tag:payload.tag||("ayfar-push-"+(payload.id||Date.now())),
    dir:"rtl",lang:"ar",silent:false,
    data:{url:payload.url||"./index.html",id:payload.id||null,eventType:payload.eventType||null}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const data=event.notification.data||{};
  const target=new URL(data.url||"./index.html",self.registration.scope);
  if(data.id)target.searchParams.set("ayfar_notification",data.id);
  if(data.eventType)target.searchParams.set("ayfar_event",data.eventType);
  event.waitUntil((async()=>{
    const clientsList=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of clientsList){
      if(new URL(client.url).origin!==self.location.origin)continue;
      if("focus" in client)await client.focus();
      client.postMessage({type:"AYFAR_OPEN_NOTIFICATION",id:data.id,eventType:data.eventType});
      return;
    }
    if(self.clients.openWindow)await self.clients.openWindow(target.href);
  })());
});
