(()=>{
  const $=s=>document.querySelector(s);
  const formSelector="#auth-form";
  let originalFormMarkup="";
  let recoveryActive=false;

  function show(message,kind="info"){
    const box=$("#auth-error");
    if(!box) return;
    box.textContent=message;
    box.classList.toggle("is-error",kind==="error");
    box.classList.toggle("is-success",kind==="success");
    box.setAttribute("aria-live",kind==="error"?"assertive":"polite");
  }

  function setLoginBusy(busy){
    const form=$(formSelector),button=$("#auth-submit");
    if(form) form.classList.toggle("is-loading",busy);
    if(button){
      button.disabled=busy;
      if(busy) button.setAttribute("aria-busy","true");
      else button.removeAttribute("aria-busy");
    }
    form?.querySelectorAll("input").forEach(input=>{input.disabled=busy;});
  }

  function friendlyLoginError(error){
    const message=String(error?.message||"");
    const lower=message.toLowerCase();
    if(lower.includes("failed to fetch")||lower.includes("networkerror")||lower.includes("load failed"))
      return "تعذر الوصول إلى خدمة الدخول حالياً. تحقق من اتصال الخدمة ثم حاول مجدداً بعد لحظات.";
    if(lower.includes("invalid login credentials"))
      return "البريد الإلكتروني أو كلمة المرور غير صحيحين. تحقق منهما وحاول مرة أخرى.";
    if(lower.includes("email not confirmed"))
      return "هذا البريد يحتاج إلى تأكيد قبل تسجيل الدخول.";
    if(lower.includes("too many requests")||lower.includes("rate limit"))
      return "محاولات الدخول كثيرة خلال وقت قصير. انتظر قليلاً ثم أعد المحاولة.";
    return message||"حدث خطأ غير متوقع أثناء تسجيل الدخول. حاول مرة أخرى.";
  }

  function restoreLogin(message=""){
    const form=$(formSelector);
    if(!form) return;
    form.innerHTML=originalFormMarkup;
    recoveryActive=false;
    if(message) show(message);
  }

  function renderRecovery(){
    const form=$(formSelector);
    if(!form||recoveryActive) return;
    recoveryActive=true;
    form.innerHTML=`
      <div class="recovery-heading">
        <small class="eyebrow">ACCOUNT RECOVERY</small>
        <h2>تعيين كلمة مرور جديدة</h2>
        <p>أدخل كلمة مرور جديدة لحسابك في AYFAR WORLD.</p>
      </div>
      <label class="field" for="recovery-password">كلمة المرور الجديدة</label>
      <input id="recovery-password" class="text" type="password" autocomplete="new-password" minlength="6" placeholder="6 أحرف على الأقل" required>
      <label class="field" for="recovery-password-confirm">تأكيد كلمة المرور</label>
      <input id="recovery-password-confirm" class="text" type="password" autocomplete="new-password" minlength="6" placeholder="أعد كتابة كلمة المرور" required>
      <button class="primary" id="recovery-submit" type="submit">حفظ كلمة المرور الجديدة</button>
      <p id="auth-error" class="notice" role="status">أنت في وضع استعادة كلمة المرور.</p>
    `;
  }

  async function login(){
    const email=$("#auth-email")?.value.trim();
    const password=$("#auth-password")?.value;
    const button=$("#auth-submit");
    if(!email||!password){show("يرجى إدخال البريد الإلكتروني وكلمة المرور أولاً.");return;}
    if(!window.ayfarSupabase){show("لم يتم تحميل خدمة الدخول. تحقق من الإنترنت ثم أعد فتح الموقع.");return;}
    setLoginBusy(true);
    show("جارٍ التحقق من بيانات الحساب والاتصال الآمن...", "info");
    try{
      const result=await window.ayfarSupabase.auth.signInWithPassword({email,password});
      if(result.error) throw result.error;
      const userId=result.data.user.id;
      const profileResult=await window.ayfarSupabase.from("profiles").select("role,display_name").eq("id",userId).maybeSingle();
      if(profileResult.error) throw new Error("تم تسجيل الدخول، لكن تعذرت قراءة ملف الحساب. "+profileResult.error.message);
      if(!profileResult.data) throw new Error("تم تسجيل الدخول، لكن لا يوجد ملف profiles لهذا المعرّف: "+userId);
      const role=String(profileResult.data.role||"").trim().toLowerCase();
      if(role!=="ayoub"&&role!=="farahati") throw new Error("معرّف الحساب: "+userId+" | الدور الذي وصل للتطبيق: ["+role+"]");
      show("تم التحقق بنجاح. جارٍ فتح عالمنا...", "success");
      if(typeof window.AYFAR_enter!=="function") throw new Error("تم تسجيل الدخول، لكن واجهة العالم لم تجهز بعد. أعد تحميل الصفحة.");
      window.AYFAR_enter(role);
    }catch(error){
      show(friendlyLoginError(error), "error");
      try{await window.ayfarSupabase.auth.signOut();}catch(_){}
    }finally{
      setLoginBusy(false);
    }
  }

  async function updatePassword(){
    const password=$("#recovery-password")?.value||"";
    const confirmation=$("#recovery-password-confirm")?.value||"";
    const button=$("#recovery-submit");
    if(password.length<6){show("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");return;}
    if(password!==confirmation){show("كلمتا المرور غير متطابقتين.");return;}
    if(!window.ayfarSupabase){show("تعذر الاتصال بخدمة الحساب. أعد تحميل الصفحة.");return;}
    button.disabled=true;
    show("جارٍ حفظ كلمة المرور الجديدة...");
    try{
      const {data,error}=await window.ayfarSupabase.auth.updateUser({password});
      if(error) throw error;
      if(!data?.user) throw new Error("لم يؤكد Supabase تحديث كلمة المرور. حاول فتح رسالة الاستعادة الجديدة.");
      try{
        await window.ayfarSupabase.auth.signOut();
      }catch(_){}
      if(window.history?.replaceState){
        window.history.replaceState({},document.title,window.location.pathname+window.location.search);
      }
      restoreLogin("تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
    }catch(error){
      show(error?.message||"تعذر تحديث كلمة المرور. اطلب رابط استعادة جديداً وحاول مرة أخرى.");
      if(button) button.disabled=false;
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    const form=$(formSelector);
    if(!form) return;
    originalFormMarkup=form.innerHTML;

    form.addEventListener("submit",event=>{
      event.preventDefault();
      if(recoveryActive) updatePassword();
      else login();
    });

    const client=window.ayfarSupabase;
    if(client?.auth?.onAuthStateChange){
      client.auth.onAuthStateChange((event,session)=>{
        if(event==="PASSWORD_RECOVERY"&&session) renderRecovery();
      });
    }

    // Fallback for browsers where the recovery hash is present before the auth listener runs.
    if(window.location.hash.includes("type=recovery")){
      client?.auth?.getSession?.().then(({data,error})=>{
        if(!error&&data?.session) renderRecovery();
      }).catch(()=>{});
    }
  });
})();