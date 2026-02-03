// Firebase Config
const firebaseConfig={apiKey:"AIzaSyDxaM9pJz-teyRlh3FGWBqrlmNBoHUI8PI",authDomain:"onlinesubsi.firebaseapp.com",databaseURL:"https://onlinesubsi-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"onlinesubsi",storageBucket:"onlinesubsi.firebasestorage.app",messagingSenderId:"449026938160",appId:"1:449026938160:web:7dc95b9a3c59e35deba4f5"};
firebase.initializeApp(firebaseConfig);
const dbRef=firebase.database();

// Variables
let mode,code,isHost=false,myRole,myTeam,roomRef,stateRef;
let players={},turn,turnIdx=0,turnOrder=[],curM;
let picked={beast:null,trainer:null},started=false;

// Navigation
function goBack(){if(roomRef)roomRef.remove();location.href='index.html';}

function selectMode(m){
  mode=m;
  document.getElementById('mode-selection').style.display='none';
  document.getElementById('room-selection').style.display='flex';
  document.getElementById('room-title').innerText=m.toUpperCase()+' MODE';
}

function cancelRoom(){
  if(roomRef)roomRef.remove();
  document.getElementById('mode-selection').style.display='flex';
  document.getElementById('room-selection').style.display='none';
  document.getElementById('code-display').style.display='none';
  document.getElementById('waiting').style.display='none';
}

// Room
function hostRoom(){
  code=Math.random().toString(36).substring(2,8).toUpperCase();
  isHost=true;myRole='p1';myTeam='A';
  roomRef=dbRef.ref('rooms/'+code);
  roomRef.set({mode:mode,host:'p1',players:{p1:{connected:true,beast:null,trainer:null,ready:false,team:'A'}},state:null});
  document.getElementById('room-code').innerText=code;
  document.getElementById('code-display').style.display='block';
  document.getElementById('waiting').style.display='block';
  
  roomRef.child('players').on('value',(snap)=>{
    const ps=snap.val();
    const need=mode==='1v1'?2:4;
    if(ps&&Object.keys(ps).length>=need){document.getElementById('waiting').style.display='none';startSel();}
    else if(ps)document.getElementById('waiting').innerText=`WAITING... (${Object.keys(ps).length}/${need})`;
  });
}

function joinRoom(){
  const c=document.getElementById('join-input').value.toUpperCase().trim();
  if(!c){alert('ENTER CODE');return;}
  code=c;isHost=false;
  roomRef=dbRef.ref('rooms/'+code);
  
  roomRef.once('value',(snap)=>{
    if(!snap.exists()){alert('ROOM NOT FOUND');return;}
    const room=snap.val();
    const cnt=Object.keys(room.players||{}).length;
    const need=room.mode==='1v1'?2:4;
    if(cnt>=need){alert('ROOM FULL');return;}
    
    mode=room.mode;
    myRole='p'+(cnt+1);
    myTeam=mode==='1v1'?'B':(cnt===1?'B':(cnt===2?'A':'B'));
    
    roomRef.child('players/'+myRole).set({connected:true,beast:null,trainer:null,ready:false,team:myTeam});
    document.getElementById('waiting').innerText='JOINED: '+code;
    document.getElementById('waiting').style.display='block';
    
    roomRef.child('players').on('value',(snap)=>{
      const ps=snap.val();
      if(ps&&Object.keys(ps).length>=need)startSel();
      else if(ps)document.getElementById('waiting').innerText=`WAITING... (${Object.keys(ps).length}/${need})`;
    });
  });
}

// Selection
function startSel(){
  document.getElementById('room-selection').style.display='none';
  document.getElementById('selection-screen').style.display='flex';
  loadBeasts();
  roomRef.child('players').on('value',(snap)=>checkReady(snap.val()));
}

function loadBeasts(){
  const r=document.getElementById('roster');r.innerHTML="";
  Object.keys(db).filter(n=>n!=="Vibhamon").forEach(n=>{
    r.innerHTML+=`<div class="card" onclick="pickBeast('${n}')" style="--b-color:${db[n].color}"><div class="beast-name">${n}</div><div class="beast-type">${db[n].type}</div></div>`;
  });
  r.innerHTML+=`<div class="card random-card" onclick="pickRandom()" style="--b-color:var(--cyber-blue)"><div class="beast-name">? ? ?</div><div class="beast-type">RANDOM</div></div>`;
}

function loadTrainers(){
  const r=document.getElementById('roster');r.innerHTML="";
  Object.keys(trainers).filter(n=>n!=="Lord Keshav").forEach(n=>{
    r.innerHTML+=`<div class="card" onclick="pickTrainer('${n}')" style="--b-color:${trainers[n].c}"><div class="beast-name">${n}</div><div class="beast-type" style="color:#fff;">${trainers[n].name}</div><div style="font-size:0.5rem; color:#aaa;">${trainers[n].d}</div></div>`;
  });
  r.innerHTML+=`<div class="card random-card" onclick="pickRandomTrainer()" style="--b-color:var(--cyber-blue)"><div class="beast-name">? ? ?</div><div class="beast-type">RANDOM</div></div>`;
}

function pickRandom(){
  const k=Object.keys(db).filter(n=>n!=="Vibhamon");
  pickBeast(k[Math.floor(Math.random()*k.length)]);
}

function pickRandomTrainer(){
  const k=Object.keys(trainers).filter(n=>n!=="Lord Keshav");
  pickTrainer(k[Math.floor(Math.random()*k.length)]);
}

function pickBeast(n){
  picked.beast=n;
  roomRef.child('players/'+myRole+'/beast').set(n);
  document.getElementById('sel-hint').innerText="[ SELECT YOUR TRAINER ]";
  loadTrainers();
}

function pickTrainer(n){
  picked.trainer=n;
  roomRef.child('players/'+myRole+'/trainer').set(n);
  roomRef.child('players/'+myRole+'/ready').set(true);
  document.getElementById('sel-hint').innerText="[ WAITING... ]";
}

function checkReady(ps){
  if(!ps)return;
  const list=Object.values(ps);
  const need=mode==='1v1'?2:4;
  if(list.length<need)return;
  if(list.every(p=>p.ready)&&!started){started=true;initBattle(ps);}
}

// Battle Init
function initBattle(ps){
  document.getElementById('selection-screen').style.display='none';
  document.getElementById('battle-screen').style.display='flex';
  
  players={};
  Object.keys(ps).forEach(key=>{
    const pd=ps[key];
    players[key]={
      ...db[pd.beast],n:pd.beast,cur:db[pd.beast].hp,
      stun:0,bleed:0,weak:0,shield:0,shieldLock:false,buff:0,accMod:0,evasion:0,used:[],lastMoveName:null,revived:0,hasDealtDmg:false,
      items:{HP:1,ANTI:1,BUFF:1,BKUP:1},
      trainer:pd.trainer,trId:trainers[pd.trainer].id,trColor:trainers[pd.trainer].c,
      role:key,team:pd.team
    };
    if(players[key].trId==="SHUBHAN"||players[key].trId==="KESHAV")players[key].items.HP+=1;
    if(players[key].trId==="NEIL"||players[key].trId==="KESHAV")players[key].items.BKUP=2;
  });
  
  turnOrder=Object.keys(players).sort();
  turnIdx=0;turn=turnOrder[turnIdx];
  
  if(isHost){
    stateRef=roomRef.child('state');
    const init={turn,turnOrder,action:null};
    Object.keys(players).forEach(k=>init[k]=serialize(players[k]));
    stateRef.set(init);
  }else{
    stateRef=roomRef.child('state');
  }
  
  setupUI();
  stateRef.on('value',(snap)=>{if(snap.exists())sync(snap.val());});
  stealItems();
}

function setupUI(){
  const hud=document.getElementById('hud-container');
  const arena=document.getElementById('arena-sprites');
  hud.innerHTML='';arena.innerHTML='';
  
  const teamA=Object.values(players).filter(p=>p.team==='A');
  const teamB=Object.values(players).filter(p=>p.team==='B');
  
  [...teamA,...teamB].forEach(p=>{
    hud.innerHTML+=`
      <div style="flex:1; min-width:200px; padding:8px; border:1px solid #333; background:#0a0a0a; margin:5px; border-left:3px solid ${p.team==='A'?'#0f0':'#f00'};" id="hud-${p.role}">
        <div style="display:flex; justify-content:space-between;">
          <span style="font-weight:900; color:${p.color}; font-size:0.9rem;">${p.n}</span>
          <span style="color:var(--cyber-blue); font-size:0.7rem;" id="sh-${p.role}"></span>
        </div>
        <div class="hp-rail"><div class="hp-bar" id="bar-${p.role}" style="--b-color:${p.color}"></div></div>
        <div class="hp-val-text" id="hp-${p.role}">CORE: ${p.cur}/${p.hp}</div>
        <div style="font-size:0.6rem; color:${p.trColor}; margin-top:2px;">TR: ${p.trainer}</div>
        <div style="font-size:0.55rem; color:#aaa; margin-top:3px;" id="st-${p.role}"></div>
        <div style="font-size:0.6rem; margin-top:5px;" id="itm-${p.role}">HP:${p.items.HP} ANTI:${p.items.ANTI} BUFF:${p.items.BUFF} BKUP:${p.items.BKUP}</div>
      </div>
    `;
    arena.innerHTML+=`<div class="sprite" id="sp-${p.role}" style="border-color:${p.team==='A'?'#0f0':'#f00'};">${p.n[0]}</div>`;
  });
  update();
}

function stealItems(){
  let msg="";
  Object.values(players).forEach(p=>{
    if(p.trId==="RISHIT"||p.trId==="KESHAV"){
      const opps=Object.values(players).filter(o=>o.team!==p.team);
      if(opps.length>0)msg+=steal(p,opps[Math.floor(Math.random()*opps.length)]);
    }
  });
  if(msg){
    document.getElementById('ticker').innerHTML=`<div class='crit-text' style='color:#ff6600;'>${msg}</div>`;
    setTimeout(()=>{document.getElementById('ticker').innerHTML="";showMain();},2500);
  }else showMain();
}

function steal(thief,victim){
  const avail=Object.keys(victim.items).filter(k=>victim.items[k]>0);
  if(avail.length>0){
    const s=avail[Math.floor(Math.random()*avail.length)];
    victim.items[s]--;thief.items[s]++;
    return `${thief.role.toUpperCase()} STOLE ${s}! `;
  }return "";
}

function serialize(p){if(!p)return null;return{n:p.n,hp:p.hp,cur:p.cur,stun:p.stun,bleed:p.bleed,weak:p.weak,shield:p.shield,shieldLock:p.shieldLock,buff:p.buff,accMod:p.accMod,evasion:p.evasion,used:p.used,lastMoveName:p.lastMoveName,revived:p.revived,hasDealtDmg:p.hasDealtDmg,items:p.items,role:p.role,team:p.team};}

function deserialize(data,orig){if(!data||!orig)return orig;return{...orig,cur:data.cur,stun:data.stun,bleed:data.bleed,weak:data.weak,shield:data.shield,shieldLock:data.shieldLock,buff:data.buff,accMod:data.accMod,evasion:data.evasion,used:data.used,lastMoveName:data.lastMoveName,revived:data.revived,hasDealtDmg:data.hasDealtDmg,items:data.items};}

function sync(state){if(!state)return;Object.keys(players).forEach(k=>{if(state[k])players[k]=deserialize(state[k],players[k]);});turn=state.turn;turnOrder=state.turnOrder;update();}

// UI Update (EXACT from 2-player)
function update(){
  Object.values(players).forEach(p=>{
    const bar=document.getElementById(`bar-${p.role}`);
    if(bar){bar.style.width=(Math.max(0,p.cur)/p.hp*100)+"%";bar.style.setProperty('--b-color',p.color);}
    const hp=document.getElementById(`hp-${p.role}`);
    if(hp)hp.innerText=`CORE: ${Math.max(0,Math.floor(p.cur))}/${p.hp}`;
    const sh=document.getElementById(`sh-${p.role}`);
    if(sh)sh.innerText=p.shield>0?`SH:${p.shield}`:(p.shieldLock?"[LOCK]":"");
    const st=document.getElementById(`st-${p.role}`);
    if(st){let arr=[];if(p.bleed>0)arr.push(`BLEED(${p.bleed})`);if(p.weak>0)arr.push(`WEAK(${p.weak})`);if(p.buff>0)arr.push("BUFFED");if(p.evasion>0)arr.push("EVA");st.innerText=arr.join(" | ");}
    const itm=document.getElementById(`itm-${p.role}`);
    if(itm)itm.innerText=`HP:${p.items.HP} ANTI:${p.items.ANTI} BUFF:${p.items.BUFF} BKUP:${p.items.BKUP}`;
    const hud=document.getElementById(`hud-${p.role}`);
    if(hud)hud.style.border=p.role===turn?'2px solid var(--cyber-blue)':'1px solid #333';
    const sp=document.getElementById(`sp-${p.role}`);
    if(sp)sp.classList.toggle('active-sprite',p.role===turn);
  });
}

// Main UI (EXACT from 2-player)
function showMain(){
  document.getElementById('ticker').innerText="";
  document.getElementById('cat-att').style.display='block';
  document.getElementById('cat-itm').style.display='block';
  for(let i=0;i<4;i++){document.getElementById('b'+i).style.display='none';document.getElementById('b'+i).classList.remove('selected');}
  document.getElementById('exec-trigger').style.display='none';
  if(turn!==myRole&&players[turn])document.getElementById('ticker').innerText=`${players[turn].n.toUpperCase()}'S TURN...`;
}

// Show Sub (EXACT from 2-player)
function showSub(m){
  document.getElementById('cat-att').style.display='none';
  document.getElementById('cat-itm').style.display='none';
  const a=players[turn];const opps=Object.values(players).filter(p=>p.team!==a.team&&p.cur>0);const o=opps[0];
  if(m==='ATTACK'){
    a.moves.forEach((mv,i)=>{let b=document.getElementById('b'+i);b.style.display='block';b.innerText=mv.n;b.disabled=(a.used.includes(mv.n)||(mv.t==="SHIELD"&&a.shieldLock));b.onclick=()=>prep(mv,i,false);});
  }else{
    const itms=[{n:"Dudu",t:"HP",v:a.items.HP,d:"+7 HP"},{n:"ANTI",t:"ANTI",v:a.items.ANTI,d:"Clear status"},{n:"BUFF",t:"BUFF",v:a.items.BUFF,d:"+3 DMG"},{n:"BACKUP",t:"BKUP",v:a.items.BKUP,d:"Revive"}];
    itms.forEach((it,i)=>{let b=document.getElementById('b'+i);b.style.display='block';b.innerText=`${it.n}(${it.v})`;b.disabled=(it.v<=0||(o&&(o.trId==="NAYSHA"||o.trId==="KESHAV")&&(it.t==="HP"||it.t==="ANTI")));b.onclick=()=>prep(it,i,true);});
  }
}

function prep(m,i,isItm){
  const a=players[turn];const opps=Object.values(players).filter(p=>p.team!==a.team&&p.cur>0);const o=opps[0];curM={...m,isItem:isItm};
  for(let j=0;j<4;j++)document.getElementById('b'+j).classList.remove('selected');
  if(i!==-1)document.getElementById('b'+i).classList.add('selected');
  document.getElementById('c-title').innerText=m.n;
  let acc=m.p||100;let mods=a.accMod;const isSp=(m.t==="DMG"||m.t==="RAND_DMG"||m.t==="STUN"||m.t==="SILENCE"||m.t==="PERCENT"||m.t==="SPEECH_STUN");
  if(o&&!isItm&&(o.trId==="UDAY"||o.trId==="KESHAV")&&isSp&&m.t!=="WIS"&&m.t!=="SHIELD")mods-=15;
  if(!isItm&&(a.trId==="CHAHAK"||a.trId==="KESHAV")&&isSp)mods+=10;
  document.getElementById('c-acc').innerText=(isItm?100:Math.min(100,acc+mods))+"%";
  let d=m.val||"EFF";if(m.t==="RISK")d=10;if(m.t==="PERCENT")d="50% HP";if((a.trId==="CHAHAK"||a.trId==="KESHAV")&&isSp&&!isNaN(d))d=parseInt(d)+2;
  document.getElementById('c-dmg').innerText=d;
  document.getElementById('c-desc').innerText=`// ${m.d||"Active"}`;
  document.getElementById('exec-trigger').style.display='block';
}

// Action (EXACT from 2-player)
function handleAction(){
  if(turn!==myRole)return;
  const att=players[turn];const opps=Object.values(players).filter(p=>p.team!==att.team&&p.cur>0);const def=opps[Math.floor(Math.random()*opps.length)];const t=document.getElementById('ticker');const sDef=def?document.getElementById(`sp-${def.role}`):null;
  document.getElementById('exec-trigger').style.display='none';
  let msg="";
  if(curM.isItem){if(curM.t==='HP')att.cur=Math.min(att.hp,att.cur+7);if(curM.t==='ANTI'){att.stun=0;att.bleed=0;att.weak=0;}if(curM.t==='BUFF'){att.buff=3;att.accMod=10;}att.items[curM.t]--;t.innerHTML="<div class='crit-text' style='color:#0f0; border-color:#0f0'>[ FIXED ]</div>";}else{
    let hit=(curM.p||100)+att.accMod;const isSp=(curM.t==="DMG"||curM.t==="RAND_DMG"||curM.t==="STUN"||curM.t==="SILENCE"||curM.t==="PERCENT"||curM.t==="SPEECH_STUN");
    if(def.trId==="UDAY"&&isSp&&curM.t!=="WIS"&&curM.t!=="SHIELD")hit-=15;if(att.trId==="CHAHAK"&&isSp)hit+=10;if(def.trId==="KESHAV"&&isSp&&curM.t!=="WIS"&&curM.t!=="SHIELD")hit-=15;if(att.trId==="KESHAV"&&isSp)hit+=10;if(def.evasion>0){hit-=50;def.evasion=0;}
    let dodged=false;if((def.trId==="ADVIK"||def.trId==="KESHAV")&&(isSp||att.buff>0)){if(Math.random()<0.2)dodged=true;}
    if(Math.random()*100>hit||dodged){t.innerHTML=dodged?"<div class='crit-text' style='color:#ff4500;'>[ DODGED ]</div>":"<div class='crit-text' style='color:#888;'>[ MISSED ]</div>";att.accMod=0;}else{
      let d=(curM.val||0);if(curM.t==="RAND_DMG")d=Math.floor(Math.random()*(curM.max-curM.min+1))+curM.min;if(curM.t==="RISK"){att.cur=Math.max(1,att.cur-8);d=10;}if(curM.t==="WIS")d=(def.cur>att.cur)?Math.floor(def.cur/2):0;if(curM.t==="DS")d=(def.cur<(def.hp*0.3))?def.cur:2;if(curM.t==="PERCENT")d=Math.floor(att.cur*0.5);if(curM.t==="SPEECH_STUN"){def.stun=3;d=0;}if(curM.t==="HEAL"){att.cur=Math.min(att.hp,att.cur+3);d=0;msg="[ HEALED ]";}if(curM.t==="SWAP"){let tmp=att.cur;att.cur=def.cur;def.cur=tmp;d=0;msg="[ SWAPPED ]";}if(curM.t==="BLEED"||curM.t==="BLEED_RAND")def.bleed=3;if(curM.t==="WEAK")def.weak=3;if(curM.t==="STUN"||curM.t==="SILENCE")def.stun=(curM.n==="Bald Shine"||curM.n==="Pause"||curM.n==="Totalitarian"||curM.n==="Out Syllabus"||curM.n==="Go out")?2:1;if(curM.t==="EVA"){att.evasion=1;msg="[ EVASIVE ]";}
      if(att.weak>0&&d>0)d=Math.floor(d/2);if((att.trId==="CHAHAK"||att.trId==="KESHAV")&&isSp&&d>0)d+=2;
      if(def.shield>0&&(d>0||curM.t==="WRATH")){if(att.buff>0){def.shield=0;def.shieldLock=true;msg="<div class='crit-text' style='color:#ff00ea;'>[ BROKEN ]</div>";}else if(curM.t==="WRATH"||curM.t==="RISK"){def.shield=0;msg="<div class='crit-text' style='color:#ff00ea;'>[ PIERCED ]</div>";}else{d=0;def.shield--;msg="<div class='crit-text' style='color:#00f3ff;'>[ BLOCKED ]</div>";}}
      if(att.buff>0&&d>0){d+=3;if(!dodged)att.buff=0;}att.accMod=0;
      if(curM.t==="WRATH"){def.cur=1;d=0;msg="[ WRATH ]";}if(curM.t==="LEECH"){att.cur=Math.min(att.hp,att.cur+d);}if(curM.t==="SHIELD"&&!att.shieldLock){att.shield=3;msg="[ SHIELD UP ]";}
      def.cur=Math.max(0,def.cur-d);if(d>0&&sDef){sDef.classList.add('shake');att.hasDealtDmg=true;}
      if((def.trId==="ADYA"||def.trId==="KESHAV")&&d>0){att.cur=Math.max(0,att.cur-1);msg=msg?msg+" + [RECOIL]":"[ RECOIL ]";}
      t.innerHTML=msg||`<div class='crit-text'>-[ ${Math.floor(d)} ]</div>`;
    }
    if(curM.once)att.used.push(curM.n);att.lastMoveName=curM.n;
  }
  update();
  const upd={'action/processed':true};Object.keys(players).forEach(k=>upd[k]=serialize(players[k]));stateRef.update(upd);
  setTimeout(checkDeath,1000);
}

function checkDeath(){
  Object.values(players).forEach(p=>{if(p.cur<=0&&p.items.BKUP>0){p.revived++;p.cur=p.revived===1?5:3;p.items.BKUP--;p.bleed=0;p.stun=0;if(p.trId==="AAYANSH"||p.trId==="KESHAV"){p.buff=3;p.accMod=10;}document.getElementById('ticker').innerHTML=`<div class='crit-text' style='color:#0f0'>${p.revived===2?"STILL THERE":"REBOOTING"}</div>`;update();const upd={};Object.keys(players).forEach(k=>upd[k]=serialize(players[k]));stateRef.update(upd);setTimeout(()=>endTurn(),1200);return;}});
  const teamA=Object.values(players).filter(p=>p.team==='A'&&p.cur>0);const teamB=Object.values(players).filter(p=>p.team==='B'&&p.cur>0);
  if(teamA.length===0){alert("TEAM B WINS!");if(roomRef)roomRef.remove();location.href='index.html';return;}
  if(teamB.length===0){alert("TEAM A WINS!");if(roomRef)roomRef.remove();location.href='index.html';return;}
  setTimeout(()=>endTurn(),800);
}

function endTurn(){
  const c=players[turn];if(c.bleed>0&&c.cur>0){c.cur=Math.max(0,c.cur-1);c.bleed--;}if((c.trId==="NOEL"||c.trId==="KESHAV")&&c.hasDealtDmg){Object.values(players).filter(p=>p.team!==c.team).forEach(o=>o.cur=Math.max(0,o.cur-2));}
  update();
  const teamA=Object.values(players).filter(p=>p.team==='A'&&p.cur>0);const teamB=Object.values(players).filter(p=>p.team==='B'&&p.cur>0);
  if(teamA.length===0||teamB.length===0){checkDeath();return;}
  if(c.weak>0)c.weak--;c.hasDealtDmg=false;
  let nextIdx=(turnIdx+1)%turnOrder.length;let attempts=0;while(players[turnOrder[nextIdx]].cur<=0&&attempts<turnOrder.length){nextIdx=(nextIdx+1)%turnOrder.length;attempts++;}if(attempts>=turnOrder.length){checkDeath();return;}
  turnIdx=nextIdx;turn=turnOrder[turnIdx];const n=players[turn];
  document.querySelectorAll('.sprite').forEach(s=>s.classList.remove('shake'));
  if(n.stun>0){n.stun--;update();document.getElementById('ticker').innerHTML=`<div class='crit-text' style='color:#f00'>${n.n.toUpperCase()} [ STUNNED ]</div>`;const upd={turn,turnOrder};Object.keys(players).forEach(k=>upd[k]=serialize(players[k]));stateRef.update(upd);setTimeout(()=>endTurn(),1000);}else{const upd={turn,turnOrder};Object.keys(players).forEach(k=>upd[k]=serialize(players[k]));stateRef.update(upd);showMain();}
}

window.addEventListener('beforeunload',()=>{if(roomRef)roomRef.child('players/'+myRole+'/connected').set(false);});
