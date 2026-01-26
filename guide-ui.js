const screen=document.getElementById("screen");

function load(sec){
screen.innerHTML="";
const d=GUIDE[sec];
const h=document.createElement("div");
h.className="section-title";
h.textContent=d.title;
screen.appendChild(h);

if(d.text){
d.text.forEach(t=>{
const p=document.createElement("div");
p.textContent="> "+t;
screen.appendChild(p);
});
}

if(d.cards){
d.cards.forEach(o=>{
const c=document.createElement("div");
c.className="card";
if(o.c) c.style.borderLeftColor=o.c;
c.innerHTML=`<div class="head">${o.n}</div><div class="sub">${o.d}</div>`;
screen.appendChild(c);
});
}
}

document.querySelectorAll("#nav button[data-sec]").forEach(b=>{
b.onclick=()=>load(b.dataset.sec);
});

load("how");
