(()=> {
  const supa=()=>window.ayfarSupabase;
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  let user=null,channel=null,editingId=null,items=[],busy=false;
  const overlay=document.createElement("div");
  overlay.className="dreams-overlay";
  overlay.id="dreams-dialog";
  overlay.hidden=true;
  overlay.innerHTML=`
    <section class="dreams-dialog" role="dialog" aria-modal="true" aria-labelledby="dreams-title">
      <div class="dreams-head"><div><small>OUR SHARED DREAMS</small><h2 id="dreams-title">قائمة أحلامنا ♡</h2><p>كل حلم نكتبه هنا يصبح خطوة صغيرة نحو شيء نعيشه معاً.</p></div><button type="button" class="dreams-close" data-dream-close aria-label="إغلاق">×</button></div>
      <div class="dreams-stats"><span><b id="dreams-total">0</b>كل الأحلام</span><span><b id="dreams-done">0</b>تحققت</span><span><b id="dreams-left">0</b>بانتظارنا</span></div>
      <form class="dreams-form" id="dreams-form">
        <label for="dream-title-input" id="dream-form-label">أضيفا حلماً جديداً</label>
        <input id="dream-title-input" maxlength="120" required placeholder="مثلاً: رحلة إلى مكان نحبه">
        <label for="dream-details-input">تفاصيل الحلم (اختياري)</label>
        <textarea id="dream-details-input" maxlength="500" placeholder="اكتبا ما تريدان تذكره عن هذا الحلم..."></textarea>
        <div class="dreams-form-actions"><button class="dreams-submit" id="dream-save" type="submit">إضافة إلى أحلامنا ♡</button><button class="dreams-cancel" id="dream-cancel" type="button" hidden>إلغاء التعديل</button></div>
        <div class="dreams-feedback" id="dreams-feedback" role="status" aria-live="polite"></div>
      </form>
      <div class="dreams-list" id="dreams-list"><div class="dreams-loading">نفتح دفتر أحلامنا…</div></div>
    </section>`;
  document.body.appendChild(overlay);
  const $=selector=>overlay.querySelector(selector);
  const feedback=message=>$("#dreams-feedback").textContent=message||"";
  function setForm(item=null){
    editingId=item?.id||null;
    $("#dream-title-input").value=item?.title||"";
    $("#dream-details-input").value=item?.details||"";
    $("#dream-form-label").textContent=item?"تعديل الحلم":"أضيفا حلماً جديداً";
    $("#dream-save").textContent=item?"حفظ التعديلات":"إضافة إلى أحلامنا ♡";
    $("#dream-cancel").hidden=!item;
    feedback("");
    if(item) $("#dream-title-input").focus();
  }
  function render(){
    const done=items.filter(item=>item.is_completed).length;
    $("#dreams-total").textContent=items.length;
    $("#dreams-done").textContent=done;
    $("#dreams-left").textContent=items.length-done;
    if(!items.length){$("#dreams-list").innerHTML='<div class="dreams-empty">لم نكتب أحلامنا بعد…<br>ابدآ بأول حلم، مهما كان صغيراً. ✨</div>';return;}
    $("#dreams-list").innerHTML=items.map(item=>`
      <article class="dream-item ${item.is_completed?"is-done":""}" data-dream-id="${esc(item.id)}">
        <div class="dream-item-top"><div><h3>${esc(item.title)}</h3>${item.details?'<p>'+esc(item.details)+'</p>':""}</div><span class="dream-state">${item.is_completed?"تحقق الحلم ✓":"حلم ينتظرنا"}</span></div>
        <div class="dream-item-actions"><button type="button" class="dream-toggle" data-dream-toggle>${item.is_completed?"إعادة إلى القائمة":"تم تحقيقه ✓"}</button><button type="button" class="dream-edit" data-dream-edit>تعديل</button><button type="button" class="dream-delete" data-dream-delete>حذف</button></div>
      </article>`).join("");
  }
  async function load(){
    if(!supa()){feedback("خدمة المزامنة غير متاحة حالياً.");return;}
    $("#dreams-list").innerHTML='<div class="dreams-loading">نحدّث أحلامنا…</div>';
    const {data,error}=await supa().from("ayfar_shared_dreams").select("*").order("created_at",{ascending:false});
    if(error){$("#dreams-list").innerHTML='<div class="dreams-empty">لم نتمكن من تحميل القائمة.<br>'+esc(error.message)+'</div>';return;}
    items=data||[];render();
  }
  async function open(){
    overlay.hidden=false;
    document.body.style.overflow="hidden";
    setForm();
    if(!supa()){feedback("تعذر الاتصال بالخدمة. حدّث الصفحة وحاول مجدداً.");return;}
    const {data,error}=await supa().auth.getUser();
    if(error||!data?.user){feedback("انتهت جلسة الدخول. سجّل الدخول مجدداً.");return;}
    user=data.user;
    await load();
    if(!channel){
      channel=supa().channel("ayfar-shared-dreams-live")
        .on("postgres_changes",{event:"*",schema:"public",table:"ayfar_shared_dreams"},()=>load())
        .subscribe();
    }
    $("#dream-title-input").focus();
  }
  function close(){
    overlay.hidden=true;document.body.style.overflow="";
    if(channel&&supa()){supa().removeChannel(channel);channel=null;}
  }
  overlay.addEventListener("click",event=>{
    if(event.target===overlay||event.target.closest("[data-dream-close]")){close();return;}
    const card=event.target.closest("[data-dream-id]");
    if(!card)return;
    const item=items.find(entry=>entry.id===card.dataset.dreamId);
    if(!item)return;
    if(event.target.closest("[data-dream-edit]")){setForm(item);return;}
    if(event.target.closest("[data-dream-toggle]")){toggle(item);return;}
    if(event.target.closest("[data-dream-delete]")){remove(item);return;}
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!overlay.hidden)close();
    if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-open-dreams]")){event.preventDefault();open();}
  });
  document.querySelectorAll("[data-open-dreams]").forEach(button=>button.addEventListener("click",open));
  $("#dream-cancel").addEventListener("click",()=>setForm());
  $("#dreams-form").addEventListener("submit",async event=>{
    event.preventDefault();if(busy)return;
    const title=$("#dream-title-input").value.trim(),details=$("#dream-details-input").value.trim();
    if(!title){feedback("اكتبا عنوان الحلم أولاً.");return;}
    if(!user){feedback("تعذر التحقق من الحساب. أغلقي النافذة وافتحيها مجدداً.");return;}
    busy=true;$("#dream-save").disabled=true;feedback("جارٍ الحفظ…");
    try{
      const result=editingId
        ?await supa().from("ayfar_shared_dreams").update({title,details}).eq("id",editingId).select().single()
        :await supa().from("ayfar_shared_dreams").insert({title,details,created_by:user.id}).select().single();
      if(result.error)throw result.error;
      setForm();await load();feedback(editingId?"":"تم حفظ الحلم بينكما ♡");
    }catch(error){feedback("تعذر الحفظ: "+(error.message||"خطأ غير معروف"));}
    finally{busy=false;$("#dream-save").disabled=false;}
  });
  async function toggle(item){
    if(busy)return;busy=true;
    const next=!item.is_completed;
    const {error}=await supa().from("ayfar_shared_dreams").update({is_completed:next,completed_by:next?user?.id:null,completed_at:next?new Date().toISOString():null}).eq("id",item.id);
    busy=false;
    if(error){feedback("تعذر تحديث الحلم: "+error.message);return;}
    await load();feedback(next?"يا لها من خطوة جميلة! تم تسجيل تحقيق الحلم.":"أُعيد الحلم إلى قائمة الخطط.");
  }
  async function remove(item){
    if(busy||!window.confirm("هل تريدان حذف هذا الحلم من قائمتكما؟"))return;
    busy=true;const {error}=await supa().from("ayfar_shared_dreams").delete().eq("id",item.id);busy=false;
    if(error){feedback("تعذر حذف الحلم: "+error.message);return;}
    await load();feedback("تم حذف الحلم.");
  }
})();