import { useState, useCallback, useMemo } from "react";

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const GROUPS = {
  A: { teams: ["MEX","RSA","KOR","CZE"],  label: "Mexico · South Africa · Korea Republic · Czechia" },
  B: { teams: ["CAN","BIH","SUI","QAT"],  label: "Canada · Bosnia & Herz. · Switzerland · Qatar" },
  C: { teams: ["BRA","MAR","HAI","SCO"],  label: "Brazil · Morocco · Haiti · Scotland" },
  D: { teams: ["USA","PAR","AUS","TUR"],  label: "USA · Paraguay · Australia · Turkey" },
  E: { teams: ["GER","CUW","CIV","ECU"],  label: "Germany · Curaçao · Côte d'Ivoire · Ecuador" },
  F: { teams: ["NED","JPN","SWE","TUN"],  label: "Netherlands · Japan · Sweden · Tunisia" },
  G: { teams: ["BEL","EGY","IRN","NZL"],  label: "Belgium · Egypt · Iran · New Zealand" },
  H: { teams: ["ESP","CPV","URU","KSA"],  label: "Spain · Cabo Verde · Uruguay · Saudi Arabia" },
  I: { teams: ["FRA","SEN","NOR","IRQ"],  label: "France · Senegal · Norway · Iraq" },
  J: { teams: ["ARG","ALG","AUT","JOR"],  label: "Argentina · Algeria · Austria · Jordan" },
  K: { teams: ["POR","COD","COL","UZB"],  label: "Portugal · Congo DR · Colombia · Uzbekistan" },
  L: { teams: ["ENG","CRO","GHA","PAN"],  label: "England · Croatia · Ghana · Panama" },
};

// Approximate FIFA World Rankings (2024) — used as tiebreaker (lower = better)
const FIFA_RANKING_DEFAULT = {
  ARG:1, FRA:2, ENG:3, BEL:4, BRA:5, POR:6, NED:7, ESP:8,
  URU:9, USA:10, MEX:11, GER:12, CRO:13, COL:14, ITA:15,
  MAR:16, SEN:17, DEN:18, AUT:19, SUI:20, JPN:21, NOR:22,
  CZE:23, AUS:24, TUR:25, KOR:26, ECU:27, IRN:28, SCO:29,
  SWE:30, CAN:31, NZL:32, GHA:33, TUN:34, ALG:35, PAR:36,
  CIV:37, IRQ:38, RSA:39, HAI:40, BIH:41, QAT:42, KSA:43,
  CPV:44, COD:45, UZB:46, JOR:47, PAN:48, CUW:49,
};

const FLAGS = {
  MEX:"🇲🇽",RSA:"🇿🇦",KOR:"🇰🇷",CZE:"🇨🇿",CAN:"🇨🇦",BIH:"🇧🇦",SUI:"🇨🇭",QAT:"🇶🇦",
  BRA:"🇧🇷",MAR:"🇲🇦",HAI:"🇭🇹",SCO:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",USA:"🇺🇸",PAR:"🇵🇾",AUS:"🇦🇺",TUR:"🇹🇷",
  GER:"🇩🇪",CUW:"🇨🇼",CIV:"🇨🇮",ECU:"🇪🇨",NED:"🇳🇱",JPN:"🇯🇵",SWE:"🇸🇪",TUN:"🇹🇳",
  BEL:"🇧🇪",EGY:"🇪🇬",IRN:"🇮🇷",NZL:"🇳🇿",ESP:"🇪🇸",CPV:"🇨🇻",URU:"🇺🇾",KSA:"🇸🇦",
  FRA:"🇫🇷",SEN:"🇸🇳",NOR:"🇳🇴",IRQ:"🇮🇶",ARG:"🇦🇷",ALG:"🇩🇿",AUT:"🇦🇹",JOR:"🇯🇴",
  POR:"🇵🇹",COD:"🇨🇩",COL:"🇨🇴",UZB:"🇺🇿",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",CRO:"🇭🇷",GHA:"🇬🇭",PAN:"🇵🇦",
};
const fl = (c) => FLAGS[c] || "🏳️";

const GROUP_MATCHES = {
  A:[["MEX","RSA"],["KOR","CZE"],["MEX","KOR"],["CZE","RSA"],["RSA","KOR"],["CZE","MEX"]],
  B:[["CAN","BIH"],["SUI","QAT"],["CAN","SUI"],["QAT","BIH"],["QAT","CAN"],["BIH","SUI"]],
  C:[["BRA","MAR"],["HAI","SCO"],["BRA","HAI"],["SCO","MAR"],["SCO","BRA"],["MAR","HAI"]],
  D:[["USA","PAR"],["AUS","TUR"],["USA","AUS"],["TUR","PAR"],["TUR","USA"],["PAR","AUS"]],
  E:[["GER","CUW"],["CIV","ECU"],["GER","CIV"],["ECU","CUW"],["ECU","GER"],["CUW","CIV"]],
  F:[["NED","JPN"],["SWE","TUN"],["NED","SWE"],["TUN","JPN"],["TUN","NED"],["JPN","SWE"]],
  G:[["BEL","EGY"],["IRN","NZL"],["BEL","IRN"],["NZL","EGY"],["NZL","BEL"],["EGY","IRN"]],
  H:[["ESP","CPV"],["URU","KSA"],["ESP","URU"],["KSA","CPV"],["KSA","ESP"],["CPV","URU"]],
  I:[["FRA","SEN"],["NOR","IRQ"],["FRA","NOR"],["IRQ","SEN"],["IRQ","FRA"],["SEN","NOR"]],
  J:[["ARG","ALG"],["AUT","JOR"],["ARG","AUT"],["JOR","ALG"],["JOR","ARG"],["ALG","AUT"]],
  K:[["POR","COD"],["COL","UZB"],["POR","COL"],["UZB","COD"],["UZB","POR"],["COD","COL"]],
  L:[["ENG","CRO"],["GHA","PAN"],["ENG","GHA"],["PAN","CRO"],["PAN","ENG"],["CRO","GHA"]],
};

const KNOCKOUT_STRUCTURE = [
  { id:"R32_1",  round:"r32", label:"Match 73", slots:["1A","2B"] },
  { id:"R32_2",  round:"r32", label:"Match 74", slots:["1B","2A"] },
  { id:"R32_3",  round:"r32", label:"Match 75", slots:["1C","2D"] },
  { id:"R32_4",  round:"r32", label:"Match 76", slots:["1D","2C"] },
  { id:"R32_5",  round:"r32", label:"Match 77", slots:["1E","2F"] },
  { id:"R32_6",  round:"r32", label:"Match 78", slots:["1F","2E"] },
  { id:"R32_7",  round:"r32", label:"Match 79", slots:["1G","2H"] },
  { id:"R32_8",  round:"r32", label:"Match 80", slots:["1H","2G"] },
  { id:"R32_9",  round:"r32", label:"Match 81", slots:["1I","2J"] },
  { id:"R32_10", round:"r32", label:"Match 82", slots:["1J","2I"] },
  { id:"R32_11", round:"r32", label:"Match 83", slots:["1K","2L"] },
  { id:"R32_12", round:"r32", label:"Match 84", slots:["1L","2K"] },
  { id:"R32_13", round:"r32", label:"Match 85", slots:["3RD_RANK_1","3RD_RANK_2"] },
  { id:"R32_14", round:"r32", label:"Match 86", slots:["3RD_RANK_3","3RD_RANK_4"] },
  { id:"R32_15", round:"r32", label:"Match 87", slots:["3RD_RANK_5","3RD_RANK_6"] },
  { id:"R32_16", round:"r32", label:"Match 88", slots:["3RD_RANK_7","3RD_RANK_8"] },
  { id:"QF_1",  round:"qf",  label:"QF 1",     slots:["W_R32_1","W_R32_2"] },
  { id:"QF_2",  round:"qf",  label:"QF 2",     slots:["W_R32_3","W_R32_4"] },
  { id:"QF_3",  round:"qf",  label:"QF 3",     slots:["W_R32_5","W_R32_6"] },
  { id:"QF_4",  round:"qf",  label:"QF 4",     slots:["W_R32_7","W_R32_8"] },
  { id:"QF_5",  round:"qf",  label:"QF 5",     slots:["W_R32_9","W_R32_10"] },
  { id:"QF_6",  round:"qf",  label:"QF 6",     slots:["W_R32_11","W_R32_12"] },
  { id:"QF_7",  round:"qf",  label:"QF 7",     slots:["W_R32_13","W_R32_14"] },
  { id:"QF_8",  round:"qf",  label:"QF 8",     slots:["W_R32_15","W_R32_16"] },
  { id:"SF_1",  round:"sf",  label:"SF 1",     slots:["W_QF_1","W_QF_2"] },
  { id:"SF_2",  round:"sf",  label:"SF 2",     slots:["W_QF_3","W_QF_4"] },
  { id:"SF_3",  round:"sf",  label:"SF 3",     slots:["W_QF_5","W_QF_6"] },
  { id:"SF_4",  round:"sf",  label:"SF 4",     slots:["W_QF_7","W_QF_8"] },
  { id:"3RD_1", round:"3rd", label:"3rd Place (1)", slots:["L_SF_1","L_SF_2"] },
  { id:"3RD_2", round:"3rd", label:"3rd Place (2)", slots:["L_SF_3","L_SF_4"] },
  { id:"FIN_1", round:"final",label:"Final 1", slots:["W_SF_1","W_SF_2"] },
  { id:"FIN_2", round:"final",label:"Final 2", slots:["W_SF_3","W_SF_4"] },
];

// ─── INIT ─────────────────────────────────────────────────────────────────────

function initGroupScores() {
  const s = {};
  for (const g of Object.keys(GROUP_MATCHES)) {
    // Each match: { s1, s2, played, y1, y2, r1, r2 }  (yellows/reds per team)
    s[g] = GROUP_MATCHES[g].map(() => ({ s1:"", s2:"", played:false, y1:0, y2:0, r1:0, r2:0 }));
  }
  return s;
}

function initKnockoutScores() {
  const s = {};
  for (const m of KNOCKOUT_STRUCTURE) {
    s[m.id] = { s1:"", s2:"", played:false };
  }
  return s;
}

// ─── COMPUTATION ──────────────────────────────────────────────────────────────

function computeStandings(group, scores) {
  const teams = GROUPS[group].teams;
  const matches = GROUP_MATCHES[group];
  const stats = {};
  teams.forEach(t => { stats[t] = { p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0, yc:0, rc:0 }; });

  scores.forEach((score, i) => {
    if (!score.played) return;
    const [t1, t2] = matches[i];
    const g1 = parseInt(score.s1)||0, g2 = parseInt(score.s2)||0;
    stats[t1].p++; stats[t2].p++;
    stats[t1].gf += g1; stats[t1].ga += g2;
    stats[t2].gf += g2; stats[t2].ga += g1;
    stats[t1].yc += (score.y1||0); stats[t2].yc += (score.y2||0);
    stats[t1].rc += (score.r1||0); stats[t2].rc += (score.r2||0);
    if (g1 > g2) { stats[t1].w++; stats[t1].pts += 3; stats[t2].l++; }
    else if (g2 > g1) { stats[t2].w++; stats[t2].pts += 3; stats[t1].l++; }
    else { stats[t1].d++; stats[t2].d++; stats[t1].pts++; stats[t2].pts++; }
  });

  return teams
    .map(t => ({
      team: t, group,
      ...stats[t],
      gd: stats[t].gf - stats[t].ga,
      fp: -(stats[t].yc * 1 + stats[t].rc * 3),
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || b.fp - a.fp);
}

// Sort all 12 third-place teams using official 5-step tiebreaker
function rankThirdPlace(allStandings, fifaRankings) {
  const thirds = Object.entries(allStandings).map(([g, st]) => ({ ...st[2], group: g }));
  return thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd  !== a.gd)  return b.gd  - a.gd;
    if (b.gf  !== a.gf)  return b.gf  - a.gf;
    if (b.fp  !== a.fp)  return b.fp  - a.fp;
    const ra = fifaRankings[a.team] || 999;
    const rb = fifaRankings[b.team] || 999;
    return ra - rb; // lower ranking number = better
  });
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────

const C = { dark:"#0f2210", mid:"#1a3a17", bright:"#2d5a27", gold:"#f5d020", lightGreen:"#a8d5a2", pale:"#e8f4e8" };

function Num({ val, onChange, w=34, h=30, title="" }) {
  return (
    <input type="number" min="0" max="99" value={val} title={title}
      onChange={e => onChange(e.target.value)}
      style={{
        width:w, height:h, textAlign:"center", border:`2px solid ${C.bright}`,
        borderRadius:6, fontSize:13, fontWeight:700,
        background: val !== "" && val !== 0 && val !== "0" ? C.pale : "#fff",
        color: C.dark, outline:"none", MozAppearance:"textfield", padding:0,
      }}
    />
  );
}

function CardInput({ yellow, red, onY, onR }) {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      <span title="Yellow cards" style={{ fontSize:13 }}>🟨</span>
      <Num val={yellow} onChange={onY} w={28} h={24} title="Yellow cards" />
      <span title="Red cards" style={{ fontSize:13 }}>🟥</span>
      <Num val={red} onChange={onR} w={28} h={24} title="Red cards" />
    </div>
  );
}

function GroupTable({ standings }) {
  return (
    <div>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ background:C.mid, color:C.gold }}>
            {["#","Team","P","W","D","L","GF","GA","GD","Pts"].map(h => (
              <th key={h} style={{ padding:"4px 4px", textAlign: h==="Team"?"left":"center", fontWeight:700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.team} style={{
              background: i===0?"#c8e6c9": i===1?"#b3e5fc": i===2?"#fff9c4":"#fff",
              borderBottom:"1px solid #ddd",
            }}>
              <td style={{ padding:"3px 4px", fontWeight:700, color: i<2?"#155724":"#777", textAlign:"center" }}>{i+1}</td>
              <td style={{ padding:"3px 4px", fontWeight:600 }}>{fl(row.team)} {row.team}</td>
              <td style={{ padding:"3px 4px", textAlign:"center" }}>{row.p}</td>
              <td style={{ padding:"3px 4px", textAlign:"center" }}>{row.w}</td>
              <td style={{ padding:"3px 4px", textAlign:"center" }}>{row.d}</td>
              <td style={{ padding:"3px 4px", textAlign:"center" }}>{row.l}</td>
              <td style={{ padding:"3px 4px", textAlign:"center" }}>{row.gf}</td>
              <td style={{ padding:"3px 4px", textAlign:"center" }}>{row.ga}</td>
              <td style={{ padding:"3px 4px", textAlign:"center", color: row.gd>0?"#155724":row.gd<0?"#c62828":"#333" }}>
                {row.gd>0?"+":""}{row.gd}
              </td>
              <td style={{ padding:"3px 6px", textAlign:"center", fontWeight:900, color:C.mid }}>{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display:"flex", gap:10, marginTop:4, fontSize:10, color:"#666" }}>
        <span>🟩 Advance (1st/2nd)</span>
        <span>🟦 Potential 3rd</span>
        <span>⬜ Eliminated</span>
      </div>
    </div>
  );
}

function MatchRow({ match, idx, group, onScore }) {
  const [showCards, setShowCards] = useState(false);
  const [t1, t2] = GROUP_MATCHES[group][idx];
  const m = match;
  return (
    <div style={{
      border:`1px solid ${m.played ? C.bright : "#ddd"}`,
      borderRadius:8, overflow:"hidden", marginBottom:6,
      background: m.played ? "#f0faf0" : "#fafafa",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 8px" }}>
        <span style={{ flex:1, textAlign:"right", fontWeight:600, fontSize:13 }}>{fl(t1)} {t1}</span>
        <Num val={m.s1} onChange={v => onScore(group,idx,{s1:v,played:false})} />
        <span style={{ color:"#999", fontWeight:700, fontSize:12 }}>:</span>
        <Num val={m.s2} onChange={v => onScore(group,idx,{s2:v,played:false})} />
        <span style={{ flex:1, fontWeight:600, fontSize:13 }}>{fl(t2)} {t2}</span>
        <button onClick={() => setShowCards(x=>!x)} title="Fair play cards"
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, padding:"0 2px" }}>
          {showCards ? "🃏▲" : "🃏"}
        </button>
        <button
          onClick={() => {
            const has = m.s1!=="" && m.s2!=="";
            onScore(group,idx,{ played: has ? !m.played : false });
          }}
          style={{
            padding:"2px 8px", fontSize:11, borderRadius:5, border:"none", cursor:"pointer",
            background: m.played ? C.mid : "#ccc", color: m.played ? "#fff" : "#333", fontWeight:700,
          }}
        >{m.played ? "✓" : "Save"}</button>
      </div>
      {showCards && (
        <div style={{
          display:"flex", gap:16, padding:"5px 12px",
          background:"#fffbe6", borderTop:"1px dashed #f5d020", fontSize:12,
        }}>
          <div>
            <span style={{ fontWeight:600 }}>{t1} cards: </span>
            <CardInput yellow={m.y1} red={m.r1}
              onY={v => onScore(group,idx,{y1:parseInt(v)||0})}
              onR={v => onScore(group,idx,{r1:parseInt(v)||0})} />
          </div>
          <div>
            <span style={{ fontWeight:600 }}>{t2} cards: </span>
            <CardInput yellow={m.y2} red={m.r2}
              onY={v => onScore(group,idx,{y2:parseInt(v)||0})}
              onR={v => onScore(group,idx,{r2:parseInt(v)||0})} />
          </div>
        </div>
      )}
    </div>
  );
}

function KnockoutMatch({ matchId, team1, team2, score, onScore, label, isFinal }) {
  const t1 = team1 || "TBD", t2 = team2 || "TBD";
  const g1 = parseInt(score.s1)||0, g2 = parseInt(score.s2)||0;
  const winner = score.played ? (g1>g2?t1: g2>g1?t2:null) : null;

  return (
    <div style={{
      border:`2px solid ${isFinal ? C.gold : C.mid}`,
      borderRadius:10, overflow:"hidden", minWidth:180,
      background: score.played ? "#f0faf0" : "#fff",
      boxShadow: isFinal ? `0 0 0 3px ${C.gold}55` : "none",
    }}>
      <div style={{
        background:C.dark, color:C.gold, fontSize:10,
        textAlign:"center", padding:"2px 4px", fontWeight:700, letterSpacing:1,
      }}>{label}</div>
      {[t1,t2].map((team, ti) => {
        const sc = ti===0 ? score.s1 : score.s2;
        const win = team === winner;
        return (
          <div key={ti} style={{
            display:"flex", alignItems:"center", gap:6, padding:"4px 8px",
            background: win ? "#c8e6c9" : ti===0 ? "#fff" : "#fafafa",
            borderTop: ti===1 ? "1px solid #e0e0e0" : "none",
          }}>
            <span style={{ flex:1, fontWeight:win?800:500, fontSize:13, opacity: team==="TBD"?0.4:1 }}>
              {fl(team)} {team}
            </span>
            <Num val={sc} onChange={v => onScore(matchId, ti, v)} />
          </div>
        );
      })}
      <div style={{ padding:"3px 8px", background:"#f5f5f5", textAlign:"right" }}>
        <button onClick={() => onScore(matchId,"toggle")} style={{
          padding:"2px 8px", fontSize:11, border:"none", borderRadius:4, cursor:"pointer",
          background: score.played ? C.mid : "#bbb",
          color: score.played ? "#fff" : "#333", fontWeight:700,
        }}>{score.played ? "✓ Done" : "Confirm"}</button>
      </div>
    </div>
  );
}

// Third-place ranking table
function ThirdPlaceTable({ ranked, fifaRankings, onFifaRank, topN=8 }) {
  const tiebreakLabels = ["Pts","GD","GF","FP","FIFA"];
  return (
    <div>
      <div style={{
        background:C.mid, color:C.gold, padding:"8px 14px",
        fontWeight:800, fontSize:14, borderRadius:"8px 8px 0 0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span>🥉 Third-Place Rankings — Top 8 Advance</span>
        <span style={{ fontSize:11, color:C.lightGreen, fontWeight:500 }}>
          {ranked.filter(r=>r.p>0).length}/12 groups complete
        </span>
      </div>
      <div style={{ border:`2px solid ${C.mid}`, borderTop:"none", borderRadius:"0 0 8px 8px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#e8f4e8" }}>
              <th style={{ padding:"5px 6px", textAlign:"center", width:30 }}>#</th>
              <th style={{ padding:"5px 6px", textAlign:"left" }}>Team</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }}>Grp</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }}>P</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }}>Pts</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }}>GD</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }}>GF</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }} title="Fair Play (−1 yellow, −3 red)">🟨🟥 FP</th>
              <th style={{ padding:"5px 6px", textAlign:"center" }} title="FIFA World Ranking (lower = better)">FIFA Rank</th>
              <th style={{ padding:"5px 4px", textAlign:"center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, i) => {
              const advance = i < topN;
              const onBubble = i === topN - 1;
              return (
                <tr key={row.team} style={{
                  background: advance ? (onBubble?"#fff9c4":"#c8e6c9") : "#fff",
                  borderBottom:"1px solid #e0e0e0",
                }}>
                  <td style={{ padding:"4px 6px", textAlign:"center", fontWeight:800,
                    color: advance ? C.mid : "#bbb" }}>{i+1}</td>
                  <td style={{ padding:"4px 6px", fontWeight:600 }}>{fl(row.team)} {row.team}</td>
                  <td style={{ padding:"4px 4px", textAlign:"center", fontWeight:600, color:"#555" }}>{row.group}</td>
                  <td style={{ padding:"4px 4px", textAlign:"center" }}>{row.p}</td>
                  <td style={{ padding:"4px 4px", textAlign:"center", fontWeight:800 }}>{row.pts}</td>
                  <td style={{ padding:"4px 4px", textAlign:"center",
                    color: row.gd>0?"#155724":row.gd<0?"#c62828":"#333" }}>
                    {row.gd>0?"+":""}{row.gd}
                  </td>
                  <td style={{ padding:"4px 4px", textAlign:"center" }}>{row.gf}</td>
                  <td style={{ padding:"4px 4px", textAlign:"center",
                    color: row.fp<0?"#c62828":"#333", fontWeight: row.fp<0?700:400 }}>
                    {row.fp>0?"+":""}{row.fp}
                  </td>
                  <td style={{ padding:"4px 6px", textAlign:"center" }}>
                    <input type="number" min="1" max="210"
                      value={fifaRankings[row.team] || ""}
                      onChange={e => onFifaRank(row.team, parseInt(e.target.value)||null)}
                      title="Override FIFA ranking"
                      style={{
                        width:46, height:24, textAlign:"center", border:`1px solid ${C.bright}`,
                        borderRadius:4, fontSize:12, fontWeight:600, outline:"none",
                        background: fifaRankings[row.team] !== FIFA_RANKING_DEFAULT[row.team] ? "#fffbe6":"#fff",
                      }}
                    />
                  </td>
                  <td style={{ padding:"4px 6px", textAlign:"center" }}>
                    {row.p === 0
                      ? <span style={{ color:"#bbb", fontSize:11 }}>—</span>
                      : advance
                        ? <span style={{ color:C.mid, fontWeight:700, fontSize:11 }}>
                            {onBubble ? "⚠️ Bubble" : "✅ Advance"}
                          </span>
                        : <span style={{ color:"#c62828", fontSize:11 }}>❌ Out</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{
        marginTop:8, padding:"8px 12px", background:"#fffbe6",
        borderRadius:8, fontSize:11, color:"#555", lineHeight:1.6,
      }}>
        <strong>Tiebreaker order:</strong> 1️⃣ Points → 2️⃣ Goal Difference → 3️⃣ Goals Scored →
        4️⃣ Fair Play (🟨−1, 🟥−3) → 5️⃣ FIFA World Ranking (editable above).
        Top 8 of 12 third-place teams qualify for the Round of 32.
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function WC2026() {
  const [groupScores, setGroupScores] = useState(initGroupScores);
  const [knockoutScores, setKnockoutScores] = useState(initKnockoutScores);
  const [fifaRankings, setFifaRankings] = useState({...FIFA_RANKING_DEFAULT});
  const [tab, setTab] = useState("groups");
  const [activeGroup, setActiveGroup] = useState("A");

  // ── Standings
  const allStandings = useMemo(() => {
    const s = {};
    for (const g of Object.keys(GROUPS)) s[g] = computeStandings(g, groupScores[g]);
    return s;
  }, [groupScores]);

  const thirdRanked = useMemo(() => rankThirdPlace(allStandings, fifaRankings), [allStandings, fifaRankings]);

  // ── Handlers
  const handleGroupScore = useCallback((group, idx, patch) => {
    setGroupScores(prev => {
      const grp = [...prev[group]];
      grp[idx] = { ...grp[idx], ...patch };
      return { ...prev, [group]: grp };
    });
  }, []);

  const handleFifaRank = useCallback((team, val) => {
    setFifaRankings(prev => ({ ...prev, [team]: val || FIFA_RANKING_DEFAULT[team] }));
  }, []);

  // ── Qualifier resolution
  function getQualifier(slot) {
    const m = slot.match(/^(\d)([A-L])$/);
    if (m) {
      const pos = parseInt(m[1]) - 1, grp = m[2];
      return allStandings[grp]?.[pos]?.team || null;
    }
    const tm = slot.match(/^3RD_RANK_(\d+)$/);
    if (tm) {
      return thirdRanked[parseInt(tm[1])-1]?.team || null;
    }
    return null;
  }

  function buildKOState() {
    const ks = {};
    // Pass 1: group-seeded R32
    for (const m of KNOCKOUT_STRUCTURE) {
      const base = knockoutScores[m.id] || { s1:"", s2:"", played:false };
      ks[m.id] = { ...base, team1: null, team2: null };
    }
    // Pass 2: fill all slots iteratively (two passes handle chain dependencies)
    for (let pass = 0; pass < 3; pass++) {
      for (const m of KNOCKOUT_STRUCTURE) {
        const t1 = resolveSlot(m.slots[0], ks);
        const t2 = resolveSlot(m.slots[1], ks);
        ks[m.id] = { ...ks[m.id], team1: t1, team2: t2 };
      }
    }
    return ks;
  }

  function resolveSlot(slot, ks) {
    if (slot.match(/^(\d)[A-L]$/) || slot.match(/^3RD_RANK_\d+$/)) return getQualifier(slot);
    if (slot.startsWith("W_")) {
      const src = ks[slot.slice(2)];
      if (!src?.played || !src.team1 || !src.team2) return null;
      const g1 = parseInt(src.s1)||0, g2 = parseInt(src.s2)||0;
      return g1>g2 ? src.team1 : g2>g1 ? src.team2 : null;
    }
    if (slot.startsWith("L_")) {
      const src = ks[slot.slice(2)];
      if (!src?.played || !src.team1 || !src.team2) return null;
      const g1 = parseInt(src.s1)||0, g2 = parseInt(src.s2)||0;
      return g1>g2 ? src.team2 : g2>g1 ? src.team1 : null;
    }
    return null;
  }

  const handleKO = useCallback((id, side, val) => {
    setKnockoutScores(prev => {
      const m = { ...prev[id] };
      if (side === "toggle") {
        m.played = (m.s1!=="" && m.s2!=="") ? !m.played : false;
      } else if (side === 0) { m.s1 = val; m.played = false; }
      else { m.s2 = val; m.played = false; }
      return { ...prev, [id]: m };
    });
  }, []);

  const koState = buildKOState();

  // ── Stats
  const gPlayed = Object.values(groupScores).flat().filter(m=>m.played).length;
  const gTotal  = Object.values(groupScores).flat().length;
  const koPlayed = Object.values(knockoutScores).filter(m=>m.played).length;
  let champion = null;
  for (const fid of ["FIN_1","FIN_2"]) {
    const f = koState[fid];
    if (f?.played && f.team1 && f.team2) {
      const g1=parseInt(f.s1)||0, g2=parseInt(f.s2)||0;
      if (g1>g2) { champion=f.team1; break; }
      if (g2>g1) { champion=f.team2; break; }
    }
  }

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      padding:"8px 18px", border:"none", cursor:"pointer", fontWeight:700,
      borderRadius:"8px 8px 0 0", fontSize:14,
      background: tab===id ? "#fff" : C.bright,
      color: tab===id ? C.dark : C.lightGreen,
      borderBottom: tab===id ? "2px solid #fff" : "none",
    }}>{label}</button>
  );

  const ROUNDS = ["r32","qf","sf","3rd","final"];
  const ROUND_LABELS = { r32:"Round of 32", qf:"Quarter-Finals", sf:"Semi-Finals", "3rd":"3rd Place", final:"Final" };
  const ROUND_ICON  = { r32:"⚽", qf:"🔥", sf:"⚡", "3rd":"🥉", final:"🏆" };

  return (
    <div style={{
      fontFamily:"'Segoe UI',system-ui,sans-serif",
      background:`linear-gradient(150deg,${C.dark} 0%,${C.mid} 50%,${C.dark} 100%)`,
      minHeight:"100vh", paddingBottom:40,
    }}>
      {/* ── HEADER */}
      <div style={{
        background:`linear-gradient(90deg,${C.dark},${C.mid},${C.dark})`,
        borderBottom:`3px solid ${C.gold}`,
        padding:"14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
      }}>
        <div>
          <div style={{ fontSize:10, color:C.gold, letterSpacing:4, fontWeight:700 }}>FIFA</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#fff", letterSpacing:1, lineHeight:1.1 }}>
            WORLD CUP 2026
          </div>
          <div style={{ fontSize:11, color:C.lightGreen, marginTop:2, fontWeight:500 }}>
            Score Tracker · USA · Canada · Mexico
          </div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {[
            { val:`${gPlayed}/${gTotal}`, label:"GROUP MATCHES" },
            { val:koPlayed, label:"KO MATCHES" },
            { val:`${thirdRanked.filter(t=>t.p===3).length}/12`, label:"GROUPS DONE" },
          ].map(s => (
            <div key={s.label} style={{
              textAlign:"center", background:C.dark, borderRadius:10, padding:"8px 14px",
            }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.gold }}>{s.val}</div>
              <div style={{ fontSize:9, color:C.lightGreen, fontWeight:700, letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
          {champion && (
            <div style={{
              textAlign:"center", background:C.gold, borderRadius:10, padding:"8px 14px",
            }}>
              <div style={{ fontSize:20 }}>🏆</div>
              <div style={{ fontSize:14, fontWeight:900, color:C.dark }}>{fl(champion)} {champion}</div>
              <div style={{ fontSize:9, color:C.mid, fontWeight:800 }}>CHAMPION</div>
            </div>
          )}
        </div>
      </div>

      {/* ── TABS */}
      <div style={{ display:"flex", padding:"0 24px", gap:3, marginTop:16, flexWrap:"wrap" }}>
        {tabBtn("groups","⚽ Group Stage")}
        {tabBtn("third","🥉 3rd Place")}
        {tabBtn("knockout","🏆 Knockout")}
        {tabBtn("tables","📊 All Tables")}
      </div>

      <div style={{
        margin:"0 24px", background:"#fff",
        borderRadius:"0 12px 12px 12px", minHeight:500,
      }}>

        {/* ── GROUP STAGE */}
        {tab === "groups" && (
          <div style={{ padding:20 }}>
            {/* Group picker */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              {Object.keys(GROUPS).map(g => {
                const done = groupScores[g].filter(m=>m.played).length;
                return (
                  <button key={g} onClick={()=>setActiveGroup(g)} style={{
                    padding:"6px 13px", borderRadius:8, border:`2px solid ${activeGroup===g?C.mid:"#ccc"}`,
                    background: activeGroup===g ? C.mid : "#fff",
                    color: activeGroup===g ? C.gold : "#333",
                    fontWeight:700, fontSize:13, cursor:"pointer", position:"relative",
                  }}>
                    {g}
                    {done > 0 && (
                      <span style={{
                        position:"absolute", top:-6, right:-6,
                        background:C.gold, color:C.dark,
                        borderRadius:"50%", width:16, height:16,
                        fontSize:10, fontWeight:900,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{done}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div>
                <div style={{
                  display:"flex", alignItems:"center", gap:8, marginBottom:8,
                }}>
                  <span style={{
                    background:C.mid, color:C.gold, borderRadius:6, padding:"2px 10px",
                    fontWeight:800, fontSize:15,
                  }}>Group {activeGroup}</span>
                  <span style={{ fontSize:11, color:"#888" }}>{GROUPS[activeGroup].label}</span>
                </div>
                <GroupTable standings={allStandings[activeGroup]} />
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:C.mid, marginBottom:8 }}>
                  Match Results · <span style={{ fontWeight:400, fontSize:11, color:"#888" }}>
                    Click 🃏 to enter yellow/red cards for fair play points
                  </span>
                </div>
                {GROUP_MATCHES[activeGroup].map((_, i) => (
                  <MatchRow key={i} match={groupScores[activeGroup][i]}
                    idx={i} group={activeGroup} onScore={handleGroupScore} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── THIRD PLACE */}
        {tab === "third" && (
          <div style={{ padding:20 }}>
            <ThirdPlaceTable
              ranked={thirdRanked}
              fifaRankings={fifaRankings}
              onFifaRank={handleFifaRank}
            />
          </div>
        )}

        {/* ── KNOCKOUT */}
        {tab === "knockout" && (
          <div style={{ padding:20 }}>
            {ROUNDS.map(round => {
              const rMatches = KNOCKOUT_STRUCTURE.filter(m=>m.round===round);
              return (
                <div key={round} style={{ marginBottom:24 }}>
                  <div style={{
                    background:C.mid, color:C.gold, borderRadius:"8px 8px 0 0",
                    padding:"8px 16px", fontWeight:800, fontSize:15, letterSpacing:0.5,
                    display:"flex", alignItems:"center", gap:8,
                  }}>
                    {ROUND_ICON[round]} {ROUND_LABELS[round]}
                    <span style={{ marginLeft:"auto", fontSize:11, color:C.lightGreen, fontWeight:500 }}>
                      {rMatches.filter(m=>koState[m.id]?.played).length}/{rMatches.length} played
                    </span>
                  </div>
                  <div style={{
                    border:`2px solid ${C.mid}`, borderTop:"none",
                    borderRadius:"0 0 8px 8px", padding:14,
                    background:"#f8fdf8",
                    display:"flex", flexWrap:"wrap", gap:12,
                  }}>
                    {rMatches.map(m => (
                      <KnockoutMatch key={m.id} matchId={m.id} label={m.label}
                        team1={koState[m.id]?.team1} team2={koState[m.id]?.team2}
                        score={koState[m.id] || {s1:"",s2:"",played:false}}
                        onScore={handleKO} isFinal={round==="final"} />
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ padding:"10px 14px", background:C.pale, borderRadius:8, fontSize:12, color:C.mid }}>
              💡 Teams auto-fill from group results and third-place rankings.
              Confirm scores to advance winners. Third-place spots in R32 are seeded by the 🥉 table.
            </div>
          </div>
        )}

        {/* ── ALL TABLES */}
        {tab === "tables" && (
          <div style={{ padding:20 }}>
            <div style={{ fontWeight:800, fontSize:16, color:C.mid, marginBottom:14 }}>
              All 12 Group Standings
            </div>
            <div style={{
              display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:16,
            }}>
              {Object.keys(GROUPS).map(g => (
                <div key={g} style={{ border:`2px solid ${C.mid}`, borderRadius:10, overflow:"hidden" }}>
                  <div style={{
                    background:C.mid, color:C.gold, padding:"6px 12px",
                    fontWeight:800, fontSize:13,
                  }}>
                    Group {g} · {GROUPS[g].teams.map(t=>fl(t)+t).join(" ")}
                  </div>
                  <GroupTable standings={allStandings[g]} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>
    </div>
  );
}
