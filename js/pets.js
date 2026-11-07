(()=> {
 const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let db=null,user=null,role="ayoub",pets=[],logs=[],busy=false,channel=null,poll=null;
 const root=()=>$("#pets-app"),other=()=>role==="ayoub"?"farahati":"ayoub",label=r=>r==="ayoub"?"أيوب":"فرحتي";
 const species={cat:{name:"قط",emoji:"🐱"},bunny:{name:"أرنب",emoji:"🐰"},fox:{name:"ثعلب",emoji:"🦊"},bear:{name:"دب",emoji:"🐻"}};
 const actions=[["feed","🍓","إطعام"],["water","💧","ماء"],["play","🎾","لعب"],["sleep","🌙","مساعدة على النوم"],["bath","🫧","استحمام"],["clean","🧹","تنظيف"],["cuddle","🤍","حضن"],["gift","🎁","هدية"]];
 const stat=(name,v,icon)=>'<div class="pet-stat"><div><span>'+icon+' '+name+'</span><b>'+v+'%</b></div><div class="pet-meter"><i style="width:'+v+'%"></i></div></div>';
 function petCard(p){
  const mine=p.owner_id===user.id,sp=species[p.species]||species.cat,elapsed=Math.max(0,(Date.now()-new Date(p.updated_at).getTime())/3600000),values={hunger:Math.max(0,p.hunger-Math.floor(elapsed*2)),thirst:Math.max(0,p.thirst-Math.floor(elapsed*3)),energy:Math.max(0,p.energy-Math.floor(elapsed*2)),hygiene:Math.max(0,p.hygiene-Math.floor(elapsed)),happiness:Math.max(0,p.happiness-Math.floor(elapsed))},low=Math.min(...Object.values(values)),face=low<25?"🥺":low<50?"😟":"😊";
  const recent=logs.filter(l=>l.pet_owner===p.owner_id).slice(0,3);
  return '<article class="pet-card '+(mine?'pet-mine':'pet-partner')+'"><div class="pet-card-top"><div><small>'+(mine?'شخصيتك الافتراضية':'شخصية الطرف الآخر')+'</small><h4>'+esc(p.pet_name)+'</h4></div><span class="pet-level">المستوى '+p.level+' · '+p.xp+' XP</span></div><div class="pet-stage"><div class="pet-orbit">✦　♡　✦</div><div class="pet-creature">'+sp.emoji+'</div><div class="pet-face">'+face+'</div><small> '+(low<25?'تحتاج إلى بعض العناية':low<50?'تنتظر اهتمامك':'سعيدة باهتمامكما')+'</small></div><div class="pet-stats">'+stat("الشبع",values.hunger,"🍓")+stat("العطش",values.thirst,"💧")+stat("الطاقة",values.energy,"⚡")+stat("النظافة",values.hygiene,"🫧")+stat("السعادة",values.happiness,"💗")+'</div>'+(mine?'<form class="pet-name-form" data-pet-owner="'+p.owner_id+'"><input name="pet_name" maxlength="24" value="'+esc(p.pet_name)+'" aria-label="اسم الشخصية"><select name="species" aria-label="نوع الشخصية">'+Object.entries(species).map(([k,v])=>'<option value="'+k+'" '+(p.species===k?'selected':'')+'>'+v.emoji+' '+v.name+'</option>').join("")+'</select><button type="submit">تعديل</button></form>':'<div class="pet-care"><b>اعتنِ بشخصية '+label(p.owner_id===user.id?role:other())+' ♡</b><div class="pet-care-grid">'+actions.map(a=>'<button type="button" data-pet-care="'+a[0]+'" data-pet-owner="'+p.owner_id+'" '+(busy?'disabled':'')+'><span>'+a[1]+'</span>'+a[2]+'</button>').join("")+'</div></div>')+(recent.length?'<div class="pet-recent"><small>آخر لحظات العناية</small>'+recent.map(l=>'<span>'+ (actions.find(a=>a[0]===l.action_key)?.[1]||"♡")+' '+(l.cared_by===user.id?'أنت':'الطرف الآخر')+'</span>').join("")+'</div>':'')+'</article>';
 }
 function render(){
  const el=root();if(!el)return;
  const own=pets.find(p=>p.owner_id===user.id),partner=pets.find(p=>p.owner_id!==user.id);
  el.innerHTML='<div class="pets-world"><div class="pets-intro"><small>OUR LITTLE COMPANIONS</small><h3>عالم أفاتارنا ♡</h3><p>اسحب يميناً ويساراً للتنقل بين شخصيتيكما. أنت تعتني بأفاتار فرحتي، وهي تعتني بأفاتارك.</p><div class="pets-heartline">🌙　♡　🌸</div></div><div class="pets-carousel" id="pets-carousel">'+(own?'<div class="pet-slide">'+petCard(own)+'</div>':'<div class="pet-slide"><div class="pet-empty">ننشئ شخصيتك الصغيرة…</div></div>')+(partner?'<div class="pet-slide">'+petCard(partner)+'</div>':'<div class="pet-slide"><div class="pet-empty">بانتظار إنشاء شخصية الطرف الآخر. ادخلوا بحسابيهما مرة واحدة.</div></div>')+'</div><div class="pet-carousel-hint"><span>اسحب للتبديل</span><span>أيوب　♡　فرحتي</span></div><div class="pet-rules">كل فعل عناية يمنح الشخصية خبرة. تنخفض احتياجاتها تدريجياً مع مرور الوقت، ويمكن للطرف الآخر إطعامها واللعب معها ومساعدتها على الراحة. هناك مهلة قصيرة قبل تكرار الفعل نفسه حتى تبقى العناية ذات معنى.</div></div>';
 }
 async function load(){
  if(!db||!user)return;
  const [p,l]=await Promise.all([db.from("ayfar_pets").select("*"),db.from("ayfar_pet_care_log").select("*").order("created_at",{ascending:false}).limit(30)]);
  if(p.error||l.error){const el=root();if(el)el.innerHTML='<div class="pet-empty">تعذر تحميل عالم أفاتارنا. تأكد من تشغيل ترحيل العناية أولاً.<br>'+esc((p.error||l.error).message)+'</div>';return}
  pets=p.data||[];logs=l.data||[];render();
 }
 async function init(){
  db=window.ayfarSupabase;if(!db)return;const {data}=await db.auth.getUser();user=data?.user;if(!user)return;
  const {data:p}=await db.from("profiles").select("role").eq("id",user.id).single();role=String(p?.role||"ayoub").toLowerCase()==="farahati"?"farahati":"ayoub";
  const own=pets.find(x=>x.owner_id===user.id);
  if(!own){const {error}=await db.from("ayfar_pets").upsert({owner_id:user.id,pet_name:role==="ayoub"?"رفيق أيوب":"رفيقة فرحتي",species:role==="ayoub"?"cat":"bunny"},{onConflict:"owner_id",ignoreDuplicates:true});if(error){const el=root();if(el)el.innerHTML='<div class="pet-empty">تعذر إنشاء الشخصية: '+esc(error.message)+'</div>';return}}
  await load();
  if(!channel)channel=db.channel("ayfar-pets-care").on("postgres_changes",{event:"*",schema:"public",table:"ayfar_pets"},load).on("postgres_changes",{event:"*",schema:"public",table:"ayfar_pet_care_log"},load).subscribe();
  if(poll)clearInterval(poll);poll=setInterval(load,20000);
 }
 async function care(owner,action){
  if(busy)return;busy=true;render();
  const {error}=await db.rpc("ayfar_care_for_pet",{p_pet_owner:owner,p_action:action});busy=false;
  if(error){alert(error.message.includes("wait")?"امنح الشخصية لحظة لتستمتع بالعناية قبل تكرار الفعل.":error.message);await load();return}
  await load();
 }
 async function rename(form){
  const f=new FormData(form),owner=form.dataset.petOwner;
  const {error}=await db.from("ayfar_pets").update({pet_name:String(f.get("pet_name")).trim(),species:f.get("species")}).eq("owner_id",owner);
  if(error)alert(error.message);else await load();
 }
 const el=root();if(el){
  el.addEventListener("click",e=>{const b=e.target.closest("[data-pet-care]");if(b)care(b.dataset.petOwner,b.dataset.petCare)});
  el.addEventListener("submit",e=>{if(e.target.matches(".pet-name-form")){e.preventDefault();rename(e.target)}});
 }
 window.AYFAR_Pets={init};
})();