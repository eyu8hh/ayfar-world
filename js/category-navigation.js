(()=> {
  const pager=document.getElementById("home-pages");
  if(!pager)return;
  const pages=()=>Array.from(pager.querySelectorAll(":scope > .home-section-anchor"));
  pager.addEventListener("keydown",event=>{
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key!=="ArrowRight"&&event.key!=="ArrowLeft")return;
    if(event.target instanceof Element&&event.target.closest("button,a,input,textarea,select,[contenteditable='true'],[data-no-page-swipe],.pets-carousel,.home-section-nav"))return;
    const list=pages();
    const box=pager.getBoundingClientRect(),center=box.left+box.width/2;
    let active=0,distance=Infinity;
    list.forEach((page,index)=>{const rect=page.getBoundingClientRect(),d=Math.abs(rect.left+rect.width/2-center);if(d<distance){distance=d;active=index;}});
    const next=Math.max(0,Math.min(list.length-1,active+(event.key==="ArrowRight"?1:-1)));
    if(next===active)return;
    event.preventDefault();
    list[next].scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest",inline:"start"});
  });
})();