const CATS={
  war:{label:"War & geopolitics",v:"--war"},
  weather:{label:"Weather & disasters",v:"--weather"},
  energy:{label:"Energy & commodities",v:"--energy"},
  tech:{label:"Technology",v:"--tech"},
  markets:{label:"Markets & economy",v:"--markets"}
};
const SECTORS=["Energy","Defense","Shipping & freight","Insurance","Utilities & power","Consumer staples","Consumer discretionary","Semiconductors","Cloud & software","Travel & airlines","Agriculture","Banks & rate-sensitive"];

const SNAPSHOT=[
 {id:"e1",cat:"energy",sev:5,date:"2026-09-11",region:"Global / US Gulf Coast",lat:29.7,lng:-95.3,
  title:"Crude spikes toward $100, energy leads 2026",
  what:"Oil jumped close to double digits in one week in early September, lifting Treasury yields too. Energy is the best-performing sector of 2026 so far, up more than 40% year to date, while consumer discretionary is down on the year.",
  chain:["Higher crude raises fuel costs for airlines, truckers, and shippers","Pricier gasoline squeezes household spending on non-essentials","Inflation worries push bond yields up, hurting rate-sensitive stocks","A sustained break above $100 would add to that squeeze"],
  sectors:[{s:"Energy",d:1,why:"Producers and refiners earn more per barrel"},{s:"Travel & airlines",d:-1,why:"Jet fuel is a top cost"},{s:"Consumer discretionary",d:-1,why:"Less spare cash after fuel"},{s:"Banks & rate-sensitive",d:-1,why:"Rising yields weigh on REITs and lenders"}],
  watch:["XLE","JETS","XLY","TLT"],src:"Weekly market recap, Sept 7–11, 2026"},
 {id:"e2",cat:"war",sev:5,date:"2026 ongoing",region:"Persian Gulf / Middle East",lat:27,lng:51,
  title:"Middle East conflict keeps a war premium in oil",
  what:"The US-Iran conflict that broke out early in 2026 pushed crude from the high $50s to around $90 by March. Damage to energy facilities and pipelines, with long repair times, has kept a risk premium in prices even though the market would otherwise be oversupplied.",
  chain:["Attacks or threats near shipping routes raise tanker insurance and freight rates","Importing countries rebuild strategic reserves, adding demand","Any ceasefire news can knock the premium out quickly, so moves are sharp in both directions"],
  sectors:[{s:"Energy",d:1,why:"Risk premium lifts prices"},{s:"Defense",d:1,why:"Higher military spending and resupply"},{s:"Shipping & freight",d:0,why:"Higher rates but riskier routes"},{s:"Insurance",d:-1,why:"War-risk claims and repricing"}],
  watch:["XLE","ITA","BZ=F"],src:"Commodity exchange and ratings agency commentary, Mar–May 2026"},
 {id:"e3",cat:"energy",sev:3,date:"2026-09-30",region:"Iraq",lat:30.5,lng:47.8,
  title:"Iraq offers October crude at deep discounts",
  what:"Iraq's state oil marketer reportedly offered October cargoes at steep discounts to regional benchmarks. A seller cutting price that hard hints at buyers being scarce for that oil.",
  chain:["Discounted barrels compete with other Gulf grades for Asian buyers","Refiners that can take the oil get cheaper input and fatter margins","It quietly undercuts the war-premium story if supply is actually plentiful"],
  sectors:[{s:"Energy",d:0,why:"Good for refiners, a soft signal for crude prices"}],
  watch:["CRAK","XLE"],src:"Market headlines, Sept 30, 2026"},
 {id:"e4",cat:"energy",sev:3,date:"Early Oct 2026",region:"Vienna",lat:48.2,lng:16.4,
  title:"OPEC+ monitoring committee meets this week",
  what:"OPEC+'s ministerial monitoring committee is on the calendar for the first week of October. Its tone on output decides whether the oversupply worry or the war premium wins the next leg.",
  chain:["Signal of more supply tends to pull crude down","Signal of restraint supports prices","Either way, airline and trucking stocks move opposite to oil"],
  sectors:[{s:"Energy",d:0,why:"Direction depends on the decision"},{s:"Travel & airlines",d:0,why:"Moves opposite to crude"}],
  watch:["XLE","USO"],src:"Economic calendar, October 2026"},
 {id:"e5",cat:"weather",sev:4,date:"2026-09-29",region:"Pacific coast of Mexico",lat:19.1,lng:-104.3,
  title:"Hurricane Polo makes landfall in Mexico as a major storm",
  what:"Category 3 Hurricane Polo came ashore in Mexico with life-threatening conditions. Mexico's Pacific coast hosts major container ports and resort towns.",
  chain:["Port closures can delay Asia-to-Mexico cargo for days","Resort damage hits tourism bookings","Crop losses in coastal farm states can lift local food prices","Reinsurers absorb part of the bill"],
  sectors:[{s:"Insurance",d:-1,why:"Property claims"},{s:"Shipping & freight",d:-1,why:"Port disruption"},{s:"Travel & airlines",d:-1,why:"Resort and flight cancellations"},{s:"Agriculture",d:0,why:"Local crop damage"}],
  watch:["KIE","EWW","IYT"],src:"Hurricane coverage, Sept 29, 2026"},
 {id:"e6",cat:"weather",sev:3,date:"2026-09-28",region:"South of Japan",lat:28.5,lng:136,
  title:"Typhoon Surigae crosses key Pacific shipping lanes",
  what:"A very strong typhoon tracked past Japan's southern islands and through busy shipping lanes south of Honshu before weakening around Oct 1–3.",
  chain:["Ships reroute or wait, adding days to trans-Pacific voyages","Short delays tighten container capacity and nudge spot rates","Little lasting impact if it stays offshore, as forecast"],
  sectors:[{s:"Shipping & freight",d:0,why:"Delays raise rates but cut volume"},{s:"Insurance",d:-1,why:"Marine and coastal claims"}],
  watch:["EWJ","BOAT"],src:"Typhoon advisory, Sept 28, 2026"},
 {id:"e7",cat:"weather",sev:3,date:"2026-09-29",region:"Europe",lat:48,lng:9,
  title:"Record European heat cuts chocolate demand",
  what:"Lindt cut its 2026 sales forecast for the second time this year, saying Europeans bought less chocolate as temperatures broke records. Heat changes what people buy, not just how they feel.",
  chain:["Hot summers shift spending from chocolate and heavy food to drinks and cooling","Air-conditioning demand strains power grids and lifts electricity prices","Low rivers in heat waves can slow barge shipping in central Europe"],
  sectors:[{s:"Consumer staples",d:-1,why:"Weaker sales for some food makers"},{s:"Utilities & power",d:1,why:"Peak power demand"},{s:"Agriculture",d:0,why:"Heat stress on crops"}],
  watch:["XLP","VGK"],src:"Daily market report, Sept 29, 2026"},
 {id:"e8",cat:"tech",sev:4,date:"2026-09-29",region:"San Francisco",lat:37.8,lng:-122.4,
  title:"Anthropic's IPO filing shows huge compute commitments",
  what:"Anthropic's IPO prospectus reported a large 2025 net loss and roughly $518 billion in planned spending obligations on cloud, computing, and infrastructure in coming years. Filings like this show how much AI money is still flowing to hardware and data centers.",
  chain:["Big multi-year compute contracts support cloud and chip revenue","Data centers need power, which supports grid equipment and utilities","Large losses keep the question open on whether AI spending pays off, which drives valuation swings"],
  sectors:[{s:"Cloud & software",d:1,why:"Committed cloud demand"},{s:"Semiconductors",d:1,why:"Chip and memory orders"},{s:"Utilities & power",d:1,why:"Data center electricity"}],
  watch:["SMH","IGV","XLU"],src:"Daily market report, Sept 29, 2026"},
 {id:"e9",cat:"markets",sev:2,date:"2026-09-29",region:"Finland / Nasdaq",lat:60.2,lng:24.9,
  title:"Oura postpones its IPO over market uncertainty",
  what:"The smart-ring maker delayed its Nasdaq listing despite strong demand, citing uncertainty in the IPO market. When companies pull deals, it usually means bankers sense nervous buyers.",
  chain:["Delayed IPOs reduce fees for investment banks","A cold IPO window can make investors more cautious about richly valued tech"],
  sectors:[{s:"Banks & rate-sensitive",d:-1,why:"Fewer underwriting fees"},{s:"Cloud & software",d:-1,why:"Risk appetite for growth names cools"}],
  watch:["IPO","XLF"],src:"Daily market report, Sept 29, 2026"},
 {id:"e10",cat:"tech",sev:3,date:"2026-09-11",region:"United States",lat:39,lng:-77,
  title:"Advanced nuclear stocks unwind sharply",
  what:"Small-modular-reactor and nuclear fuel names fell 8–16% in one week, one of the year's most crowded momentum trades reversing. Hype-driven themes can drop fast even when the long-term story is unchanged.",
  chain:["Crowded trades fall hardest when sentiment turns","Watch whether data-center power deals keep flowing; that's what the theme rests on"],
  sectors:[{s:"Utilities & power",d:-1,why:"Nuclear theme sold off"},{s:"Energy",d:0,why:"Uranium sentiment wobbled"}],
  watch:["SMR","OKLO","LEU","URA"],src:"Weekly market recap, Sept 7–11, 2026"},
 {id:"e11",cat:"tech",sev:3,date:"Sept 2026",region:"Taiwan / global supply chain",lat:24.8,lng:121,
  title:"AI shifts from training to inference, model prices keep falling",
  what:"The AI chip market is splitting between chips for training models and chips for running them. Cheaper inference makes more AI products affordable to build, while raising the bar for chip makers' pricing.",
  chain:["Falling AI prices spread AI into more apps and devices","Demand grows for inference chips and memory","Pricing pressure can squeeze margins at some chip makers"],
  sectors:[{s:"Semiconductors",d:0,why:"More volume, more price competition"},{s:"Cloud & software",d:1,why:"Cheaper to build AI features"}],
  watch:["SMH","SOXX"],src:"AI hardware roundup, Sept 2026"},
 {id:"e12",cat:"markets",sev:4,date:"Late Oct 2026",region:"US, Europe, Japan, Canada, NZ",lat:40.7,lng:-74,
  title:"Five central banks and US GDP land in one late-October week",
  what:"The Fed, ECB, Bank of Japan, Bank of Canada, and RBNZ all decide in the final week of October, alongside first Q3 US GDP, September PCE inflation, and the UK budget. Traders often hold back before a pile-up like this, then move all at once.",
  chain:["Quiet trading into the week, then sharp moves","Rate decisions move bank stocks, REITs, and the dollar","A strong dollar weighs on US companies that sell abroad"],
  sectors:[{s:"Banks & rate-sensitive",d:0,why:"Direction depends on decisions"}],
  watch:["TLT","KRE","VNQ","DXY"],src:"Economic calendar, October 2026"},
 {id:"e13",cat:"markets",sev:2,date:"2026-09-28",region:"New York",lat:42,lng:-71,
  title:"Nasdaq leads a slide on valuation worries",
  what:"US stocks closed lower on Sept 28, with the tech-heavy Nasdaq falling most as investors questioned high valuations and waited on economic data.",
  chain:["Valuation jitters hit the most expensive stocks first","Money rotates toward cheaper, steadier sectors"],
  sectors:[{s:"Semiconductors",d:-1,why:"Richly valued"},{s:"Cloud & software",d:-1,why:"Richly valued"},{s:"Consumer staples",d:1,why:"Defensive rotation"}],
  watch:["QQQ","XLP"],src:"Daily market report, Sept 29, 2026"},
 {id:"e14",cat:"weather",sev:1,date:"2026-09-28",region:"North Atlantic",lat:39,lng:-52,
  title:"Tropical Storm Hanna wanders the open Atlantic",
  what:"The eighth named storm of the Atlantic season formed far northeast of Bermuda. It is a low land threat, but an El Niño year still has October storms to watch.",
  chain:["Open-ocean storms mostly affect shipping routes","A late-season Gulf of Mexico storm would matter more for oil and insurers"],
  sectors:[{s:"Insurance",d:0,why:"Low threat for now"}],
  watch:["KIE"],src:"Hurricane coverage, Sept 28–30, 2026"}
];

const LAND=[
 [[-168,66],[-140,70],[-100,72],[-80,72],[-62,60],[-55,50],[-66,44],[-75,35],[-81,25],[-90,29],[-97,26],[-97,18],[-88,15],[-80,8],[-84,10],[-92,15],[-105,20],[-112,30],[-118,34],[-124,40],[-124,48],[-135,58],[-150,60],[-165,60]],
 [[-50,82],[-25,82],[-20,70],[-45,60],[-55,68]],
 [[-80,8],[-60,10],[-50,0],[-35,-6],[-40,-22],[-55,-35],[-68,-55],[-75,-45],[-72,-20],[-81,-5]],
 [[-10,36],[-9,43],[-2,48],[-5,58],[5,62],[15,70],[30,71],[40,66],[45,55],[40,45],[28,41],[20,40],[12,44],[3,42]],
 [[-5,50],[1,51],[-2,56],[-5,58],[-6,54]],
 [[-17,15],[-10,30],[-5,36],[10,37],[32,31],[35,28],[43,12],[51,12],[40,-15],[35,-25],[20,-35],[12,-17],[9,4],[-8,5]],
 [[28,41],[40,45],[45,55],[40,66],[60,70],[80,73],[110,76],[140,72],[170,68],[180,65],[160,58],[142,48],[132,42],[122,40],[121,30],[110,20],[106,10],[100,13],[98,8],[93,20],[80,15],[77,8],[72,20],[66,25],[57,25],[59,22],[52,16],[43,13],[35,28],[35,36]],
 [[130,31],[136,34],[141,38],[142,44],[140,41],[135,35]],
 [[95,5],[105,-6],[115,-8],[125,-9],[120,0],[110,2]],
 [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-28],[150,-37],[140,-38],[130,-32],[115,-34]]
];

const $=s=>document.querySelector(s);
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const px=(lng,lat)=>[lng+180,90-lat];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

let added=[];
try{added=JSON.parse(localStorage.getItem("ripple-added")||"[]")||[]}catch(e){added=[]}
function save(){try{localStorage.setItem("ripple-added",JSON.stringify(added))}catch(e){}}

let filter="all", selected=null, firstDraw=true, live=null;
const all=()=>[...added,...(live||SNAPSHOT)];
const when=d=>{const t=Date.parse(d);return Number.isNaN(t)?String(d):new Date(t).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})};
const safeUrl=u=>/^https?:\/\//.test(u||"")?u:"";

// Free hosting (GitHub Pages) serves a static events.json next to the page;
// the Render server answers /api/events. Try the static file first.
async function fetchEvents(){
  for(const url of ["events.json","/api/events"]){
    try{
      const r=await fetch(url,{cache:"no-store"});
      if(!r.ok) continue;
      const data=await r.json();
      if(Array.isArray(data.events)) return data;
    }catch(e){}
  }
  throw new Error("unreachable");
}
async function loadLive(){
  try{
    const data=await fetchEvents();
    live=data.events;
    const age=Date.now()-Number(data.generatedAt);
    const stale=age>2*3600e3?" That's over 2 hours ago, so collection may be paused.":"";
    $("#snap").textContent=live.length
      ? `Live: ${live.length} events from trusted sources, collected ${when(new Date(Number(data.generatedAt)).toISOString())}.${stale}`
      : "Live, but no events collected yet. The first collection runs within 15 minutes.";
  }catch(e){
    live=null;
    $("#snap").textContent="Live feed unreachable, showing the Sept 30, 2026 snapshot. Retrying every 5 minutes.";
  }
  render();
}
const visible=()=>all().filter(e=>filter==="all"||e.cat===filter);

function drawMap(){
  const svg=$("#map"); let h="";
  for(let x=0;x<=360;x+=30) h+=`<line class="grat" x1="${x}" y1="0" x2="${x}" y2="180"/>`;
  for(let y=0;y<=180;y+=30) h+=`<line class="grat" x1="0" y1="${y}" x2="360" y2="${y}"/>`;
  LAND.forEach(p=>{h+=`<polygon class="land" points="${p.map(([a,b])=>px(a,b).join(",")).join(" ")}"/>`});
  visible().filter(e=>typeof e.lat==="number"&&typeof e.lng==="number").sort((a,b)=>a.sev-b.sev).forEach((e,i)=>{
    const [x,y]=px(e.lng,e.lat), r=1.6+e.sev*.75, c=`var(${(CATS[e.cat]||CATS.markets).v})`;
    const delay=firstDraw?(i*0.09).toFixed(2):"0";
    if(firstDraw) h+=`<circle class="ring" cx="${x}" cy="${y}" r="${r}" stroke="${c}" style="transform-origin:${x}px ${y}px;animation-delay:${delay}s"/>`;
    if(selected===e.id) h+=`<circle class="sel" cx="${x}" cy="${y}" r="${r+2.2}"/>`;
    h+=`<circle class="dot" data-id="${e.id}" cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".85" stroke="var(--surface)" stroke-width=".5" tabindex="0" role="button" aria-label="${esc(e.title)}"><title>${esc(e.title)}</title></circle>`;
  });
  svg.innerHTML=h; firstDraw=false;
  svg.querySelectorAll(".dot").forEach(d=>{
    const go=()=>select(d.dataset.id,true);
    d.addEventListener("click",go);
    d.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();go()}});
  });
}

function drawLegend(){
  $("#legend").innerHTML=Object.values(CATS).map(c=>`<span style="--c:var(${c.v})">${c.label}</span>`).join("");
}

function drawPressure(){
  const score={}; SECTORS.forEach(s=>score[s]=0);
  visible().forEach(e=>(e.sectors||[]).forEach(x=>{if(x.s in score) score[x.s]+=e.sev*x.d}));
  const max=Math.max(5,...Object.values(score).map(Math.abs));
  const rows=SECTORS.map(s=>[s,score[s]]).sort((a,b)=>b[1]-a[1]);
  $("#press").innerHTML=rows.map(([s,v])=>{
    const w=Math.abs(v)/max*50, left=v>=0?50:50-w, col=v>0?"var(--up)":v<0?"var(--down)":"var(--mixed)";
    return `<div class="prow"><span>${s}</span><div class="ptrack" aria-hidden="true"><div class="pbar" style="left:${left}%;width:${w}%;background:${col}"></div></div><span class="pval">${v>0?"+":""}${v}</span></div>`;
  }).join("");
}

function drawChips(){
  const opts=[["all","Everything"],...Object.entries(CATS).map(([k,c])=>[k,c.label])];
  $("#chips").innerHTML=opts.map(([k,l])=>`<button class="chip" data-f="${k}" aria-pressed="${filter===k}">${l}</button>`).join("");
  $("#chips").querySelectorAll(".chip").forEach(b=>b.onclick=()=>{filter=b.dataset.f;selected=null;render()});
}

function dirTag(d){return d>0?'<span class="tag u">Up pressure</span>':d<0?'<span class="tag d">Down pressure</span>':'<span class="tag m">Mixed</span>'}

function drawFeed(){
  const list=visible().slice().sort((a,b)=>(b.mine?1:0)-(a.mine?1:0)||b.sev-a.sev||(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
  if(!list.length){$("#feed").innerHTML='<div class="empty">Nothing in this category yet. Paste a headline above to add one.</div>';return}
  $("#feed").innerHTML=list.map(e=>{
    const on=selected===e.id, c=`var(${(CATS[e.cat]||CATS.markets).v})`;
    const bars=[1,2,3,4,5].map(n=>`<i class="${n<=e.sev?"f":""}"></i>`).join("");
    let body="";
    if(on){
      body=`<div class="evb">
        <p>${esc(e.what)}</p>
        <h3>Chain reaction</h3><ol>${(e.chain||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
        <h3>Sectors touched</h3><div class="sects">${(e.sectors||[]).map(x=>`<div class="sect">${dirTag(x.d)}<span><b>${esc(x.s)}</b>: ${esc(x.why)}</span></div>`).join("")}</div>
        <h3>Tickers to watch</h3><div>${(e.watch||[]).map(t=>`<span class="tick">${esc(t)}</span>`).join("")}</div>
        <div class="src">${esc(e.src)}${safeUrl(e.link)?` · <a href="${esc(e.link)}" target="_blank" rel="noopener noreferrer">Read the source</a>`:""}</div>
        ${e.mine?`<div class="row"><button class="ghost" data-del="${e.id}">Remove from board</button></div>`:""}
      </div>`;
    }
    return `<article class="ev ${on?"on":""}" id="ev-${e.id}" style="--c:${c}">
      <button class="evh" data-id="${e.id}" aria-expanded="${on}">
        <strong>${esc(e.title)}${e.mine?'<span class="mine">Yours</span>':""}</strong>
        <span class="sev" aria-label="Size ${e.sev} of 5">${bars}</span>
        <span class="meta">${esc([(CATS[e.cat]||CATS.markets).label,e.region,when(e.date)].filter(Boolean).join(", "))}</span>
      </button>${body}</article>`;
  }).join("");
  $("#feed").querySelectorAll(".evh").forEach(b=>b.onclick=()=>select(b.dataset.id,false));
  $("#feed").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{added=added.filter(x=>x.id!==b.dataset.del);save();selected=null;render()});
}

function select(id,scroll){
  selected=selected===id&&!scroll?null:id; render();
  if(scroll){const el=document.getElementById("ev-"+id); if(el) el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"})}
}

function render(){drawChips();drawMap();drawPressure();drawFeed()}
drawLegend(); render(); loadLive();
setInterval(loadLive,5*60e3);
document.addEventListener("visibilitychange",()=>{if(!document.hidden) loadLive()});

/* ---------- Analyzer ---------- */
let sample=null;
const go=$("#go"), st=$("#st");
go.disabled=true;
(async()=>{
  try{ sample = window.claude && window.claude.use ? await window.claude.use("sample") : null }catch(e){ sample=null }
  if(sample){$("#analyzer").hidden=false; go.disabled=false; st.textContent=""}
})();

function clean(r,headline){
  const cat=CATS[r.cat]?r.cat:"markets";
  const sev=Math.min(5,Math.max(1,Math.round(+r.sev||2)));
  let lat=+r.lat, lng=+r.lng; if(!isFinite(lat)||!isFinite(lng)){lat=0;lng=0}
  lat=Math.max(-58,Math.min(80,lat)); lng=Math.max(-179,Math.min(179,lng));
  const sectors=(Array.isArray(r.sectors)?r.sectors:[]).filter(x=>SECTORS.includes(x.s)).slice(0,5).map(x=>({s:x.s,d:x.d>0?1:x.d<0?-1:0,why:String(x.why||"").slice(0,140)}));
  return {id:"u"+Date.now(),mine:true,cat,sev,lat,lng,
    date:new Date().toISOString().slice(0,10),
    region:String(r.region||"Unknown").slice(0,60),
    title:String(r.title||headline).slice(0,100),
    what:String(r.what||"").slice(0,500),
    chain:(Array.isArray(r.chain)?r.chain:[]).slice(0,5).map(x=>String(x).slice(0,160)),
    sectors, watch:(Array.isArray(r.watch)?r.watch:[]).slice(0,6).map(x=>String(x).slice(0,10)),
    src:"Your headline: "+headline.slice(0,140)};
}

go.onclick=async()=>{
  const headline=$("#hl").value.trim();
  if(!headline){st.textContent="Paste a headline first.";return}
  go.disabled=true; st.textContent="Reading the headline…";
  const prompt=`You are a careful markets analyst. Analyze this news headline and return ONLY a JSON object, no other text.
Keys:
- title: short plain-English title, max 80 characters
- cat: one of "war","weather","energy","tech","markets"
- sev: integer 1-5, how big the event is for global markets
- region: short place name
- lat, lng: approximate coordinates of where the event happens (numbers)
- what: 2 plain sentences explaining what happened and why it matters
- chain: 3-4 short cause-and-effect steps, including at least one second-order effect most people would miss
- sectors: up to 5 objects {"s": sector, "d": 1 for up pressure, -1 for down pressure, 0 for mixed, "why": short reason}. "s" must be exactly one of: ${SECTORS.join(", ")}
- watch: up to 5 ETF or stock tickers worth watching
Be balanced. Pressure is a direction to research, not a certainty, and markets may already have priced the news in.
Headline: ${headline}`;
  try{
    const r=await sample.json(prompt,{modelTier:"default"});
    const ev=clean(r||{},headline);
    added.unshift(ev); save(); filter="all"; selected=ev.id; render();
    $("#hl").value=""; st.textContent="Added to the board.";
    const el=document.getElementById("ev-"+ev.id); if(el) el.scrollIntoView({block:"center"});
  }catch(err){
    const code=err&&err.code;
    st.textContent = code==="rate_limited" ? "Too many requests right now. Try again in a minute."
      : code==="not_granted" ? "Analysis needs permission to ask Claude. Allow it in the artifact's permissions to use this."
      : code==="cancelled" ? "Analysis stopped."
      : "Couldn't analyze that headline. Try rewording it.";
    if(code==="not_granted") go.style.display="none";
  }finally{ if(go.style.display!=="none") go.disabled=false }
};
