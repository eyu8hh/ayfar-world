const CACHE="ayfar-world-shell-v111";
const FILES=["./","./index.html","./css/app.css?v=8","./js/supabase-config.js","./js/supabase-client.js","./js/seed.js","./js/storage.js","./js/app.js","./js/plans.js","./js/calendar.js","./js/activities.js","./js/routine.js","./js/routine-plus.js","./js/pets.js","./css/routine-plus.css","./css/horizontal-layout.css","./css/no-shadows.css","./css/design-polish.css?v=4","./js/notifications.js","./js/category-navigation.js","./supabase/migrations/202611050004_shared_daily_ratings_notifications.sql","./js/knowledge-bank.js","./js/knowledge-bank-expansion.js","./js/ayfar-question-bank.js","./js/ayfar-question-bank-expansion.js","./js/games.js","./js/auth.js","./js/messages.js","./js/love-letters.js","./manifest.json","./assets/icons/icon.svg","./assets/brand/ayfar-logo.jpg","./assets/brand/ayfar-app-icon.jpg","./assets/brand/ayoub-profile.jpg","./assets/brand/farah-profile.jpg"];
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