let player, enemy;
let floor = 1;
let turn = "player";
let towerPool = [];

window.onload = () => loadRoster();

/* ---------- SETUP ---------- */

function loadRoster() {
  const r = document.getElementById("roster");
  r.innerHTML = "";
  ["Paricheymon","Debosmitamon","Smitimon"].forEach(b=>{
    const d = document.createElement("div");
    d.className="card";
    d.style.borderColor = db[b].color;
    d.innerText = b;
    d.onclick = ()=>selectBeast(b);
    r.appendChild(d);
  });
}

function selectBeast(name) {
  player = makeUnit(db[name], true);
  showDialog(
    `You dare to climb the Untameable tower of the DPS-122 with only one Campanian-${name}...`,
    startTower
  );
}

/* ---------- CORE LOGIC ---------- */

function startTower() {
  towerPool = Object.keys(db).filter(b=>b!==player.name && b!=="Vibhamon");
  document.getElementById("select").style.display="none";
  document.getElementById("battle").style.display="block";
  nextFloor();
}

function nextFloor() {
  updateFloorUI();
  turn = "player";

  let name =
    floor === 11 ? "Vibhamon" :
    floor === 10 ? "MonsinMon" :
    towerPool[Math.floor(Math.random()*towerPool.length)];

  enemy = makeUnit(db[name], false);

  // Boss scaling
  if (floor === 5) enemy.hp += 10;
  if (floor === 7) enemy.hp += 15;
  if (floor === 10) enemy.hp += 25;

  enemy.cur = enemy.hp;
  render();
  log(`Enemy ${enemy.name} appears.`);
}

/* ---------- UNIT FACTORY ---------- */

function makeUnit(src, isPlayer) {
  return {
    name: src.name || src.n,
    color: src.color,
    hp: src.hp - 10,          // ✅ TOWER MODE HP NERF
    cur: src.hp - 10,
    moves: src.moves,
    items: { HP: 1 },
    isPlayer
  };
}

/* ---------- UI ---------- */

function render() {
  setUnitUI(player, "p1");
  setUnitUI(enemy, "p2");
}

function setUnitUI(u, id) {
  document.getElementById(`${id}-name`).innerText = u.name;
  document.getElementById(`${id}-name`).style.color = u.color;
  document.getElementById(`${id}-hp`).innerText = `${u.cur}/${u.hp}`;
  document.getElementById(`${id}-bar`).style.width = `${(u.cur/u.hp)*100}%`;
  document.getElementById(`${id}-bar`).style.background = u.color;
}

function updateFloorUI() {
  document.getElementById("tower-floor").innerText =
    floor <= 10 ? `FLOOR ${floor}/10` : "BASEMENT";
}

/* ---------- ACTIONS ---------- */

function openMoves() {
  const m = document.getElementById("moves");
  m.innerHTML="";
  player.moves.forEach(move=>{
    const b=document.createElement("button");
    b.innerText=move.n;
    b.onclick=()=>attack(move);
    m.appendChild(b);
  });
}

function attack(move) {
  const dmg = move.val || 5;
  enemy.cur -= dmg;
  log(`${player.name} used ${move.n} (-${dmg})`);
  endTurn();
}

function usePotion() {
  if (player.items.HP<=0) return;
  player.cur = Math.min(player.hp, player.cur+7);
  player.items.HP--;
  log("HP RESTORED");
  endTurn();
}

/* ---------- TURN FLOW ---------- */

function endTurn() {
  render();
  if (enemy.cur<=0) return victory();
  turn="enemy";
  setTimeout(enemyTurn,800);
}

function enemyTurn() {
  const mv = enemy.moves[Math.floor(Math.random()*enemy.moves.length)];
  const dmg = mv.val || 5;
  player.cur -= dmg;
  log(`${enemy.name} used ${mv.n} (-${dmg})`);
  render();
  if (player.cur<=0) return defeat();
  turn="player";
}

/* ---------- END STATES ---------- */

function victory() {
  log("Enemy defeated.");
  floor++;
  if (floor>11) {
    showDialog(
      "......... You are the HERO, a force that no one can stop...",
      ()=>location.href="index.html"
    );
  } else {
    nextFloor();
  }
}

function defeat() {
  showDialog(
    "You are no match for me or my TOWER...",
    ()=>location.reload()
  );
}

/* ---------- DIALOG ---------- */

function showDialog(txt, cb) {
  const d=document.getElementById("dialog");
  d.style.display="flex";
  document.getElementById("dialog-text").innerText=txt;
  document.getElementById("dialog-btn").onclick=()=>{
    d.style.display="none";
    cb();
  };
}

/* ---------- LOG ---------- */

function log(t){
  document.getElementById("log").innerText=t;
}
