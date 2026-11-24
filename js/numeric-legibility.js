(()=>{"use strict";
const selectors=".date-count-grid strong,.date-number,.stats strong,.star-total,.game-player-score>b,.game-progress-label b,.final-result-scores article>strong,.game-chat-toggle i,.game-chat-meta time,#ap,#fp,#sp,.unfinished-match-score b,.unfinished-match-status,.history-match small,.history-match-score b,.score-strip b,.score-strip strong,.compatibility-final-rate strong,[data-numeric]";
const digitMap={"٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9","۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9"};
const numericOnly=/^[\s0-9٠-٩۰-۹.,:/+−-]+$/;
function normalize(el){
 if(!(el instanceof Element))return;
 el.classList.add("ayfar-numeric");
 el.setAttribute("dir","ltr");
 el.setAttribute("lang","en");
 for(const node of el.childNodes){
  if(node.nodeType!==Node.TEXT_NODE)continue;
  const value=node.nodeValue||"";
  if(/[٠-٩۰-۹]/.test(value))node.nodeValue=value.replace(/[٠-٩۰-۹]/g,d=>digitMap[d]);
 }
}
function scan(root=document){
 if(root instanceof Element&&root.matches(selectors))normalize(root);
 root.querySelectorAll?.(selectors).forEach(normalize);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>scan(),{once:true});else scan();
const observer=new MutationObserver(records=>{
 for(const record of records){
  if(record.type==="characterData"){const parent=record.target.parentElement;if(parent?.matches(selectors))normalize(parent);continue}
  record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)scan(node);else if(node.nodeType===Node.TEXT_NODE&&node.parentElement?.matches(selectors))normalize(node.parentElement)});
 }
});
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();