(()=> {
  const pager = document.getElementById("home-pages");
  if (!pager) return;

  const pages = () => Array.from(pager.querySelectorAll(":scope > .home-section-anchor"));
  const activeIndex = () => {
    const bounds = pager.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    let nearest = 0;
    let distance = Infinity;
    pages().forEach((page, index) => {
      const rect = page.getBoundingClientRect();
      const nextDistance = Math.abs(rect.left + rect.width / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    return nearest;
  };

  let gesture = null;
  const ignoredTarget = target => target instanceof Element && target.closest(
    "button,a,input,textarea,select,[contenteditable='true'],[data-no-page-swipe],.pets-carousel,.home-section-nav"
  );

  pager.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || ignoredTarget(event.target)) {
      gesture = null;
      return;
    }
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now()
    };
  }, { passive: true });

  const clearGesture = () => { gesture = null; };
  pager.addEventListener("pointercancel", clearGesture, { passive: true });
  pager.addEventListener("lostpointercapture", clearGesture, { passive: true });

  pager.addEventListener("pointerup", event => {
    if (!gesture || event.pointerId !== gesture.id) return clearGesture();

    const start = gesture;
    clearGesture();
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = Math.max(1, performance.now() - start.time);
    const distance = Math.abs(dx);
    const threshold = Math.max(44, pager.clientWidth * 0.09);
    const quickFlick = distance >= 28 && distance / elapsed >= 0.48;

    // Leave vertical scrolling and ordinary taps completely untouched.
    if (distance <= Math.abs(dy) * 1.18 || (distance < threshold && !quickFlick)) return;

    const list = pages();
    if (!list.length) return;

    // Arabic / RTL behavior: drag right advances; drag left goes back.
    const direction = dx > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(list.length - 1, activeIndex() + direction));
    if (next === activeIndex()) return;

    pager.scrollTo({
      left: list[next].offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }, { passive: true });
})();