(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s),$=(s,r=document)=>Array.from(r.querySelectorAll(s));
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
 if(!window.lucide?.createIcons)return;
 try{window.lucide.createIcons({attrs:{"stroke-width":1.8}})}catch(error){console.debug("Lucide icon rendering skipped",error)}
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
 $(".messages-panel .message-bubble").forEach(bubble=>{
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
  if(count){count.classList.add("game-chat-count");count.setAttribute("aria-label","رسائل جديدة في المحادثة")}
  const screen=$(".game-screen"),gameKey=screen?[...screen.classList].filter(name=>name.startsWith("game-")).join(" "):"";
  const countNode=toggle.querySelector(".game-chat-count"),total=Number(countNode?.textContent||0);
  if(gameKey!==lastChatGame){lastChatGame=gameKey;lastChatTotal=total;unreadCount=0}
  else if(lastChatTotal!==null&&total>lastChatTotal&&!toggle.classList.contains("is-open"))unreadCount+=total-lastChatTotal;
  if(toggle.classList.contains("is-open"))unreadCount=0;
  lastChatTotal=total;
  if(countNode){countNode.textContent=String(unreadCount);countNode.hidden=unreadCount===0;countNode.setAttribute("aria-label",unreadCount+" رسائل جديدة")}
 }
 const bell=$("#notification-bell");
 if(bell){const icon=bell.querySelector("i.bi");if(icon){icon.className="";icon.setAttribute("data-lucide","bell");icon.setAttribute("aria-hidden","true")}}
 const icons={daily_rating:"heart",star_change:"star",routine_status:"calendar-check",habit_checkin:"sprout",pet_care:"paw-print",music_added:"music",private_message:"message-circle",love_letter:"mail"};
 $(".notification-item .notification-icon").forEach(node=>{if(!node.querySelector("svg.lucide"))node.innerHTML='<i data-lucide="'+(icons[node.closest(".notification-item")?.querySelector("[data-event-type]")?.dataset.eventType]||"bell")+'" aria-hidden="true"></i>'});
 $$(".game-player-score").forEach(score=>{
  const avatar=score.querySelector(".game-player-avatar");if(!avatar||avatar.querySelector("img"))return;
  const isAyoub=score.classList.contains("ayoub"),isCurrent=isAyoub===document.body.classList.contains("ayoub-theme"),img=document.createElement("img");
  img.src=isAyoub?"./assets/brand/ayoub-profile.jpg":"./assets/brand/farah-profile.jpg";img.alt="";img.loading="lazy";if(isCurrent)avatar.dataset.presence="online";avatar.replaceChildren(img);
 });
}
function setupReveal(){
 if(reduced())return;
 ["#hello","#plans-features-heading","#love-overlay .love-card h2","#love-overlay .love-card p"].forEach(selector=>{$$(selector).forEach(node=>node.classList.add("ayfar-text-reveal"))});
 const targets=$$(".home-anniversary,.plans-intro,.routine-intro,#home-games .games>button");
 if(!("IntersectionObserver" in window)){targets.forEach(node=>node.classList.add("is-visible"));return}
 if(!window._ayfarRevealObserver)window._ayfarRevealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add("is-visible");entry.target.classList.remove("is-pending");window._ayfarRevealObserver.unobserve(entry.target)}
 }),{threshold:.08,rootMargin:"0px 0px -24px 0px"});
 targets.forEach(node=>{if(node.dataset.revealReady)return;node.dataset.revealReady="true";node.classList.add("ayfar-scroll-reveal","is-pending");window._ayfarRevealObserver.observe(node)});
}
function avatarFallbacks(){
 $$(".ayfar-avatar img,.game-player-avatar img,.message-avatar img").forEach(img=>{
  if(img.dataset.fallbackReady)return;img.dataset.fallbackReady="true";
  img.addEventListener("error",()=>{const host=img.parentElement;img.remove();host.classList.add("avatar-fallback");host.innerHTML='<i data-lucide="user-round" aria-hidden="true"></i>'},{once:true});
 });
}
function enhance(){
 setupMoreMenu();enhanceMessages();enhanceFunctionalIcons();addProgressRing();setupReveal();avatarFallbacks();renderIcons();
 const menu=$("#home-more-menu"),toggle=$(".home-more-toggle");
 if(menu&&toggle){const active=$$("[data-home-target]",menu).some(item=>item.classList.contains("active"));toggle.classList.toggle("active",active)}
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