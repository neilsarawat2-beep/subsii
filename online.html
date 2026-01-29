<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subsi ki Jang – Online Mode</title>

<!-- SHARED CSS (IMPORTANT) -->
<link rel="stylesheet" href="game-styles.css">

<style>
/* === ONLINE MODE OVERRIDES ONLY === */

#mode-selection,
#room-screen,
#selection-screen,
#battle-screen {
  position: absolute;
  inset: 0;
}

#selection-screen {
  display: none;
  flex-direction: column;
  align-items: center;
  background: radial-gradient(circle at center, rgba(0,243,255,.15), #000 70%);
  z-index: 50;
}

#selection-screen h1 {
  margin-top: 40px;
  letter-spacing: 6px;
}

#roster {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  max-width: 900px;
  width: 100%;
  padding: 20px;
}

.card {
  cursor: pointer;
  border: 2px solid var(--b-color);
  background: #000;
  padding: 12px;
  text-align: center;
  box-shadow: 0 0 15px var(--b-color);
  transition: 0.2s;
}
.card:hover {
  transform: scale(1.05);
}

.random-card {
  border-style: dashed;
}
</style>
</head>

<body>
<div id="crt-overlay"></div>
<div id="game-window">

<button id="back-btn" onclick="goBack()">← BACK</button>

<!-- ========== MODE SELECTION ========== -->
<div id="mode-selection">
  <h1>ONLINE MODE</h1>
  <button onclick="selectGameMode('1v1')">1v1 MODE</button>
  <button onclick="selectGameMode('1v2')">1v2 MODE</button>
  <button onclick="selectGameMode('2v2')">2v2 MODE</button>
</div>

<!-- ========== ROOM SCREEN ========== -->
<div id="room-screen" style="display:none;">
  <h1 id="room-title"></h1>

  <button onclick="hostRoom()">HOST ROOM</button><br><br>

  <input id="join-code-input" placeholder="ROOM CODE">
  <button onclick="joinRoom()">JOIN</button>

  <div id="room-code-display" style="display:none;">
    ROOM CODE: <span id="room-code"></span>
  </div>

  <div id="waiting-msg"></div>
</div>

<!-- ========== SELECTION SCREEN ========== -->
<div id="selection-screen">
  <h1>ONLINE BATTLE</h1>
  <div id="sel-hint">[ SELECT YOUR BEAST ]</div>
  <div id="roster"></div>
</div>

<!-- ========== BATTLE SCREEN ========== -->
<div id="battle-screen" style="display:none;">
  <div id="ticker"></div>
  <div id="battle-hud-container"></div>
  <div id="arena-flex"></div>

  <button id="exec-trigger" onclick="handleAction()">EXECUTE</button>

  <div id="control-panel">
    <button id="cat-att" onclick="showSub('ATTACK')">ATTACK</button>
    <button id="cat-itm" onclick="showSub('ITEMS')">ITEMS</button>
    <button id="b0"></button>
    <button id="b1"></button>
    <button id="b2"></button>
    <button id="b3"></button>
  </div>
</div>

</div>

<!-- FIREBASE -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

<!-- GAME DATA -->
<script src="game-data.js"></script>

<script>
/* ================= FIREBASE ================= */
firebase.initializeApp({
  apiKey: "AIzaSyDxaM9pJz-teyRlh3FGWBqrlmNBoHUI8PI",
  databaseURL: "https://onlinesubsi-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const dbRef = firebase.database();

/* ================= GLOBAL STATE ================= */
let gameMode, roomCode, isHost=false;
let playerRole, myTeam;
let roomRef, gameStateRef;
let players = {};
let turn, turnOrder=[], currentTurnIndex=0;
let mySelection={beast:null, trainer:null};
let selectionStarted=false;
let curM;

/* ================= NAV ================= */
function goBack(){
  if(roomRef) roomRef.remove();
  location.href="index.html";
}

/* ================= MODE ================= */
function selectGameMode(m){
  gameMode=m;
  document.getElementById('mode-selection').style.display='none';
  document.getElementById('room-screen').style.display='flex';
  document.getElementById('room-title').innerText=m.toUpperCase()+" MODE";
}

/* ================= ROOM ================= */
function hostRoom(){
  roomCode=Math.random().toString(36).substring(2,8).toUpperCase();
  isHost=true;
  playerRole="p1";
  myTeam="A";

  roomRef=dbRef.ref("rooms/"+roomCode);
  roomRef.set({
    mode:gameMode,
    players:{p1:{team:"A", ready:false}}
  });

  document.getElementById("room-code").innerText=roomCode;
  document.getElementById("room-code-display").style.display="block";
  listenPlayers();
}

function joinRoom(){
  roomCode=document.getElementById("join-code-input").value.toUpperCase();
  roomRef=dbRef.ref("rooms/"+roomCode);

  roomRef.once("value",snap=>{
    if(!snap.exists()) return alert("ROOM NOT FOUND");
    const count=Object.keys(snap.val().players||{}).length;
    playerRole="p"+(count+1);
    myTeam = (count%2===0)?"A":"B";
    roomRef.child("players/"+playerRole).set({team:myTeam, ready:false});
    listenPlayers();
  });
}

function listenPlayers(){
  roomRef.child("players").off();
  roomRef.child("players").on("value",snap=>{
    const p=snap.val();
    const need=gameMode==="1v1"?2:gameMode==="1v2"?3:4;
    if(Object.keys(p).length>=need) startSelection();
  });
}

/* ================= SELECTION ================= */
function startSelection(){
  if(selectionStarted) return;
  selectionStarted=true;

  document.getElementById("room-screen").style.display="none";
  const s=document.getElementById("selection-screen");
  s.style.display="flex";
  s.style.opacity="0";
  s.offsetHeight;
  s.style.transition="opacity .3s";
  s.style.opacity="1";

  setTimeout(loadBeasts,50);
}

function loadBeasts(){
  const r=document.getElementById("roster");
  r.innerHTML="";
  Object.keys(db).filter(n=>n!=="Vibhamon").forEach(n=>{
    r.innerHTML+=`
      <div class="card" style="--b-color:${db[n].color}"
        onclick="pickBeast('${n}')">
        <div>${n}</div>
      </div>`;
  });
}

function pickBeast(n){
  if(mySelection.beast) return;
  mySelection.beast=n;
  roomRef.child("players/"+playerRole+"/beast").set(n);
  document.getElementById("sel-hint").innerText="[ SELECT YOUR TRAINER ]";
  setTimeout(loadTrainers,100);
}

function loadTrainers(){
  const r=document.getElementById("roster");
  r.innerHTML="";
  Object.keys(trainers).filter(t=>t!=="Lord Keshav").forEach(n=>{
    r.innerHTML+=`
      <div class="card" style="--b-color:${trainers[n].c}"
        onclick="pickTrainer('${n}')">
        <div>${n}</div>
        <small>${trainers[n].name}</small>
      </div>`;
  });
}

function pickTrainer(n){
  if(mySelection.trainer) return;
  mySelection.trainer=n;
  roomRef.child("players/"+playerRole+"/trainer").set(n);
  roomRef.child("players/"+playerRole+"/ready").set(true);
  document.getElementById("sel-hint").innerText="[ WAITING FOR OTHERS ]";
}
</script>

</body>
</html>
