"use strict";
/* CloverChat — Firebase Compat 8.10.1 */
firebase.initializeApp({
  apiKey:"AIzaSyCMkymWe_AEfY9X09UC-jnCN85zfCLU2h0",
  authDomain:"alamchat1.firebaseapp.com",
  databaseURL:"https://alamchat1-default-rtdb.firebaseio.com"
});
let phone="",phoneConfirmation=null,linkPhoneVerificationId=null,phoneRecaptcha=null,linkPhoneRecaptcha=null;
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
   toast("البريد مرتبط بطريقة دخول أخرى. سجّل بالطريقة الأصلية أولًا، ثم اربط الطريقة الجديدة من إعدادات الحساب. لم يتم دمج أي حساب تلقائيًا.");
   return;
  }
  if(!/popup-closed|cancelled/.test(e.code||""))
   toast(e.message||"فشل الدخول");
 }
}
$("googleBtn").onclick=()=>social(new firebase.auth.GoogleAuthProvider());
$("githubBtn").onclick=()=>social(new firebase.auth.GithubAuthProvider());

function normalizePhone(value){
 const p=String(value||"").replace(/[\s()-]/g,"");
 if(!/^\+[1-9]\d{7,14}$/.test(p))throw new Error("اكتب الرقم بالصيغة الدولية، مثال: +201xxxxxxxxx");
 return p;
}
function getRecaptcha(container,kind){
 const key=kind==="link"?"linkPhoneRecaptcha":"phoneRecaptcha";
 if(!window[key]){
  window[key]=new firebase.auth.RecaptchaVerifier(container,{
   size:"invisible",
   callback:()=>{},
   "expired-callback":()=>{
    window[key]=null;
   }
  },firebase.app());
 }
 return window[key];
}
$("phoneBtn").onclick=async()=>{
 const b=$("phoneBtn");b.disabled=true;
 try{
  phone=normalizePhone($("phoneIn").value);
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  phoneConfirmation=await auth.signInWithPhoneNumber(phone,getRecaptcha("recaptcha-container","login"));
  $("codeBox").hidden=false;
  toast("تم إرسال كود SMS إلى هاتفك");
 }catch(e){
  toast(e.message||"تعذر إرسال كود SMS");
 }finally{b.disabled=false;}
};
$("codeBtn").onclick=async()=>{
 const b=$("codeBtn");b.disabled=true;
 try{
  const code=$("codeIn").value.trim();
  if(!/^\d{6}$/.test(code))throw new Error("اكتب كود التحقق المكون من 6 أرقام");
  if(!phoneConfirmation)throw new Error("اطلب كود تحقق جديد أولًا");
  await phoneConfirmation.confirm(code);
  phoneConfirmation=null;
  toast("تم تسجيل الدخول بنجاح");
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
 const [phoneSnap,s]=await Promise.all([
  db.ref("userPhone/"+uid).once("value"),
  db.ref("users/"+uid).once("value")
 ]);
 if(me?.uid!==uid)return;
 myPhone=phoneSnap.val()||"";
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
  const isP=/^\+?\d{8,15}$/.test(q),key=isP?q.replace(/\D/g,""):q;
  const s=await db.ref(isP?"phones/"+key:"usernames/"+key).once("value");
  if(!s.exists())return toast("مفيش مستخدم بالاسم ده");
  if(s.val()===me.uid)return toast("ده حسابك 😄");
  e.target.value="";openChat(s.val());
 }catch(err){toast("تعذر البحث عن المستخدم");}
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
function getLoginMethods(user){
 const ids=new Set((user.providerData||[]).map(p=>p.providerId).filter(Boolean));
 if(user.phoneNumber)ids.add("phone");
 if(/^tg\d+$/.test(String(user.uid||"")))ids.add("telegram");
 return ids;
}
async function renderLinked(){
 const box=$("linked"),current=auth.currentUser;
 if(!box||!current)return;
 box.replaceChildren();
 await current.reload();
 const ids=(current.providerData||[]).map(x=>x.providerId);
 const methods=[["google.com","Google",()=>new firebase.auth.GoogleAuthProvider()],["github.com","GitHub",()=>new firebase.auth.GithubAuthProvider()]];
 const phoneLinked=!!current.phoneNumber;
 function addButton(label,action,disabled=false){
  const b=document.createElement("button");
  b.type="button";
  b.className="btn ghost";
  b.textContent=label;
  b.disabled=disabled;
  b.onclick=action;
  box.append(b);
 }
 for(const [id,name,makeProvider] of methods){
  const linked=ids.includes(id);
  addButton(linked?"✅ "+name+" مربوط — إلغاء الربط":"ربط حساب "+name,async()=>{
   const b=[...box.querySelectorAll("button")].find(x=>x.textContent.includes(name));
   if(b)b.disabled=true;
   try{
    const user=auth.currentUser;
    if(linked){
     await user.reload();
     if(getLoginMethods(user).size<=1)throw new Error("لا يمكن إلغاء آخر وسيلة دخول لحسابك");
     await user.unlink(id);
     toast("تم إلغاء ربط "+name);
    }else{
     await user.linkWithPopup(makeProvider());
     toast("تم ربط "+name+" بالحساب الحالي");
    }
    await auth.currentUser.reload();
    renderLinked();
   }catch(e){
    const messages={
     "auth/credential-already-in-use":"وسيلة الدخول دي مرتبطة بحساب آخر",
     "auth/provider-already-linked":"وسيلة الدخول مرتبطة بالفعل",
     "auth/requires-recent-login":"سجّل الدخول مرة أخرى ثم حاول إلغاء الربط",
     "auth/popup-closed-by-user":"تم إغلاق نافذة تسجيل الدخول"
    };
    toast(messages[e.code]||e.message||"تعذر تنفيذ العملية");
    if(b)b.disabled=false;
   }
  });
 }
 addButton(phoneLinked?"✅ الهاتف "+current.phoneNumber+" — إلغاء الربط":"ربط رقم هاتف",async()=>{
  if(phoneLinked){
   try{
    await current.reload();
    if(getLoginMethods(current).size<=1)throw new Error("لا يمكن إلغاء آخر وسيلة دخول لحسابك");
    await current.unlink("phone");
    myPhone="";
    toast("تم إلغاء ربط الهاتف");
    renderLinked();
   }catch(e){toast(e.message||"تعذر إلغاء ربط الهاتف");}
  }else{
   $("modal").hidden=true;
   show("plink");
  }
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
 try{
  lp=normalizePhone($("plPhone").value);
  const verifier=getRecaptcha("link-recaptcha-container","link");
  linkPhoneVerificationId=await new firebase.auth.PhoneAuthProvider(auth).verifyPhoneNumber(lp,verifier);
  $("plBox").hidden=false;
  toast("تم إرسال كود SMS إلى الرقم الجديد");
 }catch(e){toast(e.message||"تعذر إرسال كود SMS");}
 finally{b.disabled=false;}
};
$("plCodeBtn").onclick=async()=>{
 const b=$("plCodeBtn");b.disabled=true;
 try{
  const code=$("plCode").value.trim();
  if(!/^\d{6}$/.test(code))throw new Error("اكتب كود التحقق المكون من 6 أرقام");
  if(!linkPhoneVerificationId)throw new Error("اطلب كود تحقق جديد أولًا");
  const credential=firebase.auth.PhoneAuthProvider.credential(linkPhoneVerificationId,code);
  const current=auth.currentUser;
  if(!current)throw new Error("سجّل الدخول أولًا");
  if(current.phoneNumber){
   await current.updatePhoneNumber(credential);
  }else{
   await current.linkWithCredential(credential);
  }
  await current.reload();
  myPhone=current.phoneNumber||lp;
  linkPhoneVerificationId=null;
  $("plBox").hidden=true;
  $("plCode").value="";
  toast("تم ربط الهاتف بالحساب الحالي بنجاح");
  show("app");renderLinked();$("modal").hidden=false;
 }catch(e){
  toast(e.code==="auth/credential-already-in-use"||e.code==="auth/phone-number-already-exists"?"الرقم مرتبط بحساب آخر بالفعل":e.message||"فشل ربط الرقم");
 }finally{b.disabled=false;}
};
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
