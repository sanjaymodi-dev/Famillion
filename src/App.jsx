import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://kisiovdjngusbxfzeeyk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc2lvdmRqbmd1c2J4ZnplZXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjM0NDAsImV4cCI6MjA5NDU5OTQ0MH0.QdgE82x_WoNi97-X4PMIFkbo11xsCq_4jH07x1ZZ5Bw";

const sb = {
  _token: null, _userId: null,
  async _req(path, opts = {}) {
    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json", Authorization: `Bearer ${this._token || SUPABASE_KEY}`, ...opts.headers };
    const res = await fetch(`${SUPABASE_URL}${path}`, { ...opts, headers });
    const text = await res.text();
    try { return { data: text ? JSON.parse(text) : null, error: res.ok ? null : JSON.parse(text) }; }
    catch { return { data: null, error: { message: text } }; }
  },
  auth: {
    async signUp(email, password) {
      const r = await sb._req("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password }) });
      if (r.data?.access_token) { sb._token = r.data.access_token; sb._userId = r.data.user?.id; }
      return r;
    },
    async signIn(email, password) {
      const r = await sb._req("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
      if (r.data?.access_token) { sb._token = r.data.access_token; sb._userId = r.data.user?.id; localStorage.setItem("fn_token", r.data.access_token); localStorage.setItem("fn_uid", r.data.user?.id); }
      return r;
    },
    async signOut() { sb._token = null; sb._userId = null; ["fn_token","fn_uid","fn_email"].forEach(k => localStorage.removeItem(k)); },
    restore() { const t = localStorage.getItem("fn_token"), u = localStorage.getItem("fn_uid"); if (t && u) { sb._token = t; sb._userId = u; return true; } return false; },
  },
  from(table) {
    return {
      _table: table, _filters: [], _body: null, _method: "GET", _headers: {}, _order: null,
      select(cols="*") { this._cols=cols; return this; },
      insert(data) { this._method="POST"; this._body=data; this._headers["Prefer"]="return=representation"; return this; },
      update(data) { this._method="PATCH"; this._body=data; this._headers["Prefer"]="return=representation"; return this; },
      delete() { this._method="DELETE"; return this; },
      eq(col,val) { this._filters.push(`${col}=eq.${val}`); return this; },
      order(col,opts={}) { this._order=`${col}.${opts.ascending===false?"desc":"asc"}`; return this; },
      single() { this._single=true; this._headers["Accept"]="application/vnd.pgrst.object+json"; return this; },
      async then(resolve, reject) {
        try {
          let path=`/rest/v1/${this._table}`; const params=[];
          if (this._cols) params.push(`select=${this._cols}`);
          this._filters.forEach(f=>params.push(f));
          if (this._order) params.push(`order=${this._order}`);
          if (params.length) path+="?"+params.join("&");
          const r = await sb._req(path, { method:this._method, body:this._body?JSON.stringify(this._body):undefined, headers:this._headers });
          resolve(r);
        } catch(e) { reject(e); }
      },
    };
  },
};

const T = {
  cream:"#FDF6EC", warm:"#F5ECD7", dark:"#5C3D2E", brown:"#8B5E3C",
  amber:"#E8A838", green:"#6B8F71", rose:"#C97B84", blue:"#6B8EAD",
  lav:"#9B89B4", muted:"#A08070", border:"#EDE0D0", card:"#FFFFFF",
  text:"#3D2B1F", teal:"#5B9B9B", orange:"#D4784A", sage:"#7A9E7E",
  clay:"#C4845A", sand:"#D4B896",
};

const THEMES = [
  { id:"earthy",  label:"Earthy",   bg:"linear-gradient(160deg,#FDF6EC,#F5ECD7)", accent:T.brown },
  { id:"forest",  label:"Forest",   bg:"linear-gradient(160deg,#EAF4EA,#D4E8D0)", accent:"#3D6B47" },
  { id:"ocean",   label:"Ocean",    bg:"linear-gradient(160deg,#E8F4F8,#D0E8F0)", accent:"#2E6B8B" },
  { id:"lavender",label:"Lavender", bg:"linear-gradient(160deg,#F4EEF8,#EAE0F5)", accent:"#7B5EA7" },
  { id:"sunset",  label:"Sunset",   bg:"linear-gradient(160deg,#FFF0E8,#FFE0D0)", accent:"#C05A2E" },
  { id:"slate",   label:"Slate",    bg:"linear-gradient(160deg,#2D3142,#3D4259)", accent:"#E8A838" },
];

const lbl = { display:"block", fontSize:12, fontWeight:700, color:T.brown, marginBottom:6, letterSpacing:0.3 };
const inp = { width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${T.border}`, background:"#fff", fontSize:14, color:T.text, boxSizing:"border-box", outline:"none", fontFamily:"Lato,sans-serif" };

const Bar = ({value,max,color,h=8}) => (<div style={{background:"#E8DDD0",borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(100,Math.round((value/(max||1))*100))}%`,background:color,height:"100%",borderRadius:99,transition:"width 0.8s ease"}}/></div>);
const Card = ({children,style={}}) => <div style={{background:T.card,borderRadius:18,padding:16,boxShadow:"0 2px 14px rgba(0,0,0,0.07)",marginBottom:12,...style}}>{children}</div>;
const Sec = ({children,style={}}) => <div style={{fontSize:11,fontWeight:800,color:T.brown,marginBottom:10,letterSpacing:1,textTransform:"uppercase",...style}}>{children}</div>;
const Pill = ({label,active,onClick,color}) => <button onClick={onClick} style={{padding:"8px 14px",borderRadius:99,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:active?(color||T.brown):T.border,color:active?"#fff":T.brown,transition:"all 0.2s",flexShrink:0}}>{label}</button>;
const Badge = ({label,color=T.amber}) => <span style={{background:color+"25",color,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:800,letterSpacing:0.5}}>{label}</span>;

function Spinner() {
  return (<div style={{display:"flex",justifyContent:"center",padding:32}}><div style={{width:28,height:28,borderRadius:"50%",border:`3px solid ${T.border}`,borderTopColor:T.brown,animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
}

// ── SHOW/HIDE PASSWORD COMPONENT ──────────────────────────────────────────────
function PwdInput({ value, onChange, onKeyDown, placeholder="••••••••" }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <input
        style={{...inp, paddingRight:48}}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <button
        onClick={()=>setShow(s=>!s)}
        type="button"
        style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.muted,padding:0,lineHeight:1}}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

function useTable(table, familyId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => {
    if (!familyId) { setLoading(false); return; }
    const { data: rows } = await sb.from(table).select("*").eq("family_id", familyId).order("created_at", {ascending:false});
    setData(Array.isArray(rows) ? rows : []); setLoading(false);
  }, [table, familyId]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const add    = async (row)    => { await sb.from(table).insert({...row, family_id:familyId}); fetchData(); };
  const remove = async (id)     => { await sb.from(table).delete().eq("id",id); fetchData(); };
  const update = async (id,upd) => { await sb.from(table).update(upd).eq("id",id); fetchData(); };
  return { data, loading, add, remove, update, refetch: fetchData };
}

function computeScore(f) {
  if (!f?.monthly_income) return null;
  const sr = ((f.monthly_income - f.monthly_expenses) / f.monthly_income) * 100;
  const em = f.monthly_expenses > 0 ? f.savings / f.monthly_expenses : 0;
  const dr = f.monthly_income > 0 ? (f.debts / (f.monthly_income * 12)) * 100 : 0;
  const ic = f.monthly_income > 0 ? (f.insurance / (f.monthly_income * 12)) * 100 : 0;
  const ytr = sr > 0 ? Math.max(0, (25*f.monthly_expenses - f.savings) / ((sr/100)*f.monthly_income*12)) : 99;
  const fa = Math.min(99, Math.round((f.age||30) + ytr));
  const s1=Math.min(25,(sr/30)*25), s2=Math.min(25,(em/6)*25);
  const s3=Math.min(25,Math.max(0,((50-dr)/50)*25)), s4=Math.min(25,(ic/10)*25);
  const total=Math.round(s1+s2+s3+s4);
  const grade=total>=85?"Excellent":total>=70?"Good":total>=50?"Fair":total>=30?"Needs Work":"Critical";
  const gc=total>=85?T.green:total>=70?T.blue:total>=50?T.amber:T.rose;
  return { score:total, grade, gradeColor:gc, savingsRate:Math.round(sr), emergencyMonths:Math.round(em*10)/10, debtRatio:Math.round(dr), insuranceCoverage:Math.round(ic), freedomAge:fa,
    components:[
      {label:"Savings Rate",   value:Math.round(s1), max:25, tip:`${Math.round(sr)}% of income saved. Target: 30%+`},
      {label:"Emergency Fund", value:Math.round(s2), max:25, tip:`${Math.round(em*10)/10} months covered. Target: 6+`},
      {label:"Debt Health",    value:Math.round(s3), max:25, tip:`Debt ratio ${Math.round(dr)}%. Lower is better.`},
      {label:"Insurance Cover",value:Math.round(s4), max:25, tip:`Coverage ${Math.round(ic)}% of annual income. Target: 10%+`},
    ],
  };
}

function getPeerBenchmark(income) {
  const cohorts = [
    {label:"₹0–30k/mo",   min:0,      max:30000,   avgScore:31, avgSR:12, avgEM:1.8, topSR:22},
    {label:"₹30–80k/mo",  min:30000,  max:80000,   avgScore:48, avgSR:20, avgEM:3.2, topSR:35},
    {label:"₹80k–2L/mo",  min:80000,  max:200000,  avgScore:61, avgSR:28, avgEM:4.8, topSR:45},
    {label:"₹2L+/mo",     min:200000, max:Infinity, avgScore:72, avgSR:35, avgEM:6.4, topSR:52},
  ];
  return cohorts.find(c => income >= c.min && income < c.max) || cohorts[1];
}

const SLIDES = [
  { emoji:"🏡", title:"Welcome to Famillion", sub:"Your family's everything app — finances, chores, memories, health and more. All in one warm place.", color:T.brown },
  { emoji:"💰", title:"Smart Family Finances", sub:"Track expenses, set goals, and see your Financial Freedom Score. Know exactly when you can retire.", color:T.teal },
  { emoji:"🧹", title:"Household Made Easy", sub:"Log your maid, dhobi, dairy and more. Track attendance, bills, and monthly costs effortlessly.", color:T.green },
  { emoji:"📸", title:"Capture Your Story", sub:"Build a beautiful photo journey of your family's milestones — from childhood to today.", color:T.lav },
  { emoji:"💊", title:"Health & Wellness", sub:"Medicine schedules, vaccination records, emergency contacts and blood groups — always at hand.", color:T.rose },
  { emoji:"📓", title:"Family Journal", sub:"Private thoughts, shared memories. Each family member can keep their own journal.", color:T.orange },
  { emoji:"🤖", title:"AI Concierge Coming Soon", sub:"Your AI family assistant — set reminders, get advice, and let family members send you nudges.", color:T.amber },
];

function OnboardingSlides({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;
  return (
    <div style={{minHeight:"100vh", background:`linear-gradient(160deg,${slide.color}22,${T.cream})`, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"60px 32px 48px", fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center"}}>
        <div style={{fontSize:80, marginBottom:28, animation:"bounce 1.2s ease infinite alternate"}}>{slide.emoji}</div>
        <div style={{fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:T.dark, marginBottom:16, lineHeight:1.3}}>{slide.title}</div>
        <div style={{fontSize:15, color:T.muted, lineHeight:1.75, maxWidth:300}}>{slide.sub}</div>
      </div>
      <div>
        <div style={{display:"flex", justifyContent:"center", gap:8, marginBottom:32}}>
          {SLIDES.map((_,i) => (<div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?24:8, height:8, borderRadius:99, background:i===idx?slide.color:T.border, transition:"all 0.3s", cursor:"pointer"}}/>))}
        </div>
        <div style={{display:"flex", gap:12}}>
          {idx > 0 && (<button onClick={()=>setIdx(i=>i-1)} style={{flex:1, padding:16, borderRadius:16, border:`2px solid ${T.border}`, background:"transparent", color:T.brown, fontWeight:700, fontSize:15, cursor:"pointer"}}>← Back</button>)}
          <button onClick={()=>isLast?onDone():setIdx(i=>i+1)} style={{flex:2, padding:16, borderRadius:16, border:"none", background:`linear-gradient(135deg,${slide.color},${T.dark})`, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:`0 4px 20px ${slide.color}44`}}>{isLast?"Let's Begin 🚀":"Next →"}</button>
        </div>
        <button onClick={onDone} style={{width:"100%", marginTop:12, padding:8, background:"transparent", border:"none", color:T.muted, fontSize:13, cursor:"pointer"}}>Skip intro</button>
      </div>
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-12px)}}`}</style>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode,setMode]             = useState("login");
  const [step,setStep]             = useState(1);
  const [loading,setLoading]       = useState(false);
  const [error,setError]           = useState("");
  const [success,setSuccess]       = useState("");
  const [email,setEmail]           = useState("");
  const [password,setPassword]     = useState("");
  const [familyName,setFamilyName] = useState("");
  const [city,setCity]             = useState("Gurgaon");
  const [members,setMembers]       = useState([]);
  const [nm,setNm]                 = useState({name:"",emoji:"👤",relationship:"",dob:"",occupation:""});
  const [income,setIncome]         = useState("");
  const [expenses,setExpenses]     = useState("");
  const [savings,setSavings]       = useState("");
  const [debts,setDebts]           = useState("");
  const [insurance,setInsurance]   = useState("");
  const [age,setAge]               = useState("");
  const [joinMode,setJoinMode]     = useState(false);
  const [inviteCode,setInviteCode] = useState("");

  const emojis = ["👨","👩","👧","👦","👴","👵","👶","🧑","👱","🧔"];
  const cities = ["Gurgaon","Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Noida","Chandigarh"];
  const relationships = ["Parent","Child","Spouse/Partner","Grandparent","Sibling","Uncle/Aunt","Other"];

  const handleLogin = async () => {
    setLoading(true); setError("");
    const {error} = await sb.auth.signIn(email, password);
    if (error) { setError(error.message||"Login failed. Check email and password."); setLoading(false); return; }
    onAuth({id:sb._userId, email}); setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true); setError("");
    try {
      const {data:authData, error:authError} = await sb.auth.signUp(email, password);
      if (authError) throw new Error(authError.message||"Signup failed");
      const userId = sb._userId || authData?.user?.id;
      const inviteRef = `INV-${Math.random().toString(36).substr(2,8).toUpperCase()}`;
      const {data:famData, error:famErr} = await sb.from("families").insert({
        name:familyName, city, monthly_income:Number(income)||0, monthly_expenses:Number(expenses)||0,
        savings:Number(savings)||0, debts:Number(debts)||0, insurance:Number(insurance)||0, age:Number(age)||30,
        points:0, badges:[], invite_code:inviteRef,
      }).select();
      if (famErr) throw new Error(famErr.message||"Could not create family");
      const fid = Array.isArray(famData) ? famData[0]?.id : famData?.id;
      if (!fid) throw new Error("Family ID not returned");
      if (userId) await sb.from("user_profiles").insert({id:userId, family_id:fid, display_name:email, is_admin:true});
      if (members.length > 0)
        await sb.from("members").insert(members.map(m=>({family_id:fid, name:m.name, emoji:m.emoji, relationship:m.relationship||"", dob:m.dob||null, occupation:m.occupation||""})));
      setSuccess(`✅ Family created! Invite code: ${inviteRef}. Check email to verify, then sign in.`);
      setMode("login"); setStep(1);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handleJoin = async () => {
    setLoading(true); setError("");
    try {
      const {data:authData, error:authError} = await sb.auth.signUp(email, password);
      if (authError) throw new Error(authError.message||"Signup failed");
      const userId = sb._userId || authData?.user?.id;
      if (!userId) throw new Error("Could not get user ID after signup. Please try again.");
      const {data:fams} = await sb.from("families").select("*").eq("invite_code", inviteCode.toUpperCase().trim());
      const fam = Array.isArray(fams) ? fams[0] : fams;
      if (!fam) throw new Error("Invite code not found. Please check and try again.");
      // Create user_profiles row — this is critical for the member to see the family
      const {error:profErr} = await sb.from("user_profiles").insert({id:userId, family_id:fam.id, display_name:email, is_admin:false});
      if (profErr && !profErr.message?.includes("duplicate")) throw new Error("Could not link you to the family: "+profErr.message);
      setSuccess(`✅ Joined ${fam.name}! Check your email to verify, then sign in.`);
      setMode("login"); setJoinMode(false);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const reset = () => { setError(""); setSuccess(""); };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FDF6EC,#F5ECD7)",display:"flex",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:420,padding:"48px 24px 40px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:56,marginBottom:8}}>🏡</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:T.dark}}>Famillion</div>
          <div style={{fontSize:14,color:T.muted,marginTop:4}}>Your family's everything app</div>
        </div>

        {!joinMode && mode!=="forgot" && (
          <div style={{display:"flex",background:T.border,borderRadius:14,padding:4,marginBottom:28}}>
            {[["login","Sign In"],["signup","Create Family"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setStep(1);reset();}} style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,background:mode===m?T.brown:T.border,color:mode===m?"#fff":T.muted,transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
        )}

        {error   && <div style={{background:"#FFF0F0",border:`1px solid ${T.rose}40`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.rose,lineHeight:1.5}}>{error}</div>}
        {success && <div style={{background:"#F0FFF4",border:`1px solid ${T.green}40`,borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.green,lineHeight:1.6}}>{success}</div>}

        {/* LOGIN */}
        {!joinMode && mode==="login" && <>
          <div style={{marginBottom:14}}><label style={lbl}>Email</label><input style={inp} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div style={{marginBottom:20}}>
            <label style={lbl}>Password</label>
            <PwdInput value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.brown},${T.dark})`,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:12}}>{loading?"Signing in...":"Sign In →"}</button>
          <button onClick={()=>{setMode("forgot");reset();}} style={{width:"100%",padding:10,background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer"}}>Forgot password?</button>
          <div style={{textAlign:"center",marginTop:16}}>
            <button onClick={()=>{setJoinMode(true);reset();}} style={{background:"transparent",border:`1.5px solid ${T.amber}`,borderRadius:12,padding:"10px 20px",color:T.brown,fontWeight:700,fontSize:13,cursor:"pointer"}}>🔗 Join a Family with Invite Code</button>
          </div>
        </>}

        {/* FORGOT */}
        {!joinMode && mode==="forgot" && <>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.dark,marginBottom:20}}>Reset Password</div>
          <div style={{marginBottom:16}}><label style={lbl}>Email</label><input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <button onClick={async()=>{setLoading(true);await sb._req("/auth/v1/recover",{method:"POST",body:JSON.stringify({email})});setSuccess("Reset link sent! Check your email.");setLoading(false);}} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer",marginBottom:12}}>{loading?"Sending...":"Send Reset Link"}</button>
          <button onClick={()=>{setMode("login");reset();}} style={{width:"100%",padding:10,background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer"}}>← Back to Sign In</button>
        </>}

        {/* JOIN */}
        {joinMode && <>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.dark,marginBottom:6}}>Join Your Family</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:20,lineHeight:1.6}}>Enter the invite code shared by your family admin.</div>
          <div style={{marginBottom:14}}><label style={lbl}>Invite Code</label><input style={{...inp,textTransform:"uppercase",letterSpacing:2,fontWeight:700}} placeholder="INV-XXXXXXXX" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}/></div>
          <div style={{marginBottom:14}}><label style={lbl}>Your Email</label><input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div style={{marginBottom:20}}>
            <label style={lbl}>Create Password</label>
            <PwdInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/>
          </div>
          <button onClick={handleJoin} disabled={loading} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.brown},${T.dark})`,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:12}}>{loading?"Joining...":"Join Family 🏡"}</button>
          <button onClick={()=>{setJoinMode(false);reset();}} style={{width:"100%",padding:10,background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer"}}>← Back to Sign In</button>
        </>}

        {/* SIGNUP */}
        {!joinMode && mode==="signup" && <>
          <div style={{display:"flex",gap:6,marginBottom:24}}>
            {[1,2,3].map(s=><div key={s} style={{flex:1,height:4,borderRadius:99,background:s<=step?T.brown:T.border,transition:"background 0.3s"}}/>)}
          </div>
          {step===1 && <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.dark,marginBottom:20}}>Create your account</div>
            <div style={{marginBottom:14}}><label style={lbl}>Email</label><input style={inp} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>Password (min 6 chars)</label>
              <PwdInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/>
            </div>
            <button onClick={()=>{if(!email||password.length<6){setError("Valid email and min 6-char password required");return;}setError("");setStep(2);}} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Continue →</button>
          </>}
          {step===2 && <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.dark,marginBottom:20}}>Your family details</div>
            <div style={{marginBottom:12}}><label style={lbl}>Family Name</label><input style={inp} placeholder="e.g. The Sharma Family" value={familyName} onChange={e=>setFamilyName(e.target.value)}/></div>
            <div style={{marginBottom:12}}><label style={lbl}>City</label><select style={inp} value={city} onChange={e=>setCity(e.target.value)}>{cities.map(c=><option key={c}>{c}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={lbl}>Monthly Income (₹)</label><input style={inp} type="number" placeholder="85000" value={income} onChange={e=>setIncome(e.target.value)}/></div>
              <div><label style={lbl}>Monthly Expenses (₹)</label><input style={inp} type="number" placeholder="55000" value={expenses} onChange={e=>setExpenses(e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={lbl}>Savings (₹)</label><input style={inp} type="number" placeholder="200000" value={savings} onChange={e=>setSavings(e.target.value)}/></div>
              <div><label style={lbl}>Debts (₹)</label><input style={inp} type="number" placeholder="0" value={debts} onChange={e=>setDebts(e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <div><label style={lbl}>Life Insurance (₹)</label><input style={inp} type="number" placeholder="1000000" value={insurance} onChange={e=>setInsurance(e.target.value)}/></div>
              <div><label style={lbl}>Your Age</label><input style={inp} type="number" placeholder="35" value={age} onChange={e=>setAge(e.target.value)}/></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${T.border}`,background:"transparent",color:T.brown,fontWeight:700,cursor:"pointer"}}>Back</button>
              <button onClick={()=>{if(!familyName.trim()){setError("Please enter family name");return;}setError("");setStep(3);}} style={{flex:2,padding:14,borderRadius:14,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Continue →</button>
            </div>
          </>}
          {step===3 && <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.dark,marginBottom:20}}>Who's in your family?</div>
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:8}}>
              <select style={{...inp,width:56,padding:"10px 4px",textAlign:"center"}} value={nm.emoji} onChange={e=>setNm(m=>({...m,emoji:e.target.value}))}>{emojis.map(e=><option key={e}>{e}</option>)}</select>
              <input style={inp} placeholder="Member name" value={nm.name} onChange={e=>setNm(m=>({...m,name:e.target.value}))}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <select style={inp} value={nm.relationship} onChange={e=>setNm(m=>({...m,relationship:e.target.value}))}><option value="">Relationship</option>{relationships.map(r=><option key={r}>{r}</option>)}</select>
              <input style={inp} type="date" value={nm.dob} onChange={e=>setNm(m=>({...m,dob:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input style={{...inp,flex:1}} placeholder="Occupation (optional)" value={nm.occupation} onChange={e=>setNm(m=>({...m,occupation:e.target.value}))}/>
              <button onClick={()=>{if(nm.name.trim()){setMembers(p=>[...p,{...nm,id:Date.now()}]);setNm({name:"",emoji:"👤",relationship:"",dob:"",occupation:""});}}} style={{padding:"10px 14px",borderRadius:12,background:T.brown,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>+</button>
            </div>
            {members.map((m,i)=>(<div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:T.warm,borderRadius:12,marginBottom:8}}><span style={{fontSize:22}}>{m.emoji}</span><div style={{flex:1}}><div style={{fontWeight:600,color:T.dark}}>{m.name}</div><div style={{fontSize:11,color:T.muted}}>{m.relationship}{m.dob?" · "+new Date(m.dob).getFullYear():""}{m.occupation?" · "+m.occupation:""}</div></div><button onClick={()=>setMembers(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:T.rose,fontSize:18}}>×</button></div>))}
            {members.length===0 && <div style={{color:T.muted,fontSize:13,textAlign:"center",padding:"12px 0"}}>Add at least one member</div>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={()=>setStep(2)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${T.border}`,background:"transparent",color:T.brown,fontWeight:700,cursor:"pointer"}}>Back</button>
              <button disabled={loading||members.length===0} onClick={handleSignup} style={{flex:2,padding:14,borderRadius:14,border:"none",background:members.length>0?T.brown:T.border,color:"#fff",fontWeight:700,cursor:members.length>0?"pointer":"not-allowed"}}>{loading?"Creating...":"Create My Family 🏡"}</button>
            </div>
          </>}
        </>}
      </div>
    </div>
  );
}

function HomeScreen({ family, members, expenses, events }) {
  const score = computeScore(family);
  const month = new Date().getMonth();
  const spent = (expenses||[]).filter(e=>new Date(e.date||e.created_at).getMonth()===month).reduce((s,e)=>s+Number(e.amount),0);
  const upcoming = [...(events||[])].filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
  const hr = new Date().getHours();
  const greet = hr<12?"Good morning ☀️":hr<17?"Good afternoon 🌤️":"Good evening 🌙";
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.dark,fontWeight:700}}>{greet}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.dark,fontWeight:700}}>{family?.name}</div>
        <div style={{fontSize:13,color:T.muted,marginTop:2}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      </div>
      {members?.length>0 && (<div style={{display:"flex",gap:12,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{members.map(m=>(<div key={m.id} style={{textAlign:"center",flexShrink:0}}><div style={{width:50,height:50,borderRadius:"50%",background:T.warm,border:`2.5px solid ${T.amber}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.emoji}</div><div style={{fontSize:10,color:T.muted,marginTop:3}}>{m.name}</div></div>))}</div>)}
      <div style={{background:`linear-gradient(135deg,${T.brown},${T.dark})`,borderRadius:20,padding:"20px",marginBottom:16,color:"#fff",boxShadow:"0 6px 24px rgba(92,61,46,0.25)"}}>
        <div style={{fontSize:12,opacity:0.7,marginBottom:3}}>This Month's Spending</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,marginBottom:3}}>₹{spent.toLocaleString()}</div>
        <div style={{fontSize:13,opacity:0.7,marginBottom:10}}>of ₹{(family?.monthly_expenses||0).toLocaleString()} budget</div>
        <Bar value={spent} max={family?.monthly_expenses||1} color={spent>(family?.monthly_expenses||0)?T.rose:T.amber} h={8}/>
        {score && (<div style={{marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.15)",display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:10,opacity:0.65}}>Freedom Score</div><div style={{fontWeight:800,fontSize:18,color:score.gradeColor}}>{score.score}/100</div></div><div style={{textAlign:"center"}}><div style={{fontSize:10,opacity:0.65}}>Points</div><div style={{fontWeight:800,fontSize:18,color:T.amber}}>🏆 {family?.points||0}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:10,opacity:0.65}}>Freedom Age</div><div style={{fontWeight:800,fontSize:18}}>{score.freedomAge}</div></div></div>)}
      </div>
      {upcoming.length>0 && <><Sec>📅 Coming Up</Sec>{upcoming.map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderLeft:`4px solid ${T.amber}`}}><span style={{fontSize:20}}>{e.emoji||"📅"}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.dark}}>{e.title}</div><div style={{fontSize:12,color:T.muted}}>{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div></div></div>))}</>}
      <Card style={{background:`linear-gradient(135deg,${T.lav}22,${T.blue}11)`,border:`1.5px solid ${T.lav}44`,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:32}}>🤖</div><div style={{flex:1}}><div style={{fontWeight:700,color:T.dark,fontSize:14}}>AI Family Concierge</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Smart nudges & family assistant — coming soon!</div></div><Badge label="SOON" color={T.lav}/></div>
      </Card>
    </div>
  );
}

function MoneyScreen({ family, members, familyId, onPts }) {
  const expenses = useTable("expenses", familyId);
  const goals    = useTable("goals", familyId);
  const [tab,setTab]=useState("expenses");
  const [showE,setShowE]=useState(false);
  const [showG,setShowG]=useState(false);
  const [editId,setEditId]=useState(null);
  const [filterWho,setFilterWho]=useState("all");
  const [ef,setEf]=useState({label:"",amount:"",cat:"🛒",who:""});
  const [gf,setGf]=useState({title:"",emoji:"🎯",target:"",saved:"",color:T.blue});
  const cats=["🛒","⚡","🏥","🚗","🍔","🎓","🏠","✈️","☕","🎮"];
  const colors=[T.blue,T.rose,T.green,T.lav,T.amber,T.brown];
  const month=new Date().getMonth();
  const spent=expenses.data.filter(e=>new Date(e.date||e.created_at).getMonth()===month).reduce((s,e)=>s+Number(e.amount),0);
  const filteredExp=filterWho==="all"?expenses.data:expenses.data.filter(e=>e.who===filterWho);

  const startEdit=(e)=>{setEditId(e.id);setEf({label:e.label,amount:String(e.amount),cat:e.cat,who:e.who||""});setShowE(true);};
  const cancelEdit=()=>{setEditId(null);setEf({label:"",amount:"",cat:"🛒",who:""});setShowE(false);};
  const saveExpense=async()=>{
    if(!ef.label||!ef.amount)return;
    if(editId){
      await expenses.update(editId,{label:ef.label,amount:Number(ef.amount),cat:ef.cat,who:ef.who});
      setEditId(null);
    } else {
      await expenses.add({label:ef.label,amount:Number(ef.amount),cat:ef.cat,who:ef.who,date:new Date().toISOString()});
      await onPts(10);
    }
    setEf({label:"",amount:"",cat:"🛒",who:""});setShowE(false);
  };

  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Family Finances</div>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        <Pill label="💸 Expenses" active={tab==="expenses"} onClick={()=>setTab("expenses")}/>
        <Pill label="🎯 Goals"    active={tab==="goals"}    onClick={()=>setTab("goals")}/>
        <Pill label="📊 Score"    active={tab==="score"}    onClick={()=>setTab("score")}/>
        <Pill label="📋 Budget"   active={tab==="budget"}   onClick={()=>setTab("budget")}/>
      </div>
      {tab==="expenses" && <>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <Card style={{marginBottom:0}}><div style={{fontSize:22,marginBottom:4}}>💸</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.rose}}>₹{spent.toLocaleString()}</div><div style={{fontSize:11,color:T.muted}}>Spent this month</div></Card>
          <Card style={{marginBottom:0}}><div style={{fontSize:22,marginBottom:4}}>🏦</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.green}}>₹{Math.max(0,(family?.monthly_expenses||0)-spent).toLocaleString()}</div><div style={{fontSize:11,color:T.muted}}>Remaining</div></Card>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
          <Pill label="All" active={filterWho==="all"} onClick={()=>setFilterWho("all")} color={T.teal}/>
          {members?.map(m=><Pill key={m.id} label={m.name} active={filterWho===m.name} onClick={()=>setFilterWho(m.name)} color={T.teal}/>)}
        </div>
        <Sec>Recent Expenses {filterWho!=="all"&&`· ${filterWho}`}</Sec>
        {expenses.loading&&<Spinner/>}
        {!expenses.loading&&filteredExp.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{color:T.muted}}>No expenses yet!</div></Card>}
        {filteredExp.map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}><div style={{width:44,height:44,borderRadius:12,background:T.warm,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{e.cat}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.dark}}>{e.label}</div><div style={{fontSize:12,color:T.muted}}>{e.who} · {new Date(e.date||e.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div></div><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{fontWeight:700,color:T.dark}}>₹{Number(e.amount).toLocaleString()}</div><button onClick={()=>startEdit(e)} style={{background:T.amber+"20",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:T.brown,fontWeight:700}}>✏️</button><button onClick={()=>expenses.remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:16}}>×</button></div></div>))}
        {showE?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>{editId?"Edit Expense":"Add Expense"}</div><div style={{marginBottom:10}}><label style={lbl}>Category</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{cats.map(c=><button key={c} onClick={()=>setEf(f=>({...f,cat:c}))} style={{width:48,height:48,borderRadius:12,border:`2px solid ${ef.cat===c?T.brown:T.border}`,background:ef.cat===c?T.warm:"#fff",fontSize:24,cursor:"pointer"}}>{c}</button>)}</div></div><div style={{marginBottom:10}}><label style={lbl}>Description</label><input style={inp} value={ef.label} onChange={e=>setEf(f=>({...f,label:e.target.value}))} placeholder="e.g. Weekly groceries"/></div><div style={{marginBottom:10}}><label style={lbl}>Amount (₹)</label><input style={inp} type="number" value={ef.amount} onChange={e=>setEf(f=>({...f,amount:e.target.value}))}/></div><div style={{marginBottom:14}}><label style={lbl}>Paid by</label><select style={inp} value={ef.who} onChange={e=>setEf(f=>({...f,who:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div style={{display:"flex",gap:8}}><button onClick={cancelEdit} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={saveExpense} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>{editId?"Update":"Save +10pts"}</button></div></Card>):<button onClick={()=>{setEditId(null);setShowE(true);}} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Expense</button>}
      </>}
      {tab==="goals" && <>
        {goals.loading&&<Spinner/>}
        {goals.data.map(g=>(<Card key={g.id}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:26}}>{g.emoji}</span><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:T.dark}}>{g.title}</div><div style={{fontSize:12,color:T.muted}}>Target: ₹{Number(g.target).toLocaleString()}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:g.color,fontSize:15}}>₹{Number(g.saved).toLocaleString()}</div><div style={{fontSize:11,color:T.muted}}>{Math.round(g.saved/g.target*100)}%</div></div></div><Bar value={Number(g.saved)} max={Number(g.target)} color={g.color}/><button onClick={()=>goals.remove(g.id)} style={{marginTop:8,fontSize:11,color:T.muted,background:"none",border:"none",cursor:"pointer"}}>Remove</button></Card>))}
        {!goals.loading&&goals.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{color:T.muted}}>No goals yet!</div></Card>}
        {showG?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Goal</div><div style={{marginBottom:10}}><label style={lbl}>Goal Name</label><input style={inp} value={gf.title} onChange={e=>setGf(f=>({...f,title:e.target.value}))} placeholder="e.g. Arya's College Fund"/></div><div style={{marginBottom:10}}><label style={lbl}>Icon</label><div style={{display:"flex",gap:6}}>{["🎓","✈️","💍","🛡️","🏠","🚗","🎯","💰","🏖️","🎹"].map(e=><button key={e} onClick={()=>setGf(f=>({...f,emoji:e}))} style={{width:36,height:36,borderRadius:8,border:`2px solid ${gf.emoji===e?T.brown:T.border}`,background:gf.emoji===e?T.warm:"#fff",fontSize:18,cursor:"pointer"}}>{e}</button>)}</div></div><div style={{marginBottom:10}}><label style={lbl}>Target (₹)</label><input style={inp} type="number" value={gf.target} onChange={e=>setGf(f=>({...f,target:e.target.value}))}/></div><div style={{marginBottom:14}}><label style={lbl}>Already Saved (₹)</label><input style={inp} type="number" value={gf.saved} onChange={e=>setGf(f=>({...f,saved:e.target.value}))}/></div><div style={{marginBottom:14}}><label style={lbl}>Color</label><div style={{display:"flex",gap:8}}>{colors.map(c=><button key={c} onClick={()=>setGf(f=>({...f,color:c}))} style={{width:28,height:28,borderRadius:"50%",background:c,border:`3px solid ${gf.color===c?T.dark:"transparent"}`,cursor:"pointer"}}/>)}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowG(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(gf.title&&gf.target){await goals.add({title:gf.title,emoji:gf.emoji,target:Number(gf.target),saved:Number(gf.saved||0),color:gf.color});await onPts(20);setGf({title:"",emoji:"🎯",target:"",saved:"",color:T.blue});setShowG(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save +20pts</button></div></Card>):<button onClick={()=>setShowG(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Goal</button>}
      </>}
      {tab==="score"&&<FreedomScoreScreen family={family}/>}
      {tab==="budget"&&<BudgetScreen family={family} expenses={expenses.data}/>}
    </div>
  );
}

function BudgetScreen({ family, expenses }) {
  const cats=["🛒 Groceries","⚡ Utilities","📚 Education","🏥 Health","🚗 Transport","🍔 Food/Dining","👗 Clothing","🎮 Entertainment","✈️ Travel","🏠 Home","💊 Medicine","🎓 Fees","☕ Miscellaneous"];
  const month=new Date().getMonth();
  const monthExp=(expenses||[]).filter(e=>new Date(e.date||e.created_at).getMonth()===month);
  const totalSpent=monthExp.reduce((s,e)=>s+Number(e.amount),0);
  const budget=family?.monthly_expenses||0;
  const catTotals=cats.map(c=>{const emoji=c.split(" ")[0];const spent=monthExp.filter(e=>e.cat===emoji).reduce((s,e)=>s+Number(e.amount),0);return{label:c,emoji,spent};}).filter(c=>c.spent>0);
  return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${T.teal},#3A7070)`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:0.75,marginBottom:4}}>Monthly Budget Used</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700}}>₹{totalSpent.toLocaleString()} / ₹{budget.toLocaleString()}</div>
        <div style={{marginTop:10}}><Bar value={totalSpent} max={budget||1} color={totalSpent>budget?T.rose:"#fff"} h={10}/></div>
        <div style={{fontSize:12,opacity:0.75,marginTop:8}}>{budget>0?`${Math.round((totalSpent/budget)*100)}% used`:"Set budget in your profile"}</div>
      </Card>
      <Sec>Spending by Category</Sec>
      {catTotals.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{color:T.muted}}>Add expenses to see category breakdown</div></Card>}
      {catTotals.sort((a,b)=>b.spent-a.spent).map(c=>(<Card key={c.label} style={{padding:"12px 16px",marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{c.emoji}</span><span style={{fontSize:13,fontWeight:600,color:T.dark}}>{c.label.split(" ").slice(1).join(" ")}</span></div><span style={{fontWeight:800,color:T.brown}}>₹{c.spent.toLocaleString()}</span></div><Bar value={c.spent} max={totalSpent||1} color={T.teal} h={6}/><div style={{fontSize:11,color:T.muted,marginTop:4}}>{budget>0?`${Math.round((c.spent/budget)*100)}% of budget`:""}</div></Card>))}
    </div>
  );
}

function FreedomScoreScreen({ family }) {
  const score=computeScore(family);
  const peer=family?.monthly_income?getPeerBenchmark(family.monthly_income):null;
  if (!score) return (<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:12}}>📊</div><div style={{color:T.muted,fontSize:14,lineHeight:1.7}}>Complete your financial details to see your Freedom Score.</div></Card>);
  const C=2*Math.PI*54; const dash=C-(score.score/100)*C;
  return (
    <div>
      <Card style={{textAlign:"center",padding:"24px 16px"}}>
        <svg width={140} height={140} style={{display:"block",margin:"0 auto 12px"}}>
          <circle cx={70} cy={70} r={54} fill="none" stroke={T.border} strokeWidth={10}/>
          <circle cx={70} cy={70} r={54} fill="none" stroke={score.gradeColor} strokeWidth={10} strokeDasharray={C} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 70 70)" style={{transition:"stroke-dashoffset 1s ease"}}/>
          <text x={70} y={64} textAnchor="middle" fontSize={30} fontWeight={800} fill={T.dark} fontFamily="'Playfair Display',serif">{score.score}</text>
          <text x={70} y={82} textAnchor="middle" fontSize={11} fill={T.muted} fontFamily="Lato,sans-serif">/100</text>
        </svg>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:score.gradeColor,marginBottom:4}}>{score.grade}</div>
        <div style={{fontSize:13,color:T.muted}}>Financial freedom at age <strong style={{color:T.dark}}>{score.freedomAge}</strong></div>
      </Card>
      <Sec>Score Breakdown</Sec>
      {score.components.map(c=>(<Card key={c.label} style={{padding:"14px 16px",marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:13,color:T.dark}}>{c.label}</div><div style={{fontWeight:800,fontSize:13,color:T.brown}}>{c.value}/{c.max}</div></div><Bar value={c.value} max={c.max} color={c.value>=c.max*0.8?T.green:c.value>=c.max*0.5?T.amber:T.rose}/><div style={{fontSize:11,color:T.muted,marginTop:5}}>{c.tip}</div></Card>))}
      {peer&&<><Sec style={{marginTop:8}}>Peer Benchmarks · {peer.label}</Sec><Card>{[{label:"Freedom Score",yours:score.score,peers:peer.avgScore,unit:"/100"},{label:"Savings Rate",yours:score.savingsRate,peers:peer.avgSR,unit:"%"},{label:"Emergency Fund",yours:score.emergencyMonths,peers:peer.avgEM,unit:" mo"}].map(row=>(<div key={row.label} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{fontSize:12,color:T.dark,fontWeight:600}}>{row.label}</div><div style={{fontSize:12}}><span style={{fontWeight:800,color:row.yours>=row.peers?T.green:T.rose}}>You: {row.yours}{row.unit}</span><span style={{color:T.muted,marginLeft:8}}>Avg: {row.peers}{row.unit}</span></div></div><div style={{display:"flex",gap:6}}><div style={{flex:1}}><div style={{fontSize:9,color:T.muted,marginBottom:2}}>You</div><Bar value={row.yours} max={100} color={row.yours>=row.peers?T.green:T.rose} h={6}/></div><div style={{flex:1}}><div style={{fontSize:9,color:T.muted,marginBottom:2}}>Peer avg</div><Bar value={row.peers} max={100} color={T.blue} h={6}/></div></div></div>))}</Card></>}
      <Sec style={{marginTop:8}}>What to do next</Sec>
      <Card>{score.score<25&&<div style={{fontSize:13,color:T.dark,lineHeight:1.7}}>🚨 Start an emergency fund. Even ₹500/month helps.</div>}{score.score>=25&&score.score<50&&<div style={{fontSize:13,color:T.dark,lineHeight:1.7}}>📈 Aim for 20% savings rate. Cut one non-essential subscription.</div>}{score.score>=50&&score.score<70&&<div style={{fontSize:13,color:T.dark,lineHeight:1.7}}>💡 Consider term insurance. Explore PPF or ELSS for tax savings.</div>}{score.score>=70&&<div style={{fontSize:13,color:T.dark,lineHeight:1.7}}>🌟 Excellent! Increase your SIP by ₹1,000/month.</div>}</Card>
    </div>
  );
}

function ErrandsScreen({ familyId, onPts }) {
  const groceries=useTable("groceries",familyId);
  const bills=useTable("bills",familyId);
  const [newItem,setNewItem]=useState("");
  const [showBill,setShowBill]=useState(false);
  const [nb,setNb]=useState({label:"",amount:"",due_date:"",icon:"📄",recurring:false});
  const billIcons=["⚡","📡","💧","🔥","📱","🏠","📺","💊","🚗","🌐"];
  const overdueBills=bills.data.filter(b=>!b.paid&&b.due_date&&new Date(b.due_date)<new Date());
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Daily Errands</div>
      {overdueBills.length>0&&(<div style={{background:T.rose+"15",border:`1.5px solid ${T.rose}40`,borderRadius:14,padding:"12px 16px",marginBottom:16}}><div style={{fontWeight:700,color:T.rose,fontSize:13}}>⚠️ {overdueBills.length} overdue bill{overdueBills.length>1?"s":""}</div>{overdueBills.map(b=><div key={b.id} style={{fontSize:12,color:T.rose,marginTop:4}}>{b.icon} {b.label} — ₹{Number(b.amount).toLocaleString()}</div>)}</div>)}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,fontSize:15,color:T.dark}}>🛒 Shopping List</div><div style={{fontSize:12,color:T.muted}}>{groceries.data.filter(i=>i.done).length}/{groceries.data.length} done</div></div>
        {groceries.loading&&<Spinner/>}
        {groceries.data.map((item,i)=>(<div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<groceries.data.length-1?`1px solid ${T.border}`:"none"}}><div onClick={()=>groceries.update(item.id,{done:!item.done})} style={{width:22,height:22,borderRadius:6,border:`2px solid ${item.done?T.green:T.muted}`,background:item.done?T.green:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{item.done&&<span style={{color:"#fff",fontSize:13}}>✓</span>}</div><div style={{flex:1,fontSize:14,color:item.done?T.muted:T.dark,textDecoration:item.done?"line-through":"none"}}>{item.name}</div>{item.qty&&<div style={{fontSize:12,color:T.muted}}>{item.qty}</div>}<button onClick={()=>groceries.remove(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:16}}>×</button></div>))}
        <div style={{display:"flex",gap:8,marginTop:12}}><input style={{...inp,flex:1}} placeholder="Add item..." value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newItem.trim()){groceries.add({name:newItem.trim(),done:false});setNewItem("");}}}/><button onClick={()=>{if(newItem.trim()){groceries.add({name:newItem.trim(),done:false});setNewItem("");}}} style={{padding:"10px 16px",borderRadius:12,background:T.green,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>+</button></div>
        {groceries.data.filter(i=>i.done).length>0&&(<button onClick={()=>groceries.data.filter(i=>i.done).forEach(i=>groceries.remove(i.id))} style={{marginTop:8,fontSize:11,color:T.muted,background:"none",border:"none",cursor:"pointer"}}>Clear completed</button>)}
      </Card>
      <Sec>📄 Bills & Reminders</Sec>
      {bills.loading&&<Spinner/>}
      {bills.data.map(b=>(<div key={b.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",opacity:b.paid?0.65:1,borderLeft:`3px solid ${b.paid?T.green:overdueBills.find(o=>o.id===b.id)?T.rose:T.amber}`}}><div style={{fontSize:22}}>{b.icon}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.dark}}>{b.label}</div><div style={{fontSize:12,color:T.muted}}>Due: {b.due_date?new Date(b.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}{b.recurring?" · 🔄":""}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:b.paid?T.green:T.rose}}>₹{Number(b.amount).toLocaleString()}</div><button onClick={async()=>{await bills.update(b.id,{paid:!b.paid});if(!b.paid)await onPts(15);}} style={{fontSize:11,color:b.paid?T.green:T.rose,fontWeight:700,background:"none",border:"none",cursor:"pointer"}}>{b.paid?"✓ Paid":"Mark Paid +15pts"}</button></div></div>))}
      {showBill?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Bill / Reminder</div><div style={{marginBottom:10}}><label style={lbl}>Icon</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{billIcons.map(e=><button key={e} onClick={()=>setNb(b=>({...b,icon:e}))} style={{width:34,height:34,borderRadius:8,border:`2px solid ${nb.icon===e?T.brown:T.border}`,background:nb.icon===e?T.warm:"#fff",fontSize:17,cursor:"pointer"}}>{e}</button>)}</div></div><div style={{marginBottom:10}}><label style={lbl}>Bill Name</label><input style={inp} value={nb.label} onChange={e=>setNb(b=>({...b,label:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Amount (₹)</label><input style={inp} type="number" value={nb.amount} onChange={e=>setNb(b=>({...b,amount:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Due Date</label><input style={inp} type="date" value={nb.due_date} onChange={e=>setNb(b=>({...b,due_date:e.target.value}))}/></div><div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}><input type="checkbox" id="rec" checked={nb.recurring} onChange={e=>setNb(b=>({...b,recurring:e.target.checked}))} style={{width:18,height:18}}/><label htmlFor="rec" style={{fontSize:13,color:T.dark,cursor:"pointer"}}>🔄 Recurring monthly bill</label></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowBill(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(nb.label&&nb.amount){await bills.add({label:nb.label,amount:Number(nb.amount),due_date:nb.due_date||null,icon:nb.icon,paid:false,recurring:nb.recurring});setNb({label:"",amount:"",due_date:"",icon:"📄",recurring:false});setShowBill(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowBill(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Bill / Reminder</button>}
    </div>
  );
}

const PROVIDER_TYPES=[{id:"dhobi",label:"Dhobi",emoji:"👕",unit:"visit"},{id:"dairy",label:"Dairy",emoji:"🥛",unit:"day"},{id:"maid",label:"Maid",emoji:"🧹",unit:"visit"},{id:"cook",label:"Cook",emoji:"👨‍🍳",unit:"visit"},{id:"kirana",label:"Kirana",emoji:"🛒",unit:"visit"},{id:"driver",label:"Driver",emoji:"🚗",unit:"day"},{id:"gardener",label:"Gardener",emoji:"🌿",unit:"visit"},{id:"watchman",label:"Watchman",emoji:"💂",unit:"month"},{id:"other",label:"Other",emoji:"🔧",unit:"visit"}];

function ChoresScreen({ familyId, onPts }) {
  const providers=useTable("providers",familyId);
  const logs=useTable("provider_logs",familyId);
  const [view,setView]=useState("list");
  const [np,setNp]=useState({name:"",type:"maid",rate:"",notes:""});
  const today=new Date().toISOString().split("T")[0];
  const todaysLogs=logs.data.filter(l=>l.log_date===today);
  const loggedIds=todaysLogs.map(l=>l.provider_id);
  const handleAddProvider=async()=>{if(!np.name||!np.rate)return;const pt=PROVIDER_TYPES.find(p=>p.id===np.type);await providers.add({name:np.name,type:np.type,emoji:pt?.emoji||"🔧",rate:Number(np.rate),unit:pt?.unit||"visit",notes:np.notes,active:true});setNp({name:"",type:"maid",rate:"",notes:""});setView("list");};
  const handleLog=async(provider)=>{if(loggedIds.includes(provider.id))return;await logs.add({provider_id:provider.id,log_date:today,amount:provider.rate});await onPts(5);};
  const monthTotal=(pid)=>{const m=new Date().getMonth();return logs.data.filter(l=>l.provider_id===pid&&new Date(l.log_date).getMonth()===m).reduce((s,l)=>s+Number(l.amount||0),0);};
  const totalMonthSpend=providers.data.reduce((s,p)=>s+monthTotal(p.id),0);
  if (view==="add") return (
    <div style={{padding:"0 16px 16px"}}>
      <button onClick={()=>setView("list")} style={{background:"none",border:"none",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:16,padding:0}}>← Back</button>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:T.dark,marginBottom:20}}>Add Service Provider</div>
      <div style={{marginBottom:12}}><label style={lbl}>Type</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{PROVIDER_TYPES.map(pt=>(<button key={pt.id} onClick={()=>setNp(p=>({...p,type:pt.id}))} style={{padding:"8px 12px",borderRadius:10,border:`2px solid ${np.type===pt.id?T.brown:T.border}`,background:np.type===pt.id?T.warm:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{pt.emoji} {pt.label}</button>))}</div></div>
      <div style={{marginBottom:12}}><label style={lbl}>Provider Name</label><input style={inp} placeholder="e.g. Ramesh bhaiya" value={np.name} onChange={e=>setNp(p=>({...p,name:e.target.value}))}/></div>
      <div style={{marginBottom:12}}><label style={lbl}>Rate per {PROVIDER_TYPES.find(p=>p.id===np.type)?.unit||"visit"} (₹)</label><input style={inp} type="number" placeholder="250" value={np.rate} onChange={e=>setNp(p=>({...p,rate:e.target.value}))}/></div>
      <div style={{marginBottom:20}}><label style={lbl}>Notes (optional)</label><input style={inp} placeholder="e.g. Comes Mon-Sat" value={np.notes} onChange={e=>setNp(p=>({...p,notes:e.target.value}))}/></div>
      <button onClick={handleAddProvider} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:T.brown,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>Save Provider</button>
    </div>
  );
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:6}}>Chores & Services</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:14}}>Track your dhobi, maid, dairy & more</div>
      <Card style={{background:`linear-gradient(135deg,${T.teal},#3D7A7A)`,color:"#fff",marginBottom:14}}><div style={{fontSize:12,opacity:0.75,marginBottom:4}}>This Month's Service Cost</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700}}>₹{totalMonthSpend.toLocaleString()}</div><div style={{fontSize:12,opacity:0.7,marginTop:4}}>{providers.data.length} providers · {logs.data.filter(l=>new Date(l.log_date).getMonth()===new Date().getMonth()).length} visits logged</div></Card>
      {providers.data.length>0&&<><Sec>Today's Attendance</Sec><div style={{display:"flex",gap:10,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{providers.data.filter(p=>p.active).map(p=>{const came=loggedIds.includes(p.id);return(<div key={p.id} onClick={()=>!came&&handleLog(p)} style={{flexShrink:0,textAlign:"center",cursor:came?"default":"pointer"}}><div style={{width:56,height:56,borderRadius:"50%",background:came?T.green+"30":T.warm,border:`3px solid ${came?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,position:"relative"}}>{p.emoji}{came&&<div style={{position:"absolute",bottom:-2,right:-2,width:18,height:18,borderRadius:"50%",background:T.green,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:10}}>✓</span></div>}</div><div style={{fontSize:10,color:came?T.green:T.muted,fontWeight:700,marginTop:4}}>{p.name.split(" ")[0]}</div>{!came&&<div style={{fontSize:9,color:T.muted}}>tap ✓</div>}</div>);})}</div></>}
      <Sec>All Providers</Sec>
      {providers.loading&&<Spinner/>}
      {!providers.loading&&providers.data.length===0&&(<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:10}}>🧹</div><div style={{color:T.muted,fontSize:14,lineHeight:1.7}}>Add your maid, dhobi, dairy and more.</div></Card>)}
      {providers.data.map(p=>{const mTotal=monthTotal(p.id);const mVisits=logs.data.filter(l=>l.provider_id===p.id&&new Date(l.log_date).getMonth()===new Date().getMonth()).length;const came=loggedIds.includes(p.id);return(<Card key={p.id} style={{padding:"14px 16px"}}><div style={{display:"flex",alignItems:"flex-start",gap:12}}><div style={{width:48,height:48,borderRadius:14,background:came?T.green+"20":T.warm,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`2px solid ${came?T.green:T.border}`,flexShrink:0}}>{p.emoji}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>{p.name}</div><div style={{fontSize:12,color:T.muted}}>₹{p.rate}/{p.unit} · {mVisits} visits this month</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:800,color:T.brown}}>₹{mTotal.toLocaleString()}</div><div style={{fontSize:10,color:T.muted}}>this month</div></div></div>{p.notes&&<div style={{fontSize:11,color:T.muted,marginTop:4}}>{p.notes}</div>}<div style={{display:"flex",gap:8,marginTop:10}}>{!came?(<button onClick={()=>handleLog(p)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",background:T.green,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓ Mark Came +5pts</button>):(<div style={{flex:1,padding:"8px 0",borderRadius:10,background:T.green+"20",color:T.green,fontWeight:700,fontSize:12,textAlign:"center"}}>✓ Logged Today</div>)}<button onClick={()=>providers.remove(p.id)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${T.rose}30`,background:"transparent",color:T.rose,fontSize:12,cursor:"pointer"}}>Remove</button></div></div></div></Card>);})}
      <button onClick={()=>setView("add")} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:4}}>+ Add Provider</button>
    </div>
  );
}

function HealthScreen({ familyId, members, onPts }) {
  const medicines=useTable("medicines",familyId);
  const vaccinations=useTable("vaccinations",familyId);
  const emergency=useTable("emergency_contacts",familyId);
  const [tab,setTab]=useState("medicine");
  const [showMed,setShowMed]=useState(false);
  const [showVax,setShowVax]=useState(false);
  const [showEm,setShowEm]=useState(false);
  const [mf,setMf]=useState({name:"",member:"",dose:"",frequency:"Daily",time:"08:00",notes:""});
  const [vf,setVf]=useState({name:"",member:"",due_date:"",given_date:"",notes:""});
  const [ef,setEf]=useState({name:"",relation:"",phone:"",blood_group:"",allergies:"",doctor:""});
  const freqs=["Daily","Twice daily","Weekly","As needed","Monthly"];
  const bloodGroups=["A+","A-","B+","B-","AB+","AB-","O+","O-"];
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Health & Wellness</div>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        <Pill label="💊 Medicines" active={tab==="medicine"} onClick={()=>setTab("medicine")} color={T.rose}/>
        <Pill label="💉 Vaccines"  active={tab==="vaccines"}  onClick={()=>setTab("vaccines")} color={T.blue}/>
        <Pill label="🚨 Emergency" active={tab==="emergency"} onClick={()=>setTab("emergency")} color={T.orange}/>
      </div>
      {tab==="medicine"&&<>{medicines.loading&&<Spinner/>}{medicines.data.map(m=>(<Card key={m.id} style={{borderLeft:`4px solid ${T.rose}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>💊 {m.name}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{m.member} · {m.dose} · {m.frequency}</div><div style={{fontSize:12,color:T.rose,marginTop:2}}>⏰ {m.time}</div>{m.notes&&<div style={{fontSize:11,color:T.muted,marginTop:4,fontStyle:"italic"}}>{m.notes}</div>}</div><button onClick={()=>medicines.remove(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted}}>×</button></div></Card>))}{!medicines.loading&&medicines.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>💊</div><div style={{color:T.muted}}>No medicines tracked yet</div></Card>}{showMed?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Medicine</div><div style={{marginBottom:10}}><label style={lbl}>Medicine Name</label><input style={inp} value={mf.name} onChange={e=>setMf(f=>({...f,name:e.target.value}))} placeholder="e.g. Vitamin D3"/></div><div style={{marginBottom:10}}><label style={lbl}>For Member</label><select style={inp} value={mf.member} onChange={e=>setMf(f=>({...f,member:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>Dose</label><input style={inp} placeholder="1 tablet" value={mf.dose} onChange={e=>setMf(f=>({...f,dose:e.target.value}))}/></div><div><label style={lbl}>Time</label><input style={inp} type="time" value={mf.time} onChange={e=>setMf(f=>({...f,time:e.target.value}))}/></div></div><div style={{marginBottom:10}}><label style={lbl}>Frequency</label><select style={inp} value={mf.frequency} onChange={e=>setMf(f=>({...f,frequency:e.target.value}))}>{freqs.map(f=><option key={f}>{f}</option>)}</select></div><div style={{marginBottom:14}}><label style={lbl}>Notes</label><input style={inp} placeholder="After meals, etc." value={mf.notes} onChange={e=>setMf(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowMed(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(mf.name&&mf.member){await medicines.add(mf);await onPts(5);setMf({name:"",member:"",dose:"",frequency:"Daily",time:"08:00",notes:""});setShowMed(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.rose,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowMed(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.rose}`,background:"transparent",color:T.rose,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Medicine</button>}</>}
      {tab==="vaccines"&&<>{vaccinations.loading&&<Spinner/>}{vaccinations.data.map(v=>(<Card key={v.id} style={{borderLeft:`4px solid ${T.blue}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>💉 {v.name}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{v.member}</div>{v.given_date&&<div style={{fontSize:12,color:T.green,marginTop:2}}>✓ Given: {new Date(v.given_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>}{v.due_date&&!v.given_date&&<div style={{fontSize:12,color:new Date(v.due_date)<new Date()?T.rose:T.amber,marginTop:2}}>Due: {new Date(v.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>}{v.notes&&<div style={{fontSize:11,color:T.muted,marginTop:4}}>{v.notes}</div>}</div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>{!v.given_date&&<button onClick={()=>vaccinations.update(v.id,{given_date:new Date().toISOString().split("T")[0]})} style={{fontSize:11,color:T.green,fontWeight:700,background:T.green+"15",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>Mark Done</button>}<button onClick={()=>vaccinations.remove(v.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14}}>×</button></div></div></Card>))}{!vaccinations.loading&&vaccinations.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>💉</div><div style={{color:T.muted}}>No vaccination records yet</div></Card>}{showVax?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Vaccination</div><div style={{marginBottom:10}}><label style={lbl}>Vaccine Name</label><input style={inp} value={vf.name} onChange={e=>setVf(f=>({...f,name:e.target.value}))} placeholder="e.g. COVID-19 Booster"/></div><div style={{marginBottom:10}}><label style={lbl}>For Member</label><select style={inp} value={vf.member} onChange={e=>setVf(f=>({...f,member:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>Due Date</label><input style={inp} type="date" value={vf.due_date} onChange={e=>setVf(f=>({...f,due_date:e.target.value}))}/></div><div><label style={lbl}>Given Date</label><input style={inp} type="date" value={vf.given_date} onChange={e=>setVf(f=>({...f,given_date:e.target.value}))}/></div></div><div style={{marginBottom:14}}><label style={lbl}>Notes</label><input style={inp} placeholder="Hospital, batch no. etc." value={vf.notes} onChange={e=>setVf(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowVax(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(vf.name&&vf.member){await vaccinations.add(vf);setVf({name:"",member:"",due_date:"",given_date:"",notes:""});setShowVax(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.blue,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowVax(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.blue}`,background:"transparent",color:T.blue,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Vaccination</button>}</>}
      {tab==="emergency"&&<><div style={{background:T.rose+"10",border:`1.5px solid ${T.rose}30`,borderRadius:14,padding:"12px 16px",marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:T.rose,marginBottom:4}}>🚨 Emergency Info</div><div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>Store blood groups, allergies, doctor details and emergency contacts.</div></div>{emergency.loading&&<Spinner/>}{emergency.data.map(e=>(<Card key={e.id} style={{borderLeft:`4px solid ${T.orange}`}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>{e.name}</div><div style={{fontSize:12,color:T.muted}}>{e.relation}</div>{e.blood_group&&<div style={{marginTop:6}}><Badge label={`🩸 ${e.blood_group}`} color={T.rose}/></div>}{e.allergies&&<div style={{fontSize:12,color:T.orange,marginTop:6}}>⚠️ Allergies: {e.allergies}</div>}{e.doctor&&<div style={{fontSize:12,color:T.muted,marginTop:4}}>👨‍⚕️ {e.doctor}</div>}{e.phone&&<div style={{fontSize:14,fontWeight:700,color:T.dark,marginTop:6}}>📞 {e.phone}</div>}</div><button onClick={()=>emergency.remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted}}>×</button></div></Card>))}{!emergency.loading&&emergency.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>🚨</div><div style={{color:T.muted}}>Add emergency contacts & health info</div></Card>}{showEm?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Emergency Record</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>Name</label><input style={inp} value={ef.name} onChange={e=>setEf(f=>({...f,name:e.target.value}))} placeholder="Person name"/></div><div><label style={lbl}>Relation</label><input style={inp} value={ef.relation} onChange={e=>setEf(f=>({...f,relation:e.target.value}))} placeholder="e.g. Self, Spouse"/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>Phone</label><input style={inp} type="tel" value={ef.phone} onChange={e=>setEf(f=>({...f,phone:e.target.value}))}/></div><div><label style={lbl}>Blood Group</label><select style={inp} value={ef.blood_group} onChange={e=>setEf(f=>({...f,blood_group:e.target.value}))}><option value="">Select</option>{bloodGroups.map(b=><option key={b}>{b}</option>)}</select></div></div><div style={{marginBottom:10}}><label style={lbl}>Known Allergies</label><input style={inp} placeholder="e.g. Penicillin, Peanuts" value={ef.allergies} onChange={e=>setEf(f=>({...f,allergies:e.target.value}))}/></div><div style={{marginBottom:14}}><label style={lbl}>Family Doctor / Hospital</label><input style={inp} placeholder="Dr. Name, Hospital" value={ef.doctor} onChange={e=>setEf(f=>({...f,doctor:e.target.value}))}/></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowEm(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(ef.name){await emergency.add(ef);setEf({name:"",relation:"",phone:"",blood_group:"",allergies:"",doctor:""});setShowEm(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.orange,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowEm(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.orange}`,background:"transparent",color:T.orange,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Emergency Record</button>}</>}
    </div>
  );
}

const MOODS=["😊","😔","😤","😴","🤩","😌","😟","🥳","😰","❤️"];

function JournalScreen({ familyId, members, userId }) {
  const journal=useTable("journal_entries",familyId);
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("all");
  const [jf,setJf]=useState({title:"",content:"",mood:"😊",member:"",private:false});
  const filtered=filter==="all"?journal.data:journal.data.filter(j=>j.member===filter);
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>Family Journal</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:14}}>Thoughts, memories and moments</div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:8}}>
        <Pill label="All" active={filter==="all"} onClick={()=>setFilter("all")} color={T.orange}/>
        {members?.map(m=><Pill key={m.id} label={`${m.emoji} ${m.name}`} active={filter===m.name} onClick={()=>setFilter(m.name)} color={T.orange}/>)}
      </div>
      {journal.loading&&<Spinner/>}
      {!journal.loading&&filtered.length===0&&(<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:48,marginBottom:12}}>📓</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.dark,marginBottom:8}}>Start writing</div><div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>Capture thoughts, feelings and memories.</div></Card>)}
      {filtered.map(entry=>(<Card key={entry.id} style={{borderLeft:`4px solid ${T.orange}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{entry.mood}</span><div><div style={{fontWeight:700,fontSize:14,color:T.dark}}>{entry.title}</div><div style={{fontSize:11,color:T.muted}}>{entry.member} · {new Date(entry.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div></div></div><div style={{display:"flex",alignItems:"center",gap:6}}>{entry.private&&<Badge label="🔒 Private" color={T.muted}/>}<button onClick={()=>journal.remove(entry.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted}}>×</button></div></div><div style={{fontSize:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{entry.content}</div></Card>))}
      {showAdd?(<Card style={{marginTop:8}}><div style={{fontWeight:700,color:T.dark,marginBottom:14}}>New Entry</div><div style={{marginBottom:10}}><label style={lbl}>Title</label><input style={inp} placeholder="What's on your mind?" value={jf.title} onChange={e=>setJf(f=>({...f,title:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Mood</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{MOODS.map(m=><button key={m} onClick={()=>setJf(f=>({...f,mood:m}))} style={{width:38,height:38,borderRadius:10,border:`2px solid ${jf.mood===m?T.orange:T.border}`,background:jf.mood===m?T.orange+"20":"#fff",fontSize:20,cursor:"pointer"}}>{m}</button>)}</div></div><div style={{marginBottom:10}}><label style={lbl}>Member</label><select style={inp} value={jf.member} onChange={e=>setJf(f=>({...f,member:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div style={{marginBottom:10}}><label style={lbl}>Write here...</label><textarea style={{...inp,minHeight:120,resize:"none"}} value={jf.content} onChange={e=>setJf(f=>({...f,content:e.target.value}))}/></div><div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}><input type="checkbox" id="priv" checked={jf.private} onChange={e=>setJf(f=>({...f,private:e.target.checked}))} style={{width:18,height:18}}/><label htmlFor="priv" style={{fontSize:13,color:T.dark,cursor:"pointer"}}>🔒 Private entry (only for me)</label></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowAdd(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(jf.title&&jf.content&&jf.member){await journal.add({title:jf.title,content:jf.content,mood:jf.mood,member:jf.member,private:jf.private});setJf({title:"",content:"",mood:"😊",member:"",private:false});setShowAdd(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.orange,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save Entry 📓</button></div></Card>):(<button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.orange}`,background:"transparent",color:T.orange,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>+ New Journal Entry</button>)}
    </div>
  );
}

const CHAPTERS=[{id:"childhood",label:"Childhood",emoji:"👶",color:T.lav},{id:"school",label:"School Days",emoji:"🎒",color:T.blue},{id:"college",label:"College",emoji:"🎓",color:T.teal},{id:"work",label:"First Job",emoji:"💼",color:T.green},{id:"wedding",label:"Wedding",emoji:"💍",color:T.rose},{id:"parenthood",label:"Parenthood",emoji:"👨‍👩‍👧",color:T.amber},{id:"home",label:"New Home",emoji:"🏠",color:T.brown},{id:"travel",label:"Adventures",emoji:"✈️",color:T.orange},{id:"milestones",label:"Milestones",emoji:"🏆",color:T.green}];

function PhotoJourneyScreen({ familyId }) {
  const journey=useTable("photo_journey",familyId);
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("all");
  const [nj,setNj]=useState({title:"",year:new Date().getFullYear().toString(),chapter:"milestones",caption:"",emoji:"⭐"});
  const filtered=filter==="all"?journey.data:journey.data.filter(j=>j.chapter===filter);
  const sorted=[...filtered].sort((a,b)=>Number(a.year)-Number(b.year));
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>Photo Journey</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:14}}>Your family's story, chapter by chapter</div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12,marginBottom:4}}>
        <Pill label="All" active={filter==="all"} onClick={()=>setFilter("all")}/>
        {CHAPTERS.filter(c=>journey.data.some(j=>j.chapter===c.id)).map(c=>(<Pill key={c.id} label={`${c.emoji} ${c.label}`} active={filter===c.id} onClick={()=>setFilter(c.id)} color={c.color}/>))}
      </div>
      {journey.loading&&<Spinner/>}
      {!journey.loading&&sorted.length===0&&(<Card style={{textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>📸</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.dark,marginBottom:8}}>Begin your story</div><div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>Add memories from childhood to today.</div></Card>)}
      <div style={{position:"relative"}}>
        {sorted.length>0&&<div style={{position:"absolute",left:20,top:0,bottom:0,width:2,background:T.border}}/>}
        {sorted.map(item=>{const ch=CHAPTERS.find(c=>c.id===item.chapter)||CHAPTERS[8];return(<div key={item.id} style={{display:"flex",gap:16,marginBottom:16,position:"relative"}}><div style={{width:40,height:40,borderRadius:"50%",background:ch.color+"20",border:`3px solid ${ch.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,zIndex:1,marginTop:4}}>{item.emoji||ch.emoji}</div><div style={{flex:1,background:T.card,borderRadius:16,padding:14,boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>{item.title}</div><div style={{fontSize:11,color:ch.color,fontWeight:700}}>{ch.emoji} {ch.label} · {item.year}</div></div><button onClick={()=>journey.remove(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:15}}>×</button></div>{item.caption&&<div style={{fontSize:13,color:T.muted,marginTop:4,lineHeight:1.6,fontStyle:"italic"}}>"{item.caption}"</div>}</div></div>);})}
      </div>
      {showAdd?(<Card style={{marginTop:8}}><div style={{fontWeight:700,color:T.dark,marginBottom:14}}>Add a Memory</div><div style={{marginBottom:12}}><label style={lbl}>Chapter</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{CHAPTERS.map(c=>(<button key={c.id} onClick={()=>setNj(p=>({...p,chapter:c.id}))} style={{padding:"6px 10px",borderRadius:8,border:`2px solid ${nj.chapter===c.id?c.color:T.border}`,background:nj.chapter===c.id?c.color+"20":"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>{c.emoji} {c.label}</button>))}</div></div><div style={{display:"flex",gap:10,marginBottom:12}}><div style={{flex:2}}><label style={lbl}>Memory Title</label><input style={inp} placeholder="e.g. First day at school" value={nj.title} onChange={e=>setNj(p=>({...p,title:e.target.value}))}/></div><div style={{flex:1}}><label style={lbl}>Year</label><input style={inp} type="number" placeholder="2018" value={nj.year} onChange={e=>setNj(p=>({...p,year:e.target.value}))}/></div></div><div style={{marginBottom:12}}><label style={lbl}>Emoji</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["⭐","🎉","💕","🏆","🌟","🎂","✈️","🏠","🎓","💼","👶","💍"].map(e=>(<button key={e} onClick={()=>setNj(p=>({...p,emoji:e}))} style={{width:34,height:34,borderRadius:8,border:`2px solid ${nj.emoji===e?T.brown:T.border}`,background:nj.emoji===e?T.warm:"#fff",fontSize:17,cursor:"pointer"}}>{e}</button>))}</div></div><div style={{marginBottom:16}}><label style={lbl}>Caption (optional)</label><textarea style={{...inp,minHeight:70,resize:"none"}} placeholder="A few words about this memory..." value={nj.caption} onChange={e=>setNj(p=>({...p,caption:e.target.value}))}/></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowAdd(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(!nj.title||!nj.year)return;await journey.add({title:nj.title,year:nj.year,chapter:nj.chapter,caption:nj.caption,emoji:nj.emoji});setNj({title:"",year:new Date().getFullYear().toString(),chapter:"milestones",caption:"",emoji:"⭐"});setShowAdd(false);}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save Memory 📸</button></div></Card>):(<button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>+ Add Memory</button>)}
    </div>
  );
}

function CalendarScreen({ familyId, members }) {
  const events=useTable("events",familyId);
  const [showAdd,setShowAdd]=useState(false);
  const [view,setView]=useState("month");
  const [f,setF]=useState({title:"",date:"",emoji:"📅",member:"",repeat:"none"});
  const [calDate,setCalDate]=useState(new Date());
  const [selectedDay,setSelectedDay]=useState(null);
  const emojis=["📅","🎂","🏥","🎓","✈️","🎉","🏅","🍽️","⚡","💊","🎹","⚽","🎪","📝"];
  const repeats=[{v:"none",l:"No repeat"},{v:"weekly",l:"Every week"},{v:"monthly",l:"Every month"},{v:"yearly",l:"Every year"}];
  const now=new Date();
  const m=calDate.getMonth(); const y=calDate.getFullYear();
  const dim=new Date(y,m+1,0).getDate(); const fd=new Date(y,m,1).getDay();
  const evDays=events.data.map(e=>new Date(e.date).getDate());
  const allUpcoming=[...events.data].filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const past=[...events.data].filter(e=>new Date(e.date)<new Date()).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const selectedDateStr=selectedDay?`${y}-${String(m+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`:null;
  const dayEvents=selectedDay?events.data.filter(e=>e.date&&e.date.startsWith(selectedDateStr)):[];
  const prevMonth=()=>{const d=new Date(calDate);d.setMonth(d.getMonth()-1);setCalDate(d);setSelectedDay(null);};
  const nextMonth=()=>{const d=new Date(calDate);d.setMonth(d.getMonth()+1);setCalDate(d);setSelectedDay(null);};
  const handleDayClick=(day)=>{
    setSelectedDay(day===selectedDay?null:day);
    const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setF(p=>({...p,date:ds}));
    setShowAdd(false);
  };
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark}}>{calDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={prevMonth} style={{width:32,height:32,borderRadius:"50%",border:`1.5px solid ${T.border}`,background:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button onClick={nextMonth} style={{width:32,height:32,borderRadius:"50%",border:`1.5px solid ${T.border}`,background:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          <Pill label="List" active={view==="list"} onClick={()=>setView("list")}/>
          <Pill label="Month" active={view==="month"} onClick={()=>setView("month")}/>
        </div>
      </div>
      {view==="month"&&<Card style={{marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
          {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,color:T.muted,fontWeight:700,padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {[...Array(fd)].map((_,i)=><div key={`e${i}`}/>)}
          {[...Array(dim)].map((_,i)=>{
            const day=i+1;
            const isToday=day===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();
            const isSelected=day===selectedDay;
            const hasEv=evDays.includes(day);
            return(
              <div key={day} onClick={()=>handleDayClick(day)} style={{textAlign:"center",padding:"7px 2px",borderRadius:8,fontSize:13,fontWeight:isToday||isSelected?700:400,background:isSelected?T.amber:isToday?T.brown:"transparent",color:isSelected?"#fff":isToday?"#fff":T.text,cursor:"pointer",position:"relative"}}>
                {day}
                {hasEv&&<div style={{width:4,height:4,background:isToday||isSelected?"#fff":T.amber,borderRadius:"50%",margin:"2px auto 0"}}/>}
              </div>
            );
          })}
        </div>
        {selectedDay&&(
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
            <div style={{fontSize:12,fontWeight:700,color:T.brown,marginBottom:8}}>{new Date(selectedDateStr).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
            {dayEvents.length===0?<div style={{fontSize:12,color:T.muted,marginBottom:8}}>No events · <button onClick={()=>setShowAdd(true)} style={{background:"none",border:"none",color:T.brown,fontWeight:700,cursor:"pointer",fontSize:12}}>+ Add one</button></div>
            :dayEvents.map(e=><div key={e.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:16}}>{e.emoji}</span><div style={{flex:1,fontSize:13,color:T.dark}}>{e.title}</div><button onClick={()=>events.remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14}}>×</button></div>)}
            <button onClick={()=>setShowAdd(true)} style={{fontSize:12,color:T.brown,fontWeight:700,background:T.warm,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",marginTop:4}}>+ Add Event</button>
          </div>
        )}
      </Card>}
      <Sec>📅 Upcoming</Sec>
      {events.loading&&<Spinner/>}
      {allUpcoming.length===0&&!events.loading&&<Card style={{textAlign:"center",padding:20}}><div style={{color:T.muted,fontSize:13}}>No upcoming events</div></Card>}
      {allUpcoming.map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderLeft:`4px solid ${T.amber}`}}><span style={{fontSize:22}}>{e.emoji}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.dark}}>{e.title}</div><div style={{fontSize:12,color:T.muted}}>{new Date(e.date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}{e.member?" · "+e.member:""}{e.repeat&&e.repeat!=="none"?" · 🔄":""}</div></div><button onClick={()=>events.remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:16}}>×</button></div>))}
      {past.length>0&&<><Sec style={{marginTop:8}}>Past Events</Sec>{past.slice(0,3).map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,opacity:0.6}}><span style={{fontSize:20}}>{e.emoji}</span><div style={{flex:1}}><div style={{fontSize:13,color:T.muted}}>{e.title} · {new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div></div><button onClick={()=>events.remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted}}>×</button></div>))}</>}
      {showAdd?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Event</div><div style={{marginBottom:10}}><label style={lbl}>Icon</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{emojis.map(e=><button key={e} onClick={()=>setF(p=>({...p,emoji:e}))} style={{width:34,height:34,borderRadius:8,border:`2px solid ${f.emoji===e?T.brown:T.border}`,background:f.emoji===e?T.warm:"#fff",fontSize:17,cursor:"pointer"}}>{e}</button>)}</div></div><div style={{marginBottom:10}}><label style={lbl}>Event Name</label><input style={inp} value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Date</label><input style={inp} type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><div><label style={lbl}>Member (optional)</label><select style={inp} value={f.member} onChange={e=>setF(p=>({...p,member:e.target.value}))}><option value="">All family</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div><label style={lbl}>Repeat</label><select style={inp} value={f.repeat} onChange={e=>setF(p=>({...p,repeat:e.target.value}))}>{repeats.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}</select></div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowAdd(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(f.title&&f.date){const {error:evErr}=await sb.from("events").insert({title:f.title,date:f.date,emoji:f.emoji,member:f.member||"",repeat:f.repeat,family_id:familyId});if(evErr){alert("Save failed: "+evErr.message);return;}await events.refetch();setF({title:"",date:"",emoji:"📅",member:"",repeat:"none"});setShowAdd(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Event</button>}
    </div>
  );
}

function KidsZoneScreen({ familyId, members, onPts }) {
  const homework=useTable("homework",familyId);
  const [showAdd,setShowAdd]=useState(false);
  const [hf,setHf]=useState({subject:"",task:"",member:"",due_date:"",priority:"medium"});
  const subjects=["📐 Maths","🔬 Science","📖 English","🌍 Geography","🎨 Art","🎵 Music","💻 Computer","📚 Hindi","Other"];
  const priorities=[{v:"high",l:"🔴 High",c:T.rose},{v:"medium",l:"🟡 Medium",c:T.amber},{v:"low",l:"🟢 Low",c:T.green}];
  const pending=homework.data.filter(h=>!h.done);
  const done=homework.data.filter(h=>h.done);
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>Kids Zone 🎒</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:14}}>Homework tracker & activities</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Card style={{marginBottom:0,background:`linear-gradient(135deg,${T.blue}22,${T.lav}22)`,borderLeft:`3px solid ${T.blue}`}}><div style={{fontSize:24,marginBottom:4}}>📚</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.blue}}>{pending.length}</div><div style={{fontSize:11,color:T.muted}}>Pending tasks</div></Card>
        <Card style={{marginBottom:0,background:`linear-gradient(135deg,${T.green}22,${T.teal}22)`,borderLeft:`3px solid ${T.green}`}}><div style={{fontSize:24,marginBottom:4}}>✅</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.green}}>{done.length}</div><div style={{fontSize:11,color:T.muted}}>Completed</div></Card>
      </div>
      <Sec>📝 Homework & Tasks</Sec>
      {homework.loading&&<Spinner/>}
      {pending.map(h=>{const pri=priorities.find(p=>p.v===h.priority)||priorities[1];return(<Card key={h.id} style={{borderLeft:`4px solid ${pri.c}`,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:16}}>{h.subject?.split(" ")[0]}</span><div style={{fontWeight:700,fontSize:14,color:T.dark}}>{h.task}</div></div><div style={{fontSize:12,color:T.muted}}>{h.member}{h.due_date?" · Due "+new Date(h.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}><button onClick={async()=>{await homework.update(h.id,{done:true});await onPts(15);}} style={{fontSize:11,color:T.green,fontWeight:700,background:T.green+"15",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>✓ Done +15pts</button><button onClick={()=>homework.remove(h.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14}}>×</button></div></div></Card>);})}
      {!homework.loading&&pending.length===0&&<Card style={{textAlign:"center",padding:20}}><div style={{color:T.green,fontSize:14,fontWeight:700}}>🎉 All caught up!</div></Card>}
      {showAdd?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Homework / Task</div><div style={{marginBottom:10}}><label style={lbl}>Subject</label><select style={inp} value={hf.subject} onChange={e=>setHf(f=>({...f,subject:e.target.value}))}><option value="">Select</option>{subjects.map(s=><option key={s}>{s}</option>)}</select></div><div style={{marginBottom:10}}><label style={lbl}>Task</label><input style={inp} value={hf.task} onChange={e=>setHf(f=>({...f,task:e.target.value}))} placeholder="e.g. Chapter 5 exercises"/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>For</label><select style={inp} value={hf.member} onChange={e=>setHf(f=>({...f,member:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div><label style={lbl}>Due Date</label><input style={inp} type="date" value={hf.due_date} onChange={e=>setHf(f=>({...f,due_date:e.target.value}))}/></div></div><div style={{marginBottom:14}}><label style={lbl}>Priority</label><div style={{display:"flex",gap:8}}>{priorities.map(p=><button key={p.v} onClick={()=>setHf(f=>({...f,priority:p.v}))} style={{flex:1,padding:"8px 4px",borderRadius:10,border:`2px solid ${hf.priority===p.v?p.c:T.border}`,background:hf.priority===p.v?p.c+"20":"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>{p.l}</button>)}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowAdd(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(hf.task&&hf.member){await homework.add({...hf,done:false});setHf({subject:"",task:"",member:"",due_date:"",priority:"medium"});setShowAdd(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.blue,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.blue}`,background:"transparent",color:T.blue,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Homework / Task</button>}
      <Card style={{marginTop:8,background:`linear-gradient(135deg,#1DB95422,#1DB95411)`,border:"1.5px solid #1DB95440"}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:32}}>🎵</div><div style={{flex:1}}><div style={{fontWeight:700,color:T.dark,fontSize:14}}>Music Integration</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Coming soon!</div></div><Badge label="SOON" color="#1DB954"/></div></Card>
    </div>
  );
}

function ConciergeScreen({ family, members }) {
  const [msg,setMsg]=useState("");
  const [chat,setChat]=useState([{role:"assistant",text:`Hi! I'm your Famillion AI assistant 🤖\n\nI can help with budgeting tips, reminders, family planning and more.\n\n(Full AI integration coming soon!)`,time:new Date()}]);
  const [typing,setTyping]=useState(false);
  const send=async()=>{if(!msg.trim())return;const userMsg={role:"user",text:msg,time:new Date()};setChat(c=>[...c,userMsg]);setMsg("");setTyping(true);await new Promise(r=>setTimeout(r,1200));setChat(c=>[...c,{role:"assistant",text:`Thanks for your message! Full AI functionality coming soon. 🏡`,time:new Date()}]);setTyping(false);};
  return (
    <div style={{padding:"0 0 16px",display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
      <div style={{padding:"0 16px",marginBottom:12}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>AI Concierge 🤖</div><div style={{fontSize:13,color:T.muted}}>Your family's smart assistant</div></div>
      <div style={{padding:"0 16px",marginBottom:12}}><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>{members?.map(m=>(<button key={m.id} onClick={()=>setMsg(`Hey, speaking as ${m.name}... `)} style={{flexShrink:0,padding:"6px 12px",borderRadius:99,border:`1.5px solid ${T.lav}`,background:T.lav+"15",color:T.dark,fontSize:12,fontWeight:600,cursor:"pointer"}}>{m.emoji} {m.name}</button>))}</div></div>
      <div style={{flex:1,overflowY:"auto",padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        {chat.map((c,i)=>(<div key={i} style={{display:"flex",justifyContent:c.role==="user"?"flex-end":"flex-start"}}>{c.role==="assistant"&&<div style={{width:32,height:32,borderRadius:"50%",background:T.lav+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>🤖</div>}<div style={{maxWidth:"78%",background:c.role==="user"?`linear-gradient(135deg,${T.brown},${T.dark})`:"#fff",color:c.role==="user"?"#fff":T.text,borderRadius:c.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 16px",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.text}</div></div>))}
        {typing&&(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:32,height:32,borderRadius:"50%",background:T.lav+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div><div style={{background:"#fff",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}><div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.muted,animation:`dot 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div></div></div>)}
      </div>
      <div style={{padding:"12px 16px 0",display:"flex",gap:10}}>
        <input style={{...inp,flex:1}} placeholder="Ask me anything..." value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
        <button onClick={send} style={{padding:"12px 18px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.lav},${T.blue})`,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:18}}>→</button>
      </div>
      <style>{`@keyframes dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

function ProfileScreen({ family, members, email, onSignOut, theme, setTheme }) {
  const score=computeScore(family);
  const [copied,setCopied]=useState(false);
  const [activeTab,setActiveTab]=useState("profile");
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [pf,setPf]=useState({name:"",city:"",monthly_income:"",monthly_expenses:"",savings:"",debts:"",insurance:"",age:""});
  const cities=["Gurgaon","Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Ahmedabad","Jaipur","Noida","Chandigarh"];
  const copyCode=()=>{if(family?.invite_code){navigator.clipboard?.writeText(family.invite_code).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);}};
  const startEdit=()=>{setPf({name:family?.name||"",city:family?.city||"",monthly_income:String(family?.monthly_income||""),monthly_expenses:String(family?.monthly_expenses||""),savings:String(family?.savings||""),debts:String(family?.debts||""),insurance:String(family?.insurance||""),age:String(family?.age||"")});setEditing(true);};
  const saveProfile=async()=>{
    setSaving(true);
    await sb.from("families").update({name:pf.name,city:pf.city,monthly_income:Number(pf.monthly_income)||0,monthly_expenses:Number(pf.monthly_expenses)||0,savings:Number(pf.savings)||0,debts:Number(pf.debts)||0,insurance:Number(pf.insurance)||0,age:Number(pf.age)||30}).eq("id",family.id);
    setSaving(false);setEditing(false);
    window.location.reload();
  };
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Profile & Settings</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Pill label="👤 Profile" active={activeTab==="profile"} onClick={()=>setActiveTab("profile")}/>
        <Pill label="🎨 Theme"   active={activeTab==="theme"}   onClick={()=>setActiveTab("theme")}/>
        <Pill label="👑 Admin"   active={activeTab==="admin"}   onClick={()=>setActiveTab("admin")}/>
      </div>
      {activeTab==="profile"&&<>
        {!editing?(<>
          <Card style={{background:`linear-gradient(135deg,${T.brown},${T.dark})`,color:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontSize:32,marginBottom:8}}>🏡</div>
              <button onClick={startEdit} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>✏️ Edit</button>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:4}}>{family?.name}</div>
            <div style={{fontSize:13,opacity:0.75,marginBottom:12}}>{family?.city} · {members?.length||0} members</div>
            {score&&<div style={{display:"flex",gap:20,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.2)"}}><div><div style={{fontSize:10,opacity:0.65}}>Score</div><div style={{fontWeight:800,fontSize:20,color:score.gradeColor}}>{score.score}/100</div></div><div><div style={{fontSize:10,opacity:0.65}}>Freedom Age</div><div style={{fontWeight:800,fontSize:20}}>{score.freedomAge}</div></div><div><div style={{fontSize:10,opacity:0.65}}>Points</div><div style={{fontWeight:800,fontSize:20,color:T.amber}}>🏆 {family?.points||0}</div></div></div>}
          </Card>
        </>):(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:16}}>Edit Family Profile</div>
          <div style={{marginBottom:10}}><label style={lbl}>Family Name</label><input style={inp} value={pf.name} onChange={e=>setPf(p=>({...p,name:e.target.value}))}/></div>
          <div style={{marginBottom:10}}><label style={lbl}>City</label><select style={inp} value={pf.city} onChange={e=>setPf(p=>({...p,city:e.target.value}))}>{cities.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>Monthly Income (₹)</label><input style={inp} type="number" value={pf.monthly_income} onChange={e=>setPf(p=>({...p,monthly_income:e.target.value}))}/></div>
            <div><label style={lbl}>Monthly Expenses (₹)</label><input style={inp} type="number" value={pf.monthly_expenses} onChange={e=>setPf(p=>({...p,monthly_expenses:e.target.value}))}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>Savings (₹)</label><input style={inp} type="number" value={pf.savings} onChange={e=>setPf(p=>({...p,savings:e.target.value}))}/></div>
            <div><label style={lbl}>Debts (₹)</label><input style={inp} type="number" value={pf.debts} onChange={e=>setPf(p=>({...p,debts:e.target.value}))}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <div><label style={lbl}>Insurance (₹)</label><input style={inp} type="number" value={pf.insurance} onChange={e=>setPf(p=>({...p,insurance:e.target.value}))}/></div>
            <div><label style={lbl}>Your Age</label><input style={inp} type="number" value={pf.age} onChange={e=>setPf(p=>({...p,age:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setEditing(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button>
            <button onClick={saveProfile} disabled={saving} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>{saving?"Saving...":"Save Changes"}</button>
          </div>
        </Card>)}
        <Sec>Members</Sec>
        {(members||[]).map(m=>(<div key={m.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}><div style={{width:42,height:42,borderRadius:"50%",background:T.warm,border:`2px solid ${T.amber}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.emoji}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:T.dark}}>{m.name}</div><div style={{fontSize:11,color:T.muted}}>{m.relationship||""}{m.dob?" · Born "+new Date(m.dob).getFullYear():""}{m.occupation?" · "+m.occupation:""}</div></div></div>))}
        <Sec style={{marginTop:16}}>Invite Family Members</Sec>
        <Card style={{background:"#FFFBF0",border:`1.5px solid ${T.amber}40`}}>
          {family?.invite_code?<><div style={{fontSize:13,color:T.brown,marginBottom:10,lineHeight:1.6}}>Share this code with family members to join.</div><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1,background:T.warm,borderRadius:10,padding:"12px 16px",fontFamily:"monospace",fontSize:18,fontWeight:800,color:T.dark,letterSpacing:2,textAlign:"center"}}>{family.invite_code}</div><button onClick={copyCode} style={{padding:"12px 16px",borderRadius:10,border:"none",background:copied?T.green:T.brown,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>{copied?"✓ Copied!":"Copy"}</button></div></>:<div style={{fontSize:13,color:T.muted}}>Invite code will appear here after signup.</div>}
        </Card>
        <Sec style={{marginTop:8}}>Account</Sec>
        <Card>
          <div style={{fontSize:13,color:T.muted,marginBottom:4}}>Signed in as</div>
          <div style={{fontSize:14,fontWeight:600,color:T.dark,marginBottom:14}}>{email}</div>
          <div style={{background:T.green+"15",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}><div style={{width:8,height:8,borderRadius:"50%",background:T.green,flexShrink:0}}/><div style={{fontSize:12,color:T.green,fontWeight:600}}>Connected · Live sync active</div></div>
          <div style={{background:T.lav+"15",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:8,alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:13,color:T.dark}}>🔒 Biometric / Face ID login</div><Badge label="SOON" color={T.lav}/></div>
          <button onClick={onSignOut} style={{width:"100%",padding:12,borderRadius:12,border:`2px solid ${T.rose}`,background:"transparent",color:T.rose,fontWeight:700,fontSize:14,cursor:"pointer"}}>Sign Out</button>
        </Card>
      </>}
      {activeTab==="theme"&&<><Sec>App Theme</Sec><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{THEMES.map(th=>(<button key={th.id} onClick={()=>setTheme(th.id)} style={{padding:16,borderRadius:16,border:`3px solid ${theme===th.id?th.accent:T.border}`,background:th.bg,cursor:"pointer",textAlign:"center",fontWeight:700,color:th.accent,fontSize:13,boxShadow:theme===th.id?`0 4px 16px ${th.accent}44`:"none",transition:"all 0.2s"}}><div style={{fontSize:24,marginBottom:6}}>🎨</div>{th.label}{theme===th.id&&<div style={{fontSize:10,marginTop:4}}>✓ Active</div>}</button>))}</div></>}
      {activeTab==="admin"&&<><Sec>Admin Dashboard</Sec><Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Family Overview</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[{label:"Members",value:members?.length||0,icon:"👥"},{label:"Points",value:family?.points||0,icon:"🏆"},{label:"City",value:family?.city||"—",icon:"📍"},{label:"Freedom Score",value:score?score.score+"/100":"N/A",icon:"📊"}].map(s=>(<div key={s.label} style={{background:T.warm,borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:20,marginBottom:4}}>{s.icon}</div><div style={{fontWeight:800,fontSize:18,color:T.dark}}>{s.value}</div><div style={{fontSize:11,color:T.muted}}>{s.label}</div></div>))}</div></Card><Sec style={{marginTop:8}}>Voice AI Assistant</Sec><Card style={{background:`linear-gradient(135deg,${T.teal}15,${T.blue}10)`,border:`1.5px solid ${T.teal}40`}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:36}}>🎙️</div><div style={{flex:1}}><div style={{fontWeight:700,color:T.dark}}>Voice AI Assistant</div><div style={{fontSize:12,color:T.muted,marginTop:4}}>Coming soon!</div></div><Badge label="SOON" color={T.teal}/></div><div style={{marginTop:12}}><input style={{...inp,fontSize:12}} placeholder="Enter AI API key to activate..." disabled/></div></Card><Card style={{background:T.warm,border:`1px solid ${T.border}`}}><div style={{fontSize:12,color:T.brown,lineHeight:1.7}}>🔒 <strong>Privacy-first.</strong> Your data is never sold or shared.</div></Card></>}
    </div>
  );
}

const NAV=[{id:"home",icon:"🏠",label:"Home"},{id:"money",icon:"💰",label:"Money"},{id:"health",icon:"❤️",label:"Health"},{id:"plan",icon:"📅",label:"Plan"},{id:"more",icon:"☰",label:"More"}];
const MORE_NAV=[{id:"chores",icon:"🧹",label:"Chores"},{id:"errands",icon:"🛒",label:"Errands"},{id:"journey",icon:"📸",label:"Journey"},{id:"journal",icon:"📓",label:"Journal"},{id:"kids",icon:"🎒",label:"Kids"},{id:"concierge",icon:"🤖",label:"AI"},{id:"profile",icon:"👤",label:"Profile"}];

export default function App() {
  const [user,setUser]=useState(null);
  const [authLoading,setAL]=useState(true);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [family,setFamily]=useState(null);
  const [members,setMembers]=useState([]);
  const [tab,setTab]=useState("home");
  const [showMore,setShowMore]=useState(false);
  const [theme,setTheme]=useState(()=>localStorage.getItem("fn_theme")||"earthy");
  const expenses=useTable("expenses",family?.id);
  const events=useTable("events",family?.id);
  const currentTheme=THEMES.find(t=>t.id===theme)||THEMES[0];

  useEffect(()=>{
    const seen=localStorage.getItem("fn_onboarding_seen");
    if(!seen)setShowOnboarding(true);
    if(sb.auth.restore()){
      // Verify the stored token is still valid with Supabase
      sb._req("/auth/v1/user").then(r=>{
        if(r.data?.id){
          setUser({id:r.data.id, email:r.data.email||localStorage.getItem("fn_email")||""});
        } else {
          sb.auth.signOut(); // token expired — clear and show login
        }
        setAL(false);
      }).catch(()=>{ sb.auth.signOut(); setAL(false); });
    } else {
      setAL(false);
    }
  },[]);

  useEffect(()=>{localStorage.setItem("fn_theme",theme);},[theme]);

  useEffect(()=>{
    if(!user?.id)return;
    (async()=>{
      const {data:profile}=await sb.from("user_profiles").select("*").eq("id",user.id).single();
      if(!profile?.family_id)return;
      const {data:fam}=await sb.from("families").select("*").eq("id",profile.family_id).single();
      const {data:mems}=await sb.from("members").select("*").eq("family_id",profile.family_id).order("created_at",{ascending:true});
      setFamily(Array.isArray(fam)?fam[0]:fam);
      setMembers(Array.isArray(mems)?mems:[]);
    })();
  },[user]);

  const handlePts=useCallback(async(pts)=>{
    if(!family?.id)return;
    const np=(family.points||0)+pts;
    await sb.from("families").update({points:np}).eq("id",family.id);
    setFamily(f=>({...f,points:np}));
  },[family]);

  const handleSignOut=()=>{sb.auth.signOut();setUser(null);setFamily(null);setMembers([]);};
  const handleTabChange=(id)=>{setTab(id);setShowMore(false);};

  if(authLoading)return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${T.brown},${T.dark})`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:0,fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{fontSize:72,marginBottom:16,animation:"splashBounce 1.2s ease infinite alternate"}}>🏡</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:"#fff",marginBottom:6,letterSpacing:0.5}}>Famillion</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,0.6)",marginBottom:40,letterSpacing:1}}>Your family's everything app</div>
      <div style={{display:"flex",gap:8}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.4)",animation:`splashDot 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
      </div>
      <style>{`@keyframes splashBounce{from{transform:translateY(0) scale(1)}to{transform:translateY(-10px) scale(1.05)}}@keyframes splashDot{0%,60%,100%{opacity:0.3;transform:scale(1)}30%{opacity:1;transform:scale(1.3)}}`}</style>
    </div>
  );

  if(showOnboarding)return(<OnboardingSlides onDone={()=>{localStorage.setItem("fn_onboarding_seen","1");setShowOnboarding(false);}}/>);

  if(!user)return <AuthScreen onAuth={u=>{setUser(u);localStorage.setItem("fn_email",u.email||"");}}/>;

  // ── ALMOST THERE — clean, no technical tips ──────────────────────────────
  if(!family)return(
    <div style={{minHeight:"100vh",background:T.cream,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24,fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{fontSize:64}}>✉️</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,textAlign:"center"}}>Almost there!</div>
      <div style={{fontSize:15,color:T.muted,textAlign:"center",lineHeight:1.8,maxWidth:300}}>
        Check your email and click the verification link, then sign in here.
      </div>
      <div style={{fontSize:13,color:T.brown,background:T.warm,padding:"10px 16px",borderRadius:12,textAlign:"center",maxWidth:300}}>
        📬 Don't see the email? Check your spam folder.
      </div>
      <button onClick={()=>{sb.auth.signOut();setUser(null);}} style={{padding:"12px 28px",borderRadius:99,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>
        Back to Sign In
      </button>
    </div>
  );

  const screens={
    home:     <HomeScreen      family={family} members={members} expenses={expenses.data} events={events.data}/>,
    money:    <MoneyScreen     family={family} members={members} familyId={family?.id} onPts={handlePts}/>,
    health:   <HealthScreen    familyId={family?.id} members={members} onPts={handlePts}/>,
    plan:     <CalendarScreen  familyId={family?.id} members={members}/>,
    chores:   <ChoresScreen    familyId={family?.id} onPts={handlePts}/>,
    errands:  <ErrandsScreen   familyId={family?.id} onPts={handlePts}/>,
    journey:  <PhotoJourneyScreen familyId={family?.id}/>,
    journal:  <JournalScreen   familyId={family?.id} members={members} userId={user?.id}/>,
    kids:     <KidsZoneScreen  familyId={family?.id} members={members} onPts={handlePts}/>,
    concierge:<ConciergeScreen family={family} members={members}/>,
    profile:  <ProfileScreen   family={family} members={members} email={user?.email} onSignOut={handleSignOut} theme={theme} setTheme={setTheme}/>,
  };

  return(
    <div style={{minHeight:"100vh",background:currentTheme.bg,display:"flex",justifyContent:"center",fontFamily:"'Lato',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:420,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,background:"rgba(253,246,236,0.95)",backdropFilter:"blur(8px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>🏡</span><div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:T.dark}}>Famillion</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:T.muted,fontWeight:700}}>{family?.city}</span><span style={{background:T.amber+"30",borderRadius:99,padding:"3px 9px",fontSize:11,fontWeight:800,color:T.brown}}>🏆 {family?.points||0}</span></div>
        </div>
        <div style={{flex:1,overflowY:"auto",paddingTop:14,paddingBottom:86}}>{screens[tab]||screens["home"]}</div>
        {showMore&&(
          <div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(253,246,236,0.98)",backdropFilter:"blur(16px)",borderTop:`1px solid ${T.border}`,padding:"12px 16px",boxShadow:"0 -8px 32px rgba(0,0,0,0.1)",zIndex:100}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {MORE_NAV.map(n=>(<button key={n.id} onClick={()=>handleTabChange(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:tab===n.id?T.brown+"18":"transparent",border:"none",cursor:"pointer",padding:"10px 4px",borderRadius:12}}><span style={{fontSize:22}}>{n.icon}</span><span style={{fontSize:9,fontWeight:800,color:tab===n.id?T.brown:T.muted,letterSpacing:0.3}}>{n.label}</span></button>))}
            </div>
          </div>
        )}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(253,246,236,0.97)",backdropFilter:"blur(12px)",borderTop:`1px solid ${T.border}`,boxShadow:"0 -4px 20px rgba(92,61,46,0.08)",zIndex:200}}>
          <div style={{display:"flex",padding:"8px 4px 16px"}}>
            {NAV.map(n=>{
              const isMore=n.id==="more";
              const isActive=isMore?showMore||!NAV.find(x=>x.id===tab):tab===n.id;
              return(<button key={n.id} onClick={()=>{if(isMore){setShowMore(s=>!s);}else{handleTabChange(n.id);}}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:isActive?T.brown+"18":"transparent",border:"none",cursor:"pointer",padding:"4px 2px",borderRadius:10,transition:"all 0.15s"}}><span style={{fontSize:18}}>{n.icon}</span><span style={{fontSize:9,fontWeight:800,color:isActive?T.brown:T.muted,letterSpacing:0.3}}>{n.label}</span></button>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
