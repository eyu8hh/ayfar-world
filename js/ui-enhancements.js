(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>Array.from(r.querySelectorAll(s));
let lastChatGame="",lastChatTotal=null,unreadCount=0;
const reduced=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)").matches===true;
let toastTimer=null;
function toast(message,kind="info",duration=2600){
 const node=$("#toast");if(!node)return;
 node.textContent=String(message??"");node.dataset.kind=["success","error","warning","info"].includes(kind)?kind:"info";
 node.setAttribute("role",kind==="error"||kind==="warning"?"alert":"status");
 node.classList.add("show");clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>node.classList.remove("show"),Math.max(1800,duration));
}
function renderIcons(){
 if(window.lucide?.createIcons){try{window.lucide.createIcons({attrs:{"stroke-width":1.8}});return}catch(error){console.debug("Lucide icon rendering skipped",error)}}
 const paths={
  house:'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/>',
  heart:'<path d="M20.8 8.8c0 5.2-8.8 10-8.8 10S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/>',
  star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  "messages-square":'<path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 21 11.5Z"/><path d="M8 10h8M8 14h5"/>',
  "gamepad-2":'<path d="M6 11h4m-2-2v4"/><path d="M15 12h.01M18 10h.01"/><path d="M7 6h10a4 4 0 0 1 3.9 3.1l1 5A3 3 0 0 1 17 17l-3-2H10l-3 2a3 3 0 0 1-4.9-2.9l1-5A4 4 0 0 1 7 6Z"/>',
  ellipsis:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  "calendar-heart":'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/><path d="M12 17s-3-1.7-3-3.5a1.8 1.8 0 0 1 3-1.2 1.8 1.8 0 0 1 3 1.2c0 1.8-3 3.5-3 3.5Z"/>',
  sunrise:'<path d="M12 2v7m-7 5H2m20 0h-3M5 6l2 2m12-2-2 2"/><path d="M4 18a8 8 0 0 1 16 0M2 22h20"/>',
  "paw-print":'<circle cx="7.5" cy="8" r="2"/><circle cx="16.5" cy="8" r="2"/><circle cx="5" cy="14" r="1.7"/><circle cx="19" cy="14" r="1.7"/><path d="M12 13c-3 0-5 4-5 6a2 2 0 0 0 3 1.7l2-1 2 1a2 2 0 0 0 3-1.7c0-2-2-6-5-6Z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  "calendar-check":'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18m4 4 2 2 4-4"/>',
  sprout:'<path d="M12 22V10"/><path d="M12 14c-5 0-8-3-8-8 5 0 8 3 8 8Zm0-3c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  "message-circle":'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-4-.9L3 21l1.8-4.5A8.5 8.5 0 1 1 21 11.5Z"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  "bell-off":'<path d="M10.6 5.2A6 6 0 0 1 18 11c0 3 1 4.5 2 6H8"/><path d="M3 3 21 21M6.3 6.3A6 6 0 0 0 6 11c0 3-1 4.5-2 6h14M10 21h4"/>',
  "user-round":'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
 };
 all("[data-lucide]").forEach(node=>{
  const name=node.getAttribute("data-lucide"),body=paths[name];if(!body)return;
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");svg.setAttribute("stroke-width","1.8");svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");svg.setAttribute("aria-hidden","true");svg.setAttribute("class","lucide lucide-"+name);
  svg.innerHTML=body;node.replaceWith(svg);
 });
}
function setupMoreMenu(){
 const toggle=$(".home-more-toggle"),menu=$("#home-more-menu");if(!toggle||!menu||toggle.dataset.ready)return;
 toggle.dataset.ready="true";
 toggle.addEventListener("click",()=>{
  const opening=menu.hidden;menu.hidden=!opening;toggle.setAttribute("aria-expanded",String(opening));
 });
 menu.addEventListener("click",event=>{
  if(event.target.closest("[data-home-target]")){menu.hidden=true;toggle.setAttribute("aria-expanded","false")}
 });
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!menu.hidden){menu.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.focus()}
 });
}
function setupMoreDestinations(){
 all("[data-more-destination]").forEach(button=>{
  if(button.dataset.moreReady)return;button.dataset.moreReady="true";
  button.addEventListener("click",()=>{
   const target=button.dataset.moreDestination;
   document.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
  });
 });
}
function setupHomeShortcuts(){
 all("[data-home-shortcut]").forEach(button=>{
  if(button.dataset.shortcutReady)return;button.dataset.shortcutReady="true";
  button.addEventListener("click",()=>{
   const key=button.dataset.homeShortcut;
   if(key==="stars"){const wallet=$("#star-wallet");if(wallet){wallet.click();return}}
   const target=key==="games"?"home-games":"home-messages";
   $('.home-section-nav [data-home-target="'+target+'"]')?.click();
  });
 });
}
function addProgressRing(){
 const wrap=$(".game-progress-wrap");if(!wrap||wrap.dataset.ringReady==="true")return;
 const value=wrap.querySelector(".game-progress-label b");if(!value)return;
 const parts=(value.textContent||"1 / 1").match(/(\d+)\s*\/\s*(\d+)/);
 const current=parts?Number(parts[1]):1,total=parts?Math.max(1,Number(parts[2])):1;
 const finished=$(".game-screen")?.dataset.phase==="finished";
 const percent=finished?100:Math.round(Math.max(0,Math.min(1,(current-1)/total))*100);
 const ring=document.createElement("div");ring.className="game-progress-ring";ring.setAttribute("role","img");ring.setAttribute("aria-label","اكتمل "+percent+" بالمئة من المباراة");
 ring.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="ring-track" cx="20" cy="20" r="16"></circle><circle class="ring-value" cx="20" cy="20" r="16" pathLength="100" style="stroke-dashoffset:'+(100-percent)+'"></circle></svg><strong>'+percent+'%</strong>';
 wrap.prepend(ring);wrap.dataset.ringReady="true";
}
function enhanceMessages(){
 const empty=$(".messages-panel .empty-messages");if(empty&&!empty.dataset.premiumReady){empty.dataset.premiumReady="true";empty.innerHTML='<i data-lucide="message-circle" aria-hidden="true"></i><b>لا توجد رسائل بعد</b><span>اتركا أول كلمة جميلة هنا.</span>'}
 all(".messages-panel .message-bubble").forEach(bubble=>{
  if(bubble.dataset.premiumReady)return;bubble.dataset.premiumReady="true";
  const small=bubble.querySelector("small"),body=bubble.querySelector(":scope > div");
  const author=small?.textContent?.split(" · ")[0]||"";
  const own=bubble.classList.contains("sent"),isAyoub=own?document.body.classList.contains("ayoub-theme"):!document.body.classList.contains("ayoub-theme");
  const src=isAyoub?"./assets/brand/ayoub-profile.jpg":"./assets/brand/farah-profile.jpg";
  const meta=document.createElement("div");meta.className="message-author";
  const avatar=document.createElement("span");avatar.className="message-avatar";
  const img=document.createElement("img");img.src=src;img.alt="";img.loading="lazy";avatar.append(img);
  const name=document.createElement("b");name.textContent=author;meta.append(avatar,name);
  if(body)bubble.insertBefore(meta,body);
  if(body)body.classList.add("message-body");
  if(own&&small&&!small.querySelector(".message-delivery")){const sent=document.createElement("span");sent.className="message-delivery";sent.textContent="تم الإرسال";small.append(sent)}
 });
}
function enhanceFunctionalIcons(){
 const toggle=$("#game-chat-toggle");
 if(toggle){
  const icon=toggle.querySelector(".game-chat-toggle-icon");
  if(icon&&!icon.querySelector("svg.lucide"))icon.innerHTML='<i data-lucide="messages-square" aria-hidden="true"></i>';
  const label=toggle.querySelector(".game-chat-toggle-label");if(label)label.textContent="محادثتنا";
  const count=toggle.querySelector("i:not(.lucide):not([data-lucide])");
  if(count){count.classList.add("game-chat-count");count.setAttribute("aria-hidden","true")}
  const screen=$(".game-screen"),gameKey=screen?[...screen.classList].filter(name=>name.startsWith("game-")).join(" "):"";
  const countNode=toggle.querySelector(".game-chat-count"),total=Number(countNode?.textContent||0);
  if(gameKey!==lastChatGame){lastChatGame=gameKey;lastChatTotal=total;unreadCount=0}
  else if(lastChatTotal!==null&&total>lastChatTotal&&!toggle.classList.contains("is-open"))unreadCount+=total-lastChatTotal;
  if(toggle.classList.contains("is-open"))unreadCount=0;
  lastChatTotal=total;
  if(countNode){countNode.textContent=String(unreadCount);countNode.hidden=unreadCount===0;toggle.setAttribute("aria-label",unreadCount?"فتح المحادثة الجانبية، "+unreadCount+" رسائل جديدة":"فتح المحادثة الجانبية")}
 }
 const group=$(".ayfar-avatar-group");if(group){const avatars=all(".ayfar-avatar",group),ayoub=document.body.classList.contains("ayoub-theme");avatars.forEach((avatar,index)=>{if((index===0)===ayoub)avatar.dataset.presence="online";else delete avatar.dataset.presence})}
 all(".game-chat-avatar").forEach(avatar=>{if(avatar.dataset.avatarReady==="true"||avatar.querySelector("img"))return;avatar.dataset.avatarReady="true";const isAyoub=avatar.classList.contains("ayoub"),img=document.createElement("img");img.src=isAyoub?"./assets/brand/ayoub-profile.jpg":"./assets/brand/farah-profile.jpg";img.alt="";img.loading="lazy";avatar.replaceChildren(img)});
 const bell=$("#notification-bell");
 if(bell){const icon=bell.querySelector("i.bi");if(icon){icon.className="";icon.setAttribute("data-lucide","bell");icon.setAttribute("aria-hidden","true")}}
 const icons={daily_rating:"heart",star_change:"star",routine_status:"calendar-check",habit_checkin:"sprout",pet_care:"paw-print",music_added:"music",private_message:"message-circle",love_letter:"mail"};
 all(".notification-item .notification-icon").forEach(node=>{if(!node.querySelector("svg.lucide"))node.innerHTML='<i data-lucide="'+(icons[node.closest(".notification-item")?.querySelector("[data-event-type]")?.dataset.eventType]||"bell")+'" aria-hidden="true"></i>'});
 all(".game-player-score").forEach(score=>{
  const avatar=score.querySelector(".game-player-avatar");if(!avatar||avatar.dataset.avatarReady==="true"||avatar.querySelector("img"))return;avatar.dataset.avatarReady="true";
  const isAyoub=score.classList.contains("ayoub"),isCurrent=isAyoub===document.body.classList.contains("ayoub-theme"),img=document.createElement("img");
  img.src=isAyoub?"./assets/brand/ayoub-profile.jpg":"./assets/brand/farah-profile.jpg";img.alt="";img.loading="lazy";if(isCurrent)avatar.dataset.presence="online";avatar.replaceChildren(img);
 });
}
function enhanceEmptyStates(){
 const selectors=[".unfinished-empty",".history-empty",".routine-music-empty",".routine-plus-empty",".plan-tool-empty"];
 selectors.forEach(selector=>all(selector).forEach(node=>{
  if(!/لا توجد|لا يوجد|لم نضف|أضف عادة/.test(node.textContent||""))return;
  node.classList.add("ayfar-empty-state");
  if(node.dataset.premiumEmpty==="true")return;
  node.dataset.premiumEmpty="true";
  const name=selector===".unfinished-empty"?"gamepad-2":selector===".routine-music-empty"?"music":selector===".routine-plus-empty"?"calendar-heart":selector===".history-empty"?"calendar-check":"heart";
  const icon=document.createElement("i");icon.setAttribute("data-lucide",name);icon.setAttribute("aria-hidden","true");node.prepend(icon);
 }));
}
function setupReveal(){
 if(reduced())return;
 ["#hello","#plans-features-heading","#love-overlay .love-card h2","#love-overlay .love-card p"].forEach(selector=>{all(selector).forEach(node=>node.classList.add("ayfar-text-reveal"))});
 const targets=all(".home-anniversary,.plans-intro,.routine-intro,#home-games .games>button");
 if(!("IntersectionObserver" in window)){targets.forEach(node=>node.classList.add("is-visible"));return}
 if(!window._ayfarRevealObserver)window._ayfarRevealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add("is-visible");entry.target.classList.remove("is-pending");window._ayfarRevealObserver.unobserve(entry.target)}
 }),{threshold:.08,rootMargin:"0px 0px -24px 0px"});
 targets.forEach(node=>{if(node.dataset.revealReady)return;node.dataset.revealReady="true";node.classList.add("ayfar-scroll-reveal","is-pending");window._ayfarRevealObserver.observe(node)});
}
function avatarFallbacks(){
 all(".ayfar-avatar img,.game-player-avatar img,.game-chat-avatar img,.message-avatar img").forEach(img=>{
  if(img.dataset.fallbackReady)return;img.dataset.fallbackReady="true";
  img.addEventListener("error",()=>{const host=img.parentElement;img.remove();host.classList.add("avatar-fallback");host.innerHTML='<i data-lucide="user-round" aria-hidden="true"></i>'},{once:true});
 });
}
function enhance(){
 setupMoreMenu();setupMoreDestinations();setupHomeShortcuts();enhanceMessages();enhanceEmptyStates();enhanceFunctionalIcons();addProgressRing();setupReveal();avatarFallbacks();renderIcons();
 const menu=$("#home-more-menu"),toggle=$(".home-more-toggle");
 if(menu&&toggle){const active=all("[data-home-target]",menu).some(item=>item.classList.contains("active"));toggle.classList.toggle("active",active)}
}
window.AYFAR_UI=Object.assign(window.AYFAR_UI||{},{toast,refreshIcons:renderIcons});
document.addEventListener("DOMContentLoaded",()=>{
 enhance();
 const observer=new MutationObserver(()=>{
  if(observer._queued)return;observer._queued=true;
  requestAnimationFrame(()=>{observer._queued=false;enhance()});
 });
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
});
})();