let current = "how";
let navIndex = 0;
const navBtns = [...document.querySelectorAll("#nav button[data-sec]")];

function typeText(lines, el){
  el.innerHTML = "";
  let i = 0, j = 0;
  function tick(){
    if(i >= lines.length) return;
    if(j < lines[i].length){
      el.innerHTML += lines[i][j++];
      setTimeout(tick, 30);
    }else{
      el.innerHTML += "<br>";
      j = 0; i++;
      setTimeout(tick, 400);
    }
  }
  tick();
}

function loadSection(key){
  current = key;
  navBtns.forEach(b=>b.classList.toggle("active", b.dataset.sec===key));
  const d = GuideData[key];
  document.getElementById("title").innerText = d.title;
  typeText(d.narrator, document.getElementById("terminal"));
  const cards = document.getElementById("cards");
  cards.innerHTML = "";
  d.cards.forEach(t=>{
    const c = document.createElement("div");
    c.className = "card";
    c.innerText = t;
    cards.appendChild(c);
  });
}

navBtns.forEach((b,i)=>{
  b.onclick = ()=>{navIndex=i; loadSection(b.dataset.sec);}
});

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"){navIndex=(navIndex+1)%navBtns.length}
  if(e.key==="ArrowUp"){navIndex=(navIndex-1+navBtns.length)%navBtns.length}
  if(e.key==="Enter"){navBtns[navIndex].click()}
  if(e.key==="Escape"){location.href="../index.html"}
});

loadSection("how");
