(()=> {
"use strict";
const client=()=>window.ayfarSupabase, $=s=>document.querySelector(s);
const gameNames={who:"من يعرف الآخر أكثر؟",thisorthat:"هذا أم ذاك؟",qa:"سؤال وجواب",truth:"صراحة أم تحدي",speed:"تحدي السرعة",xo:"إكس أو – XO",predict:"ماذا سيختار؟",difference:"اكتشف الاختلاف",compatibility:"اختبار التوافق",twenty:"عشرون سؤالاً",word:"خمن الكلمة",riddles:"من أكون؟ – الألغاز"};
let channel=null,room=null,role=null,uid=null,poll=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function page(html){$("#home").classList.add("hidden");$("#page").classList.remove("hidden");$("#pagebody").innerHTML=html}
function status(t){const n=$("#game-status");if(n)n.textContent=t}
async function currentUser(){const {data,error}=await client().auth.getUser();if(error||!data.user)throw new Error("انتهت جلسة الدخول. سجّل الدخول مجدداً.");uid=data.user.id}
async function rpc(name,args){const {data,error}=await client().rpc(name,args);if(error)throw error;return data}
function cleanup(){if(channel)client().removeChannel(channel);channel=null;if(poll)clearInterval(poll);poll=null;room=null}
function gameState(key){return {key,round:1,turn:"ayoub",answers:{},scores:{ayoub:0,farhati:0},moves:[],createdAt:new Date().toISOString()}}
async function start(key){
 try{cleanup();await currentUser();role=window.WorldStore.get().active;
 const row=await rpc("ayfar_game_create",{p_game_key:key,p_state:gameState(key)});room=row;renderRoom();
 }catch(e){page('<div class="panel"><h2>تعذر إنشاء المباراة</h2><p>'+esc(e.message)+'</p><button class="primary" id="game-back">العودة</button></div>');$("#game-back").onclick=()=>location.reload()}
}
async function join(id){
 try{cleanup();await currentUser();role=window.WorldStore.get().active;room=await rpc("ayfar_game_join",{p_game_id:id});renderRoom()}
 catch(e){status("تعذر الانضمام: "+e.message)}
}
function renderRoom(){
 const key=room.game_key,host=room.host_id===uid;
 page('<div class="panel sync-game"><div class="bigheart">♡</div><small class="eyebrow">AYFAR WORLD · LIVE GAME</small><h2>'+esc(gameNames[key])+'</h2><p id="game-status">'+(room.status==="waiting"?"بانتظار انضمام الطرف الآخر…":"اتصلتما! المباراة جاهزة للبدء.")+'</p>'+(room.status==="waiting"?'<div class="room-code">'+room.id+'</div><p>أرسل رمز المباراة للطرف الآخر ليدخل إليها من قسم الألعاب.</p>':'<div id="game-board"></div>')+'<button class="secondary-action" id="game-exit">العودة إلى الألعاب</button></div>');
 $("#game-exit").onclick=()=>{cleanup();location.reload()};
 if(room.status==="playing")renderBoard();
 channel=client().channel("ayfar-game-"+room.id).on("postgres_changes",{event:"UPDATE",schema:"public",table:"ayfar_games",filter:"id=eq."+room.id},payload=>{if(payload.new){room=payload.new;renderRoom()}}).subscribe(s=>{if(s==="SUBSCRIBED")status(room.status==="waiting"?"بانتظار انضمام الطرف الآخر…":"متصل بالهاتف الآخر ♡")});
 poll=setInterval(async()=>{try{const {data,error}=await client().from("ayfar_games").select("*").eq("id",room.id).single();if(!error&&data&&data.version!==room.version){room=data;renderRoom()}}catch(_){}},4000);
}
function renderBoard(){
 const board=$("#game-board");if(!board)return;
 const s=room.state||{};
 board.innerHTML='<p>أنت تلعب الآن من حساب '+(role==="ayoub"?"أيوب 🌙":"فرحتي 🌸")+'</p><p class="notice">هذه جلسة متزامنة. نطوّر قواعد كل لعبة وواجهتها في الخطوة التالية.</p><p>الجولة: '+Number(s.round||1)+'</p><p>النقاط — أيوب: '+Number(s.scores?.ayoub||0)+' · فرحتي: '+Number(s.scores?.farhati||0)+'</p>';
}
window.AYFAR_Games={start,join,cleanup};
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-game]");if(!b)return;
 const key=b.dataset.game;if(gameNames[key]){e.preventDefault();e.stopImmediatePropagation();start(key)}
},true);
})();