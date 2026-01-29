// ============ FIREBASE CONFIG ============
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

// ============ GAME VARIABLES ============
let gameMode, roomCode, isHost = false, playerRole, myTeam, roomRef, gameStateRef;
let players = {}, turn, currentTurnIndex = 0, turnOrder = [], curM;
let mySelection = { beast: null, trainer: null }, gameStarted = false;
let potionBlock = {}, dmgReduction = {};

// ============ NAVIGATION ============
function goBack() {
  if(roomRef) roomRef.remove();
  location.href = 'index.html';
}

function selectGameMode(mode) {
  gameMode = mode;
  document.getElementById('mode-selection').style.display = 'none';
  document.getElementById('room-screen').style.display = 'flex';
  document.getElementById('room-title').innerText = mode.toUpperCase() + ' MODE';
}

// ============ ROOM MANAGEMENT ============
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function hostRoom() {
  roomCode = generateRoomCode();
  isHost = true;
  playerRole = 'p1';
  myTeam = 'A';
  roomRef = database.ref('rooms/' + roomCode);
  roomRef.set({
    mode: gameMode,
    host: playerRole,
    players: { p1: { connected: true, beast: null, trainer: null, ready: false, team: 'A' }},
    gameState: null,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  });
  document.getElementById('room-code').innerText = roomCode;
  document.getElementById('room-code-display').style.display = 'block';
  document.getElementById('waiting-msg').style.display = 'block';
  roomRef.child('players').on('value', (snapshot) => {
    const players = snapshot.val();
    const requiredPlayers = gameMode === '1v1' ? 2 : gameMode === '1v2' ? 3 : 4;
    if(players && Object.keys(players).length >= requiredPlayers) {
      document.getElementById('waiting-msg').style.display = 'none';
      startSelection();
    } else if(players) {
      document.getElementById('waiting-msg').innerText = `WAITING... (${Object.keys(players).length}/${requiredPlayers})`;
    }
  });
}

function joinRoom() {
  const code = document.getElementById('join-code-input').value.toUpperCase().trim();
  if(!code) { alert('PLEASE ENTER A ROOM CODE'); return; }
  roomCode = code;
  isHost = false;
  roomRef = database.ref('rooms/' + roomCode);
  roomRef.once('value', (snapshot) => {
    if(!snapshot.exists()) { alert('ROOM NOT FOUND'); return; }
    const room = snapshot.val();
    const playerCount = Object.keys(room.players || {}).length;
    const requiredPlayers = room.mode === '1v1' ? 2 : room.mode === '1v2' ? 3 : 4;
    if(playerCount >= requiredPlayers) { alert('ROOM IS FULL'); return; }
    gameMode = room.mode;
    playerRole = 'p' + (playerCount + 1);
    myTeam = gameMode === '1v1' ? 'B' : gameMode === '1v2' ? 'B' : (playerCount === 1 ? 'B' : (playerCount === 2 ? 'A' : 'B'));
    roomRef.child('players/' + playerRole).set({connected: true, beast: null, trainer: null, ready: false, team: myTeam});
    document.getElementById('waiting-msg').innerText = 'JOINED ROOM: ' + roomCode;
    document.getElementById('waiting-msg').style.display = 'block';
    roomRef.child('players').on('value', (snapshot) => {
      const players = snapshot.val();
      if(players && Object.keys(players).length >= requiredPlayers) startSelection();
      else if(players) document.getElementById('waiting-msg').innerText = `WAITING... (${Object.keys(players).length}/${requiredPlayers})`;
    });
  });
}

function cancelRoom() {
  if(roomRef) roomRef.remove();
  document.getElementById('mode-selection').style.display = 'flex';
  document.getElementById('room-screen').style.display = 'none';
  document.getElementById('room-code-display').style.display = 'none';
  document.getElementById('waiting-msg').style.display = 'none';
}

// ============ SELECTION ============
function startSelection() {
  document.getElementById('room-screen').style.display = 'none';
  document.getElementById('selection-screen').style.display = 'flex';
  loadBeasts();
  roomRef.child('players').on('value', (snapshot) => checkIfAllReady(snapshot.val()));
}

function loadBeasts() {
  const r = document.getElementById('roster');
  r.innerHTML = "";
  Object.keys(db).filter(n => n !== "Vibhamon").forEach(n => {
    r.innerHTML += `<div class="card" onclick="pick('${n}')" style="--b-color:${db[n].color}"><div class="beast-name">${n}</div><div class="beast-type">${db[n].type}</div></div>`;
  });
  r.innerHTML += `<div class="card random-card" onclick="pickRandom()" style="--b-color:var(--cyber-blue)"><div class="beast-name">? ? ?</div><div class="beast-type">RANDOM</div></div>`;
}

function loadTrainers() {
  const r = document.getElementById('roster');
  r.innerHTML = "";
  Object.keys(trainers).filter(n => n !== "Lord Keshav").forEach(n => {
    r.innerHTML += `<div class="card" onclick="pickTrainer('${n}')" style="--b-color:${trainers[n].c}"><div class="beast-name">${n}</div><div class="beast-type" style="color:#fff; margin-bottom: 2px;">${trainers[n].name}</div><div style="font-size:0.5rem; color:#aaa; line-height:1;">${trainers[n].d}</div></div>`;
  });
  r.innerHTML += `<div class="card random-card" onclick="pickRandomTrainer()" style="--b-color:var(--cyber-blue)"><div class="beast-name">? ? ?</div><div class="beast-type">RANDOM</div></div>`;
}

function pickRandom() {
  const k = Object.keys(db).filter(n => n !== "Vibhamon");
  pick(k[Math.floor(Math.random()*k.length)]);
}

function pickRandomTrainer() {
  const k = Object.keys(trainers).filter(n => n !== "Lord Keshav");
  pickTrainer(k[Math.floor(Math.random()*k.length)]);
}

function pick(n) {
  mySelection.beast = n;
  roomRef.child('players/' + playerRole + '/beast').set(n);
  document.getElementById('sel-hint').innerText = "[ SELECT YOUR TRAINER ]";
  loadTrainers();
}

function pickTrainer(n) {
  mySelection.trainer = n;
  roomRef.child('players/' + playerRole + '/trainer').set(n);
  roomRef.child('players/' + playerRole + '/ready').set(true);
  document.getElementById('sel-hint').innerText = "[ WAITING FOR OPPONENTS... ]";
}

function checkIfAllReady(playersData) {
  if(!playersData) return;
  const playerList = Object.values(playersData);
  const requiredPlayers = gameMode === '1v1' ? 2 : gameMode === '1v2' ? 3 : 4;
  if(playerList.length < requiredPlayers) return;
  if(playerList.every(p => p.ready) && !gameStarted) {
    gameStarted = true;
    initializeBattle(playersData);
  }
}

// ============ BATTLE INIT ============
function initializeBattle(playersData) {
  document.getElementById('selection-screen').style.display = 'none';
  document.getElementById('battle-screen').style.display = 'flex';
  players = {};
  Object.keys(playersData).forEach(key => {
    const playerData = playersData[key];
    players[key] = {
      ...db[playerData.beast],
      n: playerData.beast,
      cur: db[playerData.beast].hp,
      stun: 0, bleed: 0, weak: 0, shield: 0, shieldLock: false,
      buff: 0, accMod: 0, evasion: 0, used: [], lastMoveName: null,
      revived: 0, hasDealtDmg: false,
      items: {HP:1, ANTI:1, BUFF:1, BKUP:1},
      trainer: playerData.trainer,
      trId: trainers[playerData.trainer].id,
      trColor: trainers[playerData.trainer].c,
      role: key,
      team: playerData.team
    };
    if(players[key].trId === "SHUBHAN" || players[key].trId === "KESHAV") players[key].items.HP += 1;
    if(players[key].trId === "NEIL" || players[key].trId === "KESHAV") players[key].items.BKUP = 2;
    potionBlock[key] = 0;
    dmgReduction[key] = 0;
  });
  turnOrder = Object.keys(players).sort();
  currentTurnIndex = 0;
  turn = turnOrder[currentTurnIndex];
  if(isHost) {
    gameStateRef = roomRef.child('gameState');
    const initialState = { turn, turnOrder, currentAction: null, potionBlock, dmgReduction };
    Object.keys(players).forEach(key => initialState[key] = serializePlayer(players[key]));
    gameStateRef.set(initialState);
  } else {
    gameStateRef = roomRef.child('gameState');
  }
  setupBattleUI();
  gameStateRef.on('value', (snapshot) => { if(snapshot.exists()) syncGameState(snapshot.val()); });
  handleItemStealing();
}

function setupBattleUI() {
  const hudContainer = document.getElementById('player-huds');
  const arenaContainer = document.getElementById('arena-sprites');
  hudContainer.innerHTML = '';
  arenaContainer.innerHTML = '';
  const teamA = Object.values(players).filter(p => p.team === 'A');
  const teamB = Object.values(players).filter(p => p.team === 'B');
  [...teamA, ...teamB].forEach(p => {
    hudContainer.innerHTML += `
      <div class="player-hud-online team-${p.team.toLowerCase()}" id="hud-${p.role}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
          <span style="font-weight:900; color:${p.color}; font-size:0.9rem;">${p.n}</span>
          <span style="color:var(--cyber-blue); font-size:0.7rem;" id="shield-${p.role}"></span>
        </div>
        <div class="hp-rail">
          <div class="hp-bar" id="bar-${p.role}" style="--b-color:${p.color}"></div>
        </div>
        <div class="hp-val-text" id="hp-${p.role}">CORE: ${p.cur}/${p.hp}</div>
        <div style="font-size:0.6rem; color:${p.trColor}; margin-top:2px;">TR: ${p.trainer}</div>
        <div style="font-size:0.55rem; color:#aaa; margin-top:3px; min-height:12px;" id="status-${p.role}"></div>
        <div style="font-size:0.55rem; color:#f00; margin-top:2px;" id="potion-block-${p.role}"></div>
        <div style="display:flex; gap:5px; margin-top:5px; font-size:0.6rem; flex-wrap:wrap;" id="items-${p.role}">
          <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">HP:${p.items.HP}</span>
          <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">ANTI:${p.items.ANTI}</span>
          <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">BUFF:${p.items.BUFF}</span>
          <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">BKUP:${p.items.BKUP}</span>
        </div>
      </div>
    `;
    arenaContainer.innerHTML += `<div class="online-sprite team-${p.team.toLowerCase()}" id="sprite-${p.role}" style="border-color:${p.color};">${p.n[0]}</div>`;
  });
  updateUI();
}

function handleItemStealing() {
  let thiefMsg = "";
  Object.values(players).forEach(p => {
    if(p.trId === "RISHIT" || p.trId === "KESHAV") {
      const opponents = Object.values(players).filter(opp => opp.team !== p.team);
      if(opponents.length > 0) thiefMsg += stealItem(p, opponents[Math.floor(Math.random() * opponents.length)]);
    }
  });
  if(thiefMsg) {
    const t = document.getElementById('ticker');
    t.innerHTML = `<div class='crit-text' style='color:#ff6600; font-size:1.2rem'>${thiefMsg}</div>`;
    setTimeout(() => { t.innerHTML = ""; showMain(); }, 2500);
  } else showMain();
}

function stealItem(thief, victim) {
  const avail = Object.keys(victim.items).filter(k => victim.items[k] > 0);
  if(avail.length > 0) {
    const s = avail[Math.floor(Math.random() * avail.length)];
    victim.items[s]--;
    thief.items[s]++;
    return `${thief.role.toUpperCase()} STOLE ${s} FROM ${victim.role.toUpperCase()}! `;
  }
  return "";
}

function serializePlayer(p) {
  if(!p) return null;
  return { n: p.n, hp: p.hp, cur: p.cur, stun: p.stun, bleed: p.bleed, weak: p.weak, shield: p.shield, shieldLock: p.shieldLock, buff: p.buff, accMod: p.accMod, evasion: p.evasion, used: p.used, lastMoveName: p.lastMoveName, revived: p.revived, hasDealtDmg: p.hasDealtDmg, items: p.items, role: p.role, team: p.team };
}

function deserializePlayer(data, original) {
  if(!data || !original) return original;
  return { ...original, cur: data.cur, stun: data.stun, bleed: data.bleed, weak: data.weak, shield: data.shield, shieldLock: data.shieldLock, buff: data.buff, accMod: data.accMod, evasion: data.evasion, used: data.used, lastMoveName: data.lastMoveName, revived: data.revived, hasDealtDmg: data.hasDealtDmg, items: data.items };
}

function syncGameState(state) {
  if(!state) return;
  Object.keys(players).forEach(key => { if(state[key]) players[key] = deserializePlayer(state[key], players[key]); });
  turn = state.turn;
  turnOrder = state.turnOrder;
  potionBlock = state.potionBlock || {};
  dmgReduction = state.dmgReduction || {};
  updateUI();
  
  // Check if there's a pending action from another player
  if(state.currentAction && state.currentAction.processed === false && state.currentAction.player !== playerRole) {
    // Mark as processed to prevent re-execution
    gameStateRef.child('currentAction/processed').set(true);
  }
}

// ============ UI UPDATE ============
function updateUI() {
  Object.values(players).forEach(p => {
    const bar = document.getElementById(`bar-${p.role}`);
    if(bar) bar.style.width = (Math.max(0, p.cur) / p.hp * 100) + "%";
    const hpText = document.getElementById(`hp-${p.role}`);
    if(hpText) hpText.innerText = `CORE: ${Math.max(0, Math.floor(p.cur))}/${p.hp}`;
    const shield = document.getElementById(`shield-${p.role}`);
    if(shield) shield.innerText = p.shield > 0 ? `SH:${p.shield}` : (p.shieldLock ? "[LOCK]" : "");
    const status = document.getElementById(`status-${p.role}`);
    if(status) {
      let st = [];
      if(p.bleed > 0) st.push(`BLEED(${p.bleed})`);
      if(p.weak > 0) st.push(`WEAK(${p.weak})`);
      if(p.buff > 0) st.push("BUFF");
      if(p.evasion > 0) st.push("EVA");
      status.innerText = st.join(" | ");
    }
    const potBlock = document.getElementById(`potion-block-${p.role}`);
    if(potBlock) potBlock.innerText = (potionBlock[p.role] || 0) > 0 ? `POT BLOCK(${potionBlock[p.role]})` : "";
    const items = document.getElementById(`items-${p.role}`);
    if(items) items.innerHTML = `
      <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">HP:${p.items.HP}</span>
      <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">ANTI:${p.items.ANTI}</span>
      <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">BUFF:${p.items.BUFF}</span>
      <span style="background:#000; border:1px solid var(--cyber-blue); padding:1px 4px; color:var(--cyber-blue);">BKUP:${p.items.BKUP}</span>
    `;
    const hud = document.getElementById(`hud-${p.role}`);
    if(hud) hud.classList.toggle('active-player', p.role === turn);
    const sprite = document.getElementById(`sprite-${p.role}`);
    if(sprite) sprite.classList.toggle('active-sprite', p.role === turn);
  });
}

function showMain() {
  document.getElementById('ticker').innerText = "";
  const isMyTurn = turn === playerRole;
  
  // Hide cat buttons first
  document.getElementById('cat-att').style.display = 'none';
  document.getElementById('cat-itm').style.display = 'none';
  
  // Hide all move buttons
  for(let i=0; i<4; i++) { 
    const btn = document.getElementById('b'+i);
    btn.style.display = 'none'; 
    btn.classList.remove('selected'); 
  }
  
  document.getElementById('exec-trigger').style.display = 'none';
  
  if(isMyTurn) {
    // Show category buttons for current player
    document.getElementById('cat-att').style.display = 'block';
    document.getElementById('cat-itm').style.display = 'block';
  } else {
    // Show opponent's turn message
    if(players[turn]) {
      document.getElementById('ticker').innerText = `${players[turn].n.toUpperCase()}'S TURN...`;
    }
  }
}

function showSub(m) {
  // Hide category buttons
  document.getElementById('cat-att').style.display = 'none';
  document.getElementById('cat-itm').style.display = 'none';
  
  const a = players[turn];
  const opponents = Object.values(players).filter(p => p.team !== a.team && p.cur > 0);
  
  if(m === 'ATTACK') {
    // Show all 4 move buttons
    a.moves.forEach((mv, i) => {
      const btn = document.getElementById('b' + i);
      btn.style.display = 'block';
      btn.innerText = mv.n;
      btn.disabled = (a.used.includes(mv.n) || (mv.t === "SHIELD" && a.shieldLock));
      btn.onclick = () => prep(mv, i, false);
    });
  } else {
    // Show all 4 item buttons
    const itms = [
      {n:"HP POTION", t:"HP", v:a.items.HP, d:"+7 HP"},
      {n:"ANTI", t:"ANTI", v:a.items.ANTI, d:"Clear status"},
      {n:"BUFF", t:"BUFF", v:a.items.BUFF, d:"+3 DMG & +10% ACC"},
      {n:"BACKUP", t:"BKUP", v:a.items.BKUP, d:"Revive Life"}
    ];
    const oppHasNaysha = opponents.some(o => o.trId === "NAYSHA" || o.trId === "KESHAV");
    const currentPotBlock = potionBlock[turn] || 0;
    
    itms.forEach((it, i) => {
      const btn = document.getElementById('b' + i);
      btn.style.display = 'block';
      btn.innerText = `${it.n}(${it.v})`;
      btn.disabled = (it.v <= 0 || (oppHasNaysha && (it.t === "HP" || it.t === "ANTI")) || (currentPotBlock > 0 && (it.t === "HP" || it.t === "ANTI")));
      btn.onclick = () => prep(it, i, true);
    });
  }
}

function prep(m, i, isItm) {
  const a = players[turn];
  const opponents = Object.values(players).filter(p => p.team !== a.team && p.cur > 0);
  const o = opponents[0];
  curM = {...m, isItem:isItm};
  
  // Remove selected class from all buttons
  for(let j=0; j<4; j++) {
    document.getElementById('b'+j).classList.remove('selected');
  }
  
  // Add selected class to clicked button
  if(i !== -1) document.getElementById('b'+i).classList.add('selected');
  
  // Update console
  document.getElementById('c-title').innerText = m.n;
  let acc = m.p || 100;
  let mods = a.accMod;
  const isSp = (m.t === "DMG" || m.t === "RAND_DMG" || m.t === "STUN" || m.t === "SILENCE" || m.t === "PERCENT" || m.t === "SPEECH_STUN");
  if(o && !isItm && (o.trId === "UDAY" || o.trId === "KESHAV") && isSp && m.t !== "WIS" && m.t !== "SHIELD") mods -= 15;
  if(!isItm && (a.trId === "CHAHAK" || a.trId === "KESHAV") && isSp) mods += 10;
  document.getElementById('c-acc').innerText = (isItm ? 100 : Math.min(100, acc + mods)) + "%";
  let d = m.val || "EFF";
  if(m.t === "RISK") d = 10;
  if(m.t === "PERCENT") d = "50% HP";
  if((a.trId === "CHAHAK" || a.trId === "KESHAV") && isSp && !isNaN(d)) d = parseInt(d) + 2;
  document.getElementById('c-dmg').innerText = d;
  document.getElementById('c-desc').innerText = `// ${m.d || "Active"}`;
  document.getElementById('exec-trigger').style.display = 'block';
}

// ============ ACTION HANDLING ============
function handleAction() {
  if(turn !== playerRole) return;
  document.getElementById('exec-trigger').style.display = 'none';
  
  // Set action in Firebase
  gameStateRef.child('currentAction').set({ 
    player: playerRole, 
    move: curM, 
    processed: false, 
    timestamp: firebase.database.ServerValue.TIMESTAMP 
  });
  
  // Execute action immediately for this player
  executeAction();
}

function executeAction() {
  const att = players[turn];
  const opponents = Object.values(players).filter(p => p.team !== att.team && p.cur > 0);
  const def = opponents[Math.floor(Math.random() * opponents.length)];
  if(!def && !curM.isItem) { setTimeout(checkDeath, 500); return; }
  const t = document.getElementById('ticker');
  const sDef = def ? document.getElementById(`sprite-${def.role}`) : null;
  let msg = "";
  
  if(curM.isItem) {
    if(curM.t === 'HP') att.cur = Math.min(att.hp, att.cur + 7);
    if(curM.t === 'ANTI') { att.stun = 0; att.bleed = 0; att.weak = 0; }
    if(curM.t === 'BUFF') { att.buff = 3; att.accMod = 10; }
    att.items[curM.t]--;
    t.innerHTML = "<div class='crit-text' style='color:#0f0; border-color:#0f0'>[ FIXED ]</div>";
  } else {
    let hit = (curM.p || 100) + att.accMod;
    const isSp = (curM.t === "DMG" || curM.t === "RAND_DMG" || curM.t === "STUN" || curM.t === "SILENCE" || curM.t === "PERCENT" || curM.t === "SPEECH_STUN");
    if((def.trId === "UDAY" || def.trId === "KESHAV") && isSp && curM.t !== "WIS" && curM.t !== "SHIELD") hit -= 15;
    if((att.trId === "CHAHAK" || att.trId === "KESHAV") && isSp) hit += 10;
    if(def.evasion > 0) { hit -= 50; def.evasion = 0; }
    let dodged = false;
    if((def.trId === "ADVIK" || def.trId === "KESHAV") && (isSp || att.buff > 0)) if(Math.random() < 0.2) dodged = true;
    
    if(Math.random() * 100 > hit || dodged) {
      t.innerHTML = dodged ? "<div class='crit-text' style='color:#ff4500;'>[ DODGED ]</div>" : "<div class='crit-text' style='color:#888; border-color:#888'>[ MISSED ]</div>";
      att.accMod = 0;
    } else {
      let d = (curM.val || 0);
      if(curM.t === "RAND_DMG") d = Math.floor(Math.random() * (curM.max - curM.min + 1)) + curM.min;
      if(curM.t === "RISK") { att.cur = Math.max(1, att.cur - 8); d = 10; }
      if(curM.t === "WIS") d = (def.cur > att.cur) ? Math.floor(def.cur / 2) : 0;
      if(curM.t === "DS") d = (def.cur < (def.hp * 0.3)) ? def.cur : 2;
      if(curM.t === "PERCENT") d = Math.floor(att.cur * 0.5);
      if(curM.t === "SPEECH_STUN") { def.stun = 3; d = 0; }
      if(curM.t === "WARRANT") {
        if(def.cur <= 20) { potionBlock[def.role] = 5; dmgReduction[def.role] = 2; msg = "[ WARRANT ACTIVATED ]"; d = 0; }
        else { d = 0; msg = "[ WARRANT FAILED ]"; }
      }
      if(curM.t === "HEAL") { att.cur = Math.min(att.hp, att.cur + 3); d = 0; msg = "[ HEALED ]"; }
      if(curM.t === "SWAP") { let tmp = att.cur; att.cur = def.cur; def.cur = tmp; d = 0; msg = "[ SWAPPED ]"; }
      if(curM.t === "BLEED") def.bleed = 3;
      if(curM.t === "BLEED_RAND") { def.bleed = 3; d = Math.floor(Math.random() * 2) + 1; }
      if(curM.t === "WEAK") def.weak = 3;
      if(curM.t === "STUN") def.stun = (curM.n === "Bald Shine" || curM.n === "Pause" || curM.n === "Totalitarian" || curM.n === "Out Syllabus" || curM.n === "Go out") ? 2 : 1;
      if(curM.t === "SILENCE") def.stun = 1;
      if(curM.t === "EVA") { att.evasion = 1; msg = "[ EVASIVE ]"; }
      
      if(att.weak > 0 && d > 0) d = Math.floor(d / 2);
      const currentDmgRed = dmgReduction[turn] || 0;
      if(currentDmgRed > 0 && d > 0) d = Math.max(0, d - currentDmgRed);
      if((att.trId === "CHAHAK" || att.trId === "KESHAV") && isSp && d > 0) d += 2;
      
      if(def.shield > 0 && (d > 0 || curM.t === "WRATH")) {
        if(att.buff > 0) { def.shield = 0; def.shieldLock = true; msg = "<div class='crit-text' style='color:#ff00ea; border-color:#ff00ea'>[ BROKEN ]</div>"; }
        else if(curM.t === "WRATH" || curM.t === "RISK") { def.shield = 0; msg = "<div class='crit-text' style='color:#ff00ea; border-color:#ff00ea'>[ PIERCED ]</div>"; }
        else { d = 0; def.shield--; msg = "<div class='crit-text' style='color:#00f3ff; border-color:#00f3ff'>[ BLOCKED ]</div>"; }
      }
      
      if(att.buff > 0 && d > 0) { d += 3; if(!dodged) att.buff = 0; }
      att.accMod = 0;
      
      if(curM.t === "WRATH") { def.cur = 1; d = 0; msg = "[ WRATH ]"; }
      if(curM.t === "LEECH") att.cur = Math.min(att.hp, att.cur + d);
      if(curM.t === "SHIELD" && !att.shieldLock) { att.shield = 3; msg = "[ SHIELD UP ]"; }
      
      def.cur = Math.max(0, def.cur - d);
      if(d > 0 && sDef) { sDef.classList.add('shake'); att.hasDealtDmg = true; setTimeout(() => sDef.classList.remove('shake'), 300); }
      
      if((def.trId === "ADYA" || def.trId === "KESHAV") && d > 0) { att.cur = Math.max(0, att.cur - 1); msg = msg ? msg + " + [RECOIL]" : "[ RECOIL ]"; }
      
      t.innerHTML = msg || `<div class='crit-text'>-[ ${Math.floor(d)} ]</div>`;
    }
    if(curM.once) att.used.push(curM.n);
    att.lastMoveName = curM.n;
  }
  
  updateUI();
  
  // Update Firebase with new state
  const stateUpdate = { 'currentAction/processed': true, potionBlock, dmgReduction };
  Object.keys(players).forEach(key => stateUpdate[key] = serializePlayer(players[key]));
  gameStateRef.update(stateUpdate);
  
  setTimeout(checkDeath, 1000);
}

function checkDeath() {
  Object.values(players).forEach(p => {
    if(p.cur <= 0 && p.items.BKUP > 0) {
      p.revived++;
      p.cur = p.revived === 1 ? 5 : 3;
      p.items.BKUP--;
      p.bleed = 0; p.stun = 0;
      if(p.trId === "AAYANSH" || p.trId === "KESHAV") { p.buff = 3; p.accMod = 10; }
      const t = document.getElementById('ticker');
      t.innerHTML = `<div class='crit-text' style='color:#0f0'>${p.n.toUpperCase()} ${p.revived === 2 ? "IS STILL THERE" : "REBOOTING"}</div>`;
      updateUI();
      const stateUpdate = {};
      Object.keys(players).forEach(key => stateUpdate[key] = serializePlayer(players[key]));
      gameStateRef.update(stateUpdate);
      setTimeout(() => endTurn(), 1200);
      return;
    }
  });
  
  const teamAAlive = Object.values(players).filter(p => p.team === 'A' && p.cur > 0);
  const teamBAlive = Object.values(players).filter(p => p.team === 'B' && p.cur > 0);
  if(teamAAlive.length === 0) { alert("SYSTEM FAILURE: TEAM B WINS!"); if(roomRef) roomRef.remove(); location.href = 'index.html'; return; }
  if(teamBAlive.length === 0) { alert("SYSTEM FAILURE: TEAM A WINS!"); if(roomRef) roomRef.remove(); location.href = 'index.html'; return; }
  setTimeout(() => endTurn(), 800);
}

function endTurn() {
  const c = players[turn];
  if(c.bleed > 0 && c.cur > 0) { c.cur = Math.max(0, c.cur - 1); c.bleed--; }
  if((c.trId === "NOEL" || c.trId === "KESHAV") && c.hasDealtDmg) {
    Object.values(players).filter(p => p.team !== c.team).forEach(o => o.cur = Math.max(0, o.cur - 2));
  }
  if(potionBlock[turn] > 0) { potionBlock[turn]--; if(potionBlock[turn] === 0) dmgReduction[turn] = 0; }
  updateUI();
  
  const teamAAlive = Object.values(players).filter(p => p.team === 'A' && p.cur > 0);
  const teamBAlive = Object.values(players).filter(p => p.team === 'B' && p.cur > 0);
  if(teamAAlive.length === 0 || teamBAlive.length === 0) { checkDeath(); return; }
  
  if(c.weak > 0) c.weak--;
  c.hasDealtDmg = false;
  
  // Find next alive player
  let nextIndex = (currentTurnIndex + 1) % turnOrder.length;
  let attempts = 0;
  while(players[turnOrder[nextIndex]].cur <= 0 && attempts < turnOrder.length) { 
    nextIndex = (nextIndex + 1) % turnOrder.length; 
    attempts++; 
  }
  if(attempts >= turnOrder.length) { checkDeath(); return; }
  
  currentTurnIndex = nextIndex;
  turn = turnOrder[currentTurnIndex];
  const n = players[turn];
  
  if(n.stun > 0) {
    n.stun--;
    updateUI();
    document.getElementById('ticker').innerHTML = `<div class='crit-text' style='color:#f00'>${n.n.toUpperCase()} [ STUNNED ]</div>`;
    const stateUpdate = { turn, turnOrder, potionBlock, dmgReduction };
    Object.keys(players).forEach(key => stateUpdate[key] = serializePlayer(players[key]));
    gameStateRef.update(stateUpdate);
    setTimeout(() => endTurn(), 1000);
  } else {
    const stateUpdate = { turn, turnOrder, potionBlock, dmgReduction };
    Object.keys(players).forEach(key => stateUpdate[key] = serializePlayer(players[key]));
    gameStateRef.update(stateUpdate);
    showMain();
  }
}

window.addEventListener('beforeunload', () => { if(roomRef) roomRef.child('players/' + playerRole + '/connected').set(false); });
