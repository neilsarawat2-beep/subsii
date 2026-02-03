// Shared Game Data for Subsi Ki Jang
// Include this file in all game mode HTML files

window.db = {
  "Paricheymon": {
    hp: 30, str: 5, spd: 8, type: "WATER", color: "#00d2ff",
    moves: [
      {n:"Water Pump", p:80, val:5, t:"DMG", d:"5 HP hydro-blast."},
      {n:"Bald Shine", p:70, t:"STUN", d:"Stun for 2 turns."},
      {n:"Kick run", p:100, val:3, t:"RAND_DMG", min:2, max:4, d:"Deals 2-4 HP."},
      {n:"Quick dodge", p:80, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "Debosmitamon": {
    hp: 32, str: 8, spd: 3, type: "GRASS", color: "#45f542",
    moves: [
      {n:"Membrane", p:100, t:"SHIELD", d:"3-Hit Defensive Layer."},
      {n:"Root Hold", p:100, val:3, t:"RAND_DMG", min:2, max:4, d:"Catch prey (2-4 HP)."},
      {n:"Pollen Burst", p:50, val:6, t:"DMG", d:"6 HP burst."},
      {n:"Quick dodge", p:50, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "Smitimon": {
    hp: 28, str: 8, spd: 7, type: "FIRE", color: "#ff5e00",
    moves: [
      {n:"Roll no. 1", p:60, val:3, t:"LEECH", d:"Siphon 3 HP to Self."},
      {n:"SEA", p:100, val:3, t:"DMG", d:"Thermal hit (3 HP)."},
      {n:"Padhai Mat", p:60, t:"WEAK", d:"Opp deals 50% less dmg."},
      {n:"Quick dodge", p:50, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "Swatimon": {
    hp: 34, str: 7, spd: 3, type: "SPACE", color: "#9d00ff",
    moves: [
      {n:"Wisdom", p:90, t:"WIS", d:"Deals 1/2 Opp HP if Higher."},
      {n:"Irony", p:100, t:"SWAP", once:true, d:"Swap HP; Skip turn."},
      {n:"Pause", p:50, t:"STUN", d:"Opp skips 2 turns."},
      {n:"Metaphor", p:100, val:3, t:"DMG", d:"3 HP direct strike."}
    ]
  },
  "GarimaJmon": {
    hp: 37, str: 7, spd: 5, type: "GHOST", color: "#ff0055",
    moves: [
      {n:"Wrath", p:20, t:"WRATH", d:"Set Opp HP to 1. Breaks Shield."},
      {n:"Totalitarian", p:50, t:"STUN", once:true, d:"Stun 2 turns."},
      {n:"Bratt!", p:100, val:4, t:"DMG", d:"4 HP strike."},
      {n:"Escapism", p:60, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "Deepalimon": {
    hp: 33, str: 7, spd: 5, type: "IRON", color: "#00ff95",
    moves: [
      {n:"Death Stare", p:100, t:"DS", d:"Execute if HP < 30%."},
      {n:"Silence", p:50, val:4, t:"STUN", d:"4 HP + 1 Turn Stun."},
      {n:"Chem Burst", p:100, val:3, t:"DMG", d:"3 HP hit."},
      {n:"Out Syllabus", p:40, t:"STUN", d:"Stun 2 Turns."}
    ]
  },
  "Rohitmon": {
    hp: 30, str: 8, spd: 8, type: "COMBAT", color: "#ffcc00",
    moves: [
      {n:"Dunk", p:60, val:4, t:"BLEED", d:"4 HP + Bleed (3 turns)."},
      {n:"Intimidate", p:50, t:"STUN", d:"Stun 1 Turn."},
      {n:"Jawline cut", p:100, val:3, t:"DMG", d:"3 HP cut."},
      {n:"Quick Dodge", p:60, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "MonsinMon": {
    hp: 35, str: 9, spd: 7, type: "LEGEND", color: "#ffffff",
    moves: [
      {n:"Inshallah", p:60, t:"RISK", d:"Lose 8 HP on HIT -> Deal 10 Pierce DMG."},
      {n:"Iron Body", p:100, t:"SHIELD", d:"3-Hit Defensive Layer."},
      {n:"KhatnaCut", p:100, val:3, t:"DMG", d:"3 HP hit."},
      {n:"Quick dodge", p:50, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "Etikamon": {
    hp: 34, str: 8, spd: 6, type: "NATURE", color: "#a6ff00",
    moves: [
      {n:"Child Throw", p:60, t:"BLEED_RAND", d:"1-2 HP + Bleed."},
      {n:"Tapasya", p:100, t:"HEAL", d:"Recover 3 HP."},
      {n:"Compass", p:100, val:3, t:"DMG"},
      {n:"Quick Dodge", p:50, t:"EVA", d:"50% Evasion next hit."}
    ]
  },
  "PradeepMon": {
    hp: 34, str: 8, spd: 8, type: "MYSTIC", color: "#0077ff",
    moves: [
      {n:"Bohot dekhe hai", p:60, t:"BLEED", d:"Infects Opp with Bleed (3 turns)."},
      {n:"Bald burst", p:60, val:4, t:"SILENCE", d:"4 HP + 1 Turn Stun."},
      {n:"Go out", p:40, t:"STUN", d:"Stun 2 Turns."},
      {n:"BABU", p:100, val:3, t:"DMG"}
    ]
  },
  "Vibhamon": {
    hp: 150, str: 12, spd: 10, type: "ULTIMATE", color: "#ff0000",
    moves: [
      {n:"Resticate", p:40, val:0, t:"PERCENT", d:"50% of user HP."},
      {n:"Suspend", p:100, val:5, t:"DMG", d:"5 HP damage."},
      {n:"Speech", p:20, t:"SPEECH_STUN", d:"3 turn stun."},
      {n:"Principle's Warrant", p:100, t:"WARRANT", d:"No potions for 5 turns, -2 DMG."}
    ]
  }
};

const evoTree = {
  "Paricheymon": ["Deepalimon", "PradeepMon"],
  "Debosmitamon": ["Etikamon", "Swatimon"],
  "Smitimon": ["GarimaJmon", "MonsinMon"]
};

window.trainers = {
  "Kashmiri Adya": {id: "ADYA", c: "#ff9933", name: "Pather fekh", d: "Opp takes 1 Bleed on attack."},
  "Bengali Noel": {id: "NOEL", c: "#ff0099", name: "Kaala Jaadu", d: "Bleed 2HP/turn if dmg dealt."},
  "Milky Shubhan": {id: "SHUBHAN", c: "#00ccff", name: "Dudh", d: "+1 Heal Potion at start."},
  "Gitthi Naysha": {id: "NAYSHA", c: "#ffd700", name: "Judge", d: "Opp cannot use Heal/Anti."},
  "Kaala Uday": {id: "UDAY", c: "#9933ff", name: "Andhera", d: "Opp Acc -15% on non-specials."},
  "Fatima Chahak": {id: "CHAHAK", c: "#00ff00", name: "Maksad", d: "+2 DMG & +10% ACC on Specials."},
  "Bihari Rishit": {id: "RISHIT", c: "#ff6600", name: "Chor", d: "Steals 1 random item at start."},
  "Janwar Neil": {id: "NEIL", c: "#4b0082", name: "Bhukad", d: "2 Backup Potions (5HP & 3HP)."},
  "Khamba Aayansh": {id: "AAYANSH", c: "#808080", name: "Ragebait", d: "Buff after Backup is used."},
  "Brat Advik": {id: "ADVIK", c: "#ff4500", name: "Over-confidence", d: "20% dodge special moves."},
  "Lord Keshav": {id: "KESHAV", c: "#ffffff", name: "God's Touch", d: "All trainer abilities combined."}
};


