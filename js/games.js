(()=> {
"use strict";
const client=()=>window.ayfarSupabase,$=s=>document.querySelector(s);
const names={who:"من يعرف الآخر أكثر؟",thisorthat:"هذا أم ذاك؟",qa:"سؤال وجواب",truth:"صراحة أم تحدي",speed:"تحدي السرعة",mixed:"معرفة مختلطة",predict:"ماذا سيختار؟",compatibility:"اختبار التوافق",riddles:"الألغاز والفوازير",flags:"تحدي أعلام الدول",geography:"العواصم والجغرافيا"};
const prompts={
 who:["ما أكثر شيء يفرح شريكك؟","ما الوجبة التي يفضلها شريكك؟","ما أكثر شيء يزعج شريكك؟","ما المكان الذي يتمنى شريكك زيارته؟","ما الهدية التي تسعد شريكك؟"],
 thisorthat:[["البحر","الجبل"],["القهوة","الشاي"],["السهر","الاستيقاظ مبكراً"],["السفر","البقاء في المنزل"],["الأفلام","المسلسلات"],["الصيف","الشتاء"],["المكالمات","الرسائل"],["المفاجآت","التخطيط"],["الحلو","المالح"],["مدينة","طبيعة"]],
 qa:["ما ذكرى تتمنى أن نعيشها معاً؟","ما الشيء الصغير الذي يحسن يومك؟","ما صفة تحبها في نفسك؟","ما مكانك المفضل للهدوء؟","ما حلم تريد تحقيقه؟","ما أكثر موقف جعلك تبتسم مؤخراً؟"],
 truth:["ما أول انطباع أخذته عني؟","ما شيء لم تخبرني به من قبل؟","صف يوماً مثالياً بالنسبة لك.","ما عادة مضحكة لديك؟","قل مجاملة صادقة للطرف الآخر."],
 dare:["أرسل رسالة صوتية تقول فيها ثلاث صفات تحبها في الطرف الآخر.","قل مجاملة صادقة دون استخدام كلمة جميل.","اختر أغنية تصف مزاجك الآن وأرسل اسمها.","قلّد طريقة كلام الطرف الآخر لعشر ثوانٍ.","اكتب ذكرى جميلة جمعتكما في جملة واحدة."],
 speed:[["ما لون السماء الصافية؟","أزرق"],["كم يوماً في الأسبوع؟","7"],["ما عكس كلمة طويل؟","قصير"],["ما عاصمة المغرب؟","الرباط"],["كم ضلعاً للمثلث؟","3"],["ما ناتج 5 × 6؟","30"],["ما عاصمة فرنسا؟","باريس"],["كم شهراً في السنة؟","12"],["ما الحيوان المعروف بملك الغابة؟","الأسد"],["ما ناتج 100 ÷ 4؟","25"],["ما الكوكب الأقرب إلى الشمس؟","عطارد"],["كم دقيقة في نصف ساعة؟","30"],["ما عاصمة مصر؟","القاهرة"],["ما لون مزج الأزرق والأصفر؟","أخضر"],["كم حرفاً في اللغة العربية؟","28"],["ما أكبر محيط؟","المحيط الهادئ"],["ما العضو المسؤول عن ضخ الدم؟","القلب"],["ما ناتج 9 + 8؟","17"],["ما عاصمة اليابان؟","طوكيو"],["ما اسم صغير القط؟","هريرة"]],
 mixed:[["علوم","ما الغاز الذي تحتاجه النباتات لصنع غذائها؟","ثاني أكسيد الكربون"],["تاريخ","في أي عام انتهت الحرب العالمية الثانية؟","1945"],["جغرافيا","ما أكبر قارة في العالم؟","آسيا"],["ثقافة عامة","ما اللغة الأكثر تحدثاً من حيث عدد الناطقين الأصليين؟","الصينية"],["المغرب","ما عاصمة المغرب؟","الرباط"],["فضاء","ما الكوكب المعروف بالكوكب الأحمر؟","المريخ"],["أدب","من مؤلف رواية البؤساء؟","فيكتور هوغو"],["فن","من رسم لوحة الموناليزا؟","ليوناردو دافنشي"],["طبيعة","ما أكبر حيوان على وجه الأرض؟","الحوت الأزرق"],["اختراعات","من يُنسب إليه اختراع الهاتف؟","ألكسندر غراهام بيل"],["علوم","ما وحدة قياس شدة التيار الكهربائي؟","الأمبير"],["تاريخ","من بنى مدينة فاس؟","إدريس الثاني"],["جغرافيا","ما أطول نهر في أفريقيا؟","النيل"],["ثقافة عامة","كم عدد ألوان قوس قزح التقليدية؟","7"],["المغرب","ما أعلى قمة جبلية في المغرب؟","جبل توبقال"],["فضاء","ما اسم المجرة التي تضم المجموعة الشمسية؟","درب التبانة"],["أدب","من مؤلف رواية دون كيشوت؟","ميغيل دي ثيربانتس"],["فن","ما الآلة الموسيقية التي لها مفاتيح سوداء وبيضاء؟","البيانو"],["طبيعة","ما الغاز الذي تطلقه النباتات خلال البناء الضوئي؟","الأكسجين"],["اختراعات","من اخترع المصباح الكهربائي العملي الشهير؟","توماس إديسون"],["علوم","ما الرمز الكيميائي للماء؟","H2O"],["تاريخ","في أي قارة نشأت الحضارة المصرية القديمة؟","أفريقيا"],["جغرافيا","ما أصغر قارة من حيث المساحة؟","أستراليا"],["ثقافة عامة","كم عدد أضلاع المثمن؟","8"],["المغرب","ما المدينة المغربية المعروفة بالمدينة الحمراء؟","مراكش"],["فضاء","ما اسم أول إنسان صعد إلى الفضاء؟","يوري غاغارين"],["أدب","من كتب مسرحية روميو وجولييت؟","ويليام شكسبير"],["طبيعة","ما أكبر حيوان ثديي بري؟","الفيل الأفريقي"],["علوم","ما المعدن الذي يرمز له Fe؟","الحديد"],["جغرافيا","ما البحر الذي يقع شمال المغرب؟","البحر الأبيض المتوسط"]], predict:["ما النشاط الذي تفضله في عطلة نهاية الأسبوع؟","ما الهدية التي تختارها؟","أي وجهة سفر تفضل؟","ما الطعام الذي تختاره الآن؟","هل تفضل الهدوء أم المغامرة؟","ما نوع السهر الذي تختاره؟","أي فصل من السنة تفضله؟","كيف تفضل قضاء يوم عطلة؟","أي نوع أفلام تختار للمشاهدة؟","ما المشروب الذي تطلبه غالباً؟"],
 compatibility:[["وقت الصباح","وقت المساء"],["البحر","الجبل"],["رسالة","مكالمة"],["فيلم","نزهة"],["تخطيط","عفوية"],["القهوة","الشاي"],["السفر","الاستقرار"],["الهدوء","الحركة"],["المفاجآت","التخطيط المسبق"],["المدينة","الطبيعة"]],

 riddles:[["له أوراق وليس نباتاً، وله غلاف وليس هدية","كتاب"],["يسير بلا قدمين ويبكي بلا عينين","سحاب"],["كلما أخذت منه كبر","حفرة"],["له أسنان ولا يعض","مشط"],["بيت بلا أبواب ولا نوافذ","بيضة"],["ما الكوكب المعروف بالكوكب الأحمر؟","المريخ"],["ما عاصمة اليابان؟","طوكيو"],["ما أكبر محيط في العالم؟","المحيط الهادئ"],["كم عدد أضلاع الشكل السداسي؟","6"],["ما الغاز الذي تمتصه النباتات من الهواء؟","ثاني أكسيد الكربون"],["من رسم لوحة الموناليزا؟","ليوناردو دافنشي"],["ما أسرع حيوان بري؟","الفهد"],["في أي قارة تقع دولة البرازيل؟","أمريكا الجنوبية"],["ما العنصر الكيميائي الذي رمزه O؟","الأكسجين"],["كم عدد أيام السنة الكبيسة؟","366"],["ما عاصمة أستراليا؟","كانبيرا"],["ما اللغة الرسمية في البرازيل؟","البرتغالية"],["ما الحيوان الذي يُلقب بسفينة الصحراء؟","الجمل"],["كم عدد الكواكب في المجموعة الشمسية؟","8"],["ما البحر الذي يفصل بين أوروبا وأفريقيا؟","البحر الأبيض المتوسط"],["ما العضو الذي يضخ الدم في جسم الإنسان؟","القلب"],["ما أكبر قارة من حيث المساحة؟","آسيا"],["ما اسم العملية التي تصنع بها النباتات غذاءها؟","البناء الضوئي"],["ما عاصمة مصر؟","القاهرة"],["كم دقيقة في الساعة؟","60"],["ما المعدن السائل في درجة حرارة الغرفة؟","الزئبق"],["ما الحيوان المعروف بتغيير لونه للتمويه؟","الحرباء"],["ما اسم أقرب نجم إلى الأرض؟","الشمس"],["ما الشيء الذي يبتل كلما جفف غيره؟","المنشفة"],["ما عاصمة المغرب؟","الرباط"]]
};
if(window.AYFAR_QUESTION_EXPANSION){prompts.mixed.push(...window.AYFAR_QUESTION_EXPANSION.mixed);prompts.speed.push(...window.AYFAR_QUESTION_EXPANSION.speed);}
const sourceBank=Array.isArray(window.AYFAR_QUESTION_BANK)?window.AYFAR_QUESTION_BANK:[];
const quizBanks={mixed:sourceBank,speed:sourceBank,riddles:sourceBank.filter(q=>q.category==="الألغاز والمنطق والذكاء"),geography:sourceBank.filter(q=>q.category==="الجغرافيا والدول والعواصم")};
let room=null,role=null,uid=null,channel=null,poll=null,clock=null,speedExpiryPending=false,aiNextPending=false,aiStatusPoll=null,aiStatusBusy=false;let chatOpen=false,chatSending=false,chatDraft="";let challengeChannel=null,challengePoll=null,incomingChallenge=null,outgoingChallenge=null,challengeBusy=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const other=p=>p==="ayoub"?"farhati":"ayoub",label=p=>p==="ayoub"?"أيوب 🌙":"فرحتي 🌸";
const norm=v=>String(v??"").normalize("NFKC").replace(/[ًٌٍَُِّْـٰ]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[٠-٩۰-۹]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)>=0?"٠١٢٣٤٥٦٧٨٩".indexOf(d):"۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\s+/g," ").trim().toLocaleLowerCase("ar");
function show(html){$("#home").classList.add("hidden");$("#page").classList.remove("hidden");$("#pagebody").innerHTML=html}
function toast(t){const x=$("#toast");if(x){x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}}
async function currentUser(){const {data,error}=await client().auth.getUser();if(error||!data.user)throw Error("انتهت جلسة الدخول. سجّل الدخول مجدداً.");uid=data.user.id}
async function rpc(n,a){const {data,error}=await client().rpc(n,a);if(error)throw error;return data}
function shuffleOrder(n){const order=Array.from({length:n},(_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}return order}
function questionIndex(s,key,len){const order=s.questionOrder?.[key];return order?.length?order[(s.round-1)%order.length]:(s.round-1)%len}
function scoreRound(s,key){
 if(Number(s.scoredRound)===Number(s.round))return;
 const correct=(p,answer)=>norm(s.answers[p])===norm(answer);
 if(key==="truth"){for(const p of ["ayoub","farhati"])if(s.answers[p]!=="[تم التخطي]"&&s.answers[p]!=="[انتهى الوقت]")s.scores[p]++}
 else if(key==="flags"){const item=(window.AYFAR_KNOWLEDGE?.flags||[])[questionIndex(s,key,window.AYFAR_KNOWLEDGE?.flags?.length||1)];for(const p of ["ayoub","farhati"])if(correct(p,item?.answer))s.scores[p]+=2}
 else if(["mixed","speed","riddles","geography"].includes(key)){const list=quizBanks[key]||[],item=list[questionIndex(s,key,list.length||1)],expected=item?.options?.[item.correctAnswer],points=key==="speed"?1:2;for(const p of ["ayoub","farhati"])if(expected&&correct(p,expected))s.scores[p]+=points}
 else if(key==="qa"){for(const p of ["ayoub","farhati"])if(s.answers[p]&&s.answers[p]!=="[تم التخطي]")s.scores[p]++}
 else if(["thisorthat","compatibility"].includes(key)&&s.answers.ayoub===s.answers.farhati){s.scores.ayoub++;s.scores.farhati++}
 s.scoredRound=s.round;
}
function fresh(key){const sizes={...Object.fromEntries(Object.keys(prompts).map(k=>[k,prompts[k].length])),...Object.fromEntries(["flags"].map(k=>[k,window.AYFAR_KNOWLEDGE?.[k]?.length||0]))};for(const [k,list] of Object.entries(quizBanks))sizes[k]=list.length;const questionOrder={};for(const [k,n] of Object.entries(sizes))if(n)questionOrder[k]=shuffleOrder(n);return {key,phase:"ready",round:0,total:key==="thisorthat"||key==="predict"||key==="compatibility"||key==="riddles"||key==="flags"||key==="geography"||key==="mixed"?10:5,scores:{ayoub:0,farhati:0},answers:{},history:[],turn:"ayoub",questionIndex:0,questionOrder,scoredRound:0,found:[],diffIndex:Math.floor(Math.random()*12)}}
const ROOM_KEY="ayfar_active_room_v1",LAST_GAME_KEY="ayfar_last_game_v1";function rememberGame(key,id){try{localStorage.setItem(LAST_GAME_KEY,JSON.stringify({key,id,at:Date.now()}))}catch(_){}}function cleanup(){chatOpen=false;chatSending=false;chatDraft="";if(channel)client().removeChannel(channel);channel=null;if(poll)clearInterval(poll);poll=null;if(clock)clearInterval(clock);clock=null;if(aiStatusPoll)clearInterval(aiStatusPoll);aiStatusPoll=null;aiStatusBusy=false;speedExpiryPending=false;room=null;try{localStorage.removeItem(ROOM_KEY)}catch(_){}}
async function leaveCurrentGame(){if(room&&room.state?.phase!=="finished"){try{localStorage.removeItem(ROOM_KEY);}catch(_){}cleanup();location.reload();return;}cleanup();location.reload();}
function challengeGameName(challenge){return challenge?.state?.aiQuiz?"المسابقة الذكية":names[typeof challenge==="string"?challenge:challenge?.game_key]||"لعبتنا الخاصة";}
function showChallengeWaiting(c){
 if(document.querySelector("#challenge-waiting"))return;
 show('<div class="panel challenge-waiting-card" id="challenge-waiting"><div class="challenge-orbit"><span>♡</span></div><small class="eyebrow">AYFAR · PRIVATE CHALLENGE</small><h2>أرسلت تحدياً إلى '+(role==="ayoub"?"فرحتي 🌸":"أيوب 🌙")+'</h2><p>اخترنا لعبة <b>'+esc(challengeGameName(c))+'</b>. سيبدأ اللعب تلقائياً عندما يقبل الطرف الآخر.</p><div class="challenge-waiting-status"><span class="challenge-pulse"></span> بانتظار القبول</div><button class="secondary-action" id="cancel-game-challenge">إلغاء التحدي</button></div>');
 $("#cancel-game-challenge")?.addEventListener("click",cancelChallenge);
}
function renderIncomingChallenge(c){
 let layer=document.getElementById("ayfar-challenge-layer");
 if(!c){if(layer)layer.remove();return;}
 if(!layer){layer=document.createElement("div");layer.id="ayfar-challenge-layer";document.body.appendChild(layer);}
 if(layer.dataset.dismissedChallenge===c.id)return;
 layer.innerHTML='<section class="challenge-invite-card" role="dialog" aria-modal="true" aria-label="تحدٍّ جديد"><div class="challenge-invite-top"><span class="challenge-invite-icon">♡</span><span class="challenge-invite-kicker">AYFAR · NEW CHALLENGE</span><button type="button" class="challenge-dismiss" id="challenge-dismiss" aria-label="إغلاق">×</button></div><small class="eyebrow">تحدٍّ جديد من '+(role==="ayoub"?"فرحتي 🌸":"أيوب 🌙")+'</small><h2>هل أنت مستعد للعب؟</h2><p>تمت دعوتك إلى <b>'+esc(challengeGameName(c.game_key))+'</b>. اقبل التحدي لنبدأ معاً.</p><div class="challenge-invite-actions"><button class="primary" id="accept-game-challenge" '+(challengeBusy?'disabled':'')+'><span>✓</span> قبول التحدي</button><button class="secondary-action" id="reject-game-challenge" '+(challengeBusy?'disabled':'')+'>رفض التحدي</button></div><div class="challenge-secure-note">مباراة خاصة بين حسابيكما فقط</div></section>';
 $("#challenge-dismiss")?.addEventListener("click",()=>{const box=document.getElementById("ayfar-challenge-layer");if(!box)return;box.dataset.dismissedChallenge=c.id;box.style.background="transparent";box.style.backdropFilter="none";box.style.webkitBackdropFilter="none";box.style.placeItems="start center";box.style.padding="12px";box.innerHTML='<button type="button" class="challenge-mini-pill" id="reopen-game-challenge">♡ تحدٍّ بانتظارك · عرض</button>';$("#reopen-game-challenge")?.addEventListener("click",()=>{box.dataset.dismissedChallenge="";box.style.background="rgba(34,13,24,.48)";box.style.backdropFilter="blur(8px)";box.style.webkitBackdropFilter="blur(8px)";box.style.placeItems="center";box.style.padding="20px";renderIncomingChallenge(c)});});
 $("#accept-game-challenge")?.addEventListener("click",()=>acceptChallenge(c.id));
 $("#reject-game-challenge")?.addEventListener("click",()=>rejectChallenge(c.id));
}
async function launchAcceptedChallenge(c){
 if(!c?.game_id||room?.id===c.game_id)return;
 const {data,error}=await client().from("ayfar_games").select("*").eq("id",c.game_id).maybeSingle();
 if(error||!data){if(error)console.warn("AYFAR accepted challenge:",error);return;}
 if(room)cleanup();
 room=data;role=window.WorldStore.get().active==="farahati"?"farhati":window.WorldStore.get().active;
 try{localStorage.setItem(ROOM_KEY,room.id);localStorage.removeItem("ayfar_pending_challenge_v1")}catch(_){}
 outgoingChallenge=null;renderIncomingChallenge(null);watch();render();toast("تم قبول التحدي! لنبدأ اللعب ❤️");
}
async function refreshChallenges(){
 if(!uid)return;
 const {data,error}=await client().from("ayfar_game_challenges").select("*").or("from_user.eq."+uid+",to_user.eq."+uid).order("created_at",{ascending:false}).limit(20);
 if(error){console.warn("AYFAR challenge sync:",error);return;}
 const rows=data||[];
 const pendingIncoming=rows.find(c=>c.to_user===uid&&c.status==="pending")||null;
 const pendingOutgoing=rows.find(c=>c.from_user===uid&&c.status==="pending")||null;
 const acceptedStored=(()=>{try{return localStorage.getItem("ayfar_pending_challenge_v1")}catch(_){return null}})();
 incomingChallenge=pendingIncoming;
 renderIncomingChallenge(incomingChallenge);
 if(pendingOutgoing){
  outgoingChallenge=pendingOutgoing;
  if(!acceptedStored){try{localStorage.setItem("ayfar_pending_challenge_v1",pendingOutgoing.id)}catch(_){}}
  if(!room&&!document.querySelector("#challenge-waiting"))showChallengeWaiting(pendingOutgoing);
 }
 const accepted=rows.find(c=>c.id===acceptedStored&&c.from_user===uid&&c.status==="accepted"&&c.game_id);
 if(accepted){await launchAcceptedChallenge(accepted);return;}
 const ended=rows.find(c=>c.id===acceptedStored&&c.from_user===uid&&["rejected","cancelled","expired"].includes(c.status));
 if(ended){
  try{localStorage.removeItem("ayfar_pending_challenge_v1")}catch(_){}
  outgoingChallenge=null;
  if(document.querySelector("#challenge-waiting")){toast(ended.status==="rejected"?"تم رفض التحدي":"انتهى التحدي");location.reload();}
 }
}
async function initChallenges(profileRole){
 try{
  await currentUser();
  role=profileRole==="farahati"?"farhati":profileRole||window.WorldStore.get().active;
  if(challengeChannel)client().removeChannel(challengeChannel);
  challengeChannel=client().channel("ayfar-challenges-"+uid).on("postgres_changes",{event:"*",schema:"public",table:"ayfar_game_challenges"},()=>refreshChallenges()).subscribe();
  if(challengePoll)clearInterval(challengePoll);
  await refreshChallenges();
  challengePoll=setInterval(refreshChallenges,4000);
 }catch(e){console.warn("AYFAR challenge initialization:",e);}
}
async function createChallenge(key,state){
 try{
  if(room&&["waiting","playing"].includes(room.status)&&room.state?.phase!=="finished"){toast("لديك مباراة نشطة بالفعل. أنهها أولاً.");return;}
  if(room)cleanup();
  await currentUser();role=window.WorldStore.get().active==="farahati"?"farhati":window.WorldStore.get().active;
  const challenge=await rpc("ayfar_challenge_send",{p_game_key:key,p_state:state});
  outgoingChallenge=challenge;
  try{localStorage.setItem("ayfar_pending_challenge_v1",challenge.id)}catch(_){}
  showChallengeWaiting(challenge);
  await refreshChallenges();
 }catch(e){
  show('<div class="panel"><div class="bigheart">♡</div><h2>تعذر إرسال التحدي</h2><p>'+esc(e.message||"حدث خطأ غير متوقع")+'</p><button class="primary" id="challenge-return">العودة إلى عالمنا</button></div>');
  $("#challenge-return")?.addEventListener("click",()=>location.reload());
 }
}
async function start(key){await createChallenge(key,fresh(key));}
function buildLocalAiQuestions(settings){
 const requested=settings?.categories||["ثقافة عامة","علوم","تاريخ","جغرافيا","المغرب","سينما","ألغاز"];
 const categoryMap={"ثقافة عامة":["ثقافة عامة"],"علوم":["العلوم والطبيعة"],"تاريخ":["التاريخ والحضارات"],"جغرافيا":["الجغرافيا والدول والعواصم"],"سينما":["السينما والأفلام والمسلسلات"],"ألغاز":["الألغاز والمنطق والذكاء"]};
 const bank=sourceBank.filter(q=>q&&Array.isArray(q.options)&&q.options.length>=2&&Number.isInteger(q.correctAnswer)&&q.options[q.correctAnswer]);
 const pool=[];
 for(const cat of requested){
  let matches=cat==="المغرب"?bank.filter(q=>/المغرب|مغربي|مغربية|الرباط|فاس|مراكش|طنجة|الدار البيضاء|الأطلس|الصحراء المغربية/i.test(q.question+" "+q.options[q.correctAnswer]+" "+q.explanation)):bank.filter(q=>(categoryMap[cat]||[]).includes(q.category));
  if(settings?.difficulty&&settings.difficulty!=="متنوع")matches=matches.filter(q=>q.difficulty===settings.difficulty);
  matches.forEach(q=>pool.push({...q,quizCategory:cat}));
 }
 const unique=[...new Map(pool.map(q=>[q.id,q])).values()];
 for(let i=unique.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[unique[i],unique[j]]=[unique[j],unique[i]];}
 const chosen=unique.slice(0,15);
 if(chosen.length<15)throw Error("بنك الأسئلة لا يحتوي على 15 سؤالاً كافياً من التصنيفات المختارة. اختر تصنيفات إضافية.");
 return chosen.map(q=>({question:q.question,answer:q.options[q.correctAnswer],explanation:q.explanation||"",category:q.quizCategory,difficulty:q.difficulty||"متوسط",options:q.options.slice(0,4)}));
}
async function startAiQuiz(){
 const settings={categories:["ثقافة عامة","علوم","تاريخ","جغرافيا","المغرب","سينما","ألغاز"],difficulty:"متنوع",count:15};
 let localQuestions;try{localQuestions=buildLocalAiQuestions(settings);}catch(e){toast(e.message);return;}
 const state={...fresh("riddles"),total:15,aiQuiz:true,aiQuizSettings:settings,aiLocalQuestions:localQuestions};
 await createChallenge("riddles",state);
}
async function acceptChallenge(id){
 if(challengeBusy)return;challengeBusy=true;renderIncomingChallenge(incomingChallenge);
 try{
  await currentUser();role=window.WorldStore.get().active==="farahati"?"farhati":window.WorldStore.get().active;
  const game=await rpc("ayfar_challenge_accept",{p_challenge_id:id});
  if(!game)throw Error("انتهت صلاحية هذا التحدي. اطلب تحدياً جديداً.");
  if(room)cleanup();
  room=game;incomingChallenge=null;renderIncomingChallenge(null);
  try{localStorage.setItem(ROOM_KEY,room.id)}catch(_){}
  watch();render();toast("قبلت التحدي! حظاً سعيداً لكما ❤️");
 }catch(e){toast(e.message||"تعذر قبول التحدي");}
 finally{challengeBusy=false;refreshChallenges();}
}
async function rejectChallenge(id){
 if(challengeBusy)return;challengeBusy=true;
 try{await rpc("ayfar_challenge_reject",{p_challenge_id:id});incomingChallenge=null;renderIncomingChallenge(null);toast("تم رفض التحدي");}
 catch(e){toast(e.message||"تعذر رفض التحدي");}
 finally{challengeBusy=false;refreshChallenges();}
}
async function cancelChallenge(){
 if(!outgoingChallenge)return;
 try{await rpc("ayfar_challenge_cancel",{p_challenge_id:outgoingChallenge.id});}
 catch(e){toast(e.message||"تعذر إلغاء التحدي");return;}
 try{localStorage.removeItem("ayfar_pending_challenge_v1")}catch(_){}
 outgoingChallenge=null;location.reload();
}
async function loadOpenGames(){
 const host=$("#unfinished-games");if(!host)return;
 host.innerHTML='<div class="unfinished-loading">نبحث عن مبارياتكما المحفوظة…</div>';
 try{
  await currentUser();
  const {data,error}=await client().from("ayfar_games").select("*").or("host_id.eq."+uid+",guest_id.eq."+uid).in("status",["playing","waiting"]).order("updated_at",{ascending:false}).limit(20);
  if(error)throw error;
  const rows=(data||[]).filter(x=>x.state?.phase!=="finished"&&!x.state?.endedEarly);
  if(!rows.length){host.innerHTML='<div class="unfinished-empty"><span>♡</span><b>لا توجد مباريات معلّقة</b><small>كل مباراة تبدأانها ستظهر هنا إذا خرجتما قبل إكمالها.</small></div>';return;}
  host.innerHTML=rows.map(x=>{
   const title=x.state?.aiQuiz?"المسابقة الذكية":names[x.game_key]||"مباراة AYFAR";
   const round=Math.max(0,Number(x.state?.round||0)),total=Math.max(1,Number(x.state?.total||10));
   const when=x.updated_at?new Intl.DateTimeFormat("ar-MA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(x.updated_at)):"";
   const status=x.state?.phase==="ready"?"بانتظار بدء اللعب":x.state?.phase==="play"?"الجولة "+round+" من "+total:"مباراة محفوظة";
   const progress=x.state?.phase==="ready"?0:Math.min(100,Math.round((round/total)*100));
   return '<article class="unfinished-match"><div class="unfinished-match-icon">♡</div><div class="unfinished-match-info"><div class="unfinished-match-title-row"><b>'+esc(title)+'</b><span class="unfinished-match-state">'+(x.state?.phase==="ready"?"قيد التجهيز":"مستمرة")+'</span></div><small class="unfinished-match-status">'+esc(status)+'</small><div class="unfinished-progress" role="progressbar" aria-label="تقدم المباراة" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+progress+'"><span style="width:'+progress+'%"></span></div><div class="unfinished-match-meta"><div class="unfinished-match-score"><span><i>🌙</i> أيوب <b>'+Number(x.state?.scores?.ayoub||0)+'</b></span><span><i>🌸</i> فرحتي <b>'+Number(x.state?.scores?.farhati||0)+'</b></span></div><small class="unfinished-match-updated">آخر تحديث: '+esc(when)+'</small></div></div><div class="unfinished-match-actions"><button class="unfinished-resume" data-resume-game="'+esc(x.id)+'" aria-label="إكمال المباراة" title="إكمال المباراة"><svg class="match-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8a1 1 0 0 1 1.5-.86l9.2 6.2a1 1 0 0 1 0 1.66l-9.2 6.2A1 1 0 0 1 8 18.14V5.8Z" fill="currentColor"/></svg><span>إكمال المباراة</span></button><button class="unfinished-stop" data-stop-game="'+esc(x.id)+'" aria-label="إيقاف المباراة" title="إيقاف المباراة"><svg class="match-action-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg><span>إيقاف</span></button></div></article>';
  }).join("");
  host.querySelectorAll("[data-resume-game]").forEach(b=>b.addEventListener("click",()=>resumeGame(b.dataset.resumeGame)));
  host.querySelectorAll("[data-stop-game]").forEach(b=>b.addEventListener("click",()=>stopSavedGame(b.dataset.stopGame)));
 }catch(e){console.warn("AYFAR saved matches:",e);host.innerHTML='<div class="unfinished-empty"><b>تعذر تحميل المباريات</b><small>تحقق من الاتصال ثم أعد المحاولة.</small><button class="unfinished-resume" id="retry-open-games">إعادة المحاولة</button></div>';$("#retry-open-games")?.addEventListener("click",loadOpenGames);}
}
async function resumeGame(id){
 try{
  await currentUser();
  const {data,error}=await client().from("ayfar_games").select("*").eq("id",id).maybeSingle();
  if(error)throw error;if(!data||!["playing","waiting"].includes(data.status)||data.state?.phase==="finished")throw Error("هذه المباراة لم تعد متاحة.");
  if(room)cleanup();
  room=data;role=window.WorldStore.get().active==="farahati"?"farhati":"ayoub";
  try{localStorage.setItem(ROOM_KEY,room.id);}catch(_){}
  const home=$("#home"),page=$("#page");if(home)home.classList.add("hidden");if(page)page.classList.remove("hidden");
  watch();render();
 }catch(e){toast(e.message||"تعذر استئناف المباراة");loadOpenGames();}
}
async function stopSavedGame(id){
 if(!window.confirm("هل تريد إيقاف هذه المباراة نهائياً؟ لن تتمكنا من إكمالها بعد ذلك."))return;
 try{
  await currentUser();
  const {data,error}=await client().from("ayfar_games").select("*").eq("id",id).maybeSingle();
  if(error)throw error;if(!data)throw Error("المباراة غير موجودة.");
  const state={...(data.state||{}),phase:"finished",endedEarly:true,stoppedBy:role||window.WorldStore.get().active,stoppedAt:new Date().toISOString()};
  await rpc("ayfar_game_update",{p_game_id:data.id,p_expected_version:data.version,p_state:state,p_status:"cancelled"});
  if(room?.id===id)cleanup();
  toast("تم إيقاف المباراة");loadOpenGames();
 }catch(e){toast(e.message||"تعذر إيقاف المباراة");}
}
async function restore(){try{const id=localStorage.getItem(ROOM_KEY);if(!id)return;await currentUser();const {data,error}=await client().from("ayfar_games").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!data){localStorage.removeItem(ROOM_KEY);return}room=data;role=window.WorldStore.get().active==="farhati"?"farhati":"ayoub";watch();render()}catch(e){console.warn("AYFAR game restore:",e);toast("تعذر استعادة المباراة. تحقق من الاتصال ثم حدّث الصفحة.")}}
function watch(){if(!room)return;if(channel)client().removeChannel(channel);channel=client().channel("ayfar-game-"+room.id).on("postgres_changes",{event:"UPDATE",schema:"public",table:"ayfar_games",filter:"id=eq."+room.id},p=>{if(p.new&&(!room||Number(p.new.version)>Number(room.version))){room=p.new;render()}}).subscribe();if(poll)clearInterval(poll);poll=setInterval(async()=>{if(!room)return;const {data}=await client().from("ayfar_games").select("*").eq("id",room.id).single();if(data&&Number(data.version)>Number(room.version)){room=data;render()}},3500)}
async function save(mutator,status){if(!room)return;for(let attempt=0;attempt<3;attempt++){const base=room,s=JSON.parse(JSON.stringify(base.state||{}));mutator(s);try{room=await rpc("ayfar_game_update",{p_game_id:base.id,p_expected_version:base.version,p_state:s,p_status:status||null});render();return}catch(e){const {data}=await client().from("ayfar_games").select("*").eq("id",base.id).single();if(!data)break;room=data;if(Number(data.version)<=Number(base.version))break;}}render();toast("تعذر حفظ الحركة بعد عدة محاولات. تمت مزامنة آخر حالة؛ أعد المحاولة إن لم تظهر إجابتك.")}
function shell(inner){
 const state=room?.state||fresh(room?.game_key||"who"),key=room?.game_key||"who";
 const messages=Array.isArray(state.chatMessages)?state.chatMessages:[];
 const currentDraft=$("#game-chat-input")?.value??chatDraft;chatDraft=currentDraft;
 const icons={who:"🧠",thisorthat:"⚖️",qa:"💬",truth:"♡",speed:"⚡",mixed:"✦",predict:"🔮",compatibility:"♡",riddles:"🧩",flags:"🏳️",geography:"🌍"};
 const title=state.aiQuiz?"المسابقة الذكية":(names[key]||"لعبتنا");
 const phaseLabel=state.phase==="ready"?"المباراة جاهزة":state.phase==="finished"?"اكتملت المباراة":state.phase==="play"?"المباراة جارية":"تحدٍ خاص بينكما";
 const currentRound=state.aiQuiz?Math.min(Number(state.aiIndex||0)+1,Number(state.total||15)):Math.min(Number(state.round||1),Number(state.total||1));
 const progress=state.phase==="finished"?100:Math.max(0,Math.min(100,((currentRound-1)/Math.max(1,Number(state.total||1)))*100));
 const progressMarkup=state.phase==="play"||state.phase==="finished"?'<div class="game-progress-wrap"><div class="game-progress-label"><span>تقدم المباراة</span><b>'+currentRound+' / '+(state.total||1)+'</b></div><div class="game-progress-track"><span style="width:'+progress+'%"></span></div></div>':'';
 const scoreMarkup='<div class="game-scoreboard"><div class="game-player-score ayoub"><span class="game-player-avatar">☾</span><span class="game-player-name">أيوب</span><b>'+Number(state.scores?.ayoub||0)+'</b><small>نقطة</small></div><div class="game-score-divider">VS</div><div class="game-player-score farahati"><span class="game-player-avatar">♡</span><span class="game-player-name">فرحتي</span><b>'+Number(state.scores?.farahati||0)+'</b><small>نقطة</small></div></div>';
 const svgChat='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11h8M8 14h5"/></svg>';
 const svgSend='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z"/><path d="M10.1 13.9 15 9"/></svg>';
 const svgHeart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10-8.8 10S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/></svg>';
 const panel=chatOpen?'<section class="game-chat-panel" role="dialog" aria-label="محادثة AYFAR الجانبية"><header class="game-chat-head"><div class="game-chat-brand"><span class="game-chat-brandmark">♡</span><span><b>حديثنا أثناء اللعب</b><small><i class="game-chat-online"></i> محادثة خاصة بينكما</small></span></div><button type="button" class="game-chat-close" id="game-chat-close" aria-label="إغلاق المحادثة">×</button></header><div class="game-chat-context"><span>'+svgHeart+' مساحة صغيرة لكما</span><span>لا تؤثر في النقاط</span></div><div class="game-chat-messages" id="game-chat-messages" aria-live="polite">'+(messages.length?messages.map(m=>'<div class="game-chat-message-row '+(m.sender===role?'mine':'theirs')+'"><span class="game-chat-avatar '+(m.sender==='ayoub'?'ayoub':'farhati')+'">'+(m.sender==='ayoub'?'🌙':'🌸')+'</span><article class="game-chat-message"><div class="game-chat-meta"><b>'+(m.sender===role?'أنت':(m.sender==='ayoub'?'أيوب':'فرحتي'))+'</b><time>'+esc(new Date(m.at||Date.now()).toLocaleTimeString('ar-MA',{hour:'2-digit',minute:'2-digit'}))+'</time></div><p>'+esc(m.text)+'</p></article></div>').join(''):'<div class="game-chat-empty"><span class="game-chat-empty-icon">'+svgChat+'</span><b>هنا يبدأ حديثكما</b><p>أرسل كلمة لطيفة أو تعليقاً أثناء اللعب ❤️</p></div>')+'</div><div class="game-chat-composer"><div class="game-chat-quick" aria-label="ردود سريعة"><button type="button" data-chat-quick="❤️" aria-label="قلب">❤️</button><button type="button" data-chat-quick="😂" aria-label="ضحك">😂</button><button type="button" data-chat-quick="👏" aria-label="تصفيق">👏</button><button type="button" data-chat-quick="😘" aria-label="قبلة">😘</button></div><form id="game-chat-form" class="game-chat-form"><input id="game-chat-input" maxlength="500" autocomplete="off" value="'+esc(chatDraft)+'" placeholder="اكتب شيئاً جميلاً…" aria-label="اكتب رسالة" required><button type="submit" aria-label="إرسال الرسالة" '+(chatSending?'disabled':'')+'>'+svgSend+'</button></form><small class="game-chat-footnote">رسائلكما خاصة ومتزامنة بين الهاتفين</small></div></section>':'';
 const cleanInner=inner.replace(/^<h2>.*?<\/h2>/,"").replace(/<div class="score-strip">.*?<\/div>/,"");
 show('<div class="panel sync-game game-screen game-'+esc(key)+'" data-phase="'+esc(state.phase)+'"><div class="game-screen-header"><div class="game-screen-icon">'+(icons[key]||"♡")+'</div><div class="game-screen-heading"><small>AYFAR WORLD · PLAY TOGETHER</small><h2>'+esc(title)+'</h2><span>'+phaseLabel+'</span></div><span class="game-live-mark"><i></i> خاص</span></div>'+progressMarkup+scoreMarkup+'<div class="game-screen-content">'+cleanInner+'</div></div><div class="game-chat-widget">'+panel+'<button type="button" class="game-chat-toggle '+(chatOpen?'is-open':'')+'" id="game-chat-toggle" aria-expanded="'+String(chatOpen)+'" aria-label="فتح المحادثة الجانبية"><span class="game-chat-toggle-icon">'+svgChat+'</span><span class="game-chat-toggle-label">محادثتنا</span><i>'+messages.length+'</i></button></div>');
 const log=$("#game-chat-messages");if(log)log.scrollTop=log.scrollHeight;
 $("#game-chat-input")?.addEventListener("input",e=>{chatDraft=e.target.value});
 $("#game-chat-toggle")?.addEventListener("click",()=>{chatOpen=!chatOpen;render()});
 $("#game-chat-close")?.addEventListener("click",()=>{chatOpen=false;render()});
 document.querySelectorAll("[data-chat-quick]").forEach(b=>b.addEventListener("click",()=>{const input=$("#game-chat-input");if(input){input.value=(input.value+" "+b.dataset.chatQuick).trim();chatDraft=input.value;input.focus();}}));
 $("#game-chat-form")?.addEventListener("submit",async e=>{e.preventDefault();if(chatSending)return;const input=$("#game-chat-input"),value=input?.value.trim();if(!value)return;chatSending=true;chatDraft="";if(input)input.value="";const message={id:uid+":"+Date.now(),sender:role,text:value,at:new Date().toISOString()};try{await save(x=>{x.chatMessages=Array.isArray(x.chatMessages)?x.chatMessages:[];x.chatMessages.push(message);if(x.chatMessages.length>100)x.chatMessages=x.chatMessages.slice(-100)});}finally{chatSending=false;const send=$("#game-chat-form button[type=submit]");if(send)send.disabled=false}});
}
async function syncAiQuizStatus(){
 if(aiStatusBusy||!room||!room.state?.aiQuizSession||!room.state?.aiQuiz)return;
 aiStatusBusy=true;const gameId=room.id,sessionId=room.state.aiQuizSession;
 try{
  const {data,error}=await client().functions.invoke("ayfar-ai-quiz",{body:{action:"status",gameId,sessionId}});
  if(error||!data||!room||room.id!==gameId)return;
  const current=room.state||{},hasResults=!!data.results;
  const needsUpdate=Number(current.aiIndex||0)!==Number(data.index||0)
   ||(data.question&&current.aiQuestion!==data.question)
   ||(data.submissions?.ayoub&&!current.aiSubmitted?.ayoub)
   ||(data.submissions?.farahati&&!current.aiSubmitted?.farahati)
   ||(hasResults&&(!current.aiResults||current.aiScoredIndex!==data.index))
   ||(data.status==="finished"&&current.phase!=="finished");
  if(!needsUpdate)return;
  await save(x=>{
   if(x.aiQuizSession!==sessionId)return;
   if(data.index!==undefined&&Number(x.aiIndex||0)!==Number(data.index)){
    x.aiIndex=Number(data.index);x.round=Number(data.index)+1;x.aiResults=null;x.aiSubmitted={};x.aiScoredIndex=null;
   }
   if(data.question)x.aiQuestion=data.question;
   if(data.options?.length)x.aiOptions=data.options;
   if(data.category)x.aiCategory=data.category;
   if(data.difficulty)x.aiDifficulty=data.difficulty;
   x.aiSubmitted=x.aiSubmitted||{};
   if(data.submissions?.ayoub)x.aiSubmitted.ayoub=true;
   if(data.submissions?.farahati)x.aiSubmitted.farahati=true;
   if(data.results&&x.aiScoredIndex!==data.index){
    x.aiResults=data.results;x.aiScoredIndex=data.index;
    x.scores=x.scores||{ayoub:0,farahati:0};
    x.scores.ayoub=Number(x.scores.ayoub||0)+Number(data.results.ayoub?.points||0);
    x.scores.farahati=Number(x.scores.farahati||0)+Number(data.results.farahati?.points||0);
   }
   if(data.status==="finished")x.phase="finished";
  });
 }catch(e){console.warn("AYFAR AI quiz status:",e)}finally{aiStatusBusy=false}
}
function render(){if(!room)return;const s=room.state||fresh(room.game_key),key=room.game_key;if(s.aiQuiz&&s.aiQuizSession&&s.phase==="play"){if(!aiStatusPoll)aiStatusPoll=setInterval(syncAiQuizStatus,2500);}else if(aiStatusPoll){clearInterval(aiStatusPoll);aiStatusPoll=null;}if(room.status==="waiting"){shell('<h2>'+esc(names[key])+'</h2><p>هذه مباراة قديمة أُنشئت بنظام رمز الدعوة السابق.</p><p class="notice">ابدأ تحدياً جديداً من الصفحة الرئيسية بالطريقة الجديدة.</p><button class="primary" id="exit">العودة إلى الألعاب</button>');$("#exit").onclick=leaveCurrentGame;return}
if(s.phase==="ready"){shell('<h2>'+esc(names[key])+'</h2><p>اتصلتما بنجاح! كل واحد يلعب من هاتفه.</p><div class="score-strip"><span>🌙 '+s.scores.ayoub+'</span><span>🌸 '+s.scores.farhati+'</span></div>'+'<button class="primary" id="begin">ابدأ اللعب ♡</button>'+'<button class="secondary-action" id="exit">الخروج</button>');$("#begin")?.addEventListener("click",async()=>{if(s.phase!=="ready")return;if(s.aiQuiz){try{const {data,error}=await client().functions.invoke("ayfar-ai-quiz",{body:{action:"create",gameId:room.id,categories:s.aiQuizSettings.categories,difficulty:s.aiQuizSettings.difficulty,localQuestions:s.aiLocalQuestions}});if(error)throw error;if(data?.error)throw Error(data.error);await save(x=>{x.phase=data.status==="finished"?"finished":"play";x.round=Number(data.index||0)+1;x.aiQuizSession=data.sessionId;x.aiQuestion=data.question;x.aiOptions=data.options||[];x.aiIndex=Number(data.index||0);x.aiCategory=data.category;x.aiDifficulty=data.difficulty;x.aiSubmitted={...(data.submissions||{})};x.aiResults=data.results||null;if(data.results&&x.aiScoredIndex!==data.index){x.scores.ayoub+=Number(data.results.ayoub?.points||0);x.scores.farahati+=Number(data.results.farahati?.points||0);x.aiScoredIndex=data.index;}});}catch(e){toast(e.message||"تعذر إنشاء الأسئلة الذكية")}return;}save(x=>{if(x.phase!=="ready")return;x.phase="play";x.round=1;x.turn="ayoub";x.answers={};if(key==="speed")x.deadlineAt=Date.now()+15000;})});$("#exit").onclick=leaveCurrentGame;return}
if(s.phase==="finished"){const winner=s.scores.ayoub>s.scores.farhati?"أيوب 🌙":s.scores.farhati>s.scores.ayoub?"فرحتي 🌸":"تعادل جميل ♡";const completed=s.aiQuiz?Math.min(Number(s.aiIndex||0)+1,Number(s.total||0)):Math.min(Number(s.round||1)-1,Number(s.total||0));shell('<h2>انتهت المباراة! 🏆</h2><div class="question-card"><small>النتيجة النهائية</small><h3>'+winner+'</h3><p>الجولات المكتملة: '+completed+' من '+s.total+'</p></div><div class="result-grid"><article>🌙 أيوب<strong>'+s.scores.ayoub+' نقطة</strong></article><article>🌸 فرحتي<strong>'+s.scores.farahati+' نقطة</strong></article></div><p class="notice">الأجمل أنكما لعبتما معاً ♡</p><button class="primary" id="again">مباراة جديدة</button><button class="secondary-action" id="exit">العودة</button>');$("#again").onclick=()=>start(key);$("#exit").onclick=leaveCurrentGame;return}
let html='<h2>'+esc(names[key])+'</h2><p>الجولة '+s.round+' من '+s.total+'</p>'+(key==="speed"?'<div class="question-card">الوقت المتبقي: <b id="speed-countdown">15</b> ثانية</div>':"")+'<div class="score-strip"><span>🌙 '+s.scores.ayoub+'</span><span>🌸 '+s.scores.farhati+'</span></div>';
const submitted=!!s.answers[role],both=!!s.answers.ayoub&&!!s.answers.farhati;
if(key==="flags"){
 const bank=window.AYFAR_KNOWLEDGE||{},entry=(bank.flags||[])[questionIndex(s,"flags",(bank.flags||[]).length||1)];
 if(!entry){html+='<p class="notice">تعذر تحميل بنك الأعلام.</p>';}
 else{html+='<div class="question-card">ما الدولة التي ينتمي إليها هذا العلم؟</div><img class="flag-question" src="https://flagcdn.com/w320/'+esc(entry.code)+'.png" alt="علم دولة" loading="lazy"><div class="knowledge-options">'+entry.options.map(v=>'<button class="secondary-action knowledge-option" data-knowledge-answer="'+esc(v)+'" '+(submitted?'disabled':'')+'>'+esc(v)+'</button>').join("")+'</div>'+(submitted?'<p class="notice">تم تثبيت اختيارك. بانتظار الطرف الآخر…</p>':"")+(both?'<div class="question-card"><h3>الإجابة الصحيحة</h3><b>'+esc(entry.answer)+'</b></div><button class="primary" id="next">العلم التالي</button>':"");}
}
if(key==="riddles"){if(s.aiQuiz){html+='<p>السؤال '+(s.aiIndex+1)+' من 15 · '+esc(s.aiCategory||"ثقافة عامة")+' · مستوى '+esc(s.aiDifficulty||"متنوع")+'</p><div class="question-card">'+esc(s.aiQuestion||"يتم تحضير السؤال…")+'</div>'+(s.aiResults?'<div class="question-card"><b>الإجابة الصحيحة:</b> '+esc(s.aiResults.correctAnswer)+'<p>'+esc(s.aiResults.explanation)+'</p><p>أيوب: '+esc(s.aiResults.ayoub.feedback)+' · '+s.aiResults.ayoub.points+' نقطة</p><p>فرحتي: '+esc(s.aiResults.farhati.feedback)+' · '+s.aiResults.farhati.points+' نقطة</p></div>'+(role==="ayoub"?'<button class="primary" id="ai-next">السؤال التالي</button>':'<p class="notice">بانتظار أيوب للانتقال إلى السؤال التالي…</p>'):(s.aiSubmitted?.[role]?'<p class="notice">تم تسجيل إجابتك. بانتظار الطرف الآخر…</p>':(s.aiOptions?.length?'<div class="knowledge-options">'+s.aiOptions.map(v=>'<button class="secondary-action ai-option" data-ai-answer="'+esc(v)+'">'+esc(v)+'</button>').join("")+'</div>':'<input id="answer" class="text" maxlength="240" placeholder="اكتب إجابتك"><button class="primary" id="submit">إرسال الإجابة</button>')))}else{const list=quizBanks.riddles||[],item=list[questionIndex(s,"riddles",list.length||1)];if(!item){html+='<p class="notice">تعذر تحميل بنك الألغاز.</p>';}else{const expected=item.options[item.correctAnswer];html+='<p class="eyebrow">'+esc(item.difficulty)+'</p><div class="question-card">'+esc(item.question)+'</div><div class="knowledge-options">'+item.options.map((v,i)=>'<button class="secondary-action bank-option" data-bank-answer="'+esc(v)+'" '+(submitted?'disabled':'')+'>'+String.fromCharCode(65+i)+' · '+esc(v)+'</button>').join("")+'</div>'+(submitted?'<p class="notice">تم تثبيت اختيارك. بانتظار الطرف الآخر…</p>':"")+(both?'<div class="question-card"><h3>الإجابة الصحيحة</h3><b>'+esc(expected)+'</b><p>'+esc(item.explanation)+'</p><p>أيوب: '+esc(s.answers.ayoub)+' · فرحتي: '+esc(s.answers.farahati)+'</p></div><button class="primary" id="next">اللغز التالي</button>':"");}}}else if(["mixed","speed","geography"].includes(key)){const list=quizBanks[key]||[],item=list[questionIndex(s,key,list.length||1)];if(!item){html+='<p class="notice">تعذر تحميل بنك الأسئلة. حدّث الصفحة وحاول مجدداً.</p>';}else{const expected=item.options[item.correctAnswer],points=key==="speed"?1:2;html+=(key==="speed"?'<p class="eyebrow">تحدي السرعة · 15 ثانية</p>':"")+(key==="mixed"?'<p class="eyebrow">'+esc(item.category)+' · '+esc(item.difficulty)+'</p>':'<p class="eyebrow">'+esc(item.difficulty)+'</p>')+'<div class="question-card">'+esc(item.question)+'</div><div class="knowledge-options">'+item.options.map((v,i)=>'<button class="secondary-action bank-option" data-bank-answer="'+esc(v)+'" '+(submitted?'disabled':'')+'>'+String.fromCharCode(65+i)+' · '+esc(v)+'</button>').join("")+'</div>'+(submitted?'<p class="notice">تم تثبيت اختيارك. بانتظار الطرف الآخر…</p>':"")+(both?'<div class="question-card"><h3>الإجابة الصحيحة</h3><b>'+esc(expected)+'</b><p>'+esc(item.explanation)+'</p><p>'+(norm(s.answers.ayoub)===norm(expected)?'✅':'❌')+' أيوب: '+esc(s.answers.ayoub)+' · '+(norm(s.answers.ayoub)===norm(expected)?'+'+points:'0')+' نقطة</p><p>'+(norm(s.answers.farahati)===norm(expected)?'✅':'❌')+' فرحتي: '+esc(s.answers.farahati)+' · '+(norm(s.answers.farahati)===norm(expected)?'+'+points:'0')+' نقطة</p></div><button class="primary" id="next">السؤال التالي</button>':"");}}else if(key==="thisorthat"||key==="compatibility"){const q=key==="thisorthat"?prompts.thisorthat[questionIndex(s,"thisorthat",prompts.thisorthat.length)]:prompts.compatibility[questionIndex(s,"compatibility",prompts.compatibility.length)];html+='<div class="question-card">'+(key==="thisorthat"?"اختر ما تفضله":"أي الخيارين أقرب إليك؟")+'</div>'+(submitted?'<p>تم تسجيل اختيارك، بانتظار الآخر.</p>':q.map(v=>'<button class="secondary-action choice" data-choice="'+esc(v)+'" style="margin:6px">'+esc(v)+'</button>').join(""))+(both?'<div class="question-card"><h3>نتيجة الاختيارات</h3><p>اختيار أيوب: '+esc(s.answers.ayoub)+'</p><p>اختيار فرحتي: '+esc(s.answers.farhati)+'</p><p>'+(s.answers.ayoub===s.answers.farhati?"اختياركما متطابق! حصل كل منكما على نقطة ♡":"اختلاف جميل في الذوق، لا نقاط لهذه الجولة.")+'</p></div><button class="primary" id="next">السؤال التالي</button>':"")}
else if(key==="truth"){const choice=s.truthChoice?.[role];const q=(choice==="تحدي"?prompts.dare:prompts.truth)[(s.round-1)%5];html+=!choice?'<div class="question-card">اختَر بطاقتك لهذا الدور. يمكنك تخطي أي بطاقة لا تناسبك.</div><button class="secondary-action" data-truth-choice="صراحة">صراحة</button><button class="secondary-action" data-truth-choice="تحدي">تحدي</button>':'<div class="question-card"><b>'+choice+'</b><p>'+esc(q)+'</p></div>'+(submitted?'<p class="notice">تم إرسال ردك. بانتظار الطرف الآخر…</p>':'<textarea id="answer" class="text" rows="3" placeholder="اكتب إجابتك أو أكد إنجاز التحدي"></textarea><button class="primary" id="submit">إرسال الرد</button><button class="secondary-action" id="skip-truth">تخطي البطاقة</button>')+(both?'<div class="question-card"><h3>نتيجة الجولة</h3><p>اكتمل الدور بينكما ♡</p><p>الصراحة والتحديات المكتملة تمنح نقطة لكل لاعب. التخطي لا يمنح نقاطاً.</p><p>أيوب: '+(s.answers.ayoub==='[تم التخطي]'?'تم التخطي':'شارك')+' · فرحتي: '+(s.answers.farhati==='[تم التخطي]'?'تم التخطي':'شاركت')+'</p></div><button class="primary" id="next">البطاقة التالية</button>':"")}
else if(key==="who"){const q=prompts.who[questionIndex(s,"who",prompts.who.length)],truth=s.truthAnswers||{},guesses=s.guesses||{},hasTruth=!!truth[role],hasGuess=!!guesses[role],ready=!!truth.ayoub&&!!truth.farhati,done=!!guesses.ayoub&&!!guesses.farhati;html+='<div class="question-card">'+esc(q)+'</div>'+(!ready?(hasTruth?'<p class="notice">إجابتك محفوظة. بانتظار إجابة الطرف الآخر…</p>':'<p>أجب عن نفسك أولاً، ثم حاول تخمين إجابة شريكك.</p><textarea id="answer" class="text" rows="3" placeholder="إجابتك الحقيقية"></textarea><button class="primary" id="who-truth">حفظ إجابتي</button>'):"")+(ready&&!done?(hasGuess?'<p class="notice">تم حفظ تخمينك. بانتظار الطرف الآخر…</p>':'<p>الآن خمن إجابة شريكك:</p><textarea id="guess" class="text" rows="3" placeholder="ما إجابة شريكك؟"></textarea><button class="primary" id="who-guess">تأكيد التخمين</button>'):"")+(done?'<div class="question-card"><h3>كشف الإجابات</h3><p>إجابة أيوب: '+esc(truth.ayoub)+'</p><p>تخمين أيوب: '+esc(guesses.ayoub)+' '+(norm(guesses.ayoub)===norm(truth.farhati)?'✅ +1 نقطة':'❌ 0 نقطة')+'</p><p>إجابة فرحتي: '+esc(truth.farhati)+'</p><p>تخمين فرحتي: '+esc(guesses.farhati)+' '+(norm(guesses.farhati)===norm(truth.ayoub)?'✅ +1 نقطة':'❌ 0 نقطة')+'</p></div><button class="primary" id="next">الجولة التالية</button>':"")}else if(key==="predict"){const q=prompts.predict[questionIndex(s,"predict",prompts.predict.length)],predictor=s.round%2===1?"ayoub":"farhati",actual=s.actualChoice,pred=s.prediction;html+='<div class="question-card">'+esc(q)+'</div><p>المتوقع: '+label(predictor)+' · صاحب الاختيار: '+label(other(predictor))+'</p>'+(!actual?(role===other(predictor)?'<p>اختر إجابتك الحقيقية دون إخبار شريكك.</p><textarea id="actual-choice" class="text" rows="2" placeholder="اختيارك الحقيقي"></textarea><button class="primary" id="actual-submit">تثبيت اختياري</button>':'<p class="notice">بانتظار الاختيار الحقيقي من الطرف الآخر…</p>'):"")+(actual&&!pred?(role===predictor?'<p>خمن اختيار شريكك:</p><textarea id="prediction" class="text" rows="2" placeholder="توقعك"></textarea><button class="primary" id="predict-submit">إرسال التوقع</button>':'<p class="notice">تم تثبيت الاختيار. بانتظار توقع الشريك…</p>'):"")+(actual&&pred?'<div class="question-card"><h3>كشف التوقع</h3><p>الاختيار الحقيقي: '+esc(actual)+'</p><p>توقع الشريك: '+esc(pred)+'</p><p>'+(norm(actual)===norm(pred)?'توقع صحيح! نقطة للمُتوقع ♡':'التوقع لم يطابق الاختيار، لا نقطة هذه الجولة.')+'</p></div><button class="primary" id="next">الجولة التالية</button>':"")}else if(key==="qa"){const list=prompts[key],item=list[questionIndex(s,key,list.length)],q=key==="speed"?item[0]:key==="mixed"?item[1]:item;html+=(key==="mixed"?'<p class="eyebrow">'+esc(item[0])+'</p>':"")+'<div class="question-card">'+esc(q)+'</div>'+(submitted?'<p class="notice">تم تثبيت إجابتك. بانتظار إجابة الطرف الآخر…</p>':'<textarea id="answer" class="text" rows="3" placeholder="اكتب إجابتك هنا"></textarea><button class="primary" id="submit">إرسال الإجابة</button>')+(both?(function(){const expected=key==="mixed"?item[2]:key==="speed"?item[1]:null;if(expected){const a=norm(s.answers.ayoub)===norm(expected),f=norm(s.answers.farhati)===norm(expected);return '<div class="question-card"><h3>الإجابة الصحيحة</h3><b>'+esc(expected)+'</b><p>'+(a?'✅':'❌')+' أيوب: '+esc(s.answers.ayoub)+' · '+(a?(key==="mixed"?'+2':'+1'):'0')+' نقطة</p><p>'+(f?'✅':'❌')+' فرحتي: '+esc(s.answers.farhati)+' · '+(f?(key==="mixed"?'+2':'+1'):'0')+' نقطة</p></div>'}return '<div class="question-card"><h3>إجابات الجولة</h3><p>إجابة أيوب: '+esc(s.answers.ayoub)+'</p><p>إجابة فرحتي: '+esc(s.answers.farhati)+'</p><p>'+(s.answers.ayoub===s.answers.farhati?'نقطة مشاركة لكل لاعب أكمل إجابته ♡':'نقطة مشاركة لكل لاعب أكمل إجابته ♡')+'</p></div>'})()+'<button class="primary" id="next">السؤال التالي</button>':"")}
html+='<p id="game-status" class="notice">تتم مزامنة الحركات بين الهاتفين تلقائياً.</p><button class="secondary-action" id="exit">الخروج</button>';shell(html);
$("#exit").onclick=leaveCurrentGame;
$("#who-truth")?.addEventListener("click",()=>{const v=$("#answer")?.value.trim();if(!v)return toast("اكتب إجابتك أولاً");save(x=>{x.truthAnswers=x.truthAnswers||{};if(!x.truthAnswers[role])x.truthAnswers[role]=v})});
$("#who-guess")?.addEventListener("click",()=>{const v=$("#guess")?.value.trim();if(!v)return toast("اكتب تخمينك");save(x=>{x.guesses=x.guesses||{};if(x.truthAnswers?.ayoub&&x.truthAnswers?.farhati&&!x.guesses[role]){x.guesses[role]=v;if(x.guesses.ayoub&&x.guesses.farhati&&x.whoScoredRound!==x.round){for(const p of ["ayoub","farhati"])if(norm(x.guesses[p])===norm(x.truthAnswers[other(p)]))x.scores[p]++;x.whoScoredRound=x.round}}})});
$("#actual-submit")?.addEventListener("click",()=>{const v=$("#actual-choice")?.value.trim();if(!v)return toast("اكتب اختيارك");save(x=>{const predictor=x.round%2===1?"ayoub":"farhati";if(role===other(predictor)&&!x.actualChoice)x.actualChoice=v})});
$("#predict-submit")?.addEventListener("click",()=>{const v=$("#prediction")?.value.trim();if(!v)return toast("اكتب توقعك");save(x=>{const predictor=x.round%2===1?"ayoub":"farhati";if(role===predictor&&x.actualChoice&&!x.prediction){x.prediction=v;if(norm(v)===norm(x.actualChoice)&&x.predictScoredRound!==x.round){x.scores[role]++;x.predictScoredRound=x.round}}})});
async function submitAiAnswer(value){
 const v=String(value||"").trim();if(!v)return toast("اختر إجابتك أولاً");
 try{const {data,error}=await client().functions.invoke("ayfar-ai-quiz",{body:{action:"submit",gameId:room.id,sessionId:s.aiQuizSession,answer:v}});if(error)throw error;if(data?.error)throw Error(data.error);
  await save(x=>{x.aiSubmitted=x.aiSubmitted||{};x.aiSubmitted[role]=true;if(data.results){x.aiResults=data.results;if(x.aiScoredIndex!==x.aiIndex){x.scores.ayoub+=Number(data.results.ayoub?.points||0);x.scores.farahati+=Number(data.results.farahati?.points||0);x.aiScoredIndex=x.aiIndex;}}});
 }catch(e){toast(e.message||"تعذر تصحيح الإجابة")}
}
$("#submit")?.addEventListener("click",()=>{const v=$("#answer")?.value.trim();if(key==="riddles"&&s.aiQuiz)return submitAiAnswer(v);if(!v)return toast("اكتب إجابتك أولاً");save(x=>{if(x.answers[role])return;x.answers[role]=v;if(x.answers.ayoub&&x.answers.farahati)scoreRound(x,key);})});
document.querySelectorAll("[data-ai-answer]").forEach(b=>b.onclick=()=>{if(s.aiSubmitted?.[role])return;submitAiAnswer(b.dataset.aiAnswer)});

document.querySelectorAll("[data-knowledge-answer]").forEach(b=>b.onclick=()=>{if(s.answers?.[role])return;save(x=>{if(x.answers[role])return;x.answers[role]=b.dataset.knowledgeAnswer;if(x.answers.ayoub&&x.answers.farhati)scoreRound(x,key);})});
document.querySelectorAll("[data-bank-answer]").forEach(b=>b.onclick=()=>{if(s.answers?.[role])return;save(x=>{if(x.answers[role])return;x.answers[role]=b.dataset.bankAnswer;if(x.answers.ayoub&&x.answers.farhati)scoreRound(x,key);})});

$("#ai-next")?.addEventListener("click",async()=>{if(role!=="ayoub"||aiNextPending)return;aiNextPending=true;const button=$("#ai-next");if(button)button.disabled=true;try{const {data,error}=await client().functions.invoke("ayfar-ai-quiz",{body:{action:"next",gameId:room.id,sessionId:s.aiQuizSession}});if(error)throw error;if(data?.error)throw Error(data.error);if(data.finished){await save(x=>{if(x.aiQuizSession!==s.aiQuizSession)return;x.phase="finished";x.aiQuizFinished=true});return;}await save(x=>{if(x.aiQuizSession!==s.aiQuizSession||x.phase!=="play")return;if(Number(x.aiIndex||0)<Number(data.index)){x.round=Number(data.index)+1;x.aiIndex=data.index;x.aiQuestion=data.question;x.aiOptions=data.options||[];x.aiCategory=data.category;x.aiDifficulty=data.difficulty;x.aiSubmitted={};x.aiResults=null;x.aiScoredIndex=null;}});}catch(e){toast(e.message||"تعذر الانتقال للسؤال التالي")}finally{aiNextPending=false}});
$("#next")?.addEventListener("click",()=>save(x=>{if(x.phase!=="play"||Number(x.round)!==Number(s.round))return;const ready=key==="who"?(x.guesses?.ayoub&&x.guesses?.farhati):key==="predict"?(x.actualChoice&&x.prediction):(x.answers.ayoub&&x.answers.farhati);if(!ready)return;x.round++;x.roundResult=null;x.answers={};if(key==="speed")x.deadlineAt=Date.now()+15000;if(key==="truth")x.truthChoice={};if(key==="who"){x.truthAnswers={};x.guesses={}}if(key==="predict"){x.actualChoice=null;x.prediction=null}if(x.round>x.total)x.phase="finished"}));
$("#skip-truth")?.addEventListener("click",()=>save(x=>{if(x.answers[role])return;x.answers[role]="[تم التخطي]";if(x.answers.ayoub&&x.answers.farhati)scoreRound(x,key);}));
document.querySelectorAll("[data-truth-choice]").forEach(b=>b.onclick=()=>save(x=>{x.truthChoice=x.truthChoice||{};if(!x.truthChoice[role]&&!x.answers[role])x.truthChoice[role]=b.dataset.truthChoice}));
bodyChoice();
if(clock)clearInterval(clock);clock=null;speedExpiryPending=false;
if(key==="speed"&&s.phase==="play"&&s.deadlineAt&&!both){const tick=()=>{const el=$("#speed-countdown");if(!el)return;const left=Math.max(0,Math.ceil((Number(s.deadlineAt)-Date.now())/1000));el.textContent=String(left);if(left===0&&!speedExpiryPending){speedExpiryPending=true;save(x=>{if(x.round!==s.round||x.speedExpiredRound===x.round)return;if(!x.answers.ayoub)x.answers.ayoub="[انتهى الوقت]";if(!x.answers.farhati)x.answers.farhati="[انتهى الوقت]";if(x.answers.ayoub&&x.answers.farhati){x.speedExpiredRound=x.round;scoreRound(x,"speed");}});}};clock=setInterval(tick,250);tick();}
function bodyChoice(){document.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>save(x=>{if(x.answers[role])return;x.answers[role]=b.dataset.choice;if(x.answers.ayoub&&x.answers.farhati)scoreRound(x,key);}))}





}

window.AYFAR_Games={start,startAiQuiz,cleanup,restore,resume:restore,resumeGame,stopSavedGame,loadOpenGames,initChallenges};
document.addEventListener("click",e=>{const ai=e.target.closest("[data-ai-quiz]");if(ai){e.preventDefault();e.stopImmediatePropagation();startAiQuiz();return}const b=e.target.closest("[data-game]");if(!b||!names[b.dataset.game])return;e.preventDefault();e.stopImmediatePropagation();start(b.dataset.game)},true);
})();