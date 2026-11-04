const CACHE="ayfar-world-shell-v56";
const FILES=["./","./index.html","./css/app.css","./js/supabase-config.js","./js/supabase-client.js","./js/seed.js","./js/storage.js","./js/app.js","./js/knowledge-bank.js","./js/games.js","./js/auth.js","./js/messages.js","./js/love-letters.js","./manifest.json","./assets/icons/icon.svg"];
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