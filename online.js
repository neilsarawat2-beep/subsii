// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyDxaM9pJz-teyRlh3FGWBqrlmNBoHUI8PI",
  authDomain: "onlinesubsi.firebaseapp.com",
  databaseURL: "https://onlinesubsi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onlinesubsi",
  storageBucket: "onlinesubsi.firebasestorage.app",
  messagingSenderId: "449026938160",
  appId: "1:449026938160:web:7dc95b9a3c59e35deba4f5"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ================= GAME STATE =================
let gameMode, roomCode, roomRef, gameStateRef;
let playerRole, myTeam, isHost = false;
let players = {}, turn, turnOrder = [], currentTurnIndex = 0;
let mySelection = { beast:null, trainer:null };
let curM = null, gameStarted = false;
let potionBlock = {}, dmgReduction = {};

// ================= NAV =================
window.goBack = () => {
  if(roomRef) roomRef.remove();
  location.href = "index.html";
};

window.selectGameMode = mode => {
  gameMode = mode;
  modeView(false);
};

function modeView(show) {
  document.getElementById("mode-selection").style.display = show?"flex":"none";
  document.getElementById("room-screen").style.display = show?"none":"flex";
  document.getElementById("room-title").innerText = gameMode.toUpperCase()+" MODE";
}

// ================= ROOM =================
function genCode() {
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

window.hostRoom = () => {
  roomCode = genCode();
  isHost = true;
  playerRole = "p1";
  myTeam = "A";

  roomRef = database.ref("rooms/"+roomCode);
  roomRef.set({
    mode: gameMode,
    players: {
      p1:{connected:true,ready:false,beast:null,trainer:null,team:"A"}
    }
  });

  document.getElementById("room-code").innerText = roomCode;
  document.getElementById("room-code-display").style.display="block";
  waitPlayers();
};

window.joinRoom = () => {
  const code = document.getElementById("join-code-input").value.trim().toUpperCase();
  if(!code) return alert("ENTER CODE");

  roomCode = code;
  roomRef = database.ref("rooms/"+roomCode);

  roomRef.once("value", snap=>{
    if(!snap.exists()) return alert("ROOM NOT FOUND");
    const room = snap.val();
    const cnt = Object.keys(room.players).length;
    playerRole = "p"+(cnt+1);
    myTeam = cnt%2===0?"B":"A";
    gameMode = room.mode;

    roomRef.child("players/"+playerRole).set({
      connected:true,ready:false,beast:null,trainer:null,team:myTeam
    });
    waitPlayers();
  });
};

function waitPlayers() {
  document.getElementById("waiting-msg").style.display="block";
  roomRef.child("players").on("value", snap=>{
    const p = snap.val();
    const need = gameMode==="1v1"?2:gameMode==="1v2"?3:4;
    document.getElementById("waiting-msg").innerText =
      `WAITING (${Object.keys(p).length}/${need})`;
    if(Object.keys(p).length>=need) setTimeout(startSelection,300);
  });
}

// ================= SELECTION =================
function startSelection() {
  document.getElementById("room-screen").style.display="none";
  document.getElementById("selection-screen").style.display="flex";
  loadBeasts();
  roomRef.child("players").on("value", snap=>checkReady(snap.val()));
}

function loadBeasts() {
  if(!window.db) return;
  const r=document.getElementById("roster");
  r.innerHTML="";
  Object.keys(db).filter(b=>b!=="Vibhamon").forEach(b=>{
    r.innerHTML+=`
      <div class="card" onclick="pickBeast('${b}')"
      style="--b-color:${db[b].color}">
      <div class="beast-name">${b}</div>
      <div class="beast-type">${db[b].type}</div>
      </div>`;
  });
}

window.pickBeast = b => {
  mySelection.beast=b;
  roomRef.child(`players/${playerRole}/beast`).set(b);
  loadTrainers();
};

function loadTrainers() {
  const r=document.getElementById("roster");
  r.innerHTML="";
  Object.keys(trainers).filter(t=>t!=="Lord Keshav").forEach(t=>{
    r.innerHTML+=`
      <div class="card" onclick="pickTrainer('${t}')"
      style="--b-color:${trainers[t].c}">
      <div class="beast-name">${t}</div>
      <div class="beast-type">${trainers[t].name}</div>
      </div>`;
  });
}

window.pickTrainer = t => {
  mySelection.trainer=t;
  roomRef.child(`players/${playerRole}`).update({
    trainer:t,ready:true
  });
};

function checkReady(p) {
  if(!p || gameStarted) return;
  if(Object.values(p).every(x=>x.ready)) {
    gameStarted=true;
    initBattle(p);
  }
}

// ================= BATTLE =================
function initBattle(pdata) {
  document.getElementById("selection-screen").style.display="none";
  document.getElementById("battle-screen").style.display="flex";

  players={};
  Object.keys(pdata).forEach(k=>{
    const d=pdata[k];
    const base=db[d.beast];
    players[k]={
      ...base,n:d.beast,cur:base.hp,
      role:k,team:d.team,trainer:d.trainer,
      trId:trainers[d.trainer].id,
      trColor:trainers[d.trainer].c,
      stun:0,bleed:0,weak:0,shield:0,
      buff:0,accMod:0,evasion:0,
      used:[],items:{HP:1,ANTI:1,BUFF:1,BKUP:1},
      hasDealtDmg:false
    };
    potionBlock[k]=0; dmgReduction[k]=0;
  });

  turnOrder=Object.keys(players);
  turn=turnOrder[0];

  if(isHost) {
    gameStateRef=roomRef.child("gameState");
    const s={turn,potionBlock,dmgReduction};
    turnOrder.forEach(k=>s[k]=players[k]);
    gameStateRef.set(s);
  } else gameStateRef=roomRef.child("gameState");

  gameStateRef.on("value",snap=>{
    if(!snap.exists()) return;
    const s=snap.val();
    turn=s.turn;
    potionBlock=s.potionBlock||{};
    dmgReduction=s.dmgReduction||{};
    Object.keys(players).forEach(k=>players[k]={...players[k],...s[k]});
    updateUI();
    showMain();
  });
}

// ================= UI =================
function updateUI() {
  Object.values(players).forEach(p=>{
    document.getElementById(`bar-${p.role}`).style.width =
      (p.cur/p.hp*100)+"%";
    document.getElementById(`hp-${p.role}`).innerText =
      `CORE: ${Math.max(0,p.cur)}/${p.hp}`;
  });
}

function showMain() {
  const myTurn = turn===playerRole;
  document.getElementById("cat-att").style.display=myTurn?"block":"none";
  document.getElementById("cat-itm").style.display=myTurn?"block":"none";
}

// ================= CLEANUP =================
window.addEventListener("beforeunload",()=>{
  if(roomRef) roomRef.child(`players/${playerRole}/connected`).set(false);
});
