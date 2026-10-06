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

let filter="all", selected=null, firstDraw=true, live=null, card=null, preds=[], quotes={}, watch=null, optionsData=null;
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
    card=data.scorecard||null;
    quotes=(data.market&&data.market.quotes)||{};
    watch=data.watch||null;
    optionsData=data.options||null;
    preds=Array.isArray(data.predictions)?data.predictions:[];
    const age=Date.now()-Number(data.generatedAt);
    const stale=age>2*3600e3?" That's over 2 hours ago, so collection may be paused.":"";
    $("#snap").textContent=live.length
      ? `Live: ${live.length} events from trusted sources, collected ${when(new Date(Number(data.generatedAt)).toISOString())}.${stale}`
      : "Live, but no events collected yet. The first collection runs within 15 minutes.";
  }catch(e){
    live=null; card=null; preds=[]; quotes={}; watch=null; optionsData=null;
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

function sectorPressure(list){
  const score={}; SECTORS.forEach(s=>score[s]=0);
  list.forEach(e=>(e.sectors||[]).forEach(x=>{if(x.s in score) score[x.s]+=e.sev*x.d}));
  return score;
}
function drawPressure(){
  const score=sectorPressure(visible());
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
        <h3>Tickers to watch</h3><div>${(e.watch||[]).map(t=>tickerRow(e,t)).join("")}</div>
        ${(()=>{const mine=preds.filter(p=>p.eventId===e.id);return mine.length?`<h3>How the calls did</h3><div class="sects">${mine.map(p=>`<div class="sect">${resultTag(p.status)}<span>${tickChip(p.ticker,p.d)}${typeof p.excess==="number"?`${signed(p.excess)} vs the market`:p.status==="pending"?"checked after the next trading day":""}</span></div>`).join("")}</div>`:""})()}
        ${outlets(e).length>1?`<h3>Reported by ${outlets(e).length} trusted outlets</h3><ul class="srclist">${outlets(e).map(x=>`<li>${safeUrl(x.link)?`<a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${esc(x.src)}</a>`:esc(x.src)}</li>`).join("")}</ul>`:`<div class="src">${esc(e.src)}${safeUrl(e.link)?` · <a href="${esc(e.link)}" target="_blank" rel="noopener noreferrer">Read the source</a>`:""}</div>`}
        ${e.mine?`<div class="row"><button class="ghost" data-del="${e.id}">Remove from board</button></div>`:""}
      </div>`;
    }
    return `<article class="ev ${on?"on":""}" id="ev-${e.id}" style="--c:${c}">
      <button class="evh" data-id="${e.id}" aria-expanded="${on}">
        <strong>${esc(e.title)}${e.mine?'<span class="mine">Yours</span>':""}${confBadge(e)}</strong>
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

// Sector fund for each sector, matching the server's list.
const SECTOR_ETF={"Energy":"XLE","Defense":"ITA","Shipping & freight":"IYT","Insurance":"KIE","Utilities & power":"XLU","Consumer staples":"XLP","Consumer discretionary":"XLY","Semiconductors":"SMH","Cloud & software":"IGV","Travel & airlines":"JETS","Agriculture":"DBA","Banks & rate-sensitive":"KRE"};
function tickerDir(e,t){const s=(e.sectors||[]).find(x=>SECTOR_ETF[x.s]===t);return s?s.d:0}
function tickChip(t,d){
  const cls=d>0?" up":d<0?" down":"", arrow=d>0?"▲ ":d<0?"▼ ":"";
  const label=d>0?"predicted up":d<0?"predicted down":"no direction";
  return `<span class="tick${cls}" data-tk="${esc(t)}" role="button" tabindex="0" title="${esc(t)}: ${label}. Click for the 5-year chart" aria-label="${esc(t)}, ${label}. Show 5-year chart">${arrow}${esc(t)}</span>`;
}
const TIER_NAME={small:"Small",medium:"Medium",big:"Big"};
const tierFor=sev=>sev>=4?"big":sev>=3?"medium":"small";
const money=x=>`$${x>=1000?x.toLocaleString(undefined,{maximumFractionDigits:0}):x.toFixed(2)}`;
function chg(x){if(typeof x!=="number")return"";const c=x>0?"u":x<0?"d":"";return `<span class="chg ${c}">${x>0?"+":""}${(x*100).toFixed(2)}%</span>`}
function tickerRow(e,t){
  const d=tickerDir(e,t), q=quotes[t];
  const call=d?`<span class="tier">${TIER_NAME[tierFor(e.sev)]} ${d>0?"up":"down"} call</span>`:`<span class="tier">No call</span>`;
  const px=q?`<span><span class="num">${money(q.price)}</span> ${chg(q.changePct)} <span class="tier">today</span></span>`:"";
  return `<div class="trow">${tickChip(t,d)}${call}${px}</div>`;
}
function ago(d){
  const m=Math.round((Date.now()-Date.parse(d))/60000);
  if(!Number.isFinite(m)) return "";
  if(m<1) return "just now"; if(m<60) return `${m} min ago`;
  const h=Math.round(m/60); if(h<24) return `${h} hr ago`;
  return `${Math.round(h/24)} days ago`;
}
const outlets=e=>Array.isArray(e.sources)?e.sources:[];
const confBadge=e=>outlets(e).length>1?`<span class="conf">Confirmed by ${outlets(e).length} sources</span>`:"";

function drawQueue(){
  const list=all().slice().sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,5);
  $("#queue").innerHTML=list.length?list.map(e=>{
    const c=`var(${(CATS[e.cat]||CATS.markets).v})`;
    const who=outlets(e).length?outlets(e).map(x=>x.outlet||x.src).join(" · "):(e.src||"");
    return `<li class="qi" style="--c:${c}"><button data-q="${esc(e.id)}"><div class="qt">${esc(e.title)}</div><div class="qm">${esc(ago(e.date))} · ${esc(who)}${confBadge(e)}</div></button></li>`;
  }).join(""):'<li class="note">No stories yet.</li>';
  $("#queue").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{filter="all";select(b.dataset.q,true)});
}

const pct=x=>`${Math.round(x*100)}%`;
const signed=x=>`${x>0?"+":""}${(x*100).toFixed(1)}%`;
const resultTag=st=>st==="hit"?'<span class="res hit">✓ Hit</span>':st==="miss"?'<span class="res miss">✗ Miss</span>':st==="flat"?'<span class="res">Tie</span>':'<span class="res">Waiting</span>';

function trendTag(t){return t==="up"?'<span class="trend up">Uptrend</span>':t==="down"?'<span class="trend down">Downtrend</span>':t?'<span class="trend">Mixed</span>':""}

function drawWatch(){
  const w=$("#watch"), m=$("#movers");
  if(!watch){w.innerHTML='<p class="note">Prices appear when live data loads.</p>';m.innerHTML="";return}
  const press=sectorPressure(live||[]);
  w.innerHTML=watch.watchlist.map(r=>{
    const p=r.sector?press[r.sector]||0:0;
    const news=r.mentions&&r.mentions.length?` · ${r.mentions.length} in the news`:"";
    const label=r.sector?`${esc(r.name)}<small>${esc(r.sector)}${news}</small>`:`${esc(r.name)}<small>Market${news}</small>`;
    return `<div class="wrow">${tickChip(r.ticker,Math.sign(p))}<span class="nm">${label}</span><span class="num">${typeof r.price==="number"?money(r.price):"–"}<br>${chg(r.changePct)}</span>${trendTag(r.trend)}</div>`;
  }).join("");
  const list=(rows,empty)=>rows.length?rows.map(r=>`<div class="mrow"><b>${esc(r.ticker)}</b>${chg(r.changePct)}</div>`).join(""):`<p class="note">${empty}</p>`;
  m.innerHTML=`<div class="mv"><div><h3>Up</h3>${list(watch.movers.up,"None yet")}</div><div><h3>Down</h3>${list(watch.movers.down,"None yet")}</div></div>`;
}

function drawDash(){
  const el=$("#dash");
  if(!card){el.innerHTML='<p class="note">The dashboard appears when live data loads.</p>';return}
  const r=(n,d)=>d?pct(n/d):"–";
  const kpi=(v,l)=>`<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  let h=`<div class="kpis">
    ${kpi(card.hitRate===null?"–":pct(card.hitRate),"Direction right")}
    ${kpi(card.sizeRate==null?"–":pct(card.sizeRate),"Direction and size right")}
    ${kpi(card.scored,"Calls scored")}
    ${kpi(card.pending,"Waiting for the next close")}
  </div>`;
  if(!card.scored){
    el.innerHTML=h+`<p class="note">${card.pending?"First results arrive after the next trading day closes.":"No calls yet. New events with an up or down sector start a call."}</p>`;
    return;
  }
  const rate=card.hitRate, col=rate>=.5?"var(--up)":"var(--down)";
  h+=`<div class="vs" aria-hidden="true"><div class="fill" style="width:${rate*100}%;background:${col}"></div><div class="coin"></div></div>
    <div class="vslab"><span>0%</span><span>Coin flip 50%</span><span>100%</span></div>
    ${card.scored<30?`<p class="note">Only ${card.scored} call${card.scored===1?"":"s"} scored so far. Treat these numbers as rough until 30 or more.</p>`:""}`;
  const tiers=["big","medium","small"].filter(t=>card.byTier&&card.byTier[t]);
  const tierTbl=`<div class="scroll"><table class="tbl"><thead><tr><th>Call size</th><th class="r">Calls</th><th class="r">Direction right</th><th class="r">Size right</th></tr></thead><tbody>
    ${tiers.map(t=>{const b=card.byTier[t];return `<tr><td>${TIER_NAME[t]}</td><td class="r">${b.scored}</td><td class="r">${r(b.hits,b.scored)}</td><td class="r">${r(b.sizeHits,b.scored)}</td></tr>`}).join("")}
  </tbody></table></div>`;
  const secs=Object.entries(card.bySector).sort((a,b)=>b[1].scored-a[1].scored);
  const secTbl=`<div class="scroll"><table class="tbl"><thead><tr><th>Sector</th><th class="r">Calls</th><th class="r">Direction right</th></tr></thead><tbody>
    ${secs.map(([s,b])=>`<tr><td>${esc(s)}</td><td class="r">${b.scored}</td><td class="r">${r(b.hits,b.scored)}</td></tr>`).join("")}
  </tbody></table></div>`;
  const days=card.daily||[];
  const histo=days.length?`<div class="hist" role="img" aria-label="Daily direction hit rate">${days.map(d=>{const v=d.hits/d.scored;return `<div class="b" title="${d.date}: ${d.hits}/${d.scored} right"><div class="half"></div><i style="height:${Math.max(4,v*100)}%;background:${v>=.5?"var(--up)":"var(--down)"}"></i></div>`}).join("")}</div>
    <div class="histlab"><span>${days[0].date.slice(5)}</span><span>Dashed line = 50%</span><span>${days.at(-1).date.slice(5)}</span></div>`:"";
  const recent=`<div>${(card.recent||[]).map(x=>`<div class="rrow">${resultTag(x.status)}<span class="t" title="${esc(x.title)}">${tickChip(x.ticker,x.d)} <span class="tier">${TIER_NAME[x.tier]||""} call${x.actualTier?`, moved ${TIER_NAME[x.actualTier].toLowerCase()}`:""}</span> ${esc(x.title)}</span><span class="num">${typeof x.excess==="number"?signed(x.excess):""}</span></div>`).join("")}</div>`;
  h+=`<div class="dgrid">
    <div><h3 class="tier" style="margin:0 0 6px">By call size</h3>${tierTbl}<p class="note">If bigger calls aren't more accurate than small ones, the size tiers aren't telling you anything yet.</p></div>
    <div><h3 class="tier" style="margin:0 0 6px">Daily direction hit rate (last 14 days)</h3>${histo}</div>
    <div><h3 class="tier" style="margin:0 0 6px">By sector</h3>${secTbl}</div>
    <div><h3 class="tier" style="margin:0 0 6px">Latest results</h3>${recent}<p class="note">The number on the right is how the fund did compared with the market.</p></div>
  </div>`;
  el.innerHTML=h;
}

const VOICES=[
  {id:"musk",name:"Elon Musk",role:"CEO of Tesla and SpaceX",tickers:["TSLA","SPCX"]},
  {id:"trump",name:"Donald Trump",role:"US President",tickers:["SPY","DJT"]},
  {id:"zuckerberg",name:"Mark Zuckerberg",role:"CEO of Meta",tickers:["META"]}
];
function sourceKind(e){
  const s=e.src||"";
  if(/unofficial/i.test(s)) return '<span class="kind unoff">Unofficial archive</span>';
  if(/Federal Register|SEC EDGAR|Meta Newsroom|American Presidency Project/.test(s)) return '<span class="kind off">Official</span>';
  return "";
}
function drawVoices(){
  const el=$("#voices");
  const evs=all().filter(e=>Array.isArray(e.people)&&e.people.length);
  el.innerHTML=VOICES.map(v=>{
    const mine=evs.filter(e=>e.people.includes(v.id)).sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,4);
    const tix=v.tickers.map(t=>quotes[t]?`<span>${tickChip(t,0)} ${money(quotes[t].price)} ${chg(quotes[t].changePct)}</span>`:`<span>${tickChip(t,0)}</span>`).join("");
    const items=mine.length?mine.map(e=>{
      const who=outlets(e).length?outlets(e).map(x=>x.outlet||x.src).join(" · "):(e.src||"");
      return `<button class="vitem" data-v="${esc(e.id)}"><div class="qt">${esc(e.title)}</div><div class="qm">${esc(ago(e.date))} · ${esc(who)}${sourceKind(e)}${confBadge(e)}</div></button>`;
    }).join(""):'<p class="note" style="margin:4px 0 0">Nothing new yet.</p>';
    return `<div class="vgroup"><div class="vhead"><b>${esc(v.name)}</b><small>${esc(v.role)}</small></div><div class="vtix">${tix}</div>${items}</div>`;
  }).join("")+'<p class="note">Direct posts on X are not included (no free official feed). Trump\'s Truth Social posts come from two public archives: UC Santa Barbara (trusted, about a day behind) and trumpstruth.org (faster, unofficial).</p>';
  el.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{filter="all";select(b.dataset.v,true)});
}
const shortMoney=x=>x>=1e9?`$${(x/1e9).toFixed(1)}B`:x>=1e6?`$${(x/1e6).toFixed(1)}M`:`$${Math.round(x/1e3)}K`;
const expShort=d=>{const t=Date.parse(d+"T12:00:00Z");return Number.isNaN(t)?d:new Date(t).toLocaleDateString([], {month:"short",day:"numeric",timeZone:"UTC"})};
function drawOptions(){
  const el=$("#options");
  if(!optionsData){el.innerHTML='<p class="note">The sweep appears when live data loads.</p>';return}
  const f=optionsData.flagged||[];
  const head=`<p class="note" style="margin-top:0">Scanned ${Number(optionsData.scanned)||0} stocks, ${esc(when(new Date(optionsData.at).toISOString()))}. Cboe data, about 15 minutes delayed. Checks hourly while the market is open.</p>`;
  const rows=f.length?f.slice(0,12).map(o=>{
    const d=o.type==="call"?1:-1, num=x=>Number(x)||0;
    const strike=num(o.strike), dte=Math.round(num(o.dte)), vol=Math.round(num(o.volume)), mny=Number(o.moneyness);
    const ratio=num(o.oi)?`${num(o.ratio)}× open contracts`:"all new";
    const money2=Number.isFinite(mny)&&o.moneyness!==null?` · strike ${mny>0?"+":""}${(mny*100).toFixed(0)}% from price`:"";
    return `<div class="orow"><span class="od">${tickChip(o.ticker,d)} <b>${d>0?"Call":"Put"} $${strike}</b> · ${esc(expShort(o.expiry))} (${dte} days)<small>${vol.toLocaleString()} contracts, ${ratio}${money2}</small></span><span class="prem">${shortMoney(num(o.premium))}</span></div>`;
  }).join(""):'<p class="note">No trades met the rules in the last sweep.</p>';
  el.innerHTML=head+rows+'<p class="note">Calls lean up, puts lean down, but this shows a big trade happened, not who bought or sold it. Large puts are often hedges. These are not counted in the accuracy dashboard.</p>';
}

/* ---------- 5-year chart pop-up ---------- */
let historyData=null, historyTried=false;
async function loadHistory(){
  if(historyData||historyTried) return historyData;
  historyTried=true;
  try{const r=await fetch("history.json",{cache:"no-store"}); if(r.ok){const d=await r.json(); if(d&&d.series) historyData=d;}}catch(e){}
  if(!historyData) setTimeout(()=>{historyTried=false},60e3);
  return historyData;
}
const ETF_SECTOR=Object.fromEntries(Object.entries(SECTOR_ETF).map(([s,t])=>[t,`${s} fund`]));
function tickerName(t){
  const w=watch&&watch.watchlist.find(r=>r.ticker===t);
  return w?w.name:ETF_SECTOR[t]||(t==="SPY"?"S&P 500":"");
}
const RANGES=[["1Y",52],["3Y",156],["5Y",Infinity]];
function openChart(t){
  const back=document.activeElement;
  const wrap=document.createElement("div");
  wrap.className="chartbox";
  wrap.innerHTML=`<div class="inner" role="dialog" aria-modal="true" aria-labelledby="ch-h">
    <div class="chhead"><h2 id="ch-h">${esc(t)} <small>${esc(tickerName(t))}</small></h2><button class="ghost" data-c="close" aria-label="Close chart">Close</button></div>
    <div class="ranges" role="group" aria-label="Time range">${RANGES.map(([l],i)=>`<button class="chip" data-r="${i}" aria-pressed="${i===2}">${l}</button>`).join("")}</div>
    <div class="chartarea"><p class="note">Loading price history…</p></div>
    <div class="chstats"></div>
    <p class="note">Weekly closing prices from free public sources, refreshed twice a day. Dividends are not included.</p>
  </div>`;
  document.body.appendChild(wrap);
  const close=()=>{wrap.remove();document.removeEventListener("keydown",onKey);if(back&&back.focus)back.focus()};
  const onKey=e=>{if(e.key==="Escape")close()};
  document.addEventListener("keydown",onKey);
  wrap.addEventListener("click",e=>{
    if(e.target===wrap||e.target.dataset.c==="close") close();
    const r=e.target.dataset.r; if(r!==undefined){wrap.querySelectorAll("[data-r]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.r===r));draw(+r)}
  });
  wrap.querySelector('[data-c="close"]').focus();
  let series=null;
  function draw(ri){
    const area=wrap.querySelector(".chartarea"), stats=wrap.querySelector(".chstats");
    if(!series){area.innerHTML=`<p class="note">No history for ${esc(t)} yet. History covers the watchlist, the movers list and the sector funds, and fills in on the next collection.</p>`;stats.innerHTML="";return}
    const n=RANGES[ri][1], start=Math.max(0,series.closes.length-n);
    const c=series.closes.slice(start).map(Number), d=series.dates.slice(start);
    if(c.length<2){area.innerHTML='<p class="note">Not enough data for this range.</p>';stats.innerHTML="";return}
    const W=Math.round(Math.max(300,Math.min(700,area.clientWidth||640))),H=W<480?220:260,L=6,R=58,T=12,B=26;
    let lo=Math.min(...c), hi=Math.max(...c); const pad=(hi-lo)*.06||1; lo-=pad; hi+=pad;
    const x=i=>L+i*(W-L-R)/(c.length-1), y=v=>T+(hi-v)*(H-T-B)/(hi-lo);
    const pts=c.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const up=c.at(-1)>=c[0], col=up?"var(--up)":"var(--down)";
    const grid=[0,1,2,3].map(k=>{const v=lo+(hi-lo)*(k+.5)/4;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${W-R+6}" y="${y(v)+4}" class="gt">${money(v)}</text>`}).join("");
    let years="",lastY="";
    d.forEach((dt,i)=>{const yr=dt.slice(0,4); if(yr!==lastY&&i>0){years+=`<line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H-B}" class="gl"/><text x="${x(i)+3}" y="${H-8}" class="gt">${yr}</text>`} lastY=yr});
    if(!years){const fmt=dt=>new Date(dt+"T12:00:00Z").toLocaleDateString([], {month:"short",day:"numeric",timeZone:"UTC"});years=`<text x="${L}" y="${H-8}" class="gt">${fmt(d[0])}</text><text x="${W-R}" y="${H-8}" class="gt" text-anchor="end">${fmt(d.at(-1))}</text>`}
    area.innerHTML=`<svg viewBox="0 0 ${W} ${H}" class="pchart" role="img" aria-label="${esc(t)} weekly closing price, ${esc(d[0])} to ${esc(d.at(-1))}, from ${money(c[0])} to ${money(c.at(-1))}">
      ${grid}${years}
      <polygon points="${x(0)},${H-B} ${pts} ${x(c.length-1)},${H-B}" fill="${col}" opacity=".12"/>
      <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>
      <g class="hov" style="display:none"><line class="hl" y1="${T}" y2="${H-B}"/><circle r="4" fill="${col}"/><rect class="hb" rx="3" height="20"/><text class="ht"></text></g>
      <rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent" class="hit"/>
    </svg>`;
    const svg=area.querySelector("svg"), g=svg.querySelector(".hov");
    const show=ev=>{
      const r=svg.getBoundingClientRect(), px=(ev.clientX-r.left)*W/r.width;
      const i=Math.max(0,Math.min(c.length-1,Math.round((px-L)/((W-L-R)/(c.length-1)))));
      const label=`${new Date(d[i]+"T12:00:00Z").toLocaleDateString([], {month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})} · ${money(c[i])}`;
      g.style.display=""; g.querySelector(".hl").setAttribute("x1",x(i)); g.querySelector(".hl").setAttribute("x2",x(i));
      g.querySelector("circle").setAttribute("cx",x(i)); g.querySelector("circle").setAttribute("cy",y(c[i]));
      const tw=label.length*6.6+12, tx=Math.min(Math.max(x(i)-tw/2,L),W-R-tw);
      g.querySelector(".hb").setAttribute("x",tx); g.querySelector(".hb").setAttribute("y",T); g.querySelector(".hb").setAttribute("width",tw);
      const tt=g.querySelector(".ht"); tt.textContent=label; tt.setAttribute("x",tx+6); tt.setAttribute("y",T+14);
    };
    svg.addEventListener("pointermove",show); svg.addEventListener("pointerdown",show);
    svg.addEventListener("pointerleave",ev=>{if(ev.pointerType==="mouse") g.style.display="none"});
    const yearsWanted=ri===0?1:ri===1?3:5, firstDate=series.dates[0];
    const newer=Date.parse(firstDate)>Date.now()-yearsWanted*365.25*864e5+30*864e5;
    if(newer) area.insertAdjacentHTML("beforeend",`<p class="note" style="margin:6px 0 0">Trading since ${new Date(firstDate+"T12:00:00Z").toLocaleDateString([], {month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}, so this shows its full history.</p>`);
    const q=quotes[t], now=q?q.price:c.at(-1), chgR=c.at(-1)/c[0]-1;
    const avg50=series.closes.length>=50?series.closes.slice(-50).reduce((a,b)=>a+Number(b),0)/50:null;
    const stat=(l,v)=>`<div class="kpi"><div class="v sm">${v}</div><div class="l">${l}</div></div>`;
    stats.innerHTML=`<div class="kpis">
      ${stat(q?"Price now":"Last weekly close",money(now))}
      ${stat(newer?"Change since listing":`Change over ${RANGES[ri][0]}`,chg(chgR))}
      ${stat(newer?"High / low since listing":`High / low over ${RANGES[ri][0]}`,`${money(Math.max(...c))} / ${money(Math.min(...c))}`)}
      ${avg50?stat("Vs 50-week average",now>=avg50?'<span class="chg u">Above</span>':'<span class="chg d">Below</span>'):""}
    </div>`;
  }
  loadHistory().then(h=>{series=h&&h.series[t]||null;draw(2)});
}
document.addEventListener("click",e=>{const el=e.target.closest&&e.target.closest("[data-tk]"); if(!el) return; e.preventDefault(); e.stopPropagation(); openChart(el.dataset.tk)},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ") return; const el=e.target.closest&&e.target.closest("[data-tk]"); if(!el) return; e.preventDefault(); e.stopPropagation(); openChart(el.dataset.tk)},true);

function render(){drawChips();drawMap();drawPressure();drawFeed();drawQueue();drawWatch();drawOptions();drawVoices();drawDash()}
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
