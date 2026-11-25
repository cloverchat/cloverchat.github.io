"use strict";
/* CloverChat — Firebase Compat 8.10.1 */
firebase.initializeApp({
  apiKey:"AIzaSyCMkymWe_AEfY9X09UC-jnCN85zfCLU2h0",
  authDomain:"alamchat1.firebaseapp.com",
  databaseURL:"https://alamchat1-default-rtdb.firebaseio.com"
});
let phone="",telegramRequestId="",phoneLinkRequestId="";
const auth=firebase.auth(),db=firebase.database(),$=id=>document.getElementById(id);
const WORKER="https://still-frost-fc39.eldinalam91.workers.dev";
const NOAV="https://i.imgur.com/HeIi0wU.png";
const LOGO="https://acrft.github.io/images/achat.png";
const TS=firebase.database.ServerValue.TIMESTAMP;
let me=null,prof=null,peer=null,cur=null,msgRef=null,listRef=null;
const cache=Object.create(null);
let myPhone="",newPhoto=null,lp="",sending=false,bootUid=null;
let chatOpenToken=0,listRenderToken=0;

function icons(){
 if(window.lucide?.createIcons)window.lucide.createIcons();
}
function toast(t){
 const e=$("toast");
 if(!e)return;
 e.textContent=String(t||"حدث خطأ");
 e.setAttribute("role","status");
 e.setAttribute("aria-live","polite");
 e.classList.add("show");
 clearTimeout(toast.t);
 toast.t=setTimeout(()=>e.classList.remove("show"),3500);
}
function show(id){
 ["login","plink","setup","app"].forEach(s=>{
  const e=$(s);
  if(e)e.hidden=s!==id;
 });
}
async function api(path,body){
 const r=await fetch(WORKER+path,{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify(body)
 });
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d.error||d.message||`خطأ اتصال (${r.status})`);
 return d;
}
function shrink(file,max,q){
 return new Promise((res,rej)=>{
  if(!file||!file.type?.startsWith("image/"))
   return rej(new Error("اختر صورة صالحة"));
  const url=URL.createObjectURL(file),img=new Image();
  img.onerror=()=>{
   URL.revokeObjectURL(url);
   rej(new Error("صورة غير مدعومة"));
  };
  img.onload=()=>{
   try{
    const s=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement("canvas");
    c.width=Math.max(1,Math.round(img.width*s));
    c.height=Math.max(1,Math.round(img.height*s));
    const ctx=c.getContext("2d");
    if(!ctx)throw new Error("تعذر معالجة الصورة");
    ctx.drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);
    res(c.toDataURL("image/jpeg",q));
   }catch(e){
    URL.revokeObjectURL(url);
    rej(e);
   }
  };
  img.src=url;
 });
}
const cid=(a,b)=>[a,b].sort().join("_");

async function getUser(uid){
 if(!uid)throw new Error("معرف المستخدم غير صالح");
 if(!cache[uid]){
  const s=await db.ref("users/"+uid).once("value");
  const data=s.val()||{};
  cache[uid]={
   uid,
   ...data,
   name:data.name||"حساب محذوف",
   photo:data.photo||"",
   username:data.username||""
  };
 }
 return cache[uid];
}
const fmt=t=>t?new Date(t).toLocaleTimeString("ar-EG",{
 hour:"2-digit",
 minute:"2-digit"
}):"";

async function social(provider){
 try{
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  await auth.signInWithPopup(provider);
 }catch(e){
  if(e.code==="auth/account-exists-with-different-credential"){
   toast("هذا البريد مرتبط بطريقة دخول أخرى. ادخل بالطريقة الأصلية؛ لن ندمج الحسابات تلقائيًا.");
   return;
  }
  if(e.code==="auth/popup-blocked")toast("اسمح بالنوافذ المنبثقة لتسجيل الدخول");
  else if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/cancelled-popup-request")toast(e.message||"فشل تسجيل الدخول");
 }
}
$("googleBtn").onclick=()=>social(new firebase.auth.GoogleAuthProvider());
$("githubBtn").onclick=()=>social(new firebase.auth.GithubAuthProvider());

async function startTelegramLogin(){
 const b=$("telegramBtn");b.disabled=true;
 const tgWindow=window.open("about:blank","_blank");
 try{
  const d=await api("/otp/start",{});
  if(!d.link||!d.requestId)throw new Error("الخادم لم ينشئ طلب تسجيل الدخول");
  telegramRequestId=d.requestId;
  if(tgWindow)tgWindow.location=d.link;else toast("اسمح بفتح النوافذ المنبثقة لفتح Telegram");
  $("codeBox").hidden=false;
  toast("افتح بوت CloverChat في Telegram واضغط Start لاستلام الكود");
 }catch(e){if(tgWindow&&!tgWindow.closed)tgWindow.close();toast(e.message||"تعذر بدء تسجيل الدخول عبر Telegram");}
 finally{b.disabled=false;}
}
$("telegramBtn").onclick=startTelegramLogin;
$("codeBtn").onclick=async()=>{
 const b=$("codeBtn");b.disabled=true;
 try{
  const code=$("codeIn").value.trim();
  if(!telegramRequestId)throw new Error("ابدأ تسجيل الدخول عبر Telegram أولًا");
  if(!/^\d{6}$/.test(code))throw new Error("اكتب الكود المكوّن من 6 أرقام");
  const d=await api("/otp/verify",{requestId:telegramRequestId,code});
  if(!d.token)throw new Error("الخادم لم يرجع رمز تسجيل الدخول");
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  await auth.signInWithCustomToken(d.token);
  telegramRequestId="";
 }catch(e){toast(e.message||"فشل التحقق");}
 finally{b.disabled=false;}
};

$("suOut").onclick=$("pOut").onclick=()=>auth.signOut();
$("suBtn").onclick=async()=>{
 const u=$("suUser").value.trim().toLowerCase().replace(/^@/,"");
 if(!/^[a-z0-9_]{3,20}$/.test(u))return toast("اليوزر 3-20 حرف: إنجليزي وأرقام و _");
 const name=$("suName").value.trim()||me.displayName||u,b=$("suBtn");b.disabled=true;
 try{
  const r=await db.ref("usernames/"+u).transaction(v=>v===null?me.uid:undefined);
  if(!r.committed)return toast("اليوزر مستخدم، جرّب غيره");
  await db.ref("users/"+me.uid).set({name,username:u,photo:me.photoURL||"",bio:""});
  cache[me.uid]={uid:me.uid,name,username:u,photo:me.photoURL||"",bio:""};
  await boot();
 }catch(e){toast(e.message||"تعذر إنشاء الملف الشخصي");}
 finally{b.disabled=false;}
};
auth.onAuthStateChanged(user=>{
 me=user;bootUid=user?.uid||null;stopAll();
 if(!user){prof=null;myPhone="";show("login");return;}
 boot().catch(e=>{console.error(e);toast("تعذر تحميل الحساب. حاول تاني.");});
});
async function boot(){
 const uid=me?.uid;if(!uid)return;
 const s=await db.ref("users/"+uid).once("value");
 if(me?.uid!==uid)return;
 try{const p=await api("/phone/me",{idToken:await me.getIdToken()});myPhone=p.phone||"";}catch(e){myPhone="";console.warn("Phone lookup failed",e);}
 if(!s.exists()){
  prof=null;
  $("suName").value=me.displayName||"";
  return show("setup");
 }
 prof=s.val()||{};
 cache[uid]={uid,...prof};
 const avatar=$("meAv");if(avatar)avatar.src=prof.photo||NOAV;
 show("app");watchList();icons();
}
function stopAll(){
 chatOpenToken++;listRenderToken++;
 if(msgRef)msgRef.off();if(listRef)listRef.off();
 msgRef=listRef=null;cur=peer=null;
 const room=$("room"),empty=$("empty"),list=$("chatList");
 if(room)room.hidden=true;if(empty)empty.hidden=false;if(list)list.replaceChildren();
}
function watchList(){
 if(listRef)listRef.off();
 listRef=db.ref("userChats/"+me.uid);
 listRef.on("value",async s=>{
  const renderId=++listRenderToken;
  try{
   const items=[];s.forEach(c=>items.push({id:c.key,...(c.val()||{})}));
   items.sort((a,b)=>(b.time||0)-(a.time||0));
   const users=await Promise.all(items.map(i=>getUser(i.with)));
   if(renderId!==listRenderToken||!me||!$("chatList"))return;
   const box=$("chatList");box.replaceChildren();
   const g=document.createElement("div");g.className="row"+(cur==="__global"?" on":"");
   const ga=document.createElement("img");ga.className="av";ga.src=LOGO;ga.alt="";
   const gt=document.createElement("div");gt.className="t";
   const gn=document.createElement("b");gn.textContent="🌍 الشات العام";
   const gl=document.createElement("div");gl.className="l";gl.textContent="📌 مجموعة مثبتة للجميع";
   gt.append(gn,gl);g.append(ga,gt);g.onclick=()=>openChat("__global");box.append(g);
   items.forEach((i,n)=>{
    const u=users[n],row=document.createElement("div");row.className="row"+(i.id===cur?" on":"");
    const av=document.createElement("img");av.className="av";av.src=u.photo||NOAV;av.alt="";av.onerror=()=>av.src=NOAV;
    const t=document.createElement("div");t.className="t";
    const nm=document.createElement("b");nm.textContent=u.name||"مستخدم";
    const l=document.createElement("div");l.className="l";l.textContent=i.last||"";
    const tm=document.createElement("small");tm.className="muted";tm.textContent=fmt(i.time);
    t.append(nm,l);row.append(av,t,tm);row.onclick=()=>openChat(u.uid);box.append(row);
   });icons();
  }catch(e){console.error(e);toast("تعذر تحميل قائمة المحادثات");}
 });
}
$("findIn").addEventListener("keydown",async e=>{
 if(e.key!=="Enter")return;e.preventDefault();
 const q=e.target.value.trim().toLowerCase().replace(/^@/,"");if(!q)return;
 try{
  let uid;
  if(/^\+?\d[\d\s()-]{6,18}$/.test(q)){
   const phone=q.replace(/[\s()-]/g,"");
   const d=await api("/phone/find",{idToken:await me.getIdToken(),phone});uid=d.uid;
  }else{
   const s=await db.ref("usernames/"+q).once("value");
   if(!s.exists())return toast("مفيش مستخدم بالاسم ده");uid=s.val();
  }
  if(!uid)return toast("مفيش مستخدم بالبيانات دي");
  if(uid===me.uid)return toast("ده حسابك 😄");
  e.target.value="";openChat(uid);
 }catch(err){toast(err.message||"تعذر البحث عن المستخدم");}
});
async function openChat(uid){
 const openId=++chatOpenToken;
 try{
  const G=uid==="__global";
  const nextPeer=G?{uid:"__global",name:"🌍 الشات العام",photo:LOGO,global:true}:await getUser(uid);
  if(openId!==chatOpenToken||!me)return;
  peer=nextPeer;
  cur=G?"__global":cid(me.uid,uid);
  $("empty").hidden=true;$("room").hidden=false;$("app").classList.add("open");
  $("peerName").textContent=peer.name||"مستخدم";
  $("peerUser").textContent=G?"مجموعة عامة":(peer.username?"@"+peer.username:"");
  $("peerAv").src=peer.photo||NOAV;$("peerAv").onerror=()=>$("peerAv").src=NOAV;
  if(msgRef)msgRef.off();
  const box=$("msgs");box.replaceChildren();
  msgRef=(G?db.ref("chat"):db.ref("chats/"+cur+"/messages")).limitToLast(100);
  msgRef.on("child_added",s=>{
   if(openId!==chatOpenToken)return;
   const m=s.val();if(!m||!m.uid)return;
   const d=document.createElement("div");d.className="m "+(m.uid===me.uid?"me":"");
   if(G&&m.uid!==me.uid){const n=document.createElement("b");n.textContent=m.name||"بدون اسم";n.style.cssText="display:block;color:var(--green-light);font-size:.8rem";d.append(n);}
   if(typeof m.image==="string"&&m.image.startsWith("data:image/")){
    const im=document.createElement("img");im.src=m.image;im.loading="lazy";im.alt="صورة مرسلة";
    im.onerror=()=>im.remove();im.onload=()=>{if(openId===chatOpenToken)box.scrollTop=box.scrollHeight;};d.append(im);
   }
   if(m.text)d.append(document.createTextNode(String(m.text).slice(0,500)));
   const tm=document.createElement("i");tm.textContent=fmt(m.time);d.append(tm);box.append(d);box.scrollTop=box.scrollHeight;
  },e=>{if(openId!==chatOpenToken)return;console.error(e);toast("تعذر تحميل الرسائل");});
 }catch(e){if(openId===chatOpenToken){console.error(e);toast("تعذر فتح المحادثة");}}
}
$("backBtn").onclick=()=>$("app").classList.remove("open");
async function push(m){
 if(!cur||!peer||!me||!prof)throw new Error("افتح محادثة صالحة أولًا");
 const targetPeer=peer,targetChat=cur,sender=me,senderProfile=prof;
 if(targetPeer.global)return db.ref("chat").push({uid:sender.uid,name:senderProfile.name||"مستخدم",photo:senderProfile.photo||"",...m,time:TS});
 const up={},last=m.text||"📷 صورة",id=db.ref().push().key;
 up["chats/"+targetChat+"/messages/"+id]={uid:sender.uid,...m,time:TS};
 up["userChats/"+sender.uid+"/"+targetChat]={with:targetPeer.uid,last,time:TS};
 up["userChats/"+targetPeer.uid+"/"+targetChat]={with:sender.uid,last,time:TS};
 await db.ref().update(up);
}
$("form").onsubmit=async e=>{
 e.preventDefault();
 if(sending)return;
 const input=$("msgIn"),text=input.value.trim();
 if(!text)return;
 sending=true;
 const b=$("form").querySelector('[type="submit"]');
 if(b)b.disabled=true;
 input.value="";
 try{
  await push({text:text.slice(0,500)});
 }catch(er){
  toast("تعذر الإرسال");
  if(!input.value)input.value=text;
  else input.value=text+"\n"+input.value;
 }finally{
  sending=false;
  if(b)b.disabled=false;
 }
};
$("imgBtn").onclick=()=>$("imgIn").click();
$("imgIn").onchange=async e=>{
 const f=e.target.files[0];e.target.value="";if(!f)return;
 if(!f.type?.startsWith("image/"))return toast("الملف المختار ليس صورة");
 if(f.size>10*1024*1024)return toast("حجم الصورة كبير، اختر صورة أقل من 10MB");
 const b=$("imgBtn");b.disabled=true;
 try{await push({image:await shrink(f,1000,.7)});}
 catch(er){toast(er.message||"تعذر إرسال الصورة");}
 finally{b.disabled=false;}
};
async function renderLinked(){
 const box=$("linked"),current=auth.currentUser;
 if(!box||!current)return;
 box.replaceChildren();
 try{await current.reload();}catch(e){console.warn("تعذر تحديث بيانات الحسابات المرتبطة",e);}
 const fresh=auth.currentUser||current;
 const addButton=(parent,label,action)=>{
  const b=document.createElement("button");b.type="button";b.className="btn ghost";b.textContent=label;b.onclick=action;parent.append(b);return b;
 };
 const addTitle=label=>{const h=document.createElement("div");h.className="linked-title";h.textContent=label;box.append(h);};
 const providers=[
  {id:"google.com",name:"Google",make:()=>new firebase.auth.GoogleAuthProvider()},
  {id:"github.com",name:"GitHub",make:()=>new firebase.auth.GithubAuthProvider()}
 ];
 addTitle("حسابات تسجيل الدخول");
 for(const item of providers){
  const linked=(fresh.providerData||[]).some(p=>p.providerId===item.id);
  addButton(box,linked?"✅ "+item.name+" — مرتبط":"ربط "+item.name,async e=>{
   const button=e.currentTarget;button.disabled=true;
   try{
    if(linked){
     const fresh=auth.currentUser;
     const count=(fresh.providerData||[]).length;
     if(count<=1)throw new Error("لا يمكن فصل آخر وسيلة دخول لحسابك. اربط وسيلة أخرى أولًا.");
     if(!confirm("هل تريد إلغاء ربط حساب "+item.name+"؟"))return;
     await fresh.unlink(item.id);
     await fresh.reload();
     toast("تم إلغاء ربط "+item.name);
    }else{
     const result=await auth.currentUser.linkWithPopup(item.make());
     me=result.user;
     await me.reload();
     toast("تم ربط "+item.name+" بحسابك الحالي");
    }
    await renderLinked();
   }catch(err){
    if(err.code==="auth/credential-already-in-use"||err.code==="auth/email-already-in-use")toast("هذا الحساب مرتبط بحساب CloverChat آخر. لن ندمج الحسابات تلقائيًا.");
    else if(err.code==="auth/provider-already-linked")toast("هذا الحساب مرتبط بالفعل");
    else if(err.code==="auth/popup-blocked")toast("اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى");
    else if(err.code==="auth/requires-recent-login")toast("سجّل الخروج ثم ادخل مجددًا، وبعدها أعد المحاولة");
    else if(err.code!=="auth/popup-closed-by-user"&&err.code!=="auth/cancelled-popup-request")toast(err.message||"تعذر تحديث الحساب المرتبط");
   }finally{button.disabled=false;}
  });
 }
 addTitle("رقم الهاتف");
 addButton(box,myPhone?"✅ الهاتف المرتبط: "+myPhone:"ربط رقم هاتف عبر Telegram",async()=>{
  if(myPhone){
   if(!confirm("هل تريد إلغاء ربط رقم الهاتف؟"))return;
   try{await api("/phone/unlink",{idToken:await current.getIdToken()});myPhone="";toast("تم إلغاء ربط رقم الهاتف");await renderLinked();}
   catch(e){toast(e.message||"تعذر إلغاء ربط الرقم");}
   return;
  }
  $("modal").hidden=true;show("plink");
 });
 icons();
}
$("profBtn").onclick=()=>{
 newPhoto=null;$("pAv").src=prof.photo||NOAV;$("pName").value=prof.name||"";
 $("pBio").value=prof.bio||"";$("pUserIn").value=prof.username||"";
 renderLinked();$("modal").hidden=false;
};
$("pClose").onclick=()=>$("modal").hidden=true;
$("pPhoto").onclick=()=>$("pPhotoIn").click();
$("pPhotoIn").onchange=async e=>{
 try{newPhoto=await shrink(e.target.files[0],192,.8);$("pAv").src=newPhoto;}
 catch(er){toast(er.message);}
};
$("pSave").onclick=async()=>{
 const b=$("pSave");b.disabled=true;
 const up={name:$("pName").value.trim()||prof.name,bio:$("pBio").value.trim()};
 if(newPhoto)up.photo=newPhoto;
 const nu=$("pUserIn").value.trim().toLowerCase().replace(/^@/,""),old=prof.username;
 let claimedUsername=false;
 try{
  if(nu!==old){
   if(!/^[a-z0-9_]{3,20}$/.test(nu))throw new Error("اليوزر 3-20 حرف: إنجليزي وأرقام و _");
   const r=await db.ref("usernames/"+nu).transaction(v=>v===null?me.uid:undefined);
   if(!r.committed)throw new Error("اليوزر مستخدم، جرّب غيره");
   claimedUsername=true;
   up.username=nu;
  }
  await db.ref("users/"+me.uid).update(up);
  if(up.username&&old)await db.ref("usernames/"+old).remove();
  prof={...prof,...up};cache[me.uid]={uid:me.uid,...prof};
  const avatar=$("meAv");if(avatar)avatar.src=prof.photo||NOAV;
  $("modal").hidden=true;toast("تم الحفظ ✅");
 }catch(e){
  if(claimedUsername)await db.ref("usernames/"+nu).transaction(v=>v===me?.uid?null:v).catch(()=>{});
  toast(e.message||"تعذر الحفظ");
 }finally{b.disabled=false;}
};
$("plBtn").onclick=async()=>{
 const b=$("plBtn");b.disabled=true;
 const tgWindow=window.open("about:blank","_blank");
 try{
  const d=await api("/phone/link/start",{idToken:await auth.currentUser.getIdToken()});
  if(!d.link||!d.requestId)throw new Error("تعذر إنشاء طلب ربط الهاتف");
  phoneLinkRequestId=d.requestId;
  $("plBox").hidden=false;
  if(tgWindow)tgWindow.location=d.link;else toast("اسمح بفتح النوافذ المنبثقة لفتح Telegram");
  toast("افتح البوت واضغط Start ثم شارك رقم هاتفك من زر مشاركة جهة الاتصال");
  const started=Date.now();
  while(Date.now()-started<120000){
   await new Promise(r=>setTimeout(r,2500));
   const status=await api("/phone/link/status",{idToken:await auth.currentUser.getIdToken(),requestId:phoneLinkRequestId});
   if(status.status==="linked"){
    myPhone=status.phone||"";phoneLinkRequestId="";$("plBox").hidden=true;
    toast("تم التحقق من ملكية الرقم وربطه بحسابك بنجاح");show("app");renderLinked();$("modal").hidden=false;return;
   }
  }
  throw new Error("انتهت مهلة انتظار مشاركة جهة الاتصال. ابدأ المحاولة مرة أخرى.");
 }catch(e){if(tgWindow&&!tgWindow.closed)tgWindow.close();$("plBox").hidden=true;toast(e.message||"تعذر ربط الهاتف");}
 finally{b.disabled=false;}
};
$("plCodeBtn").onclick=()=>toast("شارك جهة الاتصال من داخل محادثة البوت في Telegram؛ لا يوجد كود SMS.");
$("plOut").onclick=()=>show("app");
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){
  if($("modal")&&!$("modal").hidden)$("modal").hidden=true;
  else if($("app"))$("app").classList.remove("open");
 }
});
document.addEventListener("DOMContentLoaded",icons);icons();

/* ── Quality-of-life safeguards ───────────────────────────────────── */
window.addEventListener("online",()=>toast("عاد الاتصال بالإنترنت"));
window.addEventListener("offline",()=>toast("الاتصال بالإنترنت منقطع — الرسائل لن تُرسل حاليًا"));
window.addEventListener("error",e=>{
 console.error("CloverChat runtime error:",e.error||e.message);
});
window.addEventListener("unhandledrejection",e=>{
 console.error("CloverChat async error:",e.reason);
});
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible"&&auth.currentUser&&me?.uid!==bootUid){
  bootUid=me.uid;
  boot().catch(e=>{console.error(e);toast("تعذر تحديث بيانات الحساب");});
 }
});
