(()=>{
let realtimeChannel=null;
const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "\'":"&#39;"}[c]));
const show=html=>{$("#home").classList.add("hidden");$("#page").classList.remove("hidden");$("#pagebody").innerHTML=html};
async function open(){
 const role=window.WorldStore.get().active,client=window.ayfarSupabase;
 show('<div class="panel"><p>جارٍ تحميل الرسائل...</p></div>');
 try{
  if(realtimeChannel){await client.removeChannel(realtimeChannel);realtimeChannel=null;}
  const {data:{user},error:uerr}=await client.auth.getUser();if(uerr||!user)throw new Error("انتهت جلسة الدخول، سجّل الدخول مجدداً.");
  const {data:profiles,error:perr}=await client.from("profiles").select("id,role").in("role",["ayoub","farahati"]);if(perr)throw perr;
  const recipient=profiles.find(p=>p.role==="farahati");if(role==="ayoub"&&!recipient)throw new Error("تعذر العثور على حساب فرحتي.");
  await render(role,user,recipient);
  realtimeChannel=client.channel("ayfar-private-messages-"+user.id)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"private_messages"},payload=>{
    if(payload.new&&payload.new.recipient_id===user.id){render(role,user,recipient).catch(err=>console.error("Message refresh failed:",err));}
   })
   .subscribe(status=>{
    const indicator=$("#realtime-status");
    if(indicator)indicator.textContent=status==="SUBSCRIBED"?"متصل — الرسائل تصل تلقائيًا ♡":status==="CHANNEL_ERROR"?"الاتصال الفوري غير متاح — استخدم تحديث الرسائل مؤقتًا.":status==="CLOSED"?"انقطع الاتصال الفوري.":"جارٍ تفعيل الاتصال المباشر...";
   });
 }catch(e){show('<div class="panel"><h2>تعذر فتح الرسائل</h2><p>'+esc(e.message||"حدث خطأ في الاتصال.")+'</p><button class="primary" id="retry-msg">إعادة المحاولة</button></div>');$("#retry-msg").onclick=open}
}
async function render(role,user,recipient){
 const {data:rows,error}=await window.ayfarSupabase.from("private_messages").select("id,sender_id,body,created_at").order("created_at",{ascending:false});if(error)throw error;
 const items=(rows||[]).map(m=>'<article class="message-bubble '+(m.sender_id===user.id?"sent":"received")+'"><div>'+esc(m.body).replace(/\n/g,"<br>")+'</div><small>'+(m.sender_id===user.id?"أنت":"أيوب 🌙")+' · '+new Date(m.created_at).toLocaleString("ar-MA",{dateStyle:"medium",timeStyle:"short"})+'</small></article>').join("");
 show('<div class="panel messages-panel"><div class="bigheart">💌</div><small class="eyebrow">OUR PRIVATE CORNER</small><h2>رسائلنا الخاصة</h2><p>'+(role==="ayoub"?"اكتب لفرحتي رسالة تبقى بينكما.":"هذه رسائلك الخاصة من أيوب 🌙.")+'</p><p id="realtime-status" class="notice">جارٍ تفعيل الاتصال المباشر...</p><div class="message-list">'+(items||'<p class="empty-messages">لا توجد رسائل بعد. اتركا أول كلمة هنا ♡</p>')+'</div>'+(role==="ayoub"?'<form id="msg-form" class="message-form"><label class="field" for="msg-body">رسالة إلى فرحتي 🌸</label><textarea id="msg-body" class="text" rows="4" maxlength="5000" required placeholder="اكتب ما تريد أن تقوله..."></textarea><button class="primary" type="submit">إرسال الرسالة ♡</button><p id="msg-status" class="notice"></p></form>':"")+'<button class="secondary-action" id="refresh-msg">تحديث الرسائل</button></div>');
 $("#refresh-msg").onclick=open;
 const form=$("#msg-form");if(form)form.onsubmit=async e=>{e.preventDefault();const field=$("#msg-body"),btn=form.querySelector("button"),status=$("#msg-status"),body=field.value.trim();if(!body)return;btn.disabled=true;status.textContent="جارٍ الإرسال...";const {error:sendError}=await window.ayfarSupabase.from("private_messages").insert({sender_id:user.id,recipient_id:recipient.id,body});if(sendError){status.textContent="تعذر الإرسال: "+sendError.message;btn.disabled=false;return}await open()};
}
$("#messages").addEventListener("click",open);
})();