import Phaser from "phaser";
import { createSelector, PerformanceTracker } from "./wordAdaptive";

const SELECTION_MODE = "adaptive";   // "random" | "adaptive"
const FONT = "'Quicksand', system-ui, sans-serif";
const V = [..."aeiou"], isVowel = c => V.includes(c);
const CONF = { b:"d", d:"b", p:"q", q:"p", m:"n", n:"m" };
const median = a => [...a].sort((x,y)=>x-y)[Math.floor(a.length/2)] ?? null;
const WORDS_PER_SWAMP = 3;  // after 3 rounds, transition to DesertScene
const T = (s,x,y,t,size,color) => s.add.text(x,y,t,{fontFamily:FONT,fontSize:`${size}px`,
  fontStyle:"bold",color,stroke:"#0e1a08",strokeThickness:5}).setOrigin(0.5).setScrollFactor(0);

export const LEVELS = {
  1:{ tag:"vowel",       words:["cat","dog","sun","map","pig","bed","cup","hat","fish","red"],
      target:isVowel,    foil:()=>V },
  2:{ tag:"init-cons",   words:["bat","net","pin","top","bus","jam","web","lip"],
      target:(c,i)=>i===0, foil:()=>[..."bcdfghjklmnprstw"] },
  3:{ tag:"final-cons",  words:["bug","hen","lid","pot","cub","fan","rug","mat"],
      target:(c,i,w)=>i===w.length-1, foil:()=>[..."bdgmnpt"] },
  4:{ tag:"confusable",  words:["bed","dog","pig","mop","nut","pan","bud","dip"],
      target:c=>c in CONF, foil:c=>[CONF[c]] },
  5:{ tag:"blend",       words:["ship","chip","frog","stop","clap","drum"],
      target:(c,i)=>i===1, foil:()=>[..."hlrtw"] },
  6:{ tag:"vowel-team",  words:["rain","boat","tree","moon","leaf"],
      target:(c,i,w)=>isVowel(c)&&i>0, foil:()=>V },
  7:{ tag:"mixed",       words:["plant","green","truck","bread","smile"],
      target:()=>true, foil:()=>[..."abcdefghilmnoprstu"] },
};

export class WordGame {
  constructor(scene){
    this.s=scene; this.score=0; this.streak=0; this.log=[]; this.slots=[];
    this.rounds=[];
    // Adaptive engine: tracker persists per child, selector picks level + word
    const childId = localStorage.getItem("childId");
    this.tracker=new PerformanceTracker(childId, "wordperf");
    this.selector=createSelector(SELECTION_MODE,this.tracker,LEVELS);
    this.level=this.selector.level;
    this.cfg=LEVELS[this.level];
  }

  // The selector decides the level and word each round, can also accept requestedLevel
  start(requestedLevel){
    this.rounds=[]; this.log=[];
    if (requestedLevel && LEVELS[requestedLevel]) {
      this.selector.setLevel(requestedLevel);
    }
    this.level=this.selector.level;
    this.cfg=LEVELS[this.level];
    if(!this.hud) this._buildHUD();
    this.nextRound();
  }

  nextRound(){
    const s=this.s;
    [...s.goblins].forEach(g=>{ if(!g.isDying) s._removeGoblinSilently(g); });

    // Ask the selector (random or adaptive) for the next word + level
    const pick=this.selector.next();
    this.level=pick.level; this.cfg=LEVELS[pick.level];
    const word=pick.word;

    let idx=[...word].flatMap((c,i)=>this.cfg.target(c,i,word)?[i]:[]);
    if(!idx.length) idx=[...word].map((_,i)=>i);
    const index=Phaser.Math.RND.pick(idx), missing=word[index];
    const foil=Phaser.Math.RND.pick(this.cfg.foil(missing).filter(l=>l!==missing));

    this.round={word,index,missing,foil,attempts:0,wrong:[],replays:0,locked:false,t0:0};
    this._renderWord();

    const xs=[300,560];
    Phaser.Utils.Array.Shuffle([missing,foil]).forEach((letter,i)=>{
      const g=s._createGoblin(xs[i],380,s._groundLayer);
      g.hp=1; g.letter=letter; s._attachLetter(g,letter); s.goblins.push(g);
    });
    this.speak(true);
  }

  // ── audio ──
  speak(auto=false){
    const r=this.round, s=this.s, key=`word-${r.word}`;
    if(!auto) r.replays++;
    const done=()=>{ if(!r.t0) r.t0=performance.now(); };   // timer starts after audio ends
    if(s.cache.audio.exists(key)){ const a=s.sound.add(key); a.once("complete",done); a.play(); }
    else if("speechSynthesis" in window){
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(r.word); u.rate=0.8; u.lang="en-US"; u.onend=done;
      speechSynthesis.speak(u);
    } else done();
  }

  // ── attack → answer ──
  onStrike(goblin){
    const r=this.round; if(!r||r.locked||!goblin.letter) return;
    r.attempts++;
    const ms=r.t0?Math.round(performance.now()-r.t0):null;
    const ok=goblin.letter===r.missing;
    this.log.push({ts:Date.now(),level:this.level,word:r.word,missing:r.missing,
      chosen:goblin.letter,correct:ok,attempt:r.attempts,responseMs:ms,replays:r.replays});
    ok?this._correct(goblin,ms):this._wrong(goblin);
  }

  _wrong(goblin){
    const s=this.s, r=this.round;
    r.wrong.push(goblin.letter); this.streak=0;
    s._bonk(goblin);
    s._showFloatingText(goblin.x,goblin.y-70,"Not quite – listen again 🔊","#ffcc66");
    s.tweens.add({targets:this.slots[r.index],x:"+=6",duration:50,yoyo:true,repeat:3});
    s.time.delayedCall(700,()=>this.speak(true));   // re-play word, not counted as learner replay
  }

  _correct(goblin,ms){
    const s=this.s, r=this.round, cam=s.cameras.main;
    r.locked=true; this.streak++;
    const first=r.attempts===1;
    const pts=Math.max(30,100-25*(r.attempts-1))+(first&&ms!==null&&ms<6000?20:0)+Math.min(this.streak,5)*5;
    const stars=first?3:r.attempts===2?2:1;

    this.rounds.push({word:r.word,level:this.level,missing:r.missing,tag:this.cfg.tag,wrong:r.wrong,
      attempts:r.attempts,firstTry:first,responseMs:ms,replays:r.replays,pts});

    // Feed the adaptive engine (persisted per child in localStorage)
    this.tracker.record({word:r.word,level:this.level,missing:r.missing,tag:this.cfg.tag,
      attempts:r.attempts,responseMs:ms,replays:r.replays,wrong:r.wrong,mode:this.selector.mode});

    // fade the distractor, defeat the correct goblin
    s.goblins.filter(g=>g!==goblin&&!g.isDying).forEach(g=>{
      g._label?.destroy(); g._hpBg?.destroy(); g._hpBar?.destroy();
      s.tweens.add({targets:g,alpha:0,duration:400});
    });
    s._killGoblin(goblin);

    // letter flies from goblin (world) to the blank slot (screen)
    const sx=(goblin.x-cam.worldView.x)*cam.zoom, sy=(goblin.y-60-cam.worldView.y)*cam.zoom;
    const slot=this.slots[r.index];
    const fly=T(s,sx,sy,r.missing,56,"#a3f78c").setDepth(60).setScale(1.4);
    s.tweens.add({targets:fly,x:slot.x,y:slot.y,scale:1,duration:600,ease:"Cubic.easeInOut",
      onComplete:()=>{
        fly.destroy(); slot.setText(r.missing).setColor("#a3f78c");
        s.tweens.add({targets:slot,scale:1.4,duration:150,yoyo:true,repeat:1});
        this._celebrate(pts,stars);
      }});
  }

  _celebrate(pts,stars){
    const s=this.s, W=s.scale.width, H=s.scale.height;
    this.score+=pts; this.scoreText.setText(`⭐ ${this.score}`);
    const c=s.add.container(W/2,H/2).setScrollFactor(0).setDepth(70).setScale(0.6);
    const bg=s.add.graphics().fillStyle(0x0e1a08,0.95).fillRoundedRect(-170,-90,340,180,18)
      .lineStyle(3,0x88d440,1).strokeRoundedRect(-170,-90,340,180,18);
    c.add([bg,T(s,0,-50,"Great job! 🎉",30,"#e8f5c0"),
      T(s,0,0,this.round.word.toUpperCase(),44,"#a3f78c"),
      T(s,0,55,`+${pts}   ${"★".repeat(stars)}${"☆".repeat(3-stars)}`,24,"#ffd700")]);
    s.tweens.add({targets:c,scale:1,duration:300,ease:"Back.easeOut"});
    for(let i=0;i<30;i++){           // confetti
      const p=s.add.rectangle(Phaser.Math.Between(0,W),-10,8,12,Phaser.Math.RND.pick([0xffd700,0x66ffcc,0xff8866,0xa3f78c]))
        .setScrollFactor(0).setDepth(69);
      s.tweens.add({targets:p,y:H+20,angle:360,duration:Phaser.Math.Between(1200,2200),onComplete:()=>p.destroy()});
    }
    s.time.delayedCall(2200, () => {
      c.destroy();
      if (this.rounds.length >= WORDS_PER_SWAMP) this._goToDesert();
      else this.nextRound();
    });
  }

  _renderWord(){
    const s=this.s, r=this.round, W=s.scale.width, size=56, gap=14, n=r.word.length;
    this.slots.forEach(t=>t.destroy());
    const x0=W/2-(n*(size+gap))/2+(size+gap)/2;
    this.slots=[...r.word].map((c,i)=>T(s,x0+i*(size+gap),122,i===r.index?"_":c,52,i===r.index?"#ffd700":"#f0fbdb").setDepth(52));
    this.progress.setText(`${this.rounds.length+1}/${WORDS_PER_SWAMP}`);
    if(this.levelBadge) this.levelBadge.setText(`Level ${this.level} • ${this.cfg.tag}`);
  }

  _buildHUD(){
    const s=this.s, W=s.scale.width;
    s.add.graphics().setScrollFactor(0).setDepth(50).fillStyle(0x0e1a08,0.85)
      .fillRoundedRect(W/2-250,82,500,86,14);
    this.hud=true;
    this.scoreText=T(s,W/2-200,150,"⭐ 0",16,"#ffd700").setDepth(52);
    this.levelBadge=T(s,W/2,150,`Level ${this.level} • ${this.cfg.tag}`,15,"#a3f78c").setDepth(52);
    this.progress =T(s,W/2+200,150,"",16,"#9acc6e").setDepth(52);
    T(s,W/2+215,110,"🔊",30,"#fff").setDepth(52).setInteractive({useHandCursor:true})
      .on("pointerdown",()=>this.speak());
  }

  _flush() {
    const R = this.rounds, n = R.length || 1;
    const acc = R.filter(x => x.firstTry).length / n;

    // Build stats for the swamp table
    const totalAttempts = this.log.length;
    const totalCorrect  = this.log.filter(x => x.correct).length;
    const totalWrong    = totalAttempts - totalCorrect;
    const accuracyPct   = R.length ? Math.round((R.filter(x => x.firstTry).length / n) * 100) : 0;
    const missratePct   = totalAttempts ? Math.round((totalWrong / totalAttempts) * 100) : 0;

    try {
      window.__saveSwamp?.({
        clicks:   totalAttempts,
        hits:     totalCorrect,
        misses:   totalWrong,
        score:    this.score,
        accuracy: accuracyPct,
        missrate: missratePct,
      });
    } catch (e) {
      console.error("saveSwamp error:", e);
    }

    return acc;
  }

  _goToDesert() {
    const s = this.s;
    this._flush();
    if (this.selector?.markCompleted) {
      this.selector.markCompleted();
    }
    try { speechSynthesis?.cancel(); } catch (e) {}
    s._showFloatingText(s.player.x, s.player.y - 90, "Swamp complete! On to the desert 🌵", "#ffd700");
    s.time.delayedCall(1600, () => {
      s.cameras.main.fadeOut(500);
      s.time.delayedCall(550, () => {
        window.location.href = `/desert?score=${this.score}&level=${this.level}`;
      });
    });
  }
}