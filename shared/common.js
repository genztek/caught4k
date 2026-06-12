/* ============================================
   CAUGHT4K — common.js
   Site identity, header/footer, content loader,
   wallet helper. Edit CONFIG, every page follows.
   ============================================ */

const CONFIG = {
  siteName: "CAUGHT4K",                 // change brand in ONE place
  brandSplit: ["CAUGHT", "4K"],        // [white part, accent part]
  tagline: "your week, itemised. caught in 4k by your own receipt.",
  domain: "caught4k.fun",               // shown in watermark
  footerText: "© 2026 CAUGHT4K · findings are final · appeals rejected",
  questionsUrl: "questions.json",       // content file (same repo)
  // Wallet addresses allowed into admin.html (lowercase!).
  // NOTE: this is a convenience gate, not security — never put secrets in this site.
  adminWallets: [
    "0xcBbCA61bD878b21c280236be3668bA559B8DA9EF"  // <-- replace with YOUR wallet address
  ]
};

/* ---------- header / footer injection ---------- */
function injectChrome(activeNav){
  const header = document.createElement("div");
  header.className = "c4k-header";
  header.innerHTML = `
    <div class="brand">${CONFIG.brandSplit[0]}<em>${CONFIG.brandSplit[1]}</em></div>
    <div class="tag">${CONFIG.tagline}</div>
    <nav>
      <a href="index.html">THIS WEEK</a>
      <a href="index.html#diary">MY RECEIPTS</a>
    </nav>`;
  document.body.prepend(header);

  const footer = document.createElement("div");
  footer.className = "c4k-footer";
  footer.innerHTML = CONFIG.footerText;
  document.body.append(footer);
}

/* ---------- content loading ---------- */
// Fallback pack so the app still works if questions.json can't be fetched
// (e.g. opening the file directly without hosting).
const FALLBACK_PACK = {
  weekly_bank: [
    {label:"swiggy / zomato orders this week",options:[
      {text:"0–1. cooked like an adult",item:"Home cooking (verified)",charge:0},
      {text:"2–3. balance, allegedly",item:'Swiggy "balance" fee',charge:380},
      {text:"the delivery guy waves at my neighbours now",item:"Swiggy loyalty programme (involuntary)",charge:910}]},
    {label:'"i\'ll sleep early tonight" — this week\'s record',options:[
      {text:"said it, actually did it",item:"Sleep schedule (intact)",charge:0},
      {text:"said it 7 times. delivered 0",item:'"Sleeping early" — 7 promises, 0 delivered',charge:490},
      {text:"didn't even pretend. 3am is a lifestyle",item:"3am lifestyle maintenance",charge:640}]},
    {label:"screen time report said:",options:[
      {text:"under 4 hrs. suspicious but ok",item:"Screen time (within limits)",charge:60},
      {text:'7 hrs "but it\'s for work" (it\'s not)',item:'Screen time labelled "work" (audit: rejected)',charge:520},
      {text:"my phone suggested i seek help",item:"Phone wellness intervention fee",charge:780}]},
    {label:"workout situation:",options:[
      {text:"actually went. multiple times. who am i",item:"Gym attendance (confirmed, shocking)",charge:0},
      {text:"membership active. attendance: declined to comment",item:"Gym membership — donation to gym owner",charge:450},
      {text:"my walk to the fridge counts",item:"Fridge cardio programme",charge:310}]},
    {label:"money that vanished with no explanation:",options:[
      {text:"under ₹500. budgeting royalty",item:"Misc spending (acceptable)",charge:90},
      {text:"₹500–2000 on... things? items?",item:'Unexplained "things and items"',charge:560},
      {text:"opened bank statement. closed it immediately.",item:"Financial denial processing",charge:830}]}
  ],
  seasonal: [],
  drops: [],
  verdicts: [
    "SAME RECEIPT NEXT WEEK. WE BOTH KNOW IT.",
    "MONDAY-YOU KEEPS WRITING CHEQUES SUNDAY-YOU CAN'T CASH.",
    "YOUR HABITS HAVE FILED A FORMAL COMPLAINT.",
    "AUDIT FINDS: YOU KNEW EXACTLY WHAT YOU WERE DOING.",
    '"STARTING MONDAY" HAS BEEN CARRIED FORWARD. AGAIN.'
  ]
};

async function loadContent(){
  try{
    const r = await fetch(CONFIG.questionsUrl + "?v=" + Date.now()); // bust cache so drops appear fast
    if(!r.ok) throw new Error("fetch failed");
    return await r.json();
  }catch(e){
    console.warn("Using fallback pack:", e.message);
    return FALLBACK_PACK;
  }
}

/* ---------- week / pack selection ---------- */
function isoWeek(d=new Date()){
  const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=date.getUTCDay()||7;
  date.setUTCDate(date.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-y0)/86400000)+1)/7);
}

// deterministic pick: same 5 questions for EVERYONE in a given week
function pickWeekly(bank, week, n=5){
  const idx=[...bank.keys()];
  let s=(week*2654435761)>>>0;
  function rnd(){
    s=(s+0x6D2B79F5)>>>0;
    let t=Math.imul(s^(s>>>15),1|s);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  }
  for(let i=idx.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [idx[i],idx[j]]=[idx[j],idx[i]];
  }
  return idx.slice(0,Math.min(n,bank.length)).map(i=>bank[i]);
}

function activeDrop(content, now=new Date()){
  return (content.drops||[]).find(d=>{
    const s=new Date(d.starts), e=new Date(d.ends);
    return now>=s && now<=e;
  })||null;
}

function seasonalPack(content, week){
  return (content.seasonal||[]).find(s=>s.week===week)||null;
}

/* ---------- wallet helper (admin gate) ---------- */
async function connectWallet(){
  if(!window.ethereum) return {error:"No wallet found. Install MetaMask (or open in a wallet browser)."};
  try{
    const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
    return {address:(accounts[0]||"").toLowerCase()};
  }catch(e){
    return {error:"Wallet connection rejected."};
  }
}

function isAdmin(address){
  return CONFIG.adminWallets.map(a=>a.toLowerCase()).includes(address);
}

/* ---------- misc shared ---------- */
function toast(msg){
  let t=document.querySelector(".toast");
  if(!t){t=document.createElement("div");t.className="toast";document.body.append(t);}
  t.textContent=msg;t.style.display="block";
  clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",3200);
}
