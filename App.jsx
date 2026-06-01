import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════════
   INTERVIEWAI — COMPLETE PREMIUM PLATFORM
   ✦ Interviewer Personas  ✦ Session Memory  ✦ Comm Analysis
   ✦ Why This Score?       ✦ Adaptation Visibility
   ✦ Radar Dashboard       ✦ Hiring Decision
══════════════════════════════════════════════════════════════════ */

const CLAUDE = "https://api.anthropic.com/v1/messages";
const MODEL  = "claude-sonnet-4-20250514";

const DIFF = {
  easy:   { time:90,  label:"Easy",   clr:"#10b981", bg:"rgba(16,185,129,.12)", border:"rgba(16,185,129,.3)", glow:"rgba(16,185,129,.3)", wt:1.0 },
  medium: { time:120, label:"Medium", clr:"#f59e0b", bg:"rgba(245,158,11,.12)", border:"rgba(245,158,11,.3)", glow:"rgba(245,158,11,.3)", wt:1.3 },
  hard:   { time:150, label:"Hard",   clr:"#ef4444", bg:"rgba(239,68,68,.12)",  border:"rgba(239,68,68,.3)",  glow:"rgba(239,68,68,.3)",  wt:1.6 },
};

/* ── Interviewer Personas ── */
const PERSONAS = {
  faang: {
    name:"FAANG Interviewer", icon:"⚡", clr:"#3b82f6",
    desc:"Google/Meta level. Expects optimal solutions, edge cases, and scalability thinking.",
    style:"You are a senior FAANG (Google/Meta/Amazon) technical interviewer. Be precise, rigorous. Expect candidates to discuss time complexity, edge cases, scalability, and system design. Ask probing follow-ups.",
    loadMsg:"Your FAANG interviewer is loading your profile…",
    tone:"precise and analytical",
  },
  startup: {
    name:"Startup Interviewer", icon:"🚀", clr:"#f59e0b",
    desc:"Fast-paced, product-minded. Values pragmatism, shipping mentality, and ownership.",
    style:"You are a technical interviewer at a fast-growing startup. Value pragmatism, speed, product thinking, and ability to handle ambiguity. You like candidates who can wear multiple hats.",
    loadMsg:"Your startup interviewer is spinning up…",
    tone:"direct and pragmatic",
  },
  friendly: {
    name:"Friendly Interviewer", icon:"😊", clr:"#10b981",
    desc:"Supportive and encouraging. Constructive feedback, positive reinforcement.",
    style:"You are a supportive, friendly technical interviewer. Give warm, constructive feedback. Help candidates feel comfortable and show their best. Be encouraging but still technically rigorous.",
    loadMsg:"Your friendly interviewer is getting ready…",
    tone:"warm and encouraging",
  },
  strict: {
    name:"Strict Interviewer", icon:"🎯", clr:"#ef4444",
    desc:"High standards, minimal tolerance. Expects complete, precise, well-structured answers.",
    style:"You are a very strict, demanding technical interviewer. You have high standards and quickly identify vagueness, incomplete answers, or lack of depth. Be direct about shortcomings.",
    loadMsg:"Your strict interviewer is calibrating expectations…",
    tone:"direct and demanding",
  },
};

const MAX_Q=10, FAIL_SC=30, CF_LIMIT=2, ROLL_MIN=35, ROLL_LEN=3;
const QTYPES=["technical","behavioral","technical","scenario","technical","conceptual","behavioral","technical","scenario","technical"];

/* ── Communication Analysis (client-side, no AI needed) ── */
function analyzeComm(text) {
  if (!text || text.trim().length < 5) return { wc:0, fillers:0, structure:0, confidence:50, verbosity:"Too Brief", vScore:10, clarity:"poor" };
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const FILLERS = ["um","uh","like","you know","basically","literally","actually","sort of","kind of","i mean","right so","i guess"];
  const fillers = FILLERS.reduce((n,f) => n + (lower.split(f).length - 1), 0);
  const STRUCT = ["first","second","third","finally","in conclusion","additionally","however","therefore","for example","such as","specifically","because","as a result","in summary","to summarize"];
  const structCount = STRUCT.filter(m => lower.includes(m)).length;
  const structure = Math.min(100, structCount * 18);
  const HEDGES = ["i think","maybe","possibly","not sure","i guess","i believe","perhaps","might be","probably","i'm not sure"];
  const hedges = HEDGES.reduce((n,h) => n + (lower.split(h).length - 1), 0);
  const confidence = Math.max(10, 100 - (hedges * 18) - (fillers * 8));
  const verbosity = wc < 20 ? "Too Brief" : wc < 50 ? "Brief" : wc < 140 ? "Good" : wc < 210 ? "Detailed" : "Verbose";
  const vScore = wc < 20 ? 15 : wc < 50 ? 45 : wc < 140 ? 95 : wc < 210 ? 75 : 45;
  const clarity = structure > 60 && confidence > 60 ? "strong" : structure > 30 || confidence > 50 ? "moderate" : "poor";
  return { wc, fillers, structure, confidence: Math.round(confidence), verbosity, vScore, clarity };
}

/* ── Hiring Decision ── */
function getHiringDecision(score) {
  if (score >= 85) return { label:"Strong Hire",  stars:3, clr:"#10b981", bg:"rgba(16,185,129,.1)",  border:"rgba(16,185,129,.35)", desc:"Exceptional performance. Fast-track for offer." };
  if (score >= 70) return { label:"Hire",          stars:2, clr:"#22d3ee", bg:"rgba(34,211,238,.1)", border:"rgba(34,211,238,.3)",  desc:"Clear technical ability. Proceed with confidence." };
  if (score >= 50) return { label:"Borderline",    stars:1, clr:"#f59e0b", bg:"rgba(245,158,11,.1)", border:"rgba(245,158,11,.3)",  desc:"Some strengths but notable gaps. Consider a second round." };
  if (score >= 35) return { label:"No Hire",       stars:0, clr:"#f97316", bg:"rgba(249,115,22,.1)", border:"rgba(249,115,22,.3)",  desc:"Insufficient preparation for this role level." };
  return                  { label:"No Hire",       stars:0, clr:"#ef4444", bg:"rgba(239,68,68,.1)",  border:"rgba(239,68,68,.3)",   desc:"Significant gaps across core competencies." };
}

const scClr  = v => v>=70?"#10b981":v>=50?"#f59e0b":"#ef4444";
const scGrad = v => v>=70?"linear-gradient(135deg,#6ee7b7,#10b981)":v>=50?"linear-gradient(135deg,#fde68a,#f59e0b)":"linear-gradient(135deg,#fca5a5,#ef4444)";
const scRgba = v => v>=70?"rgba(16,185,129,.07)":v>=50?"rgba(245,158,11,.07)":"rgba(239,68,68,.07)";
const safeD  = d => DIFF[d]||DIFF.easy;
const clamp  = (v,mx) => typeof v==="number"&&!isNaN(v) ? Math.min(mx,Math.max(0,Math.round(v))) : 0;

/* ── Global CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#05050b;font-family:'Inter',system-ui,sans-serif;color:#f1f5f9;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes scoreReveal{0%{opacity:0;transform:scale(.45) translateY(16px)}55%{transform:scale(1.07) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes d1{0%,66%,100%{transform:scale(0)}22%{transform:scale(1)}}
@keyframes d2{0%,88%,100%{transform:scale(0)}44%{transform:scale(1)}}
@keyframes d3{22%,100%{transform:scale(0)}66%{transform:scale(1)}}
@keyframes adaptIn{from{opacity:0;transform:translateY(-14px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes radarIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes hirePop{0%{opacity:0;transform:scale(.85)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
@keyframes barGrow{from{width:0}}
.fu {animation:fadeUp .52s cubic-bezier(.22,1,.36,1) both}
.fu1{animation:fadeUp .52s .07s cubic-bezier(.22,1,.36,1) both}
.fu2{animation:fadeUp .52s .14s cubic-bezier(.22,1,.36,1) both}
.fu3{animation:fadeUp .52s .21s cubic-bezier(.22,1,.36,1) both}
.fu4{animation:fadeUp .52s .28s cubic-bezier(.22,1,.36,1) both}
.fu5{animation:fadeUp .52s .35s cubic-bezier(.22,1,.36,1) both}
.sc {animation:scoreReveal .68s cubic-bezier(.34,1.56,.64,1) both}
.hi {animation:hirePop .7s cubic-bezier(.34,1.56,.64,1) both}
.ra {animation:radarIn .8s .2s cubic-bezier(.22,1,.36,1) both}
.ad {animation:adaptIn .45s cubic-bezier(.22,1,.36,1) both}
.d1{animation:d1 1.5s ease infinite}.d2{animation:d2 1.5s ease infinite}.d3{animation:d3 1.5s ease infinite}
.tw{animation:tw .8s ease infinite}
.gtext{background:linear-gradient(135deg,#f1f5f9 0%,#c4b5fd 40%,#a78bfa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.btn{transition:all .18s cubic-bezier(.22,1,.36,1);cursor:pointer;border:none;outline:none;font-family:'Space Grotesk',system-ui}
.btn:hover{transform:translateY(-2px)}.btn:active{transform:translateY(0) scale(.98);filter:brightness(.96)}
.btn-v{background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 4px 24px rgba(139,92,246,.42),inset 0 1px 0 rgba(255,255,255,.14)}
.btn-v:hover{background:linear-gradient(135deg,#9d72ff,#8b5cf6);box-shadow:0 8px 32px rgba(139,92,246,.58)}
.btn-g{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 24px rgba(16,185,129,.38)}
.btn-g:hover{box-shadow:0 8px 32px rgba(16,185,129,.55)}
textarea{font-family:'Inter',system-ui;transition:border-color .2s,box-shadow .2s;resize:vertical}
textarea:focus{outline:none;border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(139,92,246,.2)!important}
.card{transition:border-color .25s ease}
.ci{transition:background .15s ease;cursor:pointer}.ci:hover{background:rgba(255,255,255,.03)!important}
.pill{transition:all .15s ease}.pill:hover{border-color:rgba(139,92,246,.4)!important;color:rgba(196,181,253,.9)!important;transform:translateY(-1px)}
.persona-card{transition:all .2s ease;cursor:pointer}.persona-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.15)!important}
`;

/* ── AI Wrapper ── */
async function ai(sys, usr) {
  const r = await fetch(CLAUDE, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:MODEL, max_tokens:1200, system:sys, messages:[{role:"user",content:usr}] }),
  });
  if (!r.ok) throw new Error("Claude API " + r.status);
  const d = await r.json();
  const raw = d.content.map(b=>b.text||"").join("");
  return JSON.parse(raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim());
}

/* ── Generate Question (with session memory) ── */
async function genQuestion(p, prev, d, personaKey) {
  const persona = PERSONAS[personaKey] || PERSONAS.faang;
  const i = prev.length, qt = QTYPES[i % QTYPES.length];
  // Enhanced memory: include answer snippets for follow-up capability
  const mem = prev.slice(-3).map((q, j) =>
    `Q${prev.length-2+j}[${q.diff},${q.type},score:${q.totalScore}/100]: "${q.text.slice(0,55)}…"\n  → They answered: "${q.answer?.slice(0,100)||'[no answer]'}…"`
  ).join("\n\n");
  const q = await ai(
    `${persona.style}\nReturn ONLY valid JSON, no markdown.`,
    `Candidate: ${p.candidateName} | Role: ${p.targetRole}
Skills: ${p.skills?.slice(0,7).join(",")||"N/A"}
JD requirements: ${p.keyRequirements?.slice(0,5).join(",")||"N/A"}
Areas to probe: ${p.probingAreas?.slice(0,4).join(",")||"N/A"}
Skill gaps: ${p.skillGaps?.slice(0,3).join(",")||"none"}

Previous Q&A session memory:
${mem||"No prior questions yet."}

Instructions:
- Difficulty: ${d} | Type: ${qt} | Q#${i+1}/${MAX_Q} | Time: ${DIFF[d].time}s
- If a previous answer mentioned something interesting, probe deeper into that specific topic.
- Interviewer tone: ${persona.tone}

Return: {"text":"full question","type":"${qt}","diff":"${d}","time":${DIFF[d].time},"keyPoints":["p1","p2","p3"],"idealAnswerBrief":"2-sentence ideal","memoryRef":"null or specific thing from previous answer you referenced"}`
  );
  q.diff=d; q.type=qt; q.time=DIFF[d].time; return q;
}

/* ── Evaluate Answer (with Why This Score) ── */
async function evalAnswer(q, ans, used, timedOut, personaKey) {
  const persona = PERSONAS[personaKey] || PERSONAS.faang;
  const te = timedOut ? 5 : (() => { const r=used/q.time; return r<=.5?20:r<=.7?18:r<=.85?15:r<=.95?12:10; })();
  const ev = await ai(
    `${persona.style}\nYou are now evaluating a candidate's answer. Be thorough. Return ONLY valid JSON.`,
    `Question: ${q.text}
Type: ${q.type} | Difficulty: ${q.diff}
Key points expected: ${q.keyPoints?.join("; ")}
Answer: "${ans||"[no answer — timed out]"}"
Time used: ${used}s / ${q.time}s | Timed out: ${timedOut}
Pre-calculated Time Efficiency: ${te}/20 (DO NOT change this)

Score accuracy, clarity, depth, relevance each 0–20.
Then provide "Why This Score" breakdown — be specific and reference exact parts of the answer.

Return:
{
  "accuracy": 0-20,
  "clarity": 0-20,
  "depth": 0-20,
  "relevance": 0-20,
  "timeEfficiency": ${te},
  "feedback": "2-3 sentence overall feedback in ${persona.tone} tone",
  "idealAnswer": "2-sentence model answer",
  "whyStrong": ["specific strength 1 from their answer", "strength 2 if any"],
  "whyWeak": ["specific gap 1", "gap 2 if any"],
  "missedExpectation": "one key thing a stronger answer would have included",
  "communicationNote": "one sentence on clarity and structure of their response"
}`
  );
  ev.timeEfficiency = te;
  ev.accuracy       = clamp(ev.accuracy, 20);
  ev.clarity        = clamp(ev.clarity,  20);
  ev.depth          = clamp(ev.depth,    20);
  ev.relevance      = clamp(ev.relevance,20);
  ev.total = ev.accuracy + ev.clarity + ev.depth + ev.relevance + te;
  return ev;
}

/* ── Analyze Profile ── */
async function analyzeProfile(resume, jd) {
  return await ai(
    "Senior technical recruiter. Analyze resume+JD thoroughly. Return ONLY valid JSON.",
    `RESUME:\n${resume}\n\nJD:\n${jd}\n\nReturn:{"candidateName":"","targetRole":"","skills":[],"experience":[],"projects":[],"yearsOfExperience":0,"roleRelevance":0,"keyRequirements":[],"skillGaps":[],"strengthAreas":[],"probingAreas":[]}`
  );
}

/* ── Generate Report ── */
async function genReport(qs, p, ended, endR, personaKey) {
  const persona = PERSONAS[personaKey] || PERSONAS.faang;
  const tw=qs.reduce((s,q)=>s+safeD(q.diff).wt,0);
  const ws=qs.reduce((s,q)=>s+q.totalScore*safeD(q.diff).wt,0)/tw;
  const fs=Math.round(ws);
  const cat=fs>=75?"Strong":fs>=50?"Average":"Needs Improvement";
  const SK={
    "Technical Accuracy":qs.map(q=>q.scores.accuracy||0),
    "Communication":qs.map(q=>q.scores.clarity||0),
    "Problem Solving":qs.map(q=>q.scores.depth||0),
    "Time Management":qs.map(q=>q.scores.timeEfficiency||0),
    "Domain Relevance":qs.map(q=>q.scores.relevance||0),
  };
  const sb={};Object.entries(SK).forEach(([k,v])=>{sb[k]=Math.round((v.reduce((a,b)=>a+b,0)/v.length/20)*100);});
  // Aggregate communication analysis
  const commAgg = qs.reduce((acc,q) => {
    const c = analyzeComm(q.answer||"");
    return { wc:acc.wc+c.wc, fillers:acc.fillers+c.fillers, structure:acc.structure+c.structure/qs.length, confidence:acc.confidence+c.confidence/qs.length };
  }, {wc:0,fillers:0,structure:0,confidence:0});
  let ai2;
  try {
    ai2=await ai(
      `${persona.style} You are now writing a final assessment. Be specific and actionable. Return ONLY valid JSON.`,
      `${p.candidateName} | ${p.targetRole} | ${fs}/100 (${cat}) | ${qs.length} questions
Early termination: ${ended?endR:"No"}
Per-question: ${qs.map((q,i)=>`Q${i+1}[${q.diff},${q.type}]:${q.totalScore}`).join(",")}
Skill breakdown: ${JSON.stringify(sb)}
Return: {
  "strengths": ["3-5 specific observed strengths"],
  "weaknesses": ["3-5 specific areas needing work"],
  "actionableFeedback": ["5 concrete numbered steps with specifics"],
  "hiringReadiness": "2-3 sentences — hiring recommendation as ${persona.tone} interviewer",
  "summary": "3-4 sentence overall assessment",
  "improvementRoadmap": [
    {"priority":"High","action":"specific task","timeframe":"this week"},
    {"priority":"High","action":"specific task","timeframe":"this week"},
    {"priority":"Medium","action":"specific task","timeframe":"next month"},
    {"priority":"Low","action":"specific task","timeframe":"ongoing"}
  ]
}`
    );
  } catch(_) {
    ai2={
      strengths:["Performance data available in skill breakdown"],
      weaknesses:["Review per-question feedback for improvement areas"],
      actionableFeedback:["Review ideal answers for each question","Practice within strict time limits","Deepen technical explanations with concrete examples","Structure answers: situation → approach → result","Build targeted study plan for identified skill gaps"],
      hiringReadiness:`Scored ${fs}/100 for the ${p.targetRole} role.`,
      summary:`${qs.length} questions answered. Weighted score: ${fs}/100. Category: ${cat}.`,
      improvementRoadmap:[{priority:"High",action:"Review and practice missed technical concepts",timeframe:"This week"},{priority:"High",action:"Practice structured answer delivery (STAR method)",timeframe:"This week"},{priority:"Medium",action:"Build 2-3 strong projects demonstrating key skills",timeframe:"Next month"},{priority:"Low",action:"Regular mock interview practice",timeframe:"Ongoing"}],
    };
  }
  return {...ai2,finalScore:fs,category:cat,skillBreakdown:sb,questionsAnswered:qs.length,terminatedEarly:ended,terminationReason:endR,questions:qs,profile:p,commAgg,personaKey};
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════════════ */

function CountUp({target,duration=1100}){
  const[n,setN]=useState(0);
  useEffect(()=>{const s=Date.now();const id=setInterval(()=>{const e=Math.min((Date.now()-s)/duration,1);setN(Math.round((1-Math.pow(1-e,3))*target));if(e>=1)clearInterval(id);},14);return()=>clearInterval(id);},[target,duration]);
  return n;
}

function CircleTimer({left,total}){
  const R=54,C=2*Math.PI*R,pct=Math.max(0,left/total);
  const clr=pct>.5?"#10b981":pct>.25?"#f59e0b":"#ef4444";
  const glw=pct>.5?"rgba(16,185,129,.4)":pct>.25?"rgba(245,158,11,.4)":"rgba(239,68,68,.4)";
  return(
    <div style={{position:"relative",width:144,height:144}}>
      <svg width={144} height={144} style={{transform:"rotate(-90deg)",filter:`drop-shadow(0 0 10px ${glw})`}}>
        <circle cx={72} cy={72} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={9}/>
        <circle cx={72} cy={72} r={R} fill="none" stroke={clr} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C*(1-pct)} style={{transition:"stroke-dashoffset 1s linear,stroke .35s ease"}}/>
      </svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
        <div className={left>0&&left<=30?"tw":""} style={{fontSize:27,fontWeight:800,color:clr,fontFamily:"monospace",lineHeight:1,letterSpacing:-1}}>
          {Math.floor(left/60)}:{String(left%60).padStart(2,"0")}
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.28)",marginTop:4,letterSpacing:.8,textTransform:"uppercase"}}>left</div>
      </div>
    </div>
  );
}

function ScoreDial({score}){
  const[shown,setShown]=useState(0);
  useEffect(()=>{const s=Date.now();const id=setInterval(()=>{const e=Math.min((Date.now()-s)/1300,1);setShown(Math.round((1-Math.pow(1-e,3))*score));if(e>=1)clearInterval(id);},14);return()=>clearInterval(id);},[score]);
  const R=82,arc=2*Math.PI*R*.75,off=arc-(arc*shown/100);
  const clr=scClr(score),glw=score>=70?"rgba(16,185,129,.5)":score>=50?"rgba(245,158,11,.5)":"rgba(239,68,68,.5)";
  return(
    <div style={{position:"relative",width:216,height:185,margin:"0 auto"}}>
      <svg width={216} height={185} viewBox="0 0 216 185">
        <path d="M30 168 A82 82 0 1 1 186 168" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={14} strokeLinecap="round"/>
        <path d="M30 168 A82 82 0 1 1 186 168" fill="none" stroke={clr} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={arc} strokeDashoffset={off} style={{filter:`drop-shadow(0 0 8px ${glw})`,transition:"stroke-dashoffset .06s linear"}}/>
      </svg>
      <div style={{position:"absolute",top:"51%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
        <div style={{fontSize:64,fontWeight:900,lineHeight:1,letterSpacing:-3,fontFamily:"'Space Grotesk',sans-serif",background:scGrad(score),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:`drop-shadow(0 0 16px ${glw})`}}>
          {shown}
        </div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.25)",marginTop:4}}>out of 100</div>
      </div>
    </div>
  );
}

function AnimBar({value,delay=0}){
  const[w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(value),delay);return()=>clearTimeout(t);},[value,delay]);
  const clr=scClr(value);
  return(
    <div style={{background:"rgba(255,255,255,.06)",borderRadius:6,height:8,overflow:"hidden"}}>
      <div style={{width:`${w}%`,height:"100%",background:clr,borderRadius:6,boxShadow:`0 0 10px ${clr}50`,transition:"width 1.15s cubic-bezier(.34,1.2,.64,1)"}}/>
    </div>
  );
}

/* ── Radar Chart (SVG spider chart) ── */
function RadarChart({scores,size=220}){
  const[anim,setAnim]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAnim(true),300);return()=>clearTimeout(t);},[]);
  const axes=[
    {label:"Technical",key:"Technical Accuracy"},
    {label:"Comms",key:"Communication"},
    {label:"Depth",key:"Problem Solving"},
    {label:"Timing",key:"Time Management"},
    {label:"Domain",key:"Domain Relevance"},
  ];
  const N=axes.length,CX=size/2,CY=size/2,MAX_R=size*0.36,ang=i=>(i*2*Math.PI/N)-Math.PI/2;
  const gridPts=f=>axes.map((_,i)=>{const a=ang(i);return`${CX+f*MAX_R*Math.cos(a)},${CY+f*MAX_R*Math.sin(a)}`;}).join(" ");
  const pts=axes.map((ax,i)=>{const v=(scores[ax.key]||0)/100,r=(anim?v:0)*MAX_R,a=ang(i);return{x:CX+r*Math.cos(a),y:CY+r*Math.sin(a),v:scores[ax.key]||0};});
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join("")+"Z";
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ra">
      {[.25,.5,.75,1].map((f,i)=><polygon key={i} points={gridPts(f)} fill="none" stroke={f===1?"rgba(255,255,255,.12)":"rgba(255,255,255,.06)"} strokeWidth={f===1?1:.5}/>)}
      {axes.map((_,i)=>{const a=ang(i);return<line key={i} x1={CX} y1={CY} x2={CX+MAX_R*Math.cos(a)} y2={CY+MAX_R*Math.sin(a)} stroke="rgba(255,255,255,.08)" strokeWidth={.5}/>;  })}
      <path d={path} fill="rgba(139,92,246,.2)" stroke="#8b5cf6" strokeWidth={2} style={{filter:"drop-shadow(0 0 8px rgba(139,92,246,.4))",transition:"all 1.2s cubic-bezier(.34,1.2,.64,1)"}}/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={4} fill="#8b5cf6" style={{filter:"drop-shadow(0 0 5px rgba(139,92,246,.7))",transition:`all 1.2s ${i*.1}s cubic-bezier(.34,1.2,.64,1)`}}/>)}
      {axes.map((ax,i)=>{const a=ang(i),lr=MAX_R+20;return(<text key={i} x={CX+lr*Math.cos(a)} y={CY+lr*Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.45)" fontSize={9} fontFamily="'Space Grotesk',sans-serif" fontWeight="600">{ax.label}</text>);})}
    </svg>
  );
}

/* ── Communication Card ── */
function CommCard({comm}){
  const metrics=[
    {l:"Word Count",    v:comm.vScore,     raw:`${comm.wc} words`,   sub:comm.verbosity},
    {l:"Structure",     v:comm.structure,  raw:`${comm.structure}%`, sub:comm.structure>=60?"Well organized":"Needs structure"},
    {l:"Confidence",    v:comm.confidence, raw:`${comm.confidence}%`,sub:comm.confidence>=70?"Confident delivery":"Some hedging"},
    {l:"Filler Words",  v:Math.max(0,100-comm.fillers*25), raw:`${comm.fillers} detected`, sub:comm.fillers===0?"None detected":comm.fillers<=2?"Minimal":"Reduce fillers"},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {metrics.map(({l,v,raw,sub})=>(
        <div key={l} style={{background:"rgba(0,0,0,.25)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:.6}}>{l}</div>
          <div style={{fontSize:18,fontWeight:800,color:scClr(v),fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>{raw}</div>
          <div style={{background:"rgba(255,255,255,.07)",borderRadius:3,height:3,overflow:"hidden",marginBottom:5}}>
            <div style={{width:`${v}%`,height:"100%",background:scClr(v),borderRadius:3,transition:"width .9s ease"}}/>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════════ */
export default function App(){
  const[phase,setPhase]     =useState("setup");
  const[resume,setResume]   =useState("");
  const[jd,setJd]           =useState("");
  const[persona,setPersona] =useState("faang");
  const[profile,setProfile] =useState(null);
  const[qs,setQs]           =useState([]);
  const[curQ,setCurQ]       =useState(null);
  const[answer,setAnswer]   =useState("");
  const[tLeft,setTLeft]     =useState(0);
  const[diff,setDiff]       =useState("easy");
  const[cf,setCf]           =useState(0);
  const[ended,setEnded]     =useState(false);
  const[endR,setEndR]       =useState("");
  const[ev,setEv]           =useState(null);
  const[report,setReport]   =useState(null);
  const[lMsg,setLMsg]       =useState("");
  const[err,setErr]         =useState("");
  const[openQ,setOpenQ]     =useState(null);
  const[adaptBanner,setAdaptBanner]=useState(null);

  const tRef=useRef(null),subR=useRef(false),t0R=useRef(null);
  const ansR=useRef(""),cqR=useRef(null),qsR=useRef([]);
  const cfR=useRef(0),endedR=useRef(false),endRR=useRef("");
  const diffR=useRef("easy"),profR=useRef(null),sfn=useRef(null),personaR=useRef("faang");

  useEffect(()=>{ansR.current=answer},[answer]);
  useEffect(()=>{cqR.current=curQ},[curQ]);
  useEffect(()=>{qsR.current=qs},[qs]);
  useEffect(()=>{cfR.current=cf},[cf]);
  useEffect(()=>{endedR.current=ended},[ended]);
  useEffect(()=>{endRR.current=endR},[endR]);
  useEffect(()=>{diffR.current=diff},[diff]);
  useEffect(()=>{profR.current=profile},[profile]);
  useEffect(()=>{personaR.current=persona},[persona]);
  useEffect(()=>()=>{clearInterval(tRef.current)},[]);
  useEffect(()=>{const s=document.createElement("style");s.textContent=CSS;document.head.appendChild(s);return()=>{try{document.head.removeChild(s);}catch(_){}};},[]);

  // Auto-dismiss adaptation banner
  useEffect(()=>{ if(adaptBanner){const t=setTimeout(()=>setAdaptBanner(null),4500);return()=>clearTimeout(t);} },[adaptBanner]);

  const stopT=useCallback(()=>{if(tRef.current){clearInterval(tRef.current);tRef.current=null;}},[]);
  const startT=useCallback((lim)=>{
    stopT();subR.current=false;t0R.current=Date.now();setTLeft(lim);
    tRef.current=setInterval(()=>setTLeft(p=>{if(p<=1){clearInterval(tRef.current);tRef.current=null;return 0;}return p-1;}),1000);
  },[stopT]);

  useEffect(()=>{if(tLeft===0&&phase==="interview"&&!subR.current&&t0R.current)sfn.current?.(true);},[tLeft,phase]);

  const doSub=useCallback(async(to=false)=>{
    if(subR.current)return; subR.current=true; stopT();
    const q=cqR.current,a=ansR.current;
    const used=to?q.time:Math.min(Math.round((Date.now()-t0R.current)/1000),q.time);
    const comm=analyzeComm(a);
    setLMsg("Evaluating your answer…"); setPhase("loading");
    let ev2;
    try{ev2=await evalAnswer(q,a,used,to,personaR.current);}
    catch(e){const te=to?5:Math.max(5,10);ev2={accuracy:8,clarity:8,depth:8,relevance:8,timeEfficiency:te,total:32+te,feedback:"Evaluation failed: "+e.message,idealAnswer:"N/A",whyStrong:[],whyWeak:[],missedExpectation:"",communicationNote:""};}
    const done={...q,answer:a,timeUsed:used,timedOut:to,scores:ev2,totalScore:ev2.total,comm};
    const nq=[...qsR.current,done]; setQs(nq); qsR.current=nq; setEv(ev2);
    const ncf=ev2.total<FAIL_SC?cfR.current+1:0; setCf(ncf); cfR.current=ncf;
    // Adaptive: compute next difficulty
    const L=["easy","medium","hard"],idx=L.indexOf(diffR.current);
    const nd=ev2.total>=70&&idx<2?L[idx+1]:ev2.total<40&&idx>0?L[idx-1]:diffR.current;
    if(nd!==diffR.current){
      const up=["easy","medium","hard"].indexOf(nd)>["easy","medium","hard"].indexOf(diffR.current);
      setAdaptBanner({dir:up?"up":"down",from:diffR.current,to:nd,score:ev2.total,
        msg:up?`Strong performance escalating to ${DIFF[nd].label}`:`Adjusting to ${DIFF[nd].label} to rebuild momentum`});
    }
    // Termination check
    const yes = ncf>=CF_LIMIT ? {r:`${CF_LIMIT} consecutive answers below ${FAIL_SC}/100`}
      : nq.length>=ROLL_LEN&&nq.slice(-ROLL_LEN).reduce((s,q)=>s+q.totalScore,0)/ROLL_LEN<ROLL_MIN
        ? {r:`3-Q rolling avg (${(nq.slice(-ROLL_LEN).reduce((s,q)=>s+q.totalScore,0)/ROLL_LEN).toFixed(1)}) below ${ROLL_MIN}`} : null;
    if(yes){setEnded(true);endedR.current=true;setEndR(yes.r);endRR.current=yes.r;}
    setPhase("reveal");
  },[stopT]);

  useEffect(()=>{sfn.current=doSub;},[doSub]);

  const goContinue=async()=>{
    const q=qsR.current;
    if(endedR.current||q.length>=MAX_Q){
      setLMsg("Generating your Interview Readiness Report…"); setPhase("loading");
      try{const r=await genReport(q,profR.current,endedR.current,endRR.current,personaR.current);setReport(r);setPhase("report");}
      catch(e){setErr("Report failed: "+e.message);}
      return;
    }
    const ls=q[q.length-1]?.totalScore??50;
    const L=["easy","medium","hard"],idx=L.indexOf(diffR.current);
    const nd=ls>=70&&idx<2?L[idx+1]:ls<40&&idx>0?L[idx-1]:diffR.current;
    setDiff(nd); diffR.current=nd; setAnswer(""); ansR.current="";
    setLMsg(`Preparing question ${q.length+1} of ${MAX_Q}…`); setPhase("loading");
    try{const nq=await genQuestion(profR.current,q,nd,personaR.current);setCurQ(nq);cqR.current=nq;setPhase("interview");startT(nq.time);}
    catch(e){setErr("Question error: "+e.message);}
  };

  const begin=async()=>{
    if(!resume.trim()||!jd.trim()){setErr("Please fill in both fields.");return;}
    setErr(""); setLMsg(PERSONAS[persona].loadMsg); setPhase("loading");
    try{
      const p=await analyzeProfile(resume,jd); setProfile(p); profR.current=p;
      setLMsg("Generating your first question…");
      const q=await genQuestion(p,[],"easy",persona); setCurQ(q); cqR.current=q;
      setDiff("easy"); diffR.current="easy"; setPhase("interview"); startT(q.time);
    }catch(e){setErr("Error: "+e.message);setPhase("setup");}
  };

  const reset=()=>{
    stopT(); setPhase("setup"); setResume(""); setJd(""); setProfile(null);
    setQs([]); setCurQ(null); setAnswer(""); setTLeft(0); setDiff("easy"); setCf(0);
    setEnded(false); setEndR(""); setEv(null); setReport(null); setErr(""); setOpenQ(null);
    setAdaptBanner(null);
    subR.current=false; t0R.current=null; qsR.current=[]; cfR.current=0;
    endedR.current=false; endRR.current=""; diffR.current="easy";
  };

  const BD="rgba(255,255,255,.09)", cardSt={background:"rgba(13,13,22,.97)",border:`1px solid ${BD}`,borderRadius:18,padding:"22px 24px",backdropFilter:"blur(16px)"};
  const personaObj = PERSONAS[persona];

  /* ══════════════════════════════════════════════════════════════
     SETUP SCREEN
  ══════════════════════════════════════════════════════════════ */
  if(phase==="setup")return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 90% 60% at 50% -8%,rgba(139,92,246,.11) 0%,transparent 55%),#05050b",color:"#f1f5f9",padding:"0 22px"}}>
      <div style={{maxWidth:780,margin:"0 auto",paddingTop:44,paddingBottom:60}}>
        {/* Nav */}
        <div className="fu" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:44}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(139,92,246,.55)",fontSize:17}}>✦</div>
            <span style={{fontSize:15,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:-.4}}>InterviewAI</span>
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.28)",borderRadius:100,padding:"5px 15px"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#8b5cf6",boxShadow:"0 0 8px rgba(139,92,246,.8)"}}/>
            <span style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>Hack2Hire 2026</span>
          </div>
        </div>

        {/* Hero */}
        <div className="fu1" style={{textAlign:"center",marginBottom:36}}>
          <p style={{fontSize:11,color:"rgba(255,255,255,.35)",fontWeight:600,letterSpacing:2.5,textTransform:"uppercase",marginBottom:14}}>State-Based Adaptive Interview Intelligence Engine</p>
          <h1 className="gtext" style={{fontSize:50,fontWeight:800,letterSpacing:-2,lineHeight:1.06,marginBottom:16,fontFamily:"'Space Grotesk',sans-serif"}}>Ace your next<br/>technical interview</h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,.45)",maxWidth:480,margin:"0 auto",lineHeight:1.75}}>Adaptive AI interviewer with real-time session memory, communication analysis, 5-dimension scoring, and a recruiter-grade readiness report.</p>
        </div>

        {/* Persona Selector */}
        <div className="fu2" style={{marginBottom:24}}>
          <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.35)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:12}}>Choose Your Interviewer</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {Object.entries(PERSONAS).map(([key,p])=>(
              <div key={key} className="persona-card" onClick={()=>setPersona(key)} style={{
                background:persona===key?`rgba(${key==="faang"?"59,130,246":key==="startup"?"245,158,11":key==="friendly"?"16,185,129":"239,68,68"},.08)`:"rgba(13,13,22,.95)",
                border:`1px solid ${persona===key?p.clr+"55":BD}`,
                borderRadius:14,padding:"14px 16px",
                boxShadow:persona===key?`0 0 20px ${p.clr}14`:"none"
              }}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:16}}>{p.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:persona===key?p.clr:"#f1f5f9",fontFamily:"'Space Grotesk',sans-serif"}}>{p.name}</span>
                  {persona===key&&<div style={{width:6,height:6,borderRadius:"50%",background:p.clr,marginLeft:"auto",boxShadow:`0 0 8px ${p.clr}`}}/>}
                </div>
                <p style={{fontSize:11,color:"rgba(255,255,255,.38)",lineHeight:1.55}}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="fu3" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {[{l:"Resume",icon:"📄",v:resume,s:setResume,p:"Paste resume — skills, experience, projects…"},{l:"Job Description",icon:"💼",v:jd,s:setJd,p:"Paste JD — role, requirements, skills…"}].map(({l,icon,v,s,p})=>(
            <div key={l} style={cardSt}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
                <span style={{fontSize:14}}>{icon}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#a78bfa",letterSpacing:1.2,textTransform:"uppercase"}}>{l}</span>
              </div>
              <textarea value={v} onChange={e=>s(e.target.value)} placeholder={p} style={{width:"100%",height:155,background:"rgba(0,0,0,.35)",border:`1px solid ${BD}`,borderRadius:11,padding:14,color:"#f1f5f9",fontSize:13,lineHeight:1.65,boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>

        {err&&<div style={{background:"rgba(239,68,68,.09)",border:"1px solid rgba(239,68,68,.28)",borderRadius:12,padding:"11px 16px",marginBottom:12,color:"#fca5a5",fontSize:13}}>⚠ {err}</div>}

        <div className="fu4">
          <button className="btn btn-v" onClick={begin} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"16px 28px",borderRadius:14,fontSize:15,fontWeight:700,color:"#fff"}}>
            <span style={{fontSize:16}}>{personaObj.icon}</span>
            Begin with {personaObj.name}
            <span style={{fontSize:19}}>→</span>
          </button>
        </div>

        <div className="fu5" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20}}>
          {[{i:"🧠",t:"Adaptive",d:"Difficulty shifts after every answer"},{i:"💬",t:"Comm Analysis",d:"Filler words, confidence, structure"},{i:"🔗",t:"Session Memory",d:"AI references your previous answers"},{i:"📊",t:"ATS Report",d:"Radar chart + hiring decision"}].map(({i,t,d})=>(
            <div key={t} style={{background:"rgba(13,13,22,.8)",border:`1px solid ${BD}`,borderRadius:12,padding:14,textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:7}}>{i}</div>
              <div style={{fontSize:12,fontWeight:700,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif"}}>{t}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.35)",lineHeight:1.55}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── LOADING ── */
  if(phase==="loading")return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 60% 45% at 50% 35%,rgba(139,92,246,.06) 0%,transparent 65%),#05050b",display:"flex",alignItems:"center",justifyContent:"center",color:"#f1f5f9"}}>
      <div style={{textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:26}}>
          {[1,2,3].map(i=><div key={i} className={`d${i}`} style={{width:11,height:11,borderRadius:"50%",background:personaObj.clr,boxShadow:`0 0 12px ${personaObj.clr}88`}}/>)}
        </div>
        <div style={{fontSize:16,fontWeight:600,marginBottom:6,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:-.3}}>{lMsg||"Processing…"}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.28)",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <span style={{fontSize:13}}>{personaObj.icon}</span>{personaObj.name} · Claude AI
        </div>
      </div>
    </div>
  );

  /* ── INTERVIEW ── */
  if(phase==="interview"&&curQ){
    const qn=qs.length+1,dc=safeD(diff);
    return(
      <div style={{minHeight:"100vh",background:"#05050b",color:"#f1f5f9",padding:"0 22px",fontFamily:"'Inter',system-ui,sans-serif"}}>
        <div style={{maxWidth:880,margin:"0 auto",paddingTop:20,paddingBottom:48}}>

          {/* Adaptation Banner */}
          {adaptBanner&&(
            <div className="ad" style={{background:"rgba(13,13,22,.97)",border:`1px solid ${DIFF[adaptBanner.to].clr}55`,borderRadius:12,padding:"11px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,boxShadow:`0 4px 16px rgba(0,0,0,.3), 0 0 20px ${DIFF[adaptBanner.to].clr}14`}}>
              <span style={{fontSize:18}}>{adaptBanner.dir==="up"?"📈":"📉"}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif"}}>
                  {adaptBanner.msg} <span style={{color:DIFF[adaptBanner.to].clr}}>→ {DIFF[adaptBanner.to].label}</span>
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>Score {adaptBanner.score}/100 {adaptBanner.dir==="up"?`≥ 70 (upgrade threshold)`:`< 40 (downgrade threshold)`}</div>
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="fu" style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(13,13,22,.97)",border:`1px solid ${BD}`,borderRadius:14,padding:"10px 18px",marginBottom:18,backdropFilter:"blur(16px)"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:14,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:-.3}}>Q{qn}<span style={{color:"rgba(255,255,255,.28)"}}>/{MAX_Q}</span></span>
              <div style={{width:1,height:16,background:BD}}/>
              <span style={{background:dc.bg,color:dc.clr,border:`1px solid ${dc.border}`,borderRadius:100,padding:"2px 11px",fontSize:11,fontWeight:700,boxShadow:`0 0 10px ${dc.glow}`}}>{dc.label}</span>
              <span style={{background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.45)",borderRadius:100,padding:"2px 10px",fontSize:11,textTransform:"capitalize"}}>{curQ.type}</span>
              <span style={{background:`rgba(${persona==="faang"?"59,130,246":persona==="startup"?"245,158,11":persona==="friendly"?"16,185,129":"239,68,68"},.1)`,color:personaObj.clr,borderRadius:100,padding:"2px 10px",fontSize:10,fontWeight:600}}>{personaObj.icon} {personaObj.name}</span>
            </div>
            <div style={{display:"flex",gap:4}}>{Array.from({length:MAX_Q},(_,i)=><div key={i} style={{width:16,height:5,borderRadius:3,background:i<qs.length?scClr(qs[i].totalScore):i===qs.length?dc.clr+"88":"rgba(255,255,255,.1)"}}/>)}</div>
          </div>

          {/* Memory reference indicator */}
          {curQ.memoryRef&&curQ.memoryRef!=="null"&&(
            <div style={{background:"rgba(59,130,246,.07)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,padding:"8px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12}}>🔗</span>
              <span style={{fontSize:12,color:"rgba(148,163,184,.8)"}}><b style={{color:"#3b82f6"}}>Memory reference:</b> {curQ.memoryRef}</span>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 172px",gap:14,alignItems:"start"}}>
            <div>
              <div className="fu1" style={cardSt}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#8b5cf6",boxShadow:"0 0 10px rgba(139,92,246,.7)"}}/>
                  <span style={{fontSize:10,fontWeight:700,color:"rgba(139,92,246,.85)",letterSpacing:1.3,textTransform:"uppercase"}}>Interview Question</span>
                </div>
                <p style={{fontSize:16,lineHeight:1.82,marginBottom:curQ.keyPoints?.length?18:0}}>{curQ.text}</p>
                {curQ.keyPoints?.length>0&&(
                  <div style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"12px 16px",borderLeft:"3px solid rgba(139,92,246,.25)"}}>
                    <p style={{fontSize:10,color:"rgba(255,255,255,.28)",marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:.9}}>Key points to address</p>
                    {curQ.keyPoints.map((p,i)=><div key={i} style={{fontSize:12,color:"rgba(255,255,255,.42)",marginBottom:4,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:"rgba(139,92,246,.45)",flexShrink:0}}>·</span>{p}</div>)}
                  </div>
                )}
              </div>
              <div className="fu2" style={{...cardSt,marginTop:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#a78bfa",boxShadow:"0 0 10px rgba(167,139,250,.6)"}}/>
                  <span style={{fontSize:10,fontWeight:700,color:"rgba(167,139,250,.85)",letterSpacing:1.3,textTransform:"uppercase"}}>Your Answer</span>
                </div>
                <textarea value={answer} onChange={e=>{setAnswer(e.target.value);ansR.current=e.target.value;}} placeholder="Type your answer. Be clear, specific, and structured…" autoFocus
                  style={{width:"100%",height:170,background:"rgba(0,0,0,.32)",border:`1px solid ${BD}`,borderRadius:11,padding:14,color:"#f1f5f9",fontSize:14,lineHeight:1.7,boxSizing:"border-box"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
                  <div style={{display:"flex",gap:14}}>
                    <span style={{fontSize:12,color:"rgba(255,255,255,.22)"}}>{answer.split(' ').filter(Boolean).length} words</span>
                    <span style={{fontSize:12,color:"rgba(255,255,255,.14)"}}>{answer.length} chars</span>
                  </div>
                  <button className="btn btn-v" onClick={()=>doSub(false)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 24px",borderRadius:12,fontSize:14,fontWeight:700,color:"#fff"}}>Submit ↗</button>
                </div>
              </div>
            </div>
            <div>
              <div style={cardSt}>
                <CircleTimer left={tLeft} total={curQ.time}/>
                <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${BD}`,textAlign:"center"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.25)",fontWeight:600,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Limit</div>
                  <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.45)"}}>{curQ.time}s</div>
                </div>
              </div>
              {qs.length>0&&(
                <div style={{...cardSt,marginTop:12}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.22)",fontWeight:700,textTransform:"uppercase",letterSpacing:.9,marginBottom:10}}>History</div>
                  {qs.slice(-5).map((q,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<Math.min(5,qs.length)-1?7:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:4,height:4,borderRadius:"50%",background:scClr(q.totalScore),boxShadow:`0 0 6px ${scClr(q.totalScore)}60`}}/>
                        <span style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>Q{qs.length-Math.min(5,qs.length)+i+1}</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:scClr(q.totalScore),fontFamily:"'Space Grotesk',sans-serif"}}>{q.totalScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── SCORE REVEAL ── */
  if(phase==="reveal"&&ev){
    const qn=qs.length,q=qs[qn-1],isLast=ended||qn>=MAX_Q;
    const L=["easy","medium","hard"],idx=L.indexOf(diff);
    const nd=ev.total>=70&&idx<2?L[idx+1]:ev.total<40&&idx>0?L[idx-1]:diff;
    const sv=ev.total,comm=q.comm||{wc:0,fillers:0,structure:0,confidence:50,verbosity:"N/A",vScore:50};
    return(
      <div style={{minHeight:"100vh",background:`radial-gradient(ellipse 70% 55% at 50% 0%,${scRgba(sv)} 0%,transparent 55%),#05050b`,color:"#f1f5f9",padding:"0 22px",fontFamily:"'Inter',system-ui,sans-serif"}}>
        <div style={{maxWidth:640,margin:"0 auto",paddingTop:40,paddingBottom:56}}>

          {ended&&<div style={{background:"rgba(239,68,68,.09)",border:"1px solid rgba(239,68,68,.28)",borderRadius:14,padding:"13px 18px",marginBottom:22,display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🛑</span>
            <div><p style={{fontWeight:700,color:"#fca5a5",marginBottom:2,fontSize:14}}>Interview Terminated</p><p style={{fontSize:12,color:"rgba(252,165,165,.65)"}}>{endR}</p></div>
          </div>}

          {/* Big score */}
          <div className="fu" style={{textAlign:"center",marginBottom:26}}>
            <p style={{fontSize:10,color:"rgba(255,255,255,.28)",letterSpacing:1.4,textTransform:"uppercase",marginBottom:12,fontWeight:600}}>Question {qn} Result</p>
            <div className="sc" style={{fontSize:110,fontWeight:900,lineHeight:1,letterSpacing:-5,fontFamily:"'Space Grotesk',sans-serif",background:scGrad(sv),WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:`drop-shadow(0 0 28px ${scClr(sv)}55)`}}>
              <CountUp target={sv} duration={900}/>
            </div>
            <p style={{fontSize:17,color:"rgba(255,255,255,.22)",marginTop:-2,marginBottom:14}}>/100</p>
            <span style={{display:"inline-block",padding:"7px 20px",borderRadius:100,fontSize:13,fontWeight:700,background:`${scClr(sv)}18`,color:scClr(sv),border:`1px solid ${scClr(sv)}44`}}>
              {sv>=70?"✓  Strong Answer":sv>=50?"◑  Average Answer":"✗  Needs Improvement"}
            </span>
          </div>

          {/* 5-dimension breakdown */}
          <div className="fu1" style={cardSt}>
            <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.28)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:14}}>Score Breakdown</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[{l:"🎯 Accuracy",v:ev.accuracy},{l:"💬 Clarity",v:ev.clarity},{l:"🔬 Depth",v:ev.depth},{l:"📌 Relevance",v:ev.relevance},{l:"⚡ Timing",v:ev.timeEfficiency}].map(({l,v})=>(
                <div key={l} style={{background:"rgba(0,0,0,.25)",borderRadius:11,padding:"11px 13px",border:"1px solid rgba(255,255,255,.05)"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:5}}>{l}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:7}}>
                    <span style={{fontSize:24,fontWeight:800,color:scClr((v/20)*100),fontFamily:"'Space Grotesk',sans-serif",lineHeight:1}}>{v}</span>
                    <span style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>/20</span>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,.07)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{width:`${(v/20)*100}%`,height:"100%",background:scClr((v/20)*100),borderRadius:2,transition:"width .9s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WHY THIS SCORE — the key differentiator */}
          {(ev.whyStrong?.length>0||ev.whyWeak?.length>0)&&(
            <div className="fu2" style={{...cardSt,marginTop:12}}>
              <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.28)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:14}}>Why This Score?</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {ev.whyStrong?.length>0&&(
                  <div style={{background:"rgba(16,185,129,.06)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(16,185,129,.2)"}}>
                    <p style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>✓ You scored points</p>
                    {ev.whyStrong.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}><span style={{color:"#10b981",flexShrink:0,fontSize:10,marginTop:2}}>▸</span><p style={{fontSize:12,color:"rgba(255,255,255,.55)",lineHeight:1.6,margin:0}}>{s}</p></div>)}
                  </div>
                )}
                {ev.whyWeak?.length>0&&(
                  <div style={{background:"rgba(239,68,68,.06)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(239,68,68,.2)"}}>
                    <p style={{fontSize:10,fontWeight:700,color:"#ef4444",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>✗ Points lost</p>
                    {ev.whyWeak.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}><span style={{color:"#ef4444",flexShrink:0,fontSize:10,marginTop:2}}>▸</span><p style={{fontSize:12,color:"rgba(255,255,255,.55)",lineHeight:1.6,margin:0}}>{s}</p></div>)}
                  </div>
                )}
              </div>
              {ev.missedExpectation&&(
                <div style={{marginTop:10,background:"rgba(245,158,11,.06)",borderRadius:10,padding:"10px 13px",borderLeft:"3px solid rgba(245,158,11,.4)"}}>
                  <p style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:.7}}>Expected stronger answer</p>
                  <p style={{fontSize:12,color:"rgba(255,255,255,.48)",lineHeight:1.65,margin:0}}>{ev.missedExpectation}</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback + Ideal */}
          <div className="fu3" style={{...cardSt,marginTop:12}}>
            <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.28)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>Interviewer Feedback</p>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:12}}>{personaObj.icon}</span>
              <span style={{fontSize:11,color:personaObj.clr,fontWeight:600}}>{personaObj.name} says:</span>
            </div>
            <p style={{fontSize:14,lineHeight:1.78,margin:0,color:"rgba(255,255,255,.62)"}}>{ev.feedback}</p>
            {ev.communicationNote&&<p style={{fontSize:12,color:"rgba(148,163,184,.6)",marginTop:8,lineHeight:1.65,fontStyle:"italic"}}>{ev.communicationNote}</p>}
            {ev.idealAnswer&&ev.idealAnswer!=="N/A"&&(
              <div style={{marginTop:14,background:"rgba(10,20,40,.9)",borderRadius:12,padding:"12px 16px",borderLeft:"3px solid rgba(59,130,246,.45)"}}>
                <p style={{fontSize:10,color:"#3b82f6",fontWeight:700,letterSpacing:.9,marginBottom:6,textTransform:"uppercase"}}>Model Answer</p>
                <p style={{fontSize:13,color:"rgba(148,163,184,.75)",margin:0,lineHeight:1.72}}>{ev.idealAnswer}</p>
              </div>
            )}
          </div>

          {/* Communication Analysis (real-time heuristics) */}
          <div className="fu4" style={{...cardSt,marginTop:12}}>
            <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.28)",letterSpacing:1.2,textTransform:"uppercase",marginBottom:14}}>Communication Analysis</p>
            <CommCard comm={comm}/>
          </div>

          {/* Adaptive hint */}
          {!isLast&&(
            <div className="fu5" style={{...cardSt,marginTop:12,background:"rgba(13,13,22,.8)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:22}}>{sv>=70?"📈":sv<40?"📉":"➡️"}</span>
                <div>
                  <p style={{fontSize:13,fontWeight:700,marginBottom:2,fontFamily:"'Space Grotesk',sans-serif"}}>
                    Next: <span style={{color:safeD(nd).clr}}>{safeD(nd).label}</span>
                    <span style={{color:"rgba(255,255,255,.35)",marginLeft:6,fontSize:12}}>({safeD(nd).time}s)</span>
                    {nd!==diff&&<span style={{color:"rgba(255,255,255,.35)",fontSize:11,marginLeft:5}}>{sv>=70?"↑ escalated":"↓ adjusted"}</span>}
                  </p>
                  <p style={{fontSize:12,color:"rgba(255,255,255,.32)",margin:0}}>{nd===diff?"Maintaining current difficulty":"Adjusted based on your score"}</p>
                </div>
              </div>
            </div>
          )}

          <div style={{marginTop:18}}>
            <button className={`btn ${isLast?"btn-g":"btn-v"}`} onClick={goContinue} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"16px 28px",borderRadius:14,fontSize:16,fontWeight:700,color:"#fff"}}>
              {isLast?"View Full Report →":`Continue — Q${qn+1}/${MAX_Q} →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── FINAL REPORT ── */
  if(phase==="report"&&report){
    const hd=getHiringDecision(report.finalScore);
    const personaUsed=PERSONAS[report.personaKey]||PERSONAS.faang;
    return(
      <div style={{minHeight:"100vh",background:"#05050b",color:"#f1f5f9",padding:"0 22px",fontFamily:"'Inter',system-ui,sans-serif"}}>
        <div style={{maxWidth:860,margin:"0 auto",paddingTop:30,paddingBottom:60}}>

          {/* Header */}
          <div className="fu" style={{textAlign:"center",marginBottom:28}}>
            <p style={{fontSize:11,color:"rgba(255,255,255,.28)",letterSpacing:1.6,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Interview Assessment Report</p>
            <h1 className="gtext" style={{fontSize:30,fontWeight:800,margin:"0 0 4px",letterSpacing:-1,fontFamily:"'Space Grotesk',sans-serif"}}>Readiness Report</h1>
            <p style={{color:"rgba(255,255,255,.32)",margin:0,fontSize:13}}>{report.profile?.candidateName} · {report.profile?.targetRole} · Evaluated by {personaUsed.icon} {personaUsed.name}</p>
          </div>

          {report.terminatedEarly&&<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.22)",borderRadius:14,padding:"13px 18px",marginBottom:18}}><p style={{fontWeight:700,color:"#fca5a5",marginBottom:2,fontSize:13}}>⚠ Interview Terminated Early</p><p style={{fontSize:12,color:"rgba(252,165,165,.6)",margin:0}}>{report.terminationReason}</p></div>}

          {/* HIRING DECISION — most prominent element */}
          <div className="hi" style={{background:hd.bg,border:`2px solid ${hd.border}`,borderRadius:20,padding:"28px 32px",marginBottom:18,textAlign:"center",boxShadow:`0 8px 40px ${hd.clr}18`}}>
            <p style={{fontSize:11,color:`${hd.clr}88`,letterSpacing:2,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Hiring Decision</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:10}}>
              <div style={{display:"flex",gap:5}}>
                {[1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",background:i<=hd.stars?hd.clr:"rgba(255,255,255,.12)",boxShadow:i<=hd.stars?`0 0 10px ${hd.clr}80`:"none"}}/>)}
              </div>
              <span style={{fontSize:32,fontWeight:900,color:hd.clr,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:-.5}}>{hd.label}</span>
            </div>
            <p style={{fontSize:14,color:`${hd.clr}99`,margin:0,fontWeight:500}}>{hd.desc}</p>
          </div>

          {/* Score dial + Radar chart */}
          <div className="fu1" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            <div style={cardSt}>
              <ScoreDial score={report.finalScore}/>
              <div style={{textAlign:"center",marginTop:14}}>
                <span style={{padding:"6px 18px",borderRadius:100,fontSize:13,fontWeight:800,background:`${scClr(report.finalScore)}18`,color:scClr(report.finalScore),border:`1px solid ${scClr(report.finalScore)}44`}}>{report.category}</span>
              </div>
              <p style={{fontSize:12,color:"rgba(255,255,255,.4)",textAlign:"center",marginTop:12,lineHeight:1.65}}>{report.summary}</p>
            </div>
            <div style={{...cardSt,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.28)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Skill Radar</p>
              <RadarChart scores={report.skillBreakdown}/>
            </div>
          </div>

          {/* Stats row */}
          <div className="fu2" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:18}}>
            {[{l:"Questions",v:`${report.questionsAnswered}/${MAX_Q}`},{l:"Weighted Score",v:`${report.finalScore}/100`},{l:"Status",v:report.terminatedEarly?"Terminated":"Completed"}].map(({l,v})=>(
              <div key={l} style={{...cardSt,textAlign:"center",padding:18}}>
                <div style={{fontSize:20,fontWeight:800,marginBottom:4,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:-.5}}>{v}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:500}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Skill breakdown bars */}
          <div className="fu3" style={{...cardSt,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#8b5cf6",boxShadow:"0 0 10px rgba(139,92,246,.7)"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.6)",fontFamily:"'Space Grotesk',sans-serif"}}>Skill Performance Breakdown</span>
            </div>
            {Object.entries(report.skillBreakdown||{}).map(([k,v],i)=>(
              <div key={k} style={{marginBottom:i<Object.keys(report.skillBreakdown).length-1?15:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>{k}</span>
                  <span style={{fontSize:13,fontWeight:700,color:scClr(v),fontFamily:"'Space Grotesk',sans-serif"}}>{v}%</span>
                </div>
                <AnimBar value={v} delay={i*80}/>
              </div>
            ))}
          </div>

          {/* Communication Analysis (aggregate) */}
          {report.commAgg&&(
            <div className="fu4" style={{...cardSt,marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#06b6d4",boxShadow:"0 0 10px rgba(6,182,212,.6)"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.6)",fontFamily:"'Space Grotesk',sans-serif"}}>Communication Analysis</span>
              </div>
              <CommCard comm={{
                wc:report.commAgg.wc,
                fillers:report.commAgg.fillers,
                structure:Math.round(report.commAgg.structure),
                confidence:Math.round(report.commAgg.confidence),
                verbosity:report.commAgg.wc/Math.max(1,report.questionsAnswered)<20?"Too Brief":report.commAgg.wc/Math.max(1,report.questionsAnswered)<140?"Good":"Verbose",
                vScore:report.commAgg.wc/Math.max(1,report.questionsAnswered)<20?15:90,
              }}/>
            </div>
          )}

          {/* Strengths + Weaknesses */}
          <div className="fu5" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            {[{t:"Strengths",clr:"#10b981",border:"rgba(16,185,129,.2)",items:report.strengths},{t:"Areas to Improve",clr:"#ef4444",border:"rgba(239,68,68,.2)",items:report.weaknesses}].map(({t,clr,border,items})=>(
              <div key={t} style={{...cardSt,border:`1px solid ${border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:clr,boxShadow:`0 0 8px ${clr}80`}}/>
                  <span style={{fontSize:10,fontWeight:700,color:clr,letterSpacing:1,textTransform:"uppercase"}}>{t}</span>
                </div>
                {items?.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:9,marginBottom:i<items.length-1?10:0,alignItems:"flex-start"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:clr,opacity:.6,marginTop:5,flexShrink:0}}/>
                    <span style={{fontSize:13,color:"rgba(255,255,255,.48)",lineHeight:1.65}}>{s}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Improvement Roadmap */}
          <div className="fu5" style={{...cardSt,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#f59e0b",boxShadow:"0 0 10px rgba(245,158,11,.6)"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.6)",fontFamily:"'Space Grotesk',sans-serif"}}>Improvement Roadmap</span>
            </div>
            {report.improvementRoadmap?.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:14,marginBottom:i<report.improvementRoadmap.length-1?12:0,alignItems:"flex-start"}}>
                <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:28,height:28,borderRadius:8,background:item.priority==="High"?"rgba(239,68,68,.12)":item.priority==="Medium"?"rgba(245,158,11,.12)":"rgba(16,185,129,.12)",border:`1px solid ${item.priority==="High"?"rgba(239,68,68,.3)":item.priority==="Medium"?"rgba(245,158,11,.3)":"rgba(16,185,129,.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:item.priority==="High"?"#ef4444":item.priority==="Medium"?"#f59e0b":"#10b981",fontFamily:"'Space Grotesk',sans-serif"}}>{i+1}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"1px 8px",borderRadius:100,background:item.priority==="High"?"rgba(239,68,68,.12)":item.priority==="Medium"?"rgba(245,158,11,.12)":"rgba(16,185,129,.12)",color:item.priority==="High"?"#ef4444":item.priority==="Medium"?"#f59e0b":"#10b981",letterSpacing:.4}}>{item.priority}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.25)"}}>{item.timeframe}</span>
                  </div>
                  <p style={{fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:1.65,margin:0}}>{item.action}</p>
                </div>
              </div>
            ))||report.actionableFeedback?.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:14,marginBottom:i<report.actionableFeedback.length-1?12:0,alignItems:"flex-start"}}>
                <div style={{width:26,height:26,borderRadius:8,background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#a78bfa",flexShrink:0,fontFamily:"'Space Grotesk',sans-serif"}}>{i+1}</div>
                <p style={{fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:1.72,margin:0,paddingTop:3}}>{f}</p>
              </div>
            ))}
          </div>

          {/* Hiring readiness */}
          <div className="fu5" style={{background:"rgba(8,18,40,.95)",border:"1px solid rgba(59,130,246,.2)",borderRadius:18,padding:"20px 24px",marginBottom:20,backdropFilter:"blur(16px)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{fontSize:12}}>{personaUsed.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:"rgba(59,130,246,.85)",letterSpacing:1,textTransform:"uppercase"}}>{personaUsed.name} · Hiring Recommendation</span>
            </div>
            <p style={{fontSize:14,lineHeight:1.8,margin:0,color:"rgba(255,255,255,.5)"}}>{report.hiringReadiness}</p>
          </div>

          {/* Q-by-Q review with Why Strong/Weak */}
          <div className="fu5" style={{...cardSt,marginBottom:22}}>
            <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.55)",marginBottom:16,fontFamily:"'Space Grotesk',sans-serif"}}>Question-by-Question Review</p>
            {report.questions?.map((q,i)=>(
              <div key={i} style={{marginBottom:10,background:"rgba(0,0,0,.22)",borderRadius:13,overflow:"hidden",border:"1px solid rgba(255,255,255,.06)"}}>
                <button className="ci" onClick={()=>setOpenQ(openQ===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:"#f1f5f9",textAlign:"left",fontFamily:"'Inter',system-ui"}}>
                  <div style={{display:"flex",gap:9,alignItems:"center",overflow:"hidden",flex:1,marginRight:12}}>
                    <span style={{fontWeight:700,fontSize:11,flexShrink:0,color:"rgba(255,255,255,.4)"}}>Q{i+1}</span>
                    <span style={{background:safeD(q.diff).bg,color:safeD(q.diff).clr,padding:"1px 8px",borderRadius:100,fontSize:9,fontWeight:700,flexShrink:0,border:`1px solid ${safeD(q.diff).border}`}}>{safeD(q.diff).label}</span>
                    <span style={{fontSize:11,color:"rgba(255,255,255,.32)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.text}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <span style={{fontWeight:800,color:scClr(q.totalScore),fontSize:13,fontFamily:"'Space Grotesk',sans-serif"}}>{q.totalScore}/100</span>
                    <span style={{color:"rgba(255,255,255,.18)",fontSize:14,display:"inline-block",transform:openQ===i?"rotate(90deg)":"none",transition:"transform .2s"}}>&rsaquo;</span>
                  </div>
                </button>
                {openQ===i&&(
                  <div style={{padding:"0 16px 16px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                    <p style={{fontSize:13,color:"rgba(255,255,255,.52)",marginBottom:8,marginTop:12,lineHeight:1.7}}><b style={{color:"rgba(255,255,255,.65)"}}>Answer: </b>{q.answer||"[Timed out]"}</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:12}}>
                      {[["Acc",q.scores.accuracy],["Clarity",q.scores.clarity],["Depth",q.scores.depth],["Rel",q.scores.relevance],["Time",q.scores.timeEfficiency]].map(([l,v])=>(
                        <div key={l} style={{background:"rgba(255,255,255,.04)",borderRadius:9,padding:"7px 8px",textAlign:"center",border:"1px solid rgba(255,255,255,.05)"}}>
                          <div style={{fontSize:9,color:"rgba(255,255,255,.28)",marginBottom:3}}>{l}</div>
                          <div style={{fontSize:15,fontWeight:800,color:scClr((v/20)*100),fontFamily:"'Space Grotesk',sans-serif"}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Why this score inline */}
                    {(q.scores.whyStrong?.length>0||q.scores.whyWeak?.length>0)&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        {q.scores.whyStrong?.length>0&&<div style={{background:"rgba(16,185,129,.05)",borderRadius:9,padding:"9px 12px",border:"1px solid rgba(16,185,129,.15)"}}>
                          <p style={{fontSize:9,color:"#10b981",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:.6}}>✓ Points earned</p>
                          {q.scores.whyStrong.map((s,j)=><p key={j} style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.55,marginBottom:2}}>{s}</p>)}
                        </div>}
                        {q.scores.whyWeak?.length>0&&<div style={{background:"rgba(239,68,68,.05)",borderRadius:9,padding:"9px 12px",border:"1px solid rgba(239,68,68,.15)"}}>
                          <p style={{fontSize:9,color:"#ef4444",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:.6}}>✗ Points lost</p>
                          {q.scores.whyWeak.map((s,j)=><p key={j} style={{fontSize:11,color:"rgba(255,255,255,.45)",lineHeight:1.55,marginBottom:2}}>{s}</p>)}
                        </div>}
                      </div>
                    )}
                    <p style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.7,margin:"0 0 5px"}}><b style={{color:"#f59e0b"}}>Feedback: </b>{q.scores.feedback}</p>
                    {q.scores.idealAnswer&&q.scores.idealAnswer!=="N/A"&&<p style={{fontSize:12,color:"rgba(255,255,255,.38)",lineHeight:1.7,margin:0}}><b style={{color:"#10b981"}}>Ideal: </b>{q.scores.idealAnswer}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-v" onClick={reset} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"16px 28px",borderRadius:14,fontSize:16,fontWeight:700,color:"#fff"}}>
            Start New Interview →
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{height:"100vh",background:"#05050b",color:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui"}}>
      Loading… (phase: {phase})
    </div>
  );
}
