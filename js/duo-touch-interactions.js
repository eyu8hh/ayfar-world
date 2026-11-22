(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const messages={ayoub:["وجودك يجعل التفاصيل العادية أجمل.","حتى في أبسط الأيام، أنتِ أجمل ما فيها."],farah:["هنا مكانك دائماً، يا أيوب.","أحب أن يكون لنا عالم صغير يشبهنا."]};
function toast(text){const node=$("#toast");if(!node)return;node.textContent=text;node.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove("show"),2400)}
function makeReaction(person){
 const scene=$("#ayfar-duo-scene");if(!scene)return;
 const key=person.dataset.duoPerson==="ayoub"?"ayoub":"farah";
 let bubble=$(".ayfar-duo-reaction",scene);if(!bubble){bubble=document.createElement("div");bubble.className="ayfar-duo-reaction";bubble.setAttribute("role","status");scene.append(bubble)}
 const choices=messages[key],index=Number(person.dataset.reactionIndex||0)%choices.length;
 bubble.textContent=choices[index];person.dataset.reactionIndex=String(index+1);
 scene.classList.remove("is-reacting");void scene.offsetWidth;scene.classList.add("is-reacting");
 if(!reduced()&&navigator.vibrate)navigator.vibrate(16);
}
function enhanceDuo(){
 const scene=$("#ayfar-duo-scene");if(!scene||scene.dataset.touchReady)return;scene.dataset.touchReady="true";
 scene.querySelectorAll(".ayfar-duo-person").forEach(person=>{
  person.setAttribute("aria-label","المس شخصية "+(person.dataset.duoPerson==="ayoub"?"أيوب":"فرحتي")+" لتظهر رسالة لطيفة");
  person.setAttribute("aria-label","المس شخصية "+(person.dataset.duoPerson==="ayoub"?"أيوب":"فرحتي") +" لتظهر رسالة لطيفة");
  person.addEventListener("click",()=>makeReaction(person));
  person.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();makeReaction(person)}});
 });
 const heart=$(".ayfar-lottie-heart",scene)||$(".ayfar-duo-heart",scene);
 heart?.addEventListener("click",()=>{scene.classList.add("is-heart-pulse");setTimeout(()=>scene.classList.remove("is-heart-pulse"),900)});
}
function enhanceMoments(){
 const moments=$("#ayfar-moments");if(!moments||moments.dataset.touchReady)return;moments.dataset.touchReady="true";
 moments.querySelector('[data-moment="messages"]')?.addEventListener("click",()=>{
  const target=$(".home-section-nav [data-home-target='home-messages']");target?.click();
  setTimeout(()=>$("#messages")?.focus?.(),250);
 });
 moments.querySelector('[data-moment="games"]')?.addEventListener("click",()=>{
  const target=$(".home-section-nav [data-home-target='home-games']");target?.click();
 });
}
function improveSky(){
 const card=$("#ayfar-sky");if(!card||card.dataset.touchReady)return;card.dataset.touchReady="true";
 const svg=$(".ayfar-sky-canvas",card);
 svg?.addEventListener("click",e=>{
  const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
  const p=point.matrixTransform(svg.getScreenCTM().inverse());
  const star=document.createElementNS("http://www.w3.org/2000/svg","circle");
  star.setAttribute("cx",p.x);star.setAttribute("cy",p.y);star.setAttribute("r","3.5");star.setAttribute("fill","#ffe0a8");star.setAttribute("class","ayfar-sky-star ayfar-sky-star-new");svg.append(star);
  toast("أضفنا ضوءاً صغيراً إلى سماء عالمنا");
 });
}
function apply(){
 enhanceDuo();enhanceMoments();improveSky();
}
document.addEventListener("DOMContentLoaded",()=>{
 apply();
 const observer=new MutationObserver(()=>apply());
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
});
})();