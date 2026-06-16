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
      if (r.data?.access_token) {
        sb._token = r.data.access_token;
        sb._userId = r.data.user?.id;
        localStorage.setItem("fn_token", r.data.access_token);
        localStorage.setItem("fn_uid", r.data.user?.id);
        if(r.data.refresh_token) localStorage.setItem("fn_refresh", r.data.refresh_token);
      }
      return r;
    },
    
    async signOut() { sb._token = null; sb._userId = null; ["fn_token","fn_uid","fn_email","fn_refresh"].forEach(k => localStorage.removeItem(k)); },
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

const MEMBER_EMOJIS=[
  {e:"👨",label:"Man"},{e:"👩",label:"Woman"},{e:"👴",label:"Grandpa"},
  {e:"👵",label:"Grandma"},{e:"👦",label:"Son"},{e:"👧",label:"Daughter"},
  {e:"🧑",label:"Adult"},{e:"👶",label:"Baby"},{e:"👱",label:"Fair-haired"},{e:"🧔",label:"Bearded"},
];

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

function SplashScreen() {
  const NAV="#0F1F3D", SAF="#F4A724";
  return(
    <div style={{minHeight:"100vh",background:NAV,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <svg width="72" height="72" viewBox="0 0 52 52" style={{marginBottom:16,animation:"splashBounce 1.2s ease infinite alternate"}}>
        <circle cx="26" cy="26" r="24" fill="none" stroke={SAF} strokeWidth="1.5"/>
        <text x="26" y="36" textAnchor="middle" fontFamily="Georgia,serif" fontSize="36" fontWeight="700" fill={SAF}>F</text>
      </svg>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:SAF,marginBottom:6,letterSpacing:0.5}}>Famillion</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:40}}>Your family's everything app</div>
      <div style={{display:"flex",gap:8}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.3)",animation:`splashDot 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
      </div>
      <style>{`@keyframes splashBounce{from{transform:translateY(0) scale(1)}to{transform:translateY(-10px) scale(1.05)}}@keyframes splashDot{0%,60%,100%{opacity:0.3;transform:scale(1)}30%{opacity:1;transform:scale(1.3)}}`}</style>
    </div>
  );
}

const FLogo = (
  <svg width="36" height="36" viewBox="0 0 52 52" style={{display:"block",flexShrink:0}}>
    <circle cx="26" cy="26" r="24" fill="none" stroke="#F4A724" strokeWidth="1.5"/>
    <text x="26" y="36" textAnchor="middle" fontFamily="Georgia,serif" fontSize="36" fontWeight="700" fill="#F4A724">F</text>
  </svg>
);

function OnboardingSlides({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;
  const NAV="#0F1F3D", SAF="#F4A724", CRM="#FDF6EC";
  return (
    <div style={{minHeight:"100vh",background:CRM,display:"flex",flexDirection:"column",fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{background:NAV,padding:"16px 24px",flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
        {FLogo}
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:SAF,letterSpacing:0.5,lineHeight:1.2}}>Famillion</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>Your family's everything app</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"40px 32px 0"}}>
        <div style={{fontSize:80,marginBottom:28,animation:"bounce 1.2s ease infinite alternate"}}>{slide.emoji}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:NAV,marginBottom:14,lineHeight:1.3}}>{slide.title}</div>
        <div style={{fontSize:15,color:"#A08070",lineHeight:1.75,maxWidth:300}}>{slide.sub}</div>
      </div>
      <div style={{padding:"32px 32px 48px"}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:28}}>
          {SLIDES.map((_,i)=>(
            <div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?24:8,height:8,borderRadius:99,background:i===idx?SAF:"#E8DDD0",transition:"all 0.3s",cursor:"pointer"}}/>
          ))}
        </div>
        <div style={{display:"flex",gap:12}}>
          {idx > 0 && (
            <button onClick={()=>setIdx(i=>i-1)} style={{flex:1,padding:14,borderRadius:14,border:"2px solid #E8DDD0",background:"transparent",color:NAV,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"Lato,sans-serif"}}>← Back</button>
          )}
          <button onClick={()=>isLast?onDone():setIdx(i=>i+1)} style={{flex:2,padding:14,borderRadius:14,border:"none",background:SAF,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"Lato,sans-serif"}}>{isLast?"Let's Begin →":"Next →"}</button>
        </div>
        <button onClick={onDone} style={{width:"100%",marginTop:12,padding:8,background:"transparent",border:"none",color:"#A08070",fontSize:13,cursor:"pointer",fontFamily:"Lato,sans-serif"}}>Skip intro</button>
      </div>
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-12px)}}`}</style>
    </div>
  );
}

function ResetPasswordScreen({ token }) {
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  const handleReset=async()=>{
    if(password.length<6){setError("Password must be at least 6 characters");return;}
    if(password!==confirm){setError("Passwords don't match");return;}
    setLoading(true);setError("");
    sb._token=token;
    const r=await sb._req("/auth/v1/user",{method:"PUT",body:JSON.stringify({password})});
    setLoading(false);
    if(r.error){setError(r.error.message||"Something went wrong");return;}
    setDone(true);
    setTimeout(()=>{window.location.hash="";window.location.reload();},2500);
  };
  const NAV="#0F1F3D", SAF="#F4A724", CRM="#FDF6EC";
  const aInp={width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #E8DDD0",background:"#fff",fontSize:14,color:"#3D2B1F",boxSizing:"border-box",outline:"none",fontFamily:"Lato,sans-serif"};
  const aLbl={display:"block",fontSize:12,fontWeight:700,color:"#8B5E3C",marginBottom:6,letterSpacing:0.3};
  return(
    <div style={{minHeight:"100vh",background:CRM,display:"flex",flexDirection:"column",fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{background:NAV,padding:"16px 24px",flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
        {FLogo}
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:SAF,letterSpacing:0.5,lineHeight:1.2}}>Famillion</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>Your family's everything app</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",justifyContent:"center"}}>
        <div style={{width:"100%",maxWidth:420,padding:"40px 24px 24px"}}>
          {done?(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div style={{fontWeight:700,color:"#6B8F71",fontSize:16}}>Password updated!</div>
              <div style={{fontSize:13,color:"#A08070",marginTop:8}}>Taking you to sign in...</div>
            </div>
          ):(
            <>
              <div style={{textAlign:"center",marginBottom:32}}>
                <div style={{fontSize:48,marginBottom:12}}>🔑</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:NAV}}>Set New Password</div>
                <div style={{fontSize:13,color:"#A08070",marginTop:6}}>Choose a strong password for your account</div>
              </div>
              {error&&<div style={{background:"#FFF0F0",border:"1px solid #C97B8440",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#C97B84"}}>{error}</div>}
              <div style={{marginBottom:14}}><label style={aLbl}>New Password</label><PwdInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/></div>
              <div style={{marginBottom:20}}><label style={aLbl}>Confirm Password</label><PwdInput value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password"/></div>
              <button onClick={handleReset} disabled={loading} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:SAF,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"Lato,sans-serif"}}>{loading?"Updating...":"Update Password"}</button>
            </>
          )}
        </div>
      </div>
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

  const emojis = MEMBER_EMOJIS.map(x=>x.e);
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
      if (members.length > 0) {
        const {data:insertedMembers}=await sb.from("members").insert(members.map(m=>({family_id:fid, name:m.name, emoji:m.emoji, relationship:m.relationship||"", dob:m.dob||null, occupation:m.occupation||""}))).select();
        const adminMember=Array.isArray(insertedMembers)?insertedMembers[0]:null;
        if(adminMember?.id&&userId)await sb.from("user_profiles").update({member_id:adminMember.id}).eq("id",userId);
      }
      setSuccess(`✅ Family created! Invite code: ${inviteRef}. Check email to verify, then sign in.`);
      setMode("login"); setStep(1);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const [joinStep,setJoinStep]=useState(1);
  const [joinFamily,setJoinFamily]=useState(null);
  const [joinMembers,setJoinMembers]=useState([]);
  const [selectedMemberId,setSelectedMemberId]=useState(null);
  const [joinName,setJoinName]=useState("");
  const [joinEmoji,setJoinEmoji]=useState("👤");
  const [joinNew,setJoinNew]=useState(false);

  const handleInviteLookup=async()=>{
    if(!inviteCode.trim()){setError("Enter an invite code.");return;}
    setLoading(true);setError("");
    try{
      const {data:fams}=await sb.from("families").select("*").eq("invite_code",inviteCode.toUpperCase().trim());
      const fam=Array.isArray(fams)?fams[0]:fams;
      if(!fam)throw new Error("Invite code not found. Please check and try again.");
      const {data:mems}=await sb.from("members").select("*").eq("family_id",fam.id).order("created_at",{ascending:true});
      setJoinFamily(fam);setJoinMembers(Array.isArray(mems)?mems:[]);setJoinStep(2);
    }catch(e){setError(e.message);}
    setLoading(false);
  };

  const handleJoin=async()=>{
    const finalName=joinName.trim();
    if(!finalName){setError("Please enter your name.");return;}
    setLoading(true);setError("");
    try{
      const {data:authData,error:authError}=await sb.auth.signUp(email,password);
      if(authError)throw new Error(authError.message||"Signup failed");
      const userId=sb._userId||authData?.user?.id;
      if(!userId)throw new Error("Could not get user ID after signup. Please try again.");
      const {error:profErr}=await sb.from("user_profiles").insert({id:userId,family_id:joinFamily.id,display_name:finalName,is_admin:false,member_id:selectedMemberId||null});
      if(profErr&&!profErr.message?.includes("duplicate"))throw new Error("Could not link you to the family: "+profErr.message);
      if(selectedMemberId){
        await sb.from("members").update({name:finalName,emoji:joinEmoji}).eq("id",selectedMemberId);
      } else {
        const {data:newMem}=await sb.from("members").insert({family_id:joinFamily.id,name:finalName,emoji:joinEmoji,relationship:"",dob:null,occupation:""});
        const newId=Array.isArray(newMem)?newMem[0]?.id:newMem?.id;
        if(newId)await sb.from("user_profiles").update({member_id:newId}).eq("id",userId);
      }
      setSuccess(`✅ Joined ${joinFamily.name}! Check your email to verify, then sign in.`);
      setMode("login");setJoinMode(false);setJoinStep(1);setJoinFamily(null);setJoinMembers([]);setSelectedMemberId(null);setJoinName("");setJoinNew(false);
    }catch(e){setError(e.message);}
    setLoading(false);
  };

  const reset = () => { setError(""); setSuccess(""); };

  const NAV="#0F1F3D", SAF="#F4A724", CRM="#FDF6EC";
  const aInp={width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #E8DDD0",background:"#fff",fontSize:14,color:"#3D2B1F",boxSizing:"border-box",outline:"none",fontFamily:"Lato,sans-serif"};
  const aLbl={display:"block",fontSize:12,fontWeight:700,color:"#8B5E3C",marginBottom:6,letterSpacing:0.3};
  const aCta={width:"100%",padding:14,borderRadius:14,border:"none",background:SAF,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"Lato,sans-serif"};
  const aCtaOut={width:"100%",padding:14,borderRadius:14,border:"2px solid #E8DDD0",background:"transparent",color:NAV,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"Lato,sans-serif"};

  return (
    <div style={{minHeight:"100vh",background:CRM,display:"flex",flexDirection:"column",fontFamily:"Lato,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{background:NAV,padding:"16px 24px",flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
        {FLogo}
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:SAF,letterSpacing:0.5,lineHeight:1.2}}>Famillion</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>Your family's everything app</div>
        </div>
      </div>
      {/* Cream form area */}
      <div style={{flex:1,overflowY:"auto",padding:"28px 24px 40px",maxWidth:420,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>

        {!joinMode && mode!=="forgot" && (
          <div style={{display:"flex",background:"#E8DDD0",borderRadius:14,padding:4,marginBottom:24}}>
            {[["login","Sign In"],["signup","Create Family"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setStep(1);reset();}}
                style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,
                  background:mode===m?NAV:"transparent",color:mode===m?"#fff":"#8B5E3C",transition:"all 0.2s",fontFamily:"Lato,sans-serif"}}>
                {l}
              </button>
            ))}
          </div>
        )}

        {error   && <div style={{background:"#FFF0F0",border:"1px solid #C97B8440",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#C97B84",lineHeight:1.5}}>{error}</div>}
        {success && <div style={{background:"#F0FFF4",border:"1px solid #6B8F7140",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#6B8F71",lineHeight:1.6}}>{success}</div>}

        {/* LOGIN */}
        {!joinMode && mode==="login" && <>
          <div style={{marginBottom:14}}><label style={aLbl}>Email</label><input style={aInp} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <label style={aLbl}>Password</label>
              <button onClick={()=>{setMode("forgot");reset();}} style={{background:"none",border:"none",color:SAF,fontSize:12,fontWeight:700,cursor:"pointer",padding:0}}>Forgot?</button>
            </div>
            <PwdInput value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <div style={{marginBottom:20}}/>
          <button onClick={handleLogin} disabled={loading} style={aCta}>{loading?"Signing in...":"Sign In"}</button>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"20px 0"}}>
            <div style={{flex:1,height:1,background:"#E8DDD0"}}/>
            <div style={{fontSize:12,color:"#A08070"}}>or</div>
            <div style={{flex:1,height:1,background:"#E8DDD0"}}/>
          </div>
          <button onClick={()=>{setJoinMode(true);reset();}} style={{...aCtaOut,borderColor:SAF}}>🔗 Join a Family with Invite Code</button>
        </>}

        {/* FORGOT */}
        {!joinMode && mode==="forgot" && <>
          <button onClick={()=>{setMode("login");reset();}} style={{background:"none",border:"none",color:"#A08070",fontSize:13,cursor:"pointer",padding:"0 0 16px",display:"flex",alignItems:"center",gap:4}}>← Back to Sign In</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:NAV,marginBottom:6}}>Reset Password</div>
          <div style={{fontSize:13,color:"#A08070",marginBottom:20,lineHeight:1.6}}>Enter your email and we'll send a reset link.</div>
          <div style={{marginBottom:20}}><label style={aLbl}>Email</label><input style={aInp} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <button onClick={async()=>{setLoading(true);await sb._req("/auth/v1/recover",{method:"POST",body:JSON.stringify({email})});setSuccess("Reset link sent! Check your email.");setLoading(false);}} style={aCta}>{loading?"Sending...":"Send Reset Link"}</button>
        </>}

        {/* JOIN */}
        {joinMode && <>
          <button onClick={()=>{setJoinMode(false);setJoinStep(1);setJoinFamily(null);setJoinMembers([]);setSelectedMemberId(null);setJoinName("");setJoinNew(false);reset();}} style={{background:"none",border:"none",color:"#A08070",fontSize:13,cursor:"pointer",padding:"0 0 16px",display:"flex",alignItems:"center",gap:4}}>← Back to Sign In</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:NAV,marginBottom:6}}>Join Your Family</div>

          {joinStep===1&&<>
            <div style={{fontSize:13,color:"#A08070",marginBottom:20,lineHeight:1.6}}>Enter the invite code shared by your family admin.</div>
            <div style={{marginBottom:20}}><label style={aLbl}>Invite Code</label><input style={{...aInp,textTransform:"uppercase",letterSpacing:2,fontWeight:700}} placeholder="INV-XXXXXXXX" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}/></div>
            <button onClick={handleInviteLookup} disabled={loading} style={aCta}>{loading?"Looking up...":"Find My Family →"}</button>
          </>}

          {joinStep===2&&<>
            <div style={{fontSize:13,color:"#A08070",marginBottom:16,lineHeight:1.6}}>Welcome to <strong style={{color:NAV}}>{joinFamily?.name}</strong>! Who are you?</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {joinMembers.map(m=>(
                <div key={m.id} onClick={()=>{setSelectedMemberId(m.id);setJoinName(m.name);setJoinEmoji(m.emoji);setJoinNew(false);}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,
                    border:`2px solid ${selectedMemberId===m.id?SAF:"#E8DDD0"}`,
                    background:selectedMemberId===m.id?"#FFF8E8":"#fff",cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{fontSize:26}}>{m.emoji}</div>
                  <div style={{fontWeight:700,color:NAV,fontSize:14}}>{m.name}</div>
                  {selectedMemberId===m.id&&<div style={{marginLeft:"auto",color:SAF,fontWeight:700}}>✓</div>}
                </div>
              ))}
              <div onClick={()=>{setSelectedMemberId(null);setJoinName("");setJoinEmoji("👤");setJoinNew(true);}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,
                  border:`2px dashed ${joinNew?SAF:"#E8DDD0"}`,background:joinNew?"#FFF8E8":"#fff",cursor:"pointer",transition:"all 0.15s"}}>
                <div style={{fontSize:26}}>➕</div>
                <div style={{fontWeight:700,color:"#A08070",fontSize:14}}>I'm not listed — add me</div>
                {joinNew&&<div style={{marginLeft:"auto",color:SAF,fontWeight:700}}>✓</div>}
              </div>
            </div>
            {(selectedMemberId||joinNew)&&<>
              <div style={{marginBottom:10}}>
                <label style={aLbl}>{selectedMemberId?"Confirm or correct your name":"Your Name"}</label>
                <input style={aInp} value={joinName} onChange={e=>setJoinName(e.target.value)} placeholder="Your full name"/>
              </div>
              {joinNew&&<div style={{marginBottom:14}}>
                <label style={aLbl}>Your Emoji</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {MEMBER_EMOJIS.map(({e,label})=>(
                    <button key={e} title={label} onClick={()=>setJoinEmoji(e)}
                      style={{width:44,height:48,borderRadius:10,border:`2px solid ${joinEmoji===e?SAF:"#E8DDD0"}`,
                        background:joinEmoji===e?"#FFF8E8":"#fff",cursor:"pointer",
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,padding:2}}>
                      <span style={{fontSize:20,lineHeight:1}}>{e}</span>
                      <span style={{fontSize:7,color:joinEmoji===e?SAF:"#A08070",lineHeight:1.2,textAlign:"center"}}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>}
              <div style={{marginBottom:14}}><label style={aLbl}>Your Email</label><input style={aInp} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
              <div style={{marginBottom:20}}><label style={aLbl}>Create Password</label><PwdInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/></div>
              <button onClick={handleJoin} disabled={loading} style={aCta}>{loading?"Joining...":"Join Family 🏡"}</button>
            </>}
          </>}
        </>}

        {/* SIGNUP */}
        {!joinMode && mode==="signup" && <>
          <div style={{display:"flex",gap:6,marginBottom:24}}>
            {[1,2,3].map(s=><div key={s} style={{flex:1,height:4,borderRadius:99,background:s<=step?SAF:"#E8DDD0",transition:"background 0.3s"}}/>)}
          </div>
          {step===1 && <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:NAV,marginBottom:20}}>Create your account</div>
            <div style={{marginBottom:14}}><label style={aLbl}>Email</label><input style={aInp} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div style={{marginBottom:20}}>
              <label style={aLbl}>Password (min 6 chars)</label>
              <PwdInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"/>
            </div>
            <button onClick={()=>{if(!email||password.length<6){setError("Valid email and min 6-char password required");return;}setError("");setStep(2);}} style={aCta}>Continue</button>
          </>}
          {step===2 && <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:NAV,marginBottom:20}}>Your family details</div>
            <div style={{marginBottom:12}}><label style={aLbl}>Family Name</label><input style={aInp} placeholder="e.g. The Sharma Family" value={familyName} onChange={e=>setFamilyName(e.target.value)}/></div>
            <div style={{marginBottom:12}}><label style={aLbl}>City</label><select style={aInp} value={city} onChange={e=>setCity(e.target.value)}>{cities.map(c=><option key={c}>{c}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={aLbl}>Monthly Income (₹)</label><input style={aInp} type="number" placeholder="85000" value={income} onChange={e=>setIncome(e.target.value)}/></div>
              <div><label style={aLbl}>Monthly Expenses (₹)</label><input style={aInp} type="number" placeholder="55000" value={expenses} onChange={e=>setExpenses(e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={aLbl}>Savings (₹)</label><input style={aInp} type="number" placeholder="200000" value={savings} onChange={e=>setSavings(e.target.value)}/></div>
              <div><label style={aLbl}>Debts (₹)</label><input style={aInp} type="number" placeholder="0" value={debts} onChange={e=>setDebts(e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <div><label style={aLbl}>Life Insurance (₹)</label><input style={aInp} type="number" placeholder="1000000" value={insurance} onChange={e=>setInsurance(e.target.value)}/></div>
              <div><label style={aLbl}>Your Age</label><input style={aInp} type="number" placeholder="35" value={age} onChange={e=>setAge(e.target.value)}/></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={aCtaOut}>Back</button>
              <button onClick={()=>{if(!familyName.trim()){setError("Please enter family name");return;}setError("");setStep(3);}} style={{...aCta,flex:2}}>Continue</button>
            </div>
          </>}
          {step===3 && <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:NAV,marginBottom:20}}>Who's in your family?</div>
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:8}}>
              <select style={{...aInp,width:56,padding:"10px 4px",textAlign:"center"}} value={nm.emoji} onChange={e=>setNm(m=>({...m,emoji:e.target.value}))}>{emojis.map(e=><option key={e}>{e}</option>)}</select>
              <input style={aInp} placeholder="Member name" value={nm.name} onChange={e=>setNm(m=>({...m,name:e.target.value}))}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <select style={aInp} value={nm.relationship} onChange={e=>setNm(m=>({...m,relationship:e.target.value}))}><option value="">Relationship</option>{relationships.map(r=><option key={r}>{r}</option>)}</select>
              <input style={aInp} type="date" value={nm.dob} onChange={e=>setNm(m=>({...m,dob:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input style={{...aInp,flex:1}} placeholder="Occupation (optional)" value={nm.occupation} onChange={e=>setNm(m=>({...m,occupation:e.target.value}))}/>
              <button onClick={()=>{if(nm.name.trim()){setMembers(p=>[...p,{...nm,id:Date.now()}]);setNm({name:"",emoji:"👤",relationship:"",dob:"",occupation:""});}}} style={{padding:"10px 14px",borderRadius:12,background:SAF,color:"#fff",border:"none",cursor:"pointer",fontWeight:700}}>+</button>
            </div>
            {members.map((m,i)=>(<div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#FFF8E8",borderRadius:12,marginBottom:8}}><span style={{fontSize:22}}>{m.emoji}</span><div style={{flex:1}}><div style={{fontWeight:600,color:NAV}}>{m.name}</div><div style={{fontSize:11,color:"#A08070"}}>{m.relationship}{m.dob?" · "+new Date(m.dob).getFullYear():""}{m.occupation?" · "+m.occupation:""}</div></div><button onClick={()=>setMembers(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#C97B84",fontSize:18}}>×</button></div>))}
            {members.length===0 && <div style={{color:"#A08070",fontSize:13,textAlign:"center",padding:"12px 0"}}>Add at least one member</div>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={()=>setStep(2)} style={aCtaOut}>Back</button>
              <button disabled={loading||members.length===0} onClick={handleSignup}
                style={{...aCta,flex:2,background:members.length>0?SAF:"#E8DDD0",cursor:members.length>0?"pointer":"not-allowed"}}>
                {loading?"Creating...":"Create My Family 🏡"}
              </button>
            </div>
          </>}
        </>}

      </div>
    </div>
  );
}

// ── TIME-BASED IMAGE + HOME SCREEN ──────────────────────────────────────────
function DayImage() {
  const hr=new Date().getHours();
  const slot=hr<6?"night":hr<11?"morning":hr<17?"afternoon":hr<20?"evening":"night";
  const queries={morning:"sunrise golden morning sky",afternoon:"bright sunny blue sky",evening:"sunset orange dusk sky",night:"night sky stars moon"};
  const seeds={morning:42,afternoon:17,evening:88,night:33};
  const url=`https://source.unsplash.com/800x300/?${encodeURIComponent(queries[slot])}&sig=${seeds[slot]}`;
  const labels={morning:"Good morning ☀️",afternoon:"Good afternoon 🌤️",evening:"Good evening 🌅",night:"Good night 🌙"};
  return {url, label:labels[slot]};
}


const BGM_TRACKS=[
  {id:"forest",label:"🌿 Forest & Rain",    url:"https://archive.org/download/RainSoundsAndForestSounds/Rain_Sounds_and_Forest_Sounds.mp3"},
  {id:"sitar", label:"🎵 Indian Meditation", url:"https://archive.org/download/IndianSitarInstrumentalMusic10Hours/Indian%20Background%20Flute%20Music%20Instrumental%20Meditation%20Music%20%20Yoga%20Music%20%20Spa%20Music%20for%20Relaxation.mp3"},
  {id:"rain",  label:"🌧️ Gentle Rain",      url:"https://archive.org/download/rain-sounds-gentle-rain-thunderstorms/ambience-crickets-chirping-light-rain-tending-to-heavier-rain-10576.mp3"},
];
// Collage photos — picsum.photos (CORS-friendly, reliable, beautiful lifestyle shots)
// Each URL is a fixed seed so same photo always loads for that index
const COLLAGE_PHOTOS=[
  // Portraits / people
  "https://picsum.photos/seed/fam1/400/500",
  "https://picsum.photos/seed/fam2/400/500",
  "https://picsum.photos/seed/fam3/400/500",
  "https://picsum.photos/seed/fam4/400/500",
  "https://picsum.photos/seed/fam5/400/500",
  "https://picsum.photos/seed/fam6/400/500",
  "https://picsum.photos/seed/fam7/400/500",
  "https://picsum.photos/seed/fam8/400/500",
  "https://picsum.photos/seed/fam9/400/500",
  // Lifestyle / family moments
  "https://picsum.photos/seed/life1/400/500",
  "https://picsum.photos/seed/life2/400/500",
  "https://picsum.photos/seed/life3/400/500",
  "https://picsum.photos/seed/life4/400/500",
  "https://picsum.photos/seed/life5/400/500",
  "https://picsum.photos/seed/life6/400/500",
  "https://picsum.photos/seed/life7/400/500",
  "https://picsum.photos/seed/life8/400/500",
  "https://picsum.photos/seed/life9/400/500",
  // Glam / cinematic
  "https://picsum.photos/seed/glam1/400/500",
  "https://picsum.photos/seed/glam2/400/500",
  "https://picsum.photos/seed/glam3/400/500",
  "https://picsum.photos/seed/glam4/400/500",
  "https://picsum.photos/seed/glam5/400/500",
  "https://picsum.photos/seed/glam6/400/500",
  "https://picsum.photos/seed/glam7/400/500",
  "https://picsum.photos/seed/glam8/400/500",
  "https://picsum.photos/seed/glam9/400/500",
];
const COLLAGES=[
  {photos:[0,1,2]},{photos:[3,4,5]},{photos:[6,7,8]},
  {photos:[9,10,11]},{photos:[12,13,14]},{photos:[15,16,17]},
  {photos:[18,19,20]},{photos:[21,22,23]},{photos:[24,25,26]},
  {photos:[0,6,18]},
];

function HomeScreen({ family, members, expenses, events, onMemberClick, onTabChange, onShowWalkthrough, nudges }) {
  const score=computeScore(family);
  const month=new Date().getMonth();
  const spent=(expenses||[]).filter(e=>new Date(e.date||e.created_at).getMonth()===month).reduce((s,e)=>s+Number(e.amount),0);
  const upcoming=[...(events||[])].filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
  const unseenNudges=(nudges||[]).filter(n=>!n.seen).slice(0,1);
  const [slide,setSlide]=useState(0);
  const totalSlides=COLLAGES.length;
  const dateStr=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  const hr=new Date().getHours();
  const greeting=hr<12?"Good morning ☀️":hr<17?"Good afternoon 🌤️":"Good evening 🌙";
  const HL="#0F1F3D";
  const SAF="#F4A724";

  useEffect(()=>{
    const t=setInterval(()=>setSlide(s=>(s+1)%totalSlides),3500);
    return()=>clearInterval(t);
  },[]);

  return (
    <div style={{padding:"0 0 86px",background:"#EDE8DF",minHeight:"100vh"}}>
      <div style={{padding:"8px 8px 0",display:"flex",flexDirection:"column",gap:6}}>

        {/* ROW 1 — Greeting + Members */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div style={{background:HL,borderRadius:12,padding:"14px 12px",minHeight:90,display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{dateStr}</div>
            <div style={{fontSize:15,fontWeight:700,color:SAF,lineHeight:1.35}}>{greeting}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:5}}>{family?.name||"My Family"}</div>
          </div>
          <div style={{background:"#1A2F52",borderRadius:12,padding:"10px 8px",minHeight:90,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,width:"100%"}}>
              {(members||[]).slice(0,3).map(m=>(
                <div key={m.id} onClick={()=>onMemberClick(m)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(244,167,36,0.18)",border:`1.5px solid ${SAF}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,overflow:"hidden"}}>
                    {m.avatar_url?<img src={m.avatar_url} alt={m.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:m.emoji}
                  </div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.55)"}}>{m.name.split(" ")[0]}</div>
                </div>
              ))}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(244,167,36,0.06)",border:`1.5px dashed ${SAF}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>➕</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.3)"}}>Add</div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2 — Collage slider */}
        <div style={{borderRadius:12,overflow:"hidden",height:240,position:"relative"}}>
          <div style={{display:"flex",height:"100%",transition:"transform 0.4s ease",transform:`translateX(-${slide*100}%)`}}>
            {COLLAGES.map((c,ci)=>(
              <div key={ci} style={{minWidth:"100%",height:"100%",display:"grid",gridTemplateColumns:"2fr 1fr",gridTemplateRows:"1fr 1fr",gap:2,flexShrink:0}}>
                {c.photos.map((pidx,pi)=>(
                  <div key={pi} style={{...(pi===0?{gridRow:"1/3"}:{}),overflow:"hidden",background:"#1A2F52"}}>
                    <img src={COLLAGE_PHOTOS[pidx]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{position:"absolute",top:10,left:10,background:"rgba(0,0,0,0.38)",borderRadius:99,padding:"3px 10px",fontSize:9,color:"rgba(255,255,255,0.85)"}}>📸 Our moments</div>
          <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
            {COLLAGES.map((_,i)=>(
              <div key={i} onClick={()=>setSlide(i)} style={{width:6,height:6,borderRadius:"50%",background:i===slide?SAF:"rgba(255,255,255,0.3)",cursor:"pointer",transition:"background 0.3s"}}/>
            ))}
          </div>
          <div onClick={()=>setSlide(s=>(s-1+totalSlides)%totalSlides)} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.35)",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:14,userSelect:"none"}}>‹</div>
          <div onClick={()=>setSlide(s=>(s+1)%totalSlides)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.35)",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:14,userSelect:"none"}}>›</div>
        </div>

        {/* ROW 3 — Budget + Coming Up */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div onClick={()=>onTabChange("budget")} style={{background:HL,borderRadius:12,padding:12,cursor:"pointer"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.42)",marginBottom:4}}>This month</div>
            <div style={{fontSize:20,fontWeight:700,color:SAF}}>₹{spent>=1000?Math.round(spent/1000)+"k":spent.toLocaleString()}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginBottom:7}}>of ₹{(family?.monthly_expenses||0)>=1000?Math.round((family?.monthly_expenses||0)/1000)+"k":(family?.monthly_expenses||0)} budget</div>
            <div style={{height:4,background:"rgba(255,255,255,0.12)",borderRadius:99}}>
              <div style={{height:"100%",background:spent>(family?.monthly_expenses||0)?"#EF4444":SAF,borderRadius:99,width:`${Math.min(100,family?.monthly_expenses?Math.round(spent/family.monthly_expenses*100):0)}%`}}/>
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",marginTop:6}}>💸 Budget →</div>
          </div>
          <div onClick={()=>onTabChange("plan")} style={{background:"#fff",border:"0.5px solid #D0C9BC",borderRadius:12,padding:12,cursor:"pointer"}}>
            <div style={{fontSize:9,color:"#888",marginBottom:6}}>📅 Coming up</div>
            {upcoming.length===0&&<div style={{fontSize:10,color:"#AAA"}}>No upcoming events</div>}
            {upcoming.slice(0,3).map((e,i)=>(
              <div key={e.id} style={{fontSize:10,color:"#1A1A1A",paddingBottom:i<Math.min(upcoming.length,3)-1?4:0,marginBottom:i<Math.min(upcoming.length,3)-1?4:0,borderBottom:i<Math.min(upcoming.length,3)-1?"0.5px solid #E8E0D5":"none"}}>
                {e.emoji||"📅"} {e.title} · {new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </div>
            ))}
            <div style={{fontSize:9,color:SAF,marginTop:6,fontWeight:700}}>See all →</div>
          </div>
        </div>

        {/* ROW 4 — Nudges (only if unseen) */}
        {unseenNudges.length>0&&(
          <div style={{background:"#fff",border:"0.5px solid #D0C9BC",borderRadius:12,padding:12}}>
            <div style={{fontSize:9,color:"#888",marginBottom:8}}>👋 Nudges</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(244,167,36,0.15)",border:`1.5px solid ${SAF}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:"#1A1A1A",fontWeight:700}}>{unseenNudges[0].from_member} nudged you</div>
                <div style={{fontSize:10,color:"#888",marginTop:1}}>{unseenNudges[0].note}</div>
              </div>
              <div style={{fontSize:9,background:HL,color:SAF,borderRadius:99,padding:"4px 10px",whiteSpace:"nowrap",flexShrink:0,cursor:"pointer"}}>View</div>
            </div>
          </div>
        )}

        {/* ROW 5 — AI Concierge + Freedom Score */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div onClick={()=>onTabChange("concierge")} style={{background:"#1A2F52",borderRadius:12,padding:12,cursor:"pointer"}}>
            <div style={{fontSize:22,marginBottom:6}}>🤖</div>
            <div style={{fontSize:11,color:"#fff",fontWeight:700}}>AI Concierge</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginTop:2}}>Family assistant</div>
            <div style={{marginTop:8,fontSize:9,background:"rgba(244,167,36,0.15)",color:SAF,borderRadius:99,padding:"3px 8px",display:"inline-block"}}>SOON</div>
          </div>
          {score?(
            <div onClick={()=>onTabChange("budget")} style={{background:"#fff",border:"0.5px solid #D0C9BC",borderRadius:12,padding:12,cursor:"pointer"}}>
              <div style={{fontSize:9,color:"#888",marginBottom:4}}>Freedom score</div>
              <div style={{fontSize:28,fontWeight:700,color:HL}}>{score.score}</div>
              <div style={{fontSize:9,color:"#888"}}>/100 · {score.grade}</div>
              <div style={{height:4,background:"#EDE8DF",borderRadius:99,marginTop:8}}>
                <div style={{height:"100%",background:SAF,borderRadius:99,width:`${score.score}%`}}/>
              </div>
            </div>
          ):(
            <div onClick={()=>onTabChange("profile")} style={{background:"#fff",border:"0.5px solid #D0C9BC",borderRadius:12,padding:12,cursor:"pointer"}}>
              <div style={{fontSize:9,color:"#888",marginBottom:4}}>Freedom score</div>
              <div style={{fontSize:11,color:"#1A1A1A",fontWeight:700,marginTop:4}}>Set up finances</div>
              <div style={{fontSize:9,color:"#AAA",marginTop:2}}>Add income in Profile</div>
              <div style={{fontSize:9,color:SAF,marginTop:6,fontWeight:700}}>Go →</div>
            </div>
          )}
        </div>

        {/* Walkthrough */}
        <div onClick={onShowWalkthrough} style={{textAlign:"center",padding:"10px 0 4px",fontSize:12,color:"#AAA",cursor:"pointer"}}>👋 How does Famillion work?</div>

      </div>
    </div>
  );
}

function MonthView({expenses,NAV,TEAL,TEALTEXT,ExpTile}){
  const [selMonth,setSelMonth]=useState(()=>new Date().getMonth());
  const [selYear,setSelYear]=useState(()=>new Date().getFullYear());
  const prevMonth=()=>{if(selMonth===0){setSelMonth(11);setSelYear(y=>y-1);}else setSelMonth(m=>m-1);};
  const nextMonth=()=>{if(selMonth===11){setSelMonth(0);setSelYear(y=>y+1);}else setSelMonth(m=>m+1);};
  const monthLabel=new Date(selYear,selMonth,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const monthRows=expenses.data.filter(e=>{const d=new Date(e.date||e.created_at);return d.getMonth()===selMonth&&d.getFullYear()===selYear;});
  const monthTotal=monthRows.reduce((s,e)=>s+Number(e.amount),0);
  const today=new Date();
  const quickMonths=[
    {m:today.getMonth()===0?11:today.getMonth()-1,y:today.getMonth()===0?today.getFullYear()-1:today.getFullYear()},
    {m:today.getMonth(),y:today.getFullYear()},
    {m:today.getMonth()===11?0:today.getMonth()+1,y:today.getMonth()===11?today.getFullYear()+1:today.getFullYear()},
  ];
  return(
    <div style={{padding:"12px 12px 0"}}>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {quickMonths.map((qm,i)=>{
          const ql=new Date(qm.y,qm.m,1).toLocaleDateString("en-IN",{month:"short"});
          const isActive=qm.m===selMonth&&qm.y===selYear;
          return <button key={i} onClick={()=>{setSelMonth(qm.m);setSelYear(qm.y);}}
            style={{flex:1,padding:"6px 4px",borderRadius:8,border:"none",fontSize:10,fontWeight:800,cursor:"pointer",
              background:isActive?NAV:TEAL,color:isActive?"#fff":TEALTEXT}}>{ql}{i===1?" (this)":i===2?" →":""}</button>;
        })}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={prevMonth} style={{background:TEAL,border:"none",borderRadius:8,padding:"6px 12px",color:TEALTEXT,fontWeight:800,cursor:"pointer",fontSize:12}}>←</button>
        <div style={{fontWeight:700,color:NAV,fontSize:13}}>{monthLabel}</div>
        <button onClick={nextMonth} style={{background:TEAL,border:"none",borderRadius:8,padding:"6px 12px",color:TEALTEXT,fontWeight:800,cursor:"pointer",fontSize:12}}>→</button>
      </div>
      {monthRows.length===0
        ?<div style={{textAlign:"center",padding:"32px 20px",color:T.muted}}>
            <div style={{fontSize:36,marginBottom:8}}>🗓️</div>
            <div style={{fontWeight:700,color:NAV,marginBottom:4}}>No expenses in {monthLabel}</div>
            <div style={{fontSize:12}}>Tap + to add an expense or reminder</div>
          </div>
        :<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,padding:"6px 0",borderBottom:`0.5px solid #EDE0D0`}}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted}}>{monthRows.length} transactions</div>
            <div style={{fontSize:12,fontWeight:800,color:NAV}}>₹{monthTotal.toLocaleString()}</div>
          </div>
          {monthRows.map(e=><ExpTile key={e.id} e={e}/>)}
        </>
      }
    </div>
  );
}

function MoneyScreen({ family, members, familyId, onPts }) {
  const expenses = useTable("expenses", familyId);
  const goals    = useTable("goals", familyId);
  const SAF="#F4A724", NAV="#0F1F3D", CRM="#FDF6EC", TEAL="#E0F7F2", TEALTEXT="#0A6B58";

  // sub-tab: spend | breakdown | insights | more
  const [tab,setTab]           = useState("spend");
  const [showMore,setShowMore] = useState(false); // Goals · Score popup

  // spend tab state
  const [viewBy,setViewBy]     = useState("category");
  const [drillCat,setDrillCat] = useState(null);
  const [showE,setShowE]       = useState(false);
  const [editId,setEditId]     = useState(null);
  const [nudgeTarget,setNudgeTarget] = useState(null); // {id, label, who, amount} for nudge popup
  const [nudgedId,setNudgedId] = useState(null);
  const [deleteConfirm,setDeleteConfirm] = useState(null); // id to confirm delete
  const [ef,setEf]             = useState({label:"",amount:"",cat:"🍱",subcat:"",tag:"",who:"",notes:""});
  const [showG,setShowG]       = useState(false);
  const [gf,setGf]             = useState({title:"",emoji:"🎯",target:"",saved:"",color:T.blue});
  const colors=[T.blue,T.rose,T.green,T.lav,T.amber,T.brown];

  // 3-level category system
  const L1_CATS=[
    {e:"🏠",l:"Home",    sub:["Rent/EMI","Society","Maintenance","Maid/Help"]},
    {e:"🍱",l:"Food",    sub:["Groceries","Dining Out","Swiggy/Zomato","Snacks","Milk"]},
    {e:"📚",l:"Education",sub:["School Fees","Tuition","Books","Supplies","Exam Fees"]},
    {e:"🚗",l:"Transport",sub:["Petrol","Cab/Ola","Auto","Metro","Parking"]},
    {e:"💊",l:"Health",  sub:["Medicines","Doctor","Lab Tests","Hospital"]},
    {e:"🎉",l:"Lifestyle",sub:["Shopping","Salon","Entertainment","Gym","Subscriptions"]},
    {e:"⚡",l:"Utilities",sub:["Electricity","Gas/LPG","Water","Internet","Mobile"]},
    {e:"🏖️",l:"Vacation",sub:["Travel","Hotel","Food","Activities"]},
    {e:"🎯",l:"Others",  sub:["Gifts","Charity","Miscellaneous"]},
  ];
  const selL1=L1_CATS.find(c=>c.e===ef.cat)||L1_CATS[1];

  const month=new Date().getMonth();
  const monthExp=expenses.data.filter(e=>new Date(e.date||e.created_at).getMonth()===month);
  const spent=monthExp.reduce((s,e)=>s+Number(e.amount),0);
  const budget=family?.monthly_expenses||0;
  const pct=budget>0?Math.min(100,Math.round((spent/budget)*100)):0;

  // category totals
  const catMap=L1_CATS.map(c=>{
    const cs=monthExp.filter(e=>e.cat===c.e).reduce((s,e)=>s+Number(e.amount),0);
    return{...c,spent:cs,count:monthExp.filter(e=>e.cat===c.e).length};
  }).filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent);
  const topCat=catMap[0];

  // views
  const viewExp=viewBy==="category"&&drillCat
    ?expenses.data.filter(e=>e.cat===drillCat)
    :expenses.data;

  const groupedByDate=viewExp.reduce((acc,e)=>{
    const d=new Date(e.date||e.created_at);
    const today=new Date(); const yest=new Date(); yest.setDate(today.getDate()-1);
    const key=d.toDateString()===today.toDateString()?"Today":d.toDateString()===yest.toDateString()?"Yesterday":d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
    if(!acc[key])acc[key]=[];acc[key].push(e);return acc;
  },{});

  const groupedByPerson=viewExp.reduce((acc,e)=>{
    const key=e.who||"Unknown";
    if(!acc[key])acc[key]=[];acc[key].push(e);return acc;
  },{});

  const groupedByMonth=expenses.data.reduce((acc,e)=>{
    const key=new Date(e.date||e.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"});
    if(!acc[key])acc[key]=[];acc[key].push(e);return acc;
  },{});

  // handlers
  const startEdit=(e)=>{setEditId(e.id);setEf({label:e.label||"",amount:String(e.amount),cat:e.cat||"🍱",subcat:e.subcategory||"",tag:"",who:e.who||"",notes:e.notes||""});setShowE(true);};
  const cancelEdit=()=>{setEditId(null);setEf({label:"",amount:"",cat:"🍱",subcat:"",tag:"",who:"",notes:""});setShowE(false);};
  const saveExpense=async()=>{
    if(!ef.amount)return;
    const payload={label:ef.label||selL1.l,amount:Number(ef.amount),cat:ef.cat,subcategory:ef.subcat,who:ef.who,notes:ef.notes,date:new Date().toISOString()};
    if(editId){await expenses.update(editId,payload);setEditId(null);}
    else{await expenses.add(payload);await onPts(10);}
    setEf({label:"",amount:"",cat:"🍱",subcat:"",tag:"",who:"",notes:""});setShowE(false);
  };
  const confirmDelete=(id)=>setDeleteConfirm(id);
  const doDelete=async()=>{if(deleteConfirm){await expenses.remove(deleteConfirm);setDeleteConfirm(null);}};

  // nudge popup + message
  const [nudgeMsg,setNudgeMsg] = useState("");
  const [nudgeMsgMode,setNudgeMsgMode] = useState(false);
  const openNudge=(e)=>{setNudgeTarget({id:e.id,label:e.label||e.cat,who:e.who,amount:Number(e.amount)});setNudgeMsg("");setNudgeMsgMode(false);};
  const sendNudgeNow=()=>{
    setNudgedId(nudgeTarget?.id);
    setTimeout(()=>setNudgedId(null),2500);
    setNudgeTarget(null);setNudgeMsg("");setNudgeMsgMode(false);
    // TODO Nudge 2.0: wire to nudge API with nudgeMsg
  };

  // ── BACK BUTTON (Budget tab only) ──
  useEffect(()=>{
    const onBack=(e)=>{
      // close overlays in priority order
      if(deleteConfirm){setDeleteConfirm(null);return;}
      if(nudgeTarget){setNudgeTarget(null);setNudgeMsg("");setNudgeMsgMode(false);return;}
      if(showMore){setShowMore(false);return;}
      if(showE){cancelEdit();return;}
      if(drillCat){setDrillCat(null);return;}
      // else let default happen (go to home tab handled by parent)
    };
    window.addEventListener("popstate",onBack);
    return()=>window.removeEventListener("popstate",onBack);
  },[deleteConfirm,nudgeTarget,showMore,showE,drillCat]);

  // push a history entry whenever a layer opens so back has something to pop
  useEffect(()=>{
    if(showE||nudgeTarget||deleteConfirm||showMore||drillCat){
      window.history.pushState({budget:true},"");
    }
  },[showE,!!nudgeTarget,!!deleteConfirm,showMore,drillCat]);

  // full-width expense tile for drill-in
  const ExpTile=({e})=>(
    <div style={{background:"#fff",borderRadius:14,border:`0.5px solid #EDE0D0`,padding:"12px 14px",marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <span style={{fontSize:22,flexShrink:0}}>{e.cat}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:NAV,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.label||e.cat}</div>
          {e.subcategory&&<div style={{fontSize:10,color:TEALTEXT,fontWeight:700,marginTop:1}}>{e.subcategory}</div>}
        </div>
        <div style={{fontWeight:800,color:NAV,fontSize:14,flexShrink:0}}>₹{Number(e.amount).toLocaleString()}</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:e.notes?6:8}}>
        <div style={{fontSize:10,color:T.muted}}>{e.who||""}</div>
        <div style={{fontSize:10,color:T.muted}}>{new Date(e.date||e.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
      </div>
      {e.notes&&<div style={{background:"#FFF8E8",borderRadius:8,padding:"4px 8px",fontSize:10,color:"#8B5E3C",marginBottom:8}}>📝 {e.notes}</div>}
      <div style={{display:"flex",gap:6,paddingTop:8,borderTop:`0.5px solid #F0EAE0`}}>
        <button onClick={()=>openNudge(e)} style={{flex:1,padding:"6px 4px",borderRadius:8,border:"none",background:nudgedId===e.id?"#C5EFE8":TEAL,color:TEALTEXT,fontSize:11,fontWeight:800,cursor:"pointer"}}>
          {nudgedId===e.id?"✓ Nudged":"👋 Nudge"}
        </button>
        <button onClick={()=>startEdit(e)} style={{flex:1,padding:"6px 4px",borderRadius:8,border:"none",background:"#EEF0FF",color:"#3730A3",fontSize:11,fontWeight:800,cursor:"pointer"}}>✏️ Edit</button>
        <button onClick={()=>confirmDelete(e.id)} style={{flex:1,padding:"6px 4px",borderRadius:8,border:"none",background:"#FFF0EC",color:"#9B3A22",fontSize:11,fontWeight:800,cursor:"pointer"}}>🗑 Delete</button>
      </div>
    </div>
  );

  return (
    <div style={{background:CRM,minHeight:"100vh",paddingBottom:90}}>

      {/* ── SLIM NAVY BAR ── */}
      <div style={{background:NAV,padding:"12px 16px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:700,letterSpacing:0.5,marginBottom:2}}>
              {new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"}).toUpperCase()}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:SAF,lineHeight:1}}>
              ₹{spent.toLocaleString()}
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>spent{budget>0?` of ₹${budget.toLocaleString()} budget`:""}</div>
          </div>
          <div style={{width:3,height:40,background:"rgba(255,255,255,0.1)",borderRadius:99,flexShrink:0}}/>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#6B8F71"}}>
              ₹{Math.max(0,budget-spent).toLocaleString()}
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>remaining</div>
          </div>
        </div>
        {budget>0&&<div style={{marginTop:10,background:"rgba(255,255,255,0.12)",borderRadius:99,height:3}}>
          <div style={{width:`${pct}%`,background:pct<60?"#6B8F71":pct<85?SAF:"#C97B84",height:"100%",borderRadius:99,transition:"width 0.8s"}}/>
        </div>}
      </div>

      {/* ── SUB-TABS ── */}
      <div style={{background:"#fff",display:"flex",gap:6,padding:"8px 12px",borderBottom:`0.5px solid #E8E8E8`,overflowX:"auto"}}>
        {[["spend","💸 Spend"],["breakdown","📊 Breakdown"],["insights","💡 Insights"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            style={{padding:"6px 12px",borderRadius:8,border:"none",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",
              background:tab===v?NAV:"#F0F0F0",color:tab===v?"#fff":"#888"}}>
            {l}
          </button>
        ))}
        <button onClick={()=>setShowMore(true)}
          style={{padding:"6px 12px",borderRadius:8,border:`1.5px dashed ${SAF}`,fontSize:11,fontWeight:800,cursor:"pointer",
            background:"#FFF8E8",color:"#8B5E3C",whiteSpace:"nowrap",marginLeft:"auto"}}>
          ＋ More
        </button>
      </div>

      {/* ── SPEND TAB ── */}
      {tab==="spend"&&<>
        {/* 4 filter tiles */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,padding:"8px 12px",background:"#fff",borderBottom:`0.5px solid #E8E8E8`}}>
          {[
            {v:"category",icon:"🏷️",l:"Category",navy:true},
            {v:"date",    icon:"📅",l:"Date",     navy:false},
            {v:"person",  icon:"👤",l:"Person",   navy:true},
            {v:"month",   icon:"🗓️",l:"Month",    navy:false},
          ].map(f=>(
            <button key={f.v} onClick={()=>{setViewBy(f.v);setDrillCat(null);}}
              style={{padding:"7px 2px 5px",borderRadius:8,border:"none",fontSize:9,fontWeight:800,textAlign:"center",cursor:"pointer",lineHeight:1.3,
                background:f.navy?NAV:TEAL,
                color:f.navy?"#fff":TEALTEXT,
                borderBottom:viewBy===f.v?`3px solid ${SAF}`:"3px solid transparent",
                boxSizing:"border-box"}}>
              <div style={{fontSize:13,marginBottom:2}}>{f.icon}</div>
              {f.l}
            </button>
          ))}
        </div>

        {expenses.loading&&<div style={{padding:32}}><Spinner/></div>}

        {/* ── CATEGORY HOME VIEW ── */}
        {!expenses.loading&&viewBy==="category"&&!drillCat&&(
          <div style={{padding:"12px 12px 0"}}>
            {/* ring + stats tile */}
            {catMap.length>0&&<div style={{background:"#fff",borderRadius:14,border:"0.5px solid #EDE0D0",padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{flexShrink:0}}>
                <circle cx="28" cy="28" r="22" fill="none" stroke="#F0EAE0" strokeWidth="7"/>
                <circle cx="28" cy="28" r="22" fill="none" stroke={SAF} strokeWidth="7"
                  strokeDasharray={`${138.2*pct/100} 138.2`} strokeDashoffset="0"
                  strokeLinecap="round" transform="rotate(-90 28 28)"/>
                <text x="28" y="32" textAnchor="middle" fontFamily="Georgia,serif" fontSize="10" fontWeight="700" fill={NAV}>{pct}%</text>
              </svg>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:10,color:T.muted}}>Spent</span><span style={{fontSize:12,fontWeight:800,color:"#C97B84"}}>₹{spent.toLocaleString()}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:10,color:T.muted}}>Remaining</span><span style={{fontSize:12,fontWeight:800,color:"#6B8F71"}}>₹{Math.max(0,budget-spent).toLocaleString()}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:T.muted}}>Transactions</span><span style={{fontSize:12,fontWeight:800,color:NAV}}>{monthExp.length}</span></div>
              </div>
            </div>}
            {catMap.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:T.muted}}>
              <div style={{fontSize:40,marginBottom:10}}>💸</div>
              <div style={{fontWeight:700,color:NAV,marginBottom:4}}>No expenses yet</div>
              <div style={{fontSize:12}}>Tap + to log your first one</div>
            </div>}
            {/* 2-col category tiles */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {catMap.map(({e,l,spent:cs,count},i)=>(
                <div key={e} onClick={()=>setDrillCat(e)}
                  style={{background:i===0?"#FFF8E8":"#fff",borderRadius:12,border:`0.5px solid ${i===0?SAF:"#EDE0D0"}`,padding:"10px",cursor:"pointer"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{e}</div>
                  <div style={{fontSize:13,fontWeight:800,color:NAV,lineHeight:1.1}}>₹{cs.toLocaleString()}</div>
                  <div style={{fontSize:9,color:T.muted,marginTop:3}}>{l} · {count} txn{count!==1?"s":""}</div>
                  <div style={{height:3,borderRadius:99,background:"#F0EAE0",marginTop:7}}>
                    <div style={{width:`${Math.min(100,Math.round((cs/spent)*100))}%`,height:"100%",borderRadius:99,
                      background:budget>0&&cs/budget>0.85?"#C97B84":budget>0&&cs/budget>0.6?"#E8A838":"#6B8F71"}}/>
                  </div>
                </div>
              ))}
              {/* Add expense tile */}
              <div onClick={()=>{setEditId(null);setShowE(true);}}
                style={{background:"#FFF8E8",borderRadius:12,border:`1.5px dashed ${SAF}`,padding:"10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:80}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:SAF,color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:5}}>+</div>
                <div style={{fontSize:10,fontWeight:800,color:"#8B5E3C",textAlign:"center"}}>Add Expense</div>
              </div>
            </div>
          </div>
        )}

        {/* ── DRILL-IN VIEW ── */}
        {!expenses.loading&&viewBy==="category"&&drillCat&&(
          <div style={{padding:"10px 12px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"6px 0"}}>
              <button onClick={()=>setDrillCat(null)} style={{background:"none",border:"none",fontWeight:700,fontSize:12,color:NAV,cursor:"pointer",padding:0}}>← Back</button>
              <div style={{flex:1,fontWeight:800,color:NAV,fontSize:14}}>{drillCat} {L1_CATS.find(c=>c.e===drillCat)?.l||""}</div>
              <div style={{fontSize:12,fontWeight:800,color:"#C97B84"}}>₹{catMap.find(c=>c.e===drillCat)?.spent.toLocaleString()||"0"}</div>
            </div>
            {expenses.data.filter(e=>e.cat===drillCat).length===0
              ?<div style={{textAlign:"center",padding:32,color:T.muted}}>No expenses in this category</div>
              :expenses.data.filter(e=>e.cat===drillCat).map(e=><ExpTile key={e.id} e={e}/>)
            }
          </div>
        )}

        {/* ── DATE VIEW ── */}
        {!expenses.loading&&viewBy==="date"&&(
          <div style={{padding:"12px 12px 0"}}>
            {viewExp.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:10}}>📅</div><div style={{fontWeight:700,color:NAV}}>No expenses yet</div></div>}
            {Object.entries(groupedByDate).map(([label,rows])=>(
              <div key={label} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:0.6,marginBottom:6}}>{label.toUpperCase()}</div>
                {rows.map(e=><ExpTile key={e.id} e={e}/>)}
              </div>
            ))}
          </div>
        )}

        {/* ── PERSON VIEW ── */}
        {!expenses.loading&&viewBy==="person"&&(
          <div style={{padding:"12px 12px 0"}}>
            {viewExp.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:10}}>👤</div><div style={{fontWeight:700,color:NAV}}>No expenses yet</div></div>}
            {Object.entries(groupedByPerson).map(([person,rows])=>(
              <div key={person} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:0.6}}>{person.toUpperCase()}</div>
                  <div style={{fontSize:11,fontWeight:800,color:NAV}}>₹{rows.reduce((s,e)=>s+Number(e.amount),0).toLocaleString()}</div>
                </div>
                {rows.map(e=><ExpTile key={e.id} e={e}/>)}
              </div>
            ))}
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {!expenses.loading&&viewBy==="month"&&<MonthView expenses={expenses} NAV={NAV} TEAL={TEAL} TEALTEXT={TEALTEXT} ExpTile={ExpTile}/>}

        {/* ── FLOATING ADD BUTTON ── */}
        <button onClick={()=>{setEditId(null);setShowE(true);}}
          style={{position:"fixed",bottom:80,right:20,zIndex:100,width:54,height:54,borderRadius:"50%",
            background:SAF,border:"none",color:"#fff",fontSize:26,cursor:"pointer",
            boxShadow:"0 4px 16px rgba(244,167,36,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          +
        </button>

        {/* ── ADD/EDIT EXPENSE BOTTOM SHEET ── */}
        {showE&&(
          <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            <div onClick={cancelEdit} style={{flex:1,background:"rgba(0,0,0,0.5)"}}/>
            <div style={{background:"#fff",borderRadius:"24px 24px 0 0",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 20px 0",flexShrink:0}}>
                <div style={{width:36,height:4,borderRadius:99,background:"#E0D8D0",margin:"0 auto 12px"}}/>
                <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:NAV,fontSize:17,marginBottom:12}}>{editId?"Edit Expense":"New Expense"}</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0 20px 28px"}}>
                {/* Amount */}
                <div style={{background:"#F8F4F0",borderRadius:14,padding:"16px",textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:6,fontWeight:700,letterSpacing:0.5}}>AMOUNT (₹)</div>
                  <input style={{width:"100%",border:"none",background:"transparent",fontSize:34,fontWeight:800,textAlign:"center",color:NAV,outline:"none",fontFamily:"'Playfair Display',serif"}}
                    type="number" placeholder="0" value={ef.amount} onChange={e=>setEf(f=>({...f,amount:e.target.value}))} autoFocus/>
                </div>
                {/* Who */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8B5E3C",marginBottom:7,letterSpacing:0.3}}>PAID BY</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {members?.map(m=>(
                      <button key={m.id} onClick={()=>setEf(f=>({...f,who:m.name}))}
                        style={{padding:"7px 12px",borderRadius:99,border:`2px solid ${ef.who===m.name?SAF:"#E8DDD0"}`,
                          background:ef.who===m.name?"#FFF8E8":"#fff",fontWeight:700,fontSize:12,cursor:"pointer",color:NAV}}>
                        {m.emoji} {m.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Level 1 category */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8B5E3C",marginBottom:7,letterSpacing:0.3}}>CATEGORY</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                    {L1_CATS.map(c=>(
                      <button key={c.e} onClick={()=>setEf(f=>({...f,cat:c.e,subcat:""}))}
                        style={{padding:"7px 4px",borderRadius:10,border:`1.5px solid ${ef.cat===c.e?SAF:"#E8DDD0"}`,
                          background:ef.cat===c.e?"#FFF8E8":"#F8F4F0",cursor:"pointer",textAlign:"center"}}>
                        <div style={{fontSize:16,marginBottom:2}}>{c.e}</div>
                        <div style={{fontSize:8,fontWeight:800,color:"#8B5E3C"}}>{c.l}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Level 2 subcategory */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8B5E3C",marginBottom:7,letterSpacing:0.3}}>SUBCATEGORY <span style={{fontWeight:400,color:T.muted}}>({selL1.l} →)</span></div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {selL1.sub.map(s=>(
                      <button key={s} onClick={()=>setEf(f=>({...f,subcat:s}))}
                        style={{padding:"5px 9px",borderRadius:7,border:`1.5px solid ${ef.subcat===s?NAV:"#E8DDD0"}`,
                          background:ef.subcat===s?NAV:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",
                          color:ef.subcat===s?"#fff":NAV}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Level 3 tag */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8B5E3C",marginBottom:7,letterSpacing:0.3}}>TAG <span style={{fontWeight:400,color:T.muted}}>(optional)</span></div>
                  <input style={{...inp,background:"#F8F4F0",border:"1.5px solid #E8DDD0"}} value={ef.tag}
                    onChange={e=>setEf(f=>({...f,tag:e.target.value}))} placeholder="e.g. Pranava's tiffin, work lunch…"/>
                </div>
                {/* Description */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8B5E3C",marginBottom:7,letterSpacing:0.3}}>DESCRIPTION</div>
                  <input style={{...inp,background:"#F8F4F0",border:"1.5px solid #E8DDD0"}} value={ef.label}
                    onChange={e=>setEf(f=>({...f,label:e.target.value}))} placeholder="e.g. Punjabi Dhaba dinner"/>
                </div>
                {/* Memory note */}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8B5E3C",marginBottom:7,letterSpacing:0.3}}>MEMORY NOTE <span style={{fontWeight:400,color:T.muted}}>(optional)</span></div>
                  <textarea style={{...inp,height:68,resize:"none",lineHeight:1.6,background:"#F8F4F0",border:"1.5px solid #E8DDD0"}}
                    placeholder="Add a note… (e.g. Pranava's birthday dinner 🎂)"
                    value={ef.notes} onChange={e=>setEf(f=>({...f,notes:e.target.value}))}/>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={cancelEdit} style={{flex:1,padding:13,borderRadius:13,border:"1.5px solid #E8DDD0",background:"transparent",color:"#A08070",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancel</button>
                  <button onClick={saveExpense} style={{flex:2,padding:13,borderRadius:13,border:"none",background:SAF,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>{editId?"Update":"Save +10pts"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NUDGE POPUP ── */}
        {nudgeTarget&&(
          <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            <div onClick={()=>{setNudgeTarget(null);setNudgeMsg("");setNudgeMsgMode(false);}} style={{flex:1,background:"rgba(0,0,0,0.4)"}}/>
            <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"16px 18px 28px"}}>
              <div style={{width:32,height:4,borderRadius:99,background:"#E0D8D0",margin:"0 auto 14px"}}/>
              {!nudgeMsgMode?(
                <>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:NAV,marginBottom:4}}>👋 Nudge about this?</div>
                  <div style={{fontSize:11,color:T.muted,marginBottom:14,lineHeight:1.6,background:"#F8F4F0",borderRadius:8,padding:"8px 10px"}}>
                    {nudgeTarget.who||"Someone"} spent ₹{nudgeTarget.amount.toLocaleString()} on {nudgeTarget.label}
                  </div>
                  {[
                    {icon:"👋",l:"Nudge with a message",sub:"Write what you want to say",bg:TEAL,tc:TEALTEXT,fn:()=>setNudgeMsgMode(true)},
                    {icon:"⏰",l:"Schedule nudge",sub:"Tonight 8pm · Tomorrow morning · Custom",bg:"#EEF0FF",tc:"#3730A3",fn:()=>setNudgeTarget(null)},
                  ].map(opt=>(
                    <div key={opt.l} onClick={opt.fn}
                      style={{display:"flex",alignItems:"center",gap:12,background:opt.bg,borderRadius:12,padding:"11px 14px",marginBottom:8,cursor:"pointer"}}>
                      <div style={{fontSize:20,flexShrink:0}}>{opt.icon}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:opt.tc}}>{opt.l}</div>
                        <div style={{fontSize:10,color:T.muted,marginTop:2}}>{opt.sub}</div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>{setNudgeTarget(null);setNudgeMsg("");}} style={{width:"100%",padding:8,background:"transparent",border:"none",fontSize:12,fontWeight:700,color:T.muted,cursor:"pointer",marginTop:4}}>Cancel</button>
                </>
              ):(
                <>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:NAV,marginBottom:4}}>✍️ Write your nudge</div>
                  <div style={{fontSize:11,color:T.muted,marginBottom:10}}>About: {nudgeTarget.who||"Someone"}'s ₹{nudgeTarget.amount.toLocaleString()} on {nudgeTarget.label}</div>
                  <textarea
                    autoFocus
                    placeholder={`e.g. "Eat healthy next time, no more burgers! 🥗"`}
                    value={nudgeMsg}
                    onChange={e=>setNudgeMsg(e.target.value)}
                    style={{...inp,height:90,resize:"none",lineHeight:1.6,background:"#F8F4F0",border:`1.5px solid ${TEAL}`,marginBottom:12}}
                  />
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setNudgeMsgMode(false)} style={{flex:1,padding:12,borderRadius:12,border:"1.5px solid #E8DDD0",background:"transparent",color:T.muted,fontWeight:700,cursor:"pointer",fontSize:13}}>← Back</button>
                    <button onClick={sendNudgeNow} disabled={!nudgeMsg.trim()}
                      style={{flex:2,padding:12,borderRadius:12,border:"none",background:nudgeMsg.trim()?TEALTEXT:"#ccc",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>
                      Send Nudge 👋
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRM ── */}
        {deleteConfirm&&(
          <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)"}}>
            <div style={{background:"#fff",borderRadius:20,padding:"24px 20px",margin:"0 24px",maxWidth:340,width:"100%"}}>
              <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>🗑️</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:NAV,textAlign:"center",marginBottom:8}}>Delete this expense?</div>
              <div style={{fontSize:12,color:T.muted,textAlign:"center",marginBottom:20,lineHeight:1.6}}>This can't be undone.</div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:12,borderRadius:12,border:"1.5px solid #E8DDD0",background:"transparent",fontWeight:700,cursor:"pointer",color:T.muted}}>Cancel</button>
                <button onClick={doDelete} style={{flex:1,padding:12,borderRadius:12,border:"none",background:"#9B3A22",color:"#fff",fontWeight:700,cursor:"pointer"}}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </>}

      {/* ── BREAKDOWN TAB ── */}
      {tab==="breakdown"&&(
        <div style={{padding:"12px 12px 0"}}>
          {/* Fixed/Committed */}
          <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #EDE0D0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:800,color:NAV,letterSpacing:0.5,marginBottom:10}}>🔒 FIXED / COMMITTED</div>
            {[
              {l:"🏠 Rent / EMI",amt:22000,paid:true},
              {l:"📚 School fees",amt:8500,paid:true},
              {l:"⚡ Electricity",amt:3200,paid:false},
              {l:"📱 Internet + Mobile",amt:1800,paid:true},
            ].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"0.5px solid #F0EAE0"}}>
                <div style={{fontSize:11,fontWeight:700,color:NAV}}>{r.l}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:11,fontWeight:800,color:NAV}}>₹{r.amt.toLocaleString()}</div>
                  <div style={{fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:5,background:r.paid?TEAL:"#FFF0EC",color:r.paid?TEALTEXT:"#9B3A22"}}>{r.paid?"✅ Paid":"❌ Due"}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Variable/Discretionary */}
          <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #EDE0D0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:800,color:NAV,letterSpacing:0.5,marginBottom:10}}>🎯 VARIABLE / DISCRETIONARY</div>
            {catMap.length===0&&<div style={{fontSize:12,color:T.muted,textAlign:"center",padding:"16px 0"}}>Log expenses to see your breakdown</div>}
            {catMap.map(({e,l,spent:cs})=>(
              <div key={e} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:700,color:NAV}}>{e} {l}</div>
                  <div style={{fontSize:11,fontWeight:800,color:budget>0&&cs/budget>0.85?"#C97B84":budget>0&&cs/budget>0.6?"#E8A838":"#6B8F71"}}>₹{cs.toLocaleString()}{budget>0?` · ${Math.round((cs/budget)*100)}%`:""}</div>
                </div>
                <div style={{height:5,borderRadius:99,background:"#F0EAE0"}}>
                  <div style={{width:`${Math.min(100,budget>0?Math.round((cs/budget)*100):Math.round((cs/spent)*100))}%`,height:"100%",borderRadius:99,
                    background:budget>0&&cs/budget>0.85?"#C97B84":budget>0&&cs/budget>0.6?"#E8A838":"#6B8F71",transition:"width 0.6s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab==="insights"&&(
        <div style={{padding:"12px 12px 0"}}>
          {/* Monthly trend */}
          <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #EDE0D0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:800,color:NAV,letterSpacing:0.5,marginBottom:4}}>📈 MONTHLY TREND</div>
            <div style={{fontSize:9,color:T.muted,marginBottom:10}}>Last 6 months · total spend</div>
            {expenses.data.length<5
              ?<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"16px 0"}}>Keep logging to unlock trends (need 5+ expenses)</div>
              :(()=>{
                const months=[];
                for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push({key:d.toLocaleDateString("en-IN",{month:"short"}),m:d.getMonth(),y:d.getFullYear()});}
                const maxAmt=Math.max(...months.map(mo=>expenses.data.filter(e=>{const d=new Date(e.date||e.created_at);return d.getMonth()===mo.m&&d.getFullYear()===mo.y;}).reduce((s,e)=>s+Number(e.amount),0)),1);
                return(
                  <div style={{display:"flex",alignItems:"flex-end",gap:5,height:60,marginBottom:6}}>
                    {months.map((mo,i)=>{
                      const amt=expenses.data.filter(e=>{const d=new Date(e.date||e.created_at);return d.getMonth()===mo.m&&d.getFullYear()===mo.y;}).reduce((s,e)=>s+Number(e.amount),0);
                      const h=Math.round((amt/maxAmt)*52)||2;
                      const isCur=i===5;
                      return(
                        <div key={mo.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                          <div style={{fontSize:8,fontWeight:700,color:isCur?SAF:T.muted}}>{amt>0?"₹"+(amt>=1000?Math.round(amt/1000)+"k":amt):""}</div>
                          <div style={{width:"100%",height:h,borderRadius:"4px 4px 0 0",background:isCur?SAF:TEAL}}/>
                          <div style={{fontSize:8,color:isCur?SAF:T.muted,fontWeight:isCur?800:400}}>{mo.key}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            }
          </div>
          {/* Category pie */}
          <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #EDE0D0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:800,color:NAV,letterSpacing:0.5,marginBottom:10}}>🥧 CATEGORY SPLIT</div>
            {catMap.length===0
              ?<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"16px 0"}}>Log expenses to see your split</div>
              :<div style={{display:"flex",alignItems:"center",gap:12}}>
                <svg width="64" height="64" viewBox="0 0 64 64" style={{flexShrink:0}}>
                  {(()=>{
                    const colors2=["#F4A724","#E0F7F2","#EEF0FF","#FFF0EC","#C5EFE8","#E8A838"];
                    let angle=0;
                    return catMap.slice(0,5).map(({e,spent:cs},i)=>{
                      const pct2=cs/spent;
                      const sweep=pct2*360;
                      const r=28,cx=32,cy=32;
                      const x1=cx+r*Math.cos((angle-90)*Math.PI/180);
                      const y1=cy+r*Math.sin((angle-90)*Math.PI/180);
                      angle+=sweep;
                      const x2=cx+r*Math.cos((angle-90)*Math.PI/180);
                      const y2=cy+r*Math.sin((angle-90)*Math.PI/180);
                      const large=sweep>180?1:0;
                      return <path key={e} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={colors2[i%colors2.length]}/>;
                    });
                  })()}
                  <circle cx="32" cy="32" r="14" fill="#FDF6EC"/>
                </svg>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  {catMap.slice(0,4).map(({e,l,spent:cs},i)=>{
                    const pcts=["#F4A724","#0A6B58","#3730A3","#9B3A22"];
                    return(
                      <div key={e} style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:8,height:8,borderRadius:2,background:["#F4A724",TEAL,"#EEF0FF","#FFF0EC"][i],border:"0.5px solid #ccc",flexShrink:0}}/>
                        <div style={{flex:1,fontSize:9,color:NAV}}>{l}</div>
                        <div style={{fontSize:9,fontWeight:800,color:NAV}}>{Math.round((cs/spent)*100)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            }
          </div>
          {/* Patterns */}
          <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #EDE0D0",padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:800,color:NAV,letterSpacing:0.5,marginBottom:10}}>🔍 PATTERNS</div>
            {expenses.data.length<5
              ?<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"16px 0"}}>Keep logging to unlock patterns</div>
              :[
                {icon:"✅",text:"All committed bills paid this month",tag:"On track",tagBg:TEAL,tagC:TEALTEXT},
                {icon:"💡",text:`Top spend: ${topCat?topCat.l:"—"} at ₹${topCat?topCat.spent.toLocaleString():"0"} this month`,tag:"Insight",tagBg:"#EEF0FF",tagC:"#3730A3"},
                {icon:"⚠️",text:"Set a monthly budget in Profile to unlock smart cautions",tag:"Tip",tagBg:"#FFF0EC",tagC:"#9B3A22"},
              ].map((p,i)=>(
                <div key={i} style={{display:"flex",gap:10,background:"#F8F4F0",borderRadius:10,padding:"9px 10px",marginBottom:7}}>
                  <div style={{fontSize:18,flexShrink:0}}>{p.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,color:NAV,lineHeight:1.5}}>{p.text}</div>
                    <div style={{fontSize:8,fontWeight:800,padding:"2px 6px",borderRadius:4,background:p.tagBg,color:p.tagC,display:"inline-block",marginTop:4}}>{p.tag}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── MORE POPUP (Goals + Score) ── */}
      {showMore&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div onClick={()=>setShowMore(false)} style={{flex:1,background:"rgba(0,0,0,0.4)"}}/>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"16px 18px 32px",maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{width:32,height:4,borderRadius:99,background:"#E0D8D0",margin:"0 auto 14px"}}/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:NAV,marginBottom:14}}>Goals & Score</div>
            {/* Goals */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:0.5,marginBottom:8}}>🎯 FAMILY GOALS</div>
              {goals.loading&&<Spinner/>}
              {goals.data.map(g=>(<div key={g.id} style={{background:"#F8F4F0",borderRadius:12,padding:"10px 12px",marginBottom:7}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:20}}>{g.emoji}</span>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:NAV}}>{g.title}</div><div style={{fontSize:10,color:T.muted}}>Target: ₹{Number(g.target).toLocaleString()}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:g.color,fontSize:12}}>₹{Number(g.saved).toLocaleString()}</div><div style={{fontSize:9,color:T.muted}}>{Math.round(g.saved/g.target*100)}%</div></div>
                </div>
                <Bar value={Number(g.saved)} max={Number(g.target)} color={g.color}/>
              </div>))}
              {!goals.loading&&goals.data.length===0&&<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"12px 0"}}>No goals yet</div>}
              {showG
                ?<div style={{background:"#F8F4F0",borderRadius:12,padding:"12px"}}>
                  <div style={{marginBottom:8}}><label style={lbl}>Goal Name</label><input style={inp} value={gf.title} onChange={e=>setGf(f=>({...f,title:e.target.value}))} placeholder="e.g. Arya's College Fund"/></div>
                  <div style={{marginBottom:8}}><label style={lbl}>Target (₹)</label><input style={inp} type="number" value={gf.target} onChange={e=>setGf(f=>({...f,target:e.target.value}))}/></div>
                  <div style={{marginBottom:8}}><label style={lbl}>Already Saved (₹)</label><input style={inp} type="number" value={gf.saved} onChange={e=>setGf(f=>({...f,saved:e.target.value}))}/></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setShowG(false)} style={{flex:1,padding:10,borderRadius:10,border:"1.5px solid #E8DDD0",background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700,fontSize:12}}>Cancel</button>
                    <button onClick={async()=>{if(gf.title&&gf.target){await goals.add({title:gf.title,emoji:gf.emoji,target:Number(gf.target),saved:Number(gf.saved||0),color:gf.color});await onPts(20);setGf({title:"",emoji:"🎯",target:"",saved:"",color:T.blue});setShowG(false);}}} style={{flex:2,padding:10,borderRadius:10,border:"none",background:SAF,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12}}>Save +20pts</button>
                  </div>
                </div>
                :<button onClick={()=>setShowG(true)} style={{width:"100%",padding:10,borderRadius:10,border:`2px dashed ${SAF}`,background:"transparent",color:"#8B5E3C",fontWeight:700,fontSize:12,cursor:"pointer",marginTop:4}}>+ Add Goal</button>
              }
            </div>
            {/* Score */}
            <div>
              <div style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:0.5,marginBottom:8}}>📊 FREEDOM SCORE</div>
              <FreedomScoreScreen family={family}/>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function BudgetScreen({ family, expenses, setFamily }) {
  const cats=["🛒 Groceries","⚡ Utilities","📚 Education","🏥 Health","🚗 Transport","🍔 Food/Dining","👗 Clothing","🎮 Entertainment","✈️ Travel","🏠 Home","💊 Medicine","🎓 Fees","☕ Miscellaneous"];
  const month=new Date().getMonth();
  const monthExp=(expenses||[]).filter(e=>new Date(e.date||e.created_at).getMonth()===month);
  const totalSpent=monthExp.reduce((s,e)=>s+Number(e.amount),0);
  const budget=family?.monthly_expenses||0;
  const catTotals=cats.map(c=>{const emoji=c.split(" ")[0];const spent=monthExp.filter(e=>e.cat===emoji).reduce((s,e)=>s+Number(e.amount),0);return{label:c,emoji,spent};}).filter(c=>c.spent>0);
  const [editing,setEditing]=useState(false);
  const [bf,setBf]=useState({monthly_income:"",monthly_expenses:""});
  const [saving,setSaving]=useState(false);
  const startEdit=()=>{setBf({monthly_income:String(family?.monthly_income||""),monthly_expenses:String(family?.monthly_expenses||"")});setEditing(true);};
  const saveEdit=async()=>{
    if(!family?.id)return;
    setSaving(true);
    await sb.from("families").update({monthly_income:Number(bf.monthly_income)||0,monthly_expenses:Number(bf.monthly_expenses)||0}).eq("id",family.id);
    setFamily(f=>({...f,monthly_income:Number(bf.monthly_income)||0,monthly_expenses:Number(bf.monthly_expenses)||0}));
    setSaving(false);setEditing(false);
  };
  return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${T.teal},#3A7070)`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:0.75,marginBottom:4}}>Monthly Budget Used</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700}}>₹{totalSpent.toLocaleString()} / ₹{budget.toLocaleString()}</div>
        <div style={{marginTop:10}}><Bar value={totalSpent} max={budget||1} color={totalSpent>budget?T.rose:"#fff"} h={10}/></div>
        <div style={{fontSize:12,opacity:0.75,marginTop:8}}>{budget>0?`${Math.round((totalSpent/budget)*100)}% used`:"Set your budget below"}</div>
        <button onClick={startEdit} style={{marginTop:12,padding:"6px 14px",borderRadius:99,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>✏️ Edit Budget</button>
      </Card>
      {editing&&(
        <Card style={{marginTop:8}}>
          <div style={{fontWeight:700,color:T.dark,marginBottom:14}}>Update Budget</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={lbl}>Monthly Income (₹)</label><input style={inp} type="number" value={bf.monthly_income} onChange={e=>setBf(p=>({...p,monthly_income:e.target.value}))}/></div>
            <div><label style={lbl}>Monthly Budget (₹)</label><input style={inp} type="number" value={bf.monthly_expenses} onChange={e=>setBf(p=>({...p,monthly_expenses:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setEditing(false)} style={{flex:1,padding:11,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{flex:2,padding:11,borderRadius:12,border:"none",background:T.teal,color:"#fff",fontWeight:700,cursor:"pointer"}}>{saving?"Saving…":"Save Changes"}</button>
          </div>
        </Card>
      )}
      <Sec>Spending by Category</Sec>
      {catTotals.length===0&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:36,marginBottom:8}}>📊</div><div style={{fontWeight:700,color:T.dark,marginBottom:4}}>No spending data yet</div><div style={{fontSize:12,color:T.muted}}>Log expenses and your breakdown will appear here</div></Card>}
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
  const [nb,setNb]=useState({label:"",amount:"",due_date:"",icon:"📄",recurring:false,frequency:"monthly",custom_freq:"",custom_unit:"weeks"});
  const billIcons=["⚡","📡","💧","🔥","📱","🏠","📺","💊","🚗","🌐"];
  const overdueBills=bills.data.filter(b=>!b.paid&&b.due_date&&new Date(b.due_date)<new Date());
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Errands</div>
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
      {showBill?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Bill / Reminder</div><div style={{marginBottom:10}}><label style={lbl}>Icon</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{billIcons.map(e=><button key={e} onClick={()=>setNb(b=>({...b,icon:e}))} style={{width:34,height:34,borderRadius:8,border:`2px solid ${nb.icon===e?T.brown:T.border}`,background:nb.icon===e?T.warm:"#fff",fontSize:17,cursor:"pointer"}}>{e}</button>)}</div></div><div style={{marginBottom:10}}><label style={lbl}>Bill Name</label><input style={inp} value={nb.label} onChange={e=>setNb(b=>({...b,label:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Amount (₹)</label><input style={inp} type="number" value={nb.amount} onChange={e=>setNb(b=>({...b,amount:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Due Date</label><input style={inp} type="date" value={nb.due_date} onChange={e=>setNb(b=>({...b,due_date:e.target.value}))}/></div><div style={{marginBottom:10}}><label style={lbl}>Frequency</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[{v:"monthly",l:"Monthly"},{v:"quarterly",l:"Quarterly"},{v:"annual",l:"Annual"},{v:"custom",l:"Custom"}].map(f=><button key={f.v} onClick={()=>setNb(b=>({...b,frequency:f.v,custom_freq:""}))} style={{padding:"6px 12px",borderRadius:99,border:`2px solid ${(nb.frequency||"monthly")===f.v?T.brown:T.border}`,background:(nb.frequency||"monthly")===f.v?T.warm:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",color:T.dark}}>{f.l}</button>)}</div>{nb.frequency==="custom"&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}><span style={{fontSize:13,color:T.muted,whiteSpace:"nowrap"}}>Every</span><input style={{...inp,width:60,padding:"8px 10px",textAlign:"center"}} type="number" min="1" placeholder="2" value={nb.custom_freq||""} onChange={e=>setNb(b=>({...b,custom_freq:e.target.value}))}/><select style={{...inp,flex:1,padding:"8px 10px"}} value={nb.custom_unit||"weeks"} onChange={e=>setNb(b=>({...b,custom_unit:e.target.value}))}><option value="days">days</option><option value="weeks">weeks</option><option value="months">months</option></select></div>}</div><div style={{marginBottom:14,display:"flex",alignItems:"center",gap:10}}><input type="checkbox" id="rec" checked={nb.recurring} onChange={e=>setNb(b=>({...b,recurring:e.target.checked}))} style={{width:18,height:18}}/><label htmlFor="rec" style={{fontSize:13,color:T.dark,cursor:"pointer"}}>🔄 Recurring bill</label></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowBill(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(nb.label&&nb.amount){const freqVal=nb.frequency==="custom"?`custom:${nb.custom_freq||1}:${nb.custom_unit||"weeks"}`:(nb.frequency||"monthly");await bills.add({label:nb.label,amount:Number(nb.amount),due_date:nb.due_date||null,icon:nb.icon,paid:false,recurring:nb.recurring,frequency:freqVal});setNb({label:"",amount:"",due_date:"",icon:"📄",recurring:false,frequency:"monthly",custom_freq:"",custom_unit:"weeks"});setShowBill(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowBill(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Bill / Reminder</button>}
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
      <button onClick={()=>setView("list")} style={{background:"none",border:"none",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:16,padding:0}}>Back</button>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:12}}>Add Service Provider</div>
      <div style={{marginBottom:12}}><label style={lbl}>Type</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{PROVIDER_TYPES.map(pt=>(<button key={pt.id} onClick={()=>setNp(p=>({...p,type:pt.id}))} style={{padding:"8px 12px",borderRadius:10,border:`2px solid ${np.type===pt.id?T.brown:T.border}`,background:np.type===pt.id?T.warm:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{pt.emoji} {pt.label}</button>))}</div></div>
      <div style={{marginBottom:12}}><label style={lbl}>Provider Name</label><input style={inp} placeholder="e.g. Ramesh bhaiya" value={np.name} onChange={e=>setNp(p=>({...p,name:e.target.value}))}/></div>
      <div style={{marginBottom:12}}><label style={lbl}>Rate per {PROVIDER_TYPES.find(p=>p.id===np.type)?.unit||"visit"} (₹)</label><input style={inp} type="number" placeholder="250" value={np.rate} onChange={e=>setNp(p=>({...p,rate:e.target.value}))}/></div>
      <div style={{marginBottom:20}}><label style={lbl}>Notes (optional)</label><input style={inp} placeholder="e.g. Comes Mon-Sat" value={np.notes} onChange={e=>setNp(p=>({...p,notes:e.target.value}))}/></div>
      <button onClick={handleAddProvider} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:T.brown,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>Save Provider</button>
    </div>
  );
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:12}}>Chores</div>
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
      {tab==="medicine"&&<>{medicines.loading&&<Spinner/>}{medicines.data.map(m=>(<Card key={m.id} style={{borderLeft:`4px solid ${T.rose}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>💊 {m.name}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{m.member} · {m.dose} · {m.frequency}</div><div style={{fontSize:12,color:T.rose,marginTop:2}}>⏰ {m.time}</div>{m.notes&&<div style={{fontSize:11,color:T.muted,marginTop:4,fontStyle:"italic"}}>{m.notes}</div>}</div><button onClick={()=>medicines.remove(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted}}>×</button></div></Card>))}{!medicines.loading&&medicines.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>💊</div><div style={{fontWeight:700,color:T.dark,marginBottom:4}}>No medicines tracked</div><div style={{fontSize:12,color:T.muted}}>Keep your family's health on track</div></Card>}{showMed?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Medicine</div><div style={{marginBottom:10}}><label style={lbl}>Medicine Name</label><input style={inp} value={mf.name} onChange={e=>setMf(f=>({...f,name:e.target.value}))} placeholder="e.g. Vitamin D3"/></div><div style={{marginBottom:10}}><label style={lbl}>For Member</label><select style={inp} value={mf.member} onChange={e=>setMf(f=>({...f,member:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>Dose</label><input style={inp} placeholder="1 tablet" value={mf.dose} onChange={e=>setMf(f=>({...f,dose:e.target.value}))}/></div><div><label style={lbl}>Time</label><input style={inp} type="time" value={mf.time} onChange={e=>setMf(f=>({...f,time:e.target.value}))}/></div></div><div style={{marginBottom:10}}><label style={lbl}>Frequency</label><select style={inp} value={mf.frequency} onChange={e=>setMf(f=>({...f,frequency:e.target.value}))}>{freqs.map(f=><option key={f}>{f}</option>)}</select></div><div style={{marginBottom:14}}><label style={lbl}>Notes</label><input style={inp} placeholder="After meals, etc." value={mf.notes} onChange={e=>setMf(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowMed(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(mf.name&&mf.member){await medicines.add(mf);await onPts(5);setMf({name:"",member:"",dose:"",frequency:"Daily",time:"08:00",notes:""});setShowMed(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.rose,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowMed(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.rose}`,background:"transparent",color:T.rose,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Medicine</button>}</>}
      {tab==="vaccines"&&<>{vaccinations.loading&&<Spinner/>}{vaccinations.data.map(v=>(<Card key={v.id} style={{borderLeft:`4px solid ${T.blue}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:700,fontSize:15,color:T.dark}}>💉 {v.name}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{v.member}</div>{v.given_date&&<div style={{fontSize:12,color:T.green,marginTop:2}}>✓ Given: {new Date(v.given_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>}{v.due_date&&!v.given_date&&<div style={{fontSize:12,color:new Date(v.due_date)<new Date()?T.rose:T.amber,marginTop:2}}>Due: {new Date(v.due_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>}{v.notes&&<div style={{fontSize:11,color:T.muted,marginTop:4}}>{v.notes}</div>}</div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>{!v.given_date&&<button onClick={()=>vaccinations.update(v.id,{given_date:new Date().toISOString().split("T")[0]})} style={{fontSize:11,color:T.green,fontWeight:700,background:T.green+"15",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>Mark Done</button>}<button onClick={()=>vaccinations.remove(v.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:14}}>×</button></div></div></Card>))}{!vaccinations.loading&&vaccinations.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>💉</div><div style={{fontWeight:700,color:T.dark,marginBottom:4}}>No vaccination records</div><div style={{fontSize:12,color:T.muted}}>Add records to stay on top of family health</div></Card>}{showVax?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Vaccination</div><div style={{marginBottom:10}}><label style={lbl}>Vaccine Name</label><input style={inp} value={vf.name} onChange={e=>setVf(f=>({...f,name:e.target.value}))} placeholder="e.g. COVID-19 Booster"/></div><div style={{marginBottom:10}}><label style={lbl}>For Member</label><select style={inp} value={vf.member} onChange={e=>setVf(f=>({...f,member:e.target.value}))}><option value="">Select</option>{members?.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><label style={lbl}>Due Date</label><input style={inp} type="date" value={vf.due_date} onChange={e=>setVf(f=>({...f,due_date:e.target.value}))}/></div><div><label style={lbl}>Given Date</label><input style={inp} type="date" value={vf.given_date} onChange={e=>setVf(f=>({...f,given_date:e.target.value}))}/></div></div><div style={{marginBottom:14}}><label style={lbl}>Notes</label><input style={inp} placeholder="Hospital, batch no. etc." value={vf.notes} onChange={e=>setVf(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:8}}><button onClick={()=>setShowVax(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(vf.name&&vf.member){await vaccinations.add(vf);setVf({name:"",member:"",due_date:"",given_date:"",notes:""});setShowVax(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.blue,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save</button></div></Card>):<button onClick={()=>setShowVax(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.blue}`,background:"transparent",color:T.blue,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Vaccination</button>}</>}
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>Journal</div>
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>Journey</div>
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
      {allUpcoming.length===0&&!events.loading&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:36,marginBottom:8}}>📅</div><div style={{fontWeight:700,color:T.dark,marginBottom:4}}>All clear ahead!</div><div style={{fontSize:12,color:T.muted}}>No upcoming events — add one to the calendar</div></Card>}
      {allUpcoming.map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderLeft:`4px solid ${T.amber}`,cursor:"pointer"}} onClick={()=>onTabChange("plan")}><span style={{fontSize:22}}>{e.emoji}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.dark}}>{e.title}</div><div style={{fontSize:12,color:T.muted}}>{new Date(e.date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}{e.member?" · "+e.member:""}{e.repeat&&e.repeat!=="none"?" · 🔄":""}</div></div><button onClick={()=>events.remove(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.muted,fontSize:16}}>×</button></div>))}
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:4}}>Kids</div>
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

function RewardsScreen({ family }) {
  const NAV="#0F1F3D", SAF="#F4A724", CRM="#FDF6EC";
  const pts=family?.points||0;
  const tiers=[
    {label:"Bronze",  min:0,    max:199,  icon:"🥉"},
    {label:"Silver",  min:200,  max:499,  icon:"🥈"},
    {label:"Gold",    min:500,  max:999,  icon:"🥇"},
    {label:"Diamond", min:1000, max:2499, icon:"💎"},
    {label:"Legend",  min:2500, max:9999, icon:"👑"},
  ];
  const tier=tiers.findLast(t=>pts>=t.min)||tiers[0];
  const nextTier=tiers[tiers.indexOf(tier)+1];
  const progress=nextTier?Math.round(((pts-tier.min)/(nextTier.min-tier.min))*100):100;
  const rules=[
    {icon:"✅",action:"Complete a chore",pts:5},
    {icon:"💸",action:"Log an expense",pts:5},
    {icon:"💊",action:"Add a medicine",pts:5},
    {icon:"📅",action:"Add a family event",pts:10},
    {icon:"💳",action:"Mark a bill paid",pts:15},
    {icon:"✔️",action:"Complete homework",pts:15},
    {icon:"💎",action:"Add a wealth goal",pts:20},
    {icon:"👨‍👩‍👧",action:"Invite a member",pts:50},
  ];
  const badges=[
    {icon:"🏠",label:"First Login",earned:true},
    {icon:"💸",label:"First Expense",earned:pts>0},
    {icon:"🎯",label:"500 Points",earned:pts>=500},
    {icon:"💎",label:"Diamond Club",earned:pts>=1000},
    {icon:"🔥",label:"30-day streak",earned:false},
    {icon:"✅",label:"All bills paid",earned:false},
  ];
  return(
    <div style={{minHeight:"100%",background:CRM,paddingBottom:32}}>
      {/* Navy hero */}
      <div style={{background:NAV,padding:"24px 20px 28px"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:700,letterSpacing:1,marginBottom:4}}>FAMILY POINTS</div>
        <div style={{fontSize:52,fontWeight:800,color:SAF,lineHeight:1}}>{pts}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:4,marginBottom:16}}>{tier.icon} {tier.label} tier{nextTier?` · ${nextTier.min-pts} pts to ${nextTier.label}`:` · Max tier!`}</div>
        {/* Progress bar */}
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:6}}>
          <div style={{width:`${progress}%`,background:SAF,height:"100%",borderRadius:99,transition:"width 0.8s ease"}}/>
        </div>
        {/* Tier row */}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
          {tiers.map(t=>(
            <div key={t.label} style={{textAlign:"center",opacity:pts>=t.min?1:0.35}}>
              <div style={{fontSize:18}}>{t.icon}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",marginTop:2}}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"20px 16px 0"}}>
        {/* Badges */}
        <div style={{fontSize:11,fontWeight:800,color:"#8B5E3C",letterSpacing:0.8,marginBottom:10}}>BADGES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
          {badges.map(b=>(
            <div key={b.label} style={{background:b.earned?"#FFF8E8":"#F5F0EA",borderRadius:14,padding:"14px 8px",textAlign:"center",border:`1.5px solid ${b.earned?SAF:"#E8DDD0"}`,opacity:b.earned?1:0.5}}>
              <div style={{fontSize:26,marginBottom:4}}>{b.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:b.earned?"#8B5E3C":"#A08070",lineHeight:1.3}}>{b.label}</div>
            </div>
          ))}
        </div>
        {/* How to earn */}
        <div style={{fontSize:11,fontWeight:800,color:"#8B5E3C",letterSpacing:0.8,marginBottom:10}}>HOW TO EARN</div>
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #E8DDD0",overflow:"hidden",marginBottom:16}}>
          {rules.map((r,i)=>(
            <div key={r.action} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<rules.length-1?"1px solid #F0EAE0":"none"}}>
              <span style={{fontSize:18,width:24,textAlign:"center",flexShrink:0}}>{r.icon}</span>
              <span style={{flex:1,fontSize:13,color:NAV}}>{r.action}</span>
              <span style={{fontSize:13,fontWeight:800,color:SAF}}>+{r.pts} pts</span>
            </div>
          ))}
        </div>
        <div style={{background:"#FFF8E8",borderRadius:14,padding:"14px 16px",fontSize:13,color:"#8B5E3C",lineHeight:1.7,border:`1px solid ${SAF}40`}}>
          🎁 <strong>Coming soon:</strong> Redeem points for badges, rewards & family milestones!
        </div>
      </div>
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
        <button onClick={send} style={{padding:"12px 18px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.lav},${T.blue})`,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:18}}>Send</button>
      </div>
      <style>{`@keyframes dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

function ProfileScreen({ family, members, setMembers, email, onSignOut, theme, setTheme }) {
  const [linkedIds,setLinkedIds]=useState(null); // null = loading, Set = loaded
  useEffect(()=>{
    if(!family?.id)return;
    sb.from("user_profiles").select("member_id").eq("family_id",family.id).then(({data})=>{
      setLinkedIds(new Set((data||[]).map(p=>p.member_id).filter(Boolean)));
    });
  },[family?.id]);
  const score=computeScore(family);
  const [copied,setCopied]=useState(false);
  const [activeTab,setActiveTab]=useState("profile");
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [showAddMember,setShowAddMember]=useState(false);
  const [savingMember,setSavingMember]=useState(false);
  const [newMember,setNewMember]=useState({name:"",emoji:"👤",relationship:"",dob:"",occupation:""});
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:12}}>Profile & Settings</div>
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
        {(members||[]).map(m=>{
          const hasJoined=linkedIds===null||linkedIds.has(m.id);
          return(
          <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",border:hasJoined?"none":`1.5px dashed ${T.amber}`}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:T.warm,border:`2px solid ${hasJoined?T.amber:T.muted}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,overflow:"hidden"}}>
              {m.avatar_url?<img src={m.avatar_url} alt={m.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:m.emoji}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:T.dark}}>{m.name}</div>
              <div style={{fontSize:11,color:T.muted}}>{m.relationship||""}{m.dob?" · Born "+new Date(m.dob).getFullYear():""}{m.occupation?" · "+m.occupation:""}</div>
              {!hasJoined&&<div style={{fontSize:10,color:T.amber,fontWeight:700,marginTop:3}}>⏳ Waiting to join — share invite code</div>}
            </div>
          </div>
          );
        })}
        {showAddMember?(
          <Card style={{marginBottom:8}}>
            <div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Family Member</div>
            <div style={{marginBottom:10}}><label style={lbl}>Name</label><input style={inp} value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))} placeholder="e.g. Ashi Modi"/></div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Icon</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {MEMBER_EMOJIS.map(({e,label})=>(
                  <button key={e} title={label} onClick={()=>setNewMember(p=>({...p,emoji:e}))}
                    style={{width:58,height:62,borderRadius:10,border:`2px solid ${newMember.emoji===e?T.brown:T.border}`,
                      background:newMember.emoji===e?T.warm:"#fff",cursor:"pointer",
                      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,padding:2}}>
                    <span style={{fontSize:28,lineHeight:1}}>{e}</span>
                    <span style={{fontSize:9,color:newMember.emoji===e?T.brown:T.muted,lineHeight:1.2,textAlign:"center"}}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>Relationship</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                {["Spouse","Son","Daughter","Father","Mother","Brother","Sister","Grandfather","Grandmother","Uncle","Aunt","Cousin","In-law","Other"].map(r=>(
                  <button key={r} onClick={()=>setNewMember(p=>({...p,relationship:r}))}
                    style={{padding:"5px 11px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",
                      border:`1.5px solid ${newMember.relationship===r?T.brown:T.border}`,
                      background:newMember.relationship===r?T.warm:"#fff",
                      color:newMember.relationship===r?T.dark:T.muted}}>
                    {r}
                  </button>
                ))}
              </div>
              <input style={inp} value={newMember.relationship} onChange={e=>setNewMember(p=>({...p,relationship:e.target.value}))} placeholder="Or type: Sister-in-law, Nani, Maasi…"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div><label style={lbl}>Date of Birth</label><input style={inp} type="date" value={newMember.dob} onChange={e=>setNewMember(p=>({...p,dob:e.target.value}))}/></div>
              <div><label style={lbl}>Occupation</label><input style={inp} value={newMember.occupation} onChange={e=>setNewMember(p=>({...p,occupation:e.target.value}))} placeholder="Optional"/></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowAddMember(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button>
              <button onClick={async()=>{
                if(!newMember.name.trim()){alert("Please enter a name.");return;}
                setSavingMember(true);
                const {data:inserted,error:memErr}=await sb.from("members").insert({family_id:family.id,name:newMember.name.trim(),emoji:newMember.emoji,relationship:newMember.relationship,dob:newMember.dob||null,occupation:newMember.occupation||null}).select();
                setSavingMember(false);
                if(memErr){alert("Could not save member: "+memErr.message);return;}
                const newM=Array.isArray(inserted)?inserted[0]:inserted;
                if(newM&&setMembers)setMembers(p=>[...p,newM]);
                setNewMember({name:"",emoji:"👤",relationship:"",dob:"",occupation:""});
                setShowAddMember(false);
              }} disabled={savingMember} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>{savingMember?"Saving...":"Add Member ✓"}</button>
            </div>
          </Card>
        ):(
          <button onClick={()=>setShowAddMember(true)} style={{width:"100%",padding:12,borderRadius:12,border:`2px dashed ${T.amber}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:8}}>+ Add Family Member</button>
        )}
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

// ── SETTINGS SCREEN ─────────────────────────────────────────────────────────
function SettingsScreen({ onSignOut, bgmOn, bgmPref, bgmTrack, bgmFile, bgmPauseOnHide, toggleBgm, handleBgmPref, handleBgmTrack, onBgmFile, onBgmPauseOnHide }) {
  const [activeTab,setActiveTab]=useState("privacy");
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Settings</div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:T.dark}}>🎵 Ambient Sound</div>
            <div style={{fontSize:12,color:T.muted,marginTop:2}}>{bgmOn?"Playing":"Silent"}</div>
          </div>
          <div onClick={toggleBgm} style={{width:48,height:28,borderRadius:99,background:bgmOn?T.brown:T.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:bgmOn?22:3,width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
          </div>
        </div>
        <div style={{fontSize:12,color:T.muted,marginBottom:8,fontWeight:700}}>Choose a track</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {BGM_TRACKS.map(t=>(
            <div key={t.id} onClick={()=>handleBgmTrack(t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:`2px solid ${bgmTrack===t.id&&!bgmFile?T.brown:T.border}`,background:bgmTrack===t.id&&!bgmFile?T.warm:"transparent",cursor:"pointer"}}>
              <span style={{fontSize:18}}>{t.label.split(" ")[0]}</span>
              <span style={{fontSize:13,fontWeight:bgmTrack===t.id&&!bgmFile?700:400,color:bgmTrack===t.id&&!bgmFile?T.dark:T.muted,flex:1}}>{t.label.slice(t.label.indexOf(" ")+1)}</span>
              {bgmTrack===t.id&&!bgmFile&&<div style={{width:14,height:14,borderRadius:"50%",background:T.brown}}/>}
            </div>
          ))}
        </div>
        <div style={{padding:"10px 12px",borderRadius:12,border:`1.5px dashed ${T.amber}`,background:T.warm}}>
          <div style={{fontSize:12,fontWeight:700,color:T.brown,marginBottom:4}}>🎧 Use your own music</div>
          <div style={{fontSize:11,color:T.muted,marginBottom:8}}>Pick any audio file from your phone — bhajans, instrumental, anything you love.</div>
          <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:T.brown,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            📁 Choose Audio File
            <input type="file" accept="audio/*" style={{display:"none"}} onChange={onBgmFile}/>
          </label>
          {bgmFile&&<div style={{fontSize:11,color:T.green,marginTop:8,fontWeight:700}}>✓ Custom track loaded</div>}
        </div>
        <div style={{marginTop:12,fontSize:12,color:T.muted,marginBottom:8}}>When should it play?</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{v:"always",label:"🔁 Always on",sub:"Starts automatically every time I open the app"},{v:"manual",label:"🖐️ I'll turn it on myself",sub:"Starts silent, I decide when to play"}].map(opt=>(
            <div key={opt.v} onClick={()=>handleBgmPref(opt.v)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,border:`2px solid ${bgmPref===opt.v?T.brown:T.border}`,background:bgmPref===opt.v?T.warm:"transparent",cursor:"pointer"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:T.dark}}>{opt.label}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{opt.sub}</div>
              </div>
              <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${bgmPref===opt.v?T.brown:T.border}`,background:bgmPref===opt.v?T.brown:"transparent",flexShrink:0}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,padding:"10px 12px",borderRadius:12,background:T.warm}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.dark}}>⏸️ Pause when minimised</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>Stops when you switch apps, resumes on return</div>
          </div>
          <div onClick={()=>onBgmPauseOnHide(!bgmPauseOnHide)} style={{width:40,height:24,borderRadius:99,background:bgmPauseOnHide?T.brown:T.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:bgmPauseOnHide?18:2,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
          </div>
        </div>
      </Card>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        <Pill label="🔒 Privacy" active={activeTab==="privacy"} onClick={()=>setActiveTab("privacy")}/>
        <Pill label="📄 Disclaimer" active={activeTab==="disclaimer"} onClick={()=>setActiveTab("disclaimer")}/>
        <Pill label="🗑️ Data" active={activeTab==="data"} onClick={()=>setActiveTab("data")}/>
      </div>
      {activeTab==="privacy"&&<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12,fontSize:15}}>Privacy Policy</div><div style={{fontSize:13,color:T.muted,lineHeight:1.9}}>
        <p><strong style={{color:T.dark}}>What we collect:</strong> Your family data including names, expenses, events, health records and journal entries. All data is stored securely on Supabase servers.</p>
        <p><strong style={{color:T.dark}}>What we never do:</strong> We never sell your data. We never share your data with advertisers. We never access your journal entries.</p>
        <p><strong style={{color:T.dark}}>Your data, your control:</strong> You can delete your account and all associated data at any time by contacting us at privacy@famillion.in</p>
        <p><strong style={{color:T.dark}}>Cookies:</strong> We use local storage only to keep you signed in. No third-party tracking cookies.</p>
        <p style={{fontSize:11,color:T.muted,marginTop:8}}>Last updated: June 2026 · Version 0.2</p>
      </div></Card>}
      {activeTab==="disclaimer"&&<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12,fontSize:15}}>Disclaimer</div><div style={{fontSize:13,color:T.muted,lineHeight:1.9}}>
        <p><strong style={{color:T.dark}}>Financial information:</strong> The Financial Freedom Score and related calculations are indicative only. They are not financial advice. Please consult a qualified financial advisor before making investment decisions.</p>
        <p><strong style={{color:T.dark}}>Health information:</strong> Medicine schedules and health records stored in this app are for personal reference only. Always consult a qualified medical professional for medical advice.</p>
        <p><strong style={{color:T.dark}}>Accuracy:</strong> Famillion is a personal family management tool. All data entered is user-provided. We are not responsible for decisions made based on this data.</p>
        <p style={{fontSize:11,color:T.muted,marginTop:8}}>Last updated: June 2026 · Version 0.2</p>
      </div></Card>}
      {activeTab==="data"&&<><Card><div style={{fontWeight:700,color:T.dark,marginBottom:12,fontSize:15}}>Your Data</div>
        <div style={{fontSize:13,color:T.muted,lineHeight:1.8,marginBottom:16}}>All your family data is stored securely. You are in full control.</div>
        <div style={{background:T.warm,borderRadius:12,padding:"12px 14px",marginBottom:10}}><div style={{fontSize:13,color:T.dark,fontWeight:600}}>📦 Export Data</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Download all your family data as JSON — coming soon</div></div>
        <div style={{background:"#FFF0F0",borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:13,color:T.rose,fontWeight:600}}>🗑️ Delete Account</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>Permanently delete all data · Email privacy@famillion.in</div></div>
      </Card>
      <button onClick={onSignOut} style={{width:"100%",padding:14,borderRadius:14,border:`2px solid ${T.rose}`,background:"transparent",color:T.rose,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>Sign Out</button>
      </>}
    </div>
  );
}

// ── MEMBER PROFILE SCREEN ────────────────────────────────────────────────────
function MemberProfileScreen({ member, familyId, expenses, events, onBack, setMembers, currentUserName }) {
  const memberExpenses=(expenses||[]).filter(e=>e.who===member.name);
  const memberEvents=(events||[]).filter(e=>e.member===member.name);
  const totalSpent=memberExpenses.reduce((s,e)=>s+Number(e.amount),0);
  const [uploading,setUploading]=useState(false);
  const [avatarUrl,setAvatarUrl]=useState(member.avatar_url||null);
  const [cropSrc,setCropSrc]=useState(null);
  const [cropOffset,setCropOffset]=useState({x:0,y:0});
  const [cropDragging,setCropDragging]=useState(false);
  const [dragStart,setDragStart]=useState({x:0,y:0});
  const cropImgRef=useRef(null);
  const cropCanvasRef=useRef(null);
  const CROP_SIZE=240;
  const [showNudge,setShowNudge]=useState(false);
  const [nudgeSent,setNudgeSent]=useState(false);
  const [nf,setNf]=useState({task_type:"bill",note:"",tone:"🙏 Gentle reminder"});
  const isSelf=currentUserName===member.name;
  const nudgeExpenses=useTable("expenses",familyId);
  const nudgeChores=useTable("providers",familyId);
  const nudgeBills=useTable("bills",familyId);
  const nudgeEvents=useTable("events",familyId);

  const getItems=()=>{
    if(nf.task_type==="expense") return nudgeExpenses.data.slice(0,6).map(e=>({id:e.id,label:`${e.cat} ${e.label} ₹${e.amount}`}));
    if(nf.task_type==="chore") return nudgeChores.data.slice(0,6).map(e=>({id:e.id,label:`${e.emoji||"🧹"} ${e.name}`}));
    if(nf.task_type==="bill") return nudgeBills.data.filter(b=>!b.paid).slice(0,6).map(e=>({id:e.id,label:`${e.icon} ${e.label} ₹${e.amount}`}));
    if(nf.task_type==="event") return nudgeEvents.data.slice(0,6).map(e=>({id:e.id,label:`${e.emoji||"📅"} ${e.title}`}));
    return [];
  };
  const tones=["🙏 Gentle reminder","⚡ Urgent","💕 With love","😄 Just checking in"];
  const taskTypes=[{id:"bill",label:"Pay a bill",icon:"💳"},{id:"expense",label:"Log an expense",icon:"💸"},{id:"chore",label:"Complete a chore",icon:"🧹"},{id:"event",label:"Family event",icon:"📅"},{id:"homework",label:"Finish homework",icon:"📚"},{id:"custom",label:"Custom message",icon:"💬"}];
  const sendNudge=async()=>{
    if(!nf.note.trim())return;
    await sb.from("nudges").insert({family_id:familyId,from_member:currentUserName,to_member:member.name,task_type:nf.task_type,note:nf.note,tone:nf.tone,seen:false});
    setNudgeSent(true);
    setTimeout(()=>{setNudgeSent(false);setShowNudge(false);setNf({task_type:"bill",note:"",tone:"🙏 Gentle reminder"});},2000);
  };
  const handleFileSelect=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const url=URL.createObjectURL(file);
    setCropSrc(url);setCropOffset({x:0,y:0});
  };
  const handleCropDragStart=(clientX,clientY)=>{setCropDragging(true);setDragStart({x:clientX-cropOffset.x,y:clientY-cropOffset.y});};
  const handleCropDragMove=(clientX,clientY)=>{
    if(!cropDragging)return;
    const img=cropImgRef.current;if(!img)return;
    const maxX=img.offsetWidth-CROP_SIZE;const maxY=img.offsetHeight-CROP_SIZE;
    setCropOffset({x:Math.max(0,Math.min(maxX,clientX-dragStart.x)),y:Math.max(0,Math.min(maxY,clientY-dragStart.y))});
  };
  const handleCropEnd=()=>setCropDragging(false);
  const handleCropAndUpload=async()=>{
    setUploading(true);
    try{
      const img=cropImgRef.current;
      const displayed=img.getBoundingClientRect();
      const scaleX=img.naturalWidth/displayed.width;const scaleY=img.naturalHeight/displayed.height;
      const canvas=document.createElement("canvas");canvas.width=400;canvas.height=400;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,cropOffset.x*scaleX,cropOffset.y*scaleY,CROP_SIZE*scaleX,CROP_SIZE*scaleY,0,0,400,400);
      let blob;let quality=0.85;
      while(quality>=0.3){blob=await new Promise(res=>canvas.toBlob(res,"image/jpeg",quality));if(blob.size<=150*1024)break;quality-=0.1;}
      const token=sb._token||localStorage.getItem("fn_token");
      if(!token){alert("Not logged in — please sign out and sign back in.");setUploading(false);return;}
      const fileName=`${familyId}/${member.id}_${Date.now()}.jpg`;
      const uploadRes=await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${fileName}`,{method:"PUT",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"image/jpeg","x-upsert":"true"},body:blob});
      if(!uploadRes.ok){const errText=await uploadRes.text();throw new Error(errText);}
      const publicUrl=`${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
      await sb.from("members").update({avatar_url:publicUrl}).eq("id",member.id);
      setAvatarUrl(publicUrl);
      if(setMembers)setMembers(prev=>prev.map(m=>m.id===member.id?{...m,avatar_url:publicUrl}:m));
      setCropSrc(null);
    }catch(err){alert("Upload error: "+err.message);}
    setUploading(false);
  };
  if(cropSrc)return(
    <div style={{padding:"16px",fontFamily:"Lato,sans-serif"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:T.dark,marginBottom:12}}>Crop Photo</div>
      <div style={{position:"relative",overflow:"hidden",borderRadius:16,background:"#000",marginBottom:16,userSelect:"none",touchAction:"none"}}
        onMouseMove={e=>handleCropDragMove(e.clientX,e.clientY)}
        onMouseUp={handleCropEnd} onMouseLeave={handleCropEnd}
        onTouchMove={e=>{e.preventDefault();handleCropDragMove(e.touches[0].clientX,e.touches[0].clientY);}}
        onTouchEnd={handleCropEnd}>
        <img ref={cropImgRef} src={cropSrc} alt="crop" style={{width:"100%",display:"block",opacity:0.5,pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:cropOffset.y,left:cropOffset.x,width:CROP_SIZE,height:CROP_SIZE,border:"3px solid #fff",borderRadius:"50%",boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)",cursor:"move",boxSizing:"border-box"}}
          onMouseDown={e=>handleCropDragStart(e.clientX,e.clientY)}
          onTouchStart={e=>handleCropDragStart(e.touches[0].clientX,e.touches[0].clientY)}/>
      </div>
      <div style={{fontSize:12,color:T.muted,textAlign:"center",marginBottom:16}}>Drag the circle to position your photo</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setCropSrc(null)} style={{flex:1,padding:13,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,fontWeight:700,cursor:"pointer"}}>Cancel</button>
        <button onClick={handleCropAndUpload} disabled={uploading} style={{flex:2,padding:13,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>{uploading?"Uploading…":"Crop & Upload"}</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:"0 16px 16px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:16,padding:0}}>Back</button>
      <div style={{textAlign:"center",marginBottom:20}}>
        <label style={{cursor:"pointer",display:"inline-block",position:"relative"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${T.amber},${T.brown})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 12px",boxShadow:`0 4px 20px ${T.amber}44`,overflow:"hidden"}}>
            {avatarUrl?<img src={avatarUrl} alt={member.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:member.emoji}
          </div>
          <div style={{position:"absolute",bottom:12,right:0,width:24,height:24,borderRadius:"50%",background:T.brown,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,boxShadow:"0 2px 6px rgba(0,0,0,0.2)"}}>{uploading?"⏳":"📷"}</div>
          <input type="file" accept="image/*" onChange={handleFileSelect} style={{display:"none"}} disabled={uploading}/>
        </label>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:T.dark}}>{member.name}</div>
        {member.relationship&&<div style={{fontSize:13,color:T.muted,marginTop:2}}>{member.relationship}{member.dob?" · Born "+new Date(member.dob).getFullYear():""}</div>}
        {member.occupation&&<div style={{fontSize:12,color:T.brown,marginTop:4,background:T.warm,borderRadius:99,padding:"4px 12px",display:"inline-block"}}>{member.occupation}</div>}
        <div style={{fontSize:11,color:T.muted,marginTop:8}}>Tap photo to change picture</div>
      </div>

      {/* NUDGE BUTTON — hide if viewing own profile */}
      {!isSelf&&<button onClick={()=>setShowNudge(s=>!s)} style={{width:"100%",padding:"12px 16px",borderRadius:14,border:`2px solid ${T.amber}`,background:showNudge?T.amber+"20":"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:12}}>
        👋 Nudge {member.name.split(" ")[0]}
      </button>}

      {/* NUDGE FORM */}
      {!isSelf&&showNudge&&(
        <Card style={{marginBottom:16,border:`1.5px solid ${T.amber}40`}}>
          {nudgeSent?(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontWeight:700,color:T.green}}>Nudge sent to {member.name.split(" ")[0]}!</div>
            </div>
          ):(
            <>
              <div style={{fontWeight:700,color:T.dark,marginBottom:14}}>👋 Send a Nudge</div>
              <div style={{marginBottom:12}}>
                <label style={lbl}>What's it about?</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {taskTypes.map(t=>(
                    <button key={t.id} onClick={()=>setNf(f=>({...f,task_type:t.id,note:""}))} style={{padding:"6px 10px",borderRadius:99,border:`1.5px solid ${nf.task_type===t.id?T.brown:T.border}`,background:nf.task_type===t.id?T.warm:"#fff",fontSize:12,fontWeight:600,color:T.dark,cursor:"pointer"}}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ITEM PICKER — for bill, expense, chore, event */}
              {nf.task_type!=="custom"&&nf.task_type!=="homework"&&getItems().length>0&&(
                <div style={{marginBottom:12}}>
                  <label style={lbl}>Pick one (or write your own below)</label>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {getItems().map(item=>(
                      <button key={item.id} onClick={()=>setNf(f=>({...f,note:item.label}))} style={{textAlign:"left",padding:"8px 12px",borderRadius:10,border:`1.5px solid ${nf.note===item.label?T.brown:T.border}`,background:nf.note===item.label?T.warm:"#fff",fontSize:12,color:T.dark,cursor:"pointer",fontWeight:nf.note===item.label?700:400}}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{marginBottom:12}}>
                <label style={lbl}>Tone</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {tones.map(t=>(
                    <button key={t} onClick={()=>setNf(f=>({...f,tone:t}))} style={{padding:"5px 10px",borderRadius:99,border:`1.5px solid ${nf.tone===t?T.brown:T.border}`,background:nf.tone===t?T.warm:"#fff",fontSize:11,fontWeight:600,color:T.dark,cursor:"pointer"}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>Your message</label>
                <input style={inp} placeholder="e.g. Hey, please check the electricity bill!" value={nf.note} onChange={e=>setNf(f=>({...f,note:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setShowNudge(false)} style={{flex:1,padding:11,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button>
                <button onClick={sendNudge} disabled={!nf.note.trim()} style={{flex:2,padding:11,borderRadius:12,border:"none",background:nf.note.trim()?T.brown:"#ccc",color:"#fff",fontWeight:700,cursor:"pointer"}}>Send Nudge 👋</button>
              </div>
            </>
          )}
        </Card>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <Card style={{marginBottom:0,textAlign:"center"}}><div style={{fontSize:22,marginBottom:4}}>💸</div><div style={{fontWeight:800,fontSize:18,color:T.rose}}>₹{totalSpent.toLocaleString()}</div><div style={{fontSize:11,color:T.muted}}>Total spent</div></Card>
        <Card style={{marginBottom:0,textAlign:"center"}}><div style={{fontSize:22,marginBottom:4}}>📅</div><div style={{fontWeight:800,fontSize:18,color:T.blue}}>{memberEvents.length}</div><div style={{fontSize:11,color:T.muted}}>Events</div></Card>
      </div>
      {memberExpenses.length>0&&<><Sec>💸 Expenses</Sec>{memberExpenses.slice(0,5).map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:10,background:T.card,borderRadius:12,padding:"10px 14px",marginBottom:6,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}><span style={{fontSize:20}}>{e.cat}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.dark}}>{e.label}</div><div style={{fontSize:11,color:T.muted}}>{new Date(e.date||e.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div></div><div style={{fontWeight:700,color:T.dark,fontSize:13}}>₹{Number(e.amount).toLocaleString()}</div></div>))}</>}
      {memberEvents.length>0&&<><Sec style={{marginTop:8}}>📅 Events</Sec>{memberEvents.map(e=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:10,background:T.card,borderRadius:12,padding:"10px 14px",marginBottom:6,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}><span style={{fontSize:20}}>{e.emoji||"📅"}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.dark}}>{e.title}</div><div style={{fontSize:11,color:T.muted}}>{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div></div></div>))}</>}
      {memberExpenses.length===0&&memberEvents.length===0&&<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:10}}>🌟</div><div style={{fontWeight:700,color:T.dark,marginBottom:4}}>No activity yet</div><div style={{fontSize:12,color:T.muted}}>Expenses and events for {member.name.split(" ")[0]} will show here</div></Card>}
    </div>
  );
}

// ── WEALTH / MONEY SCREEN ────────────────────────────────────────────────────
function WealthScreen({ family, members, familyId, onPts }) {
  const goals=useTable("goals",familyId);
  const [tab,setTab]=useState("overview");
  const [showGoal,setShowGoal]=useState(false);
  const [expanded,setExpanded]=useState(null);
  const [gf,setGf]=useState({title:"",emoji:"🎯",target:"",saved:"",color:T.blue,category:"savings"});
  const colors=[T.blue,T.rose,T.green,T.lav,T.amber,T.brown];
  const goalCategories=[{v:"savings",l:"💰 Savings"},{v:"investment",l:"📈 Investment"},{v:"purchase",l:"🛒 Purchase"},{v:"education",l:"🎓 Education"},{v:"travel",l:"✈️ Travel"},{v:"emergency",l:"🛡️ Emergency"}];
  const netWorth=(family?.savings||0)-(family?.debts||0);
  const savingsRate=family?.monthly_income>0?Math.round(((family.monthly_income-family.monthly_expenses)/family.monthly_income)*100):0;
  const totalGoalTarget=goals.data.reduce((s,g)=>s+Number(g.target),0);
  const totalGoalSaved=goals.data.reduce((s,g)=>s+Number(g.saved),0);

  const overviewCards=[
    {id:"income",icon:"💰",label:"Monthly Income",value:`₹${(family?.monthly_income||0).toLocaleString()}`,color:T.green,detail:`Monthly expenses: ₹${(family?.monthly_expenses||0).toLocaleString()}\nSavings rate: ${savingsRate}%\nNet monthly surplus: ₹${((family?.monthly_income||0)-(family?.monthly_expenses||0)).toLocaleString()}`},
    {id:"savings",icon:"📈",label:"Savings Rate",value:`${savingsRate}%`,color:savingsRate>=20?T.green:T.rose,detail:`A healthy savings rate is 20%+.\nYours is currently ${savingsRate}%.\n${savingsRate<20?"Try reducing discretionary expenses.":savingsRate<30?"Good! Consider SIP investments.":"Excellent discipline! Review asset allocation."}`},
    {id:"insurance",icon:"🛡️",label:"Insurance Cover",value:`₹${(family?.insurance||0).toLocaleString()}`,color:T.blue,detail:`Life cover: ₹${(family?.insurance||0).toLocaleString()}\nRule of thumb: Cover should be 10x annual income.\nRecommended: ₹${((family?.monthly_income||0)*120).toLocaleString()}`},
    {id:"goals",icon:"🎯",label:"Active Goals",value:`${goals.data.length}`,color:T.amber,detail:`Total target: ₹${totalGoalTarget.toLocaleString()}\nTotal saved: ₹${totalGoalSaved.toLocaleString()}\nProgress: ${totalGoalTarget>0?Math.round(totalGoalSaved/totalGoalTarget*100):0}% across all goals`},
  ];

  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.dark,marginBottom:14}}>Wealth Management</div>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        <Pill label="📊 Overview"  active={tab==="overview"}  onClick={()=>setTab("overview")}/>
        <Pill label="🎯 Goals"     active={tab==="goals"}     onClick={()=>setTab("goals")}/>
        <Pill label="📈 Score"     active={tab==="score"}     onClick={()=>setTab("score")}/>
        <Pill label="🏦 Net Worth" active={tab==="networth"}  onClick={()=>setTab("networth")}/>
      </div>

      {tab==="overview"&&<>
        <Card style={{background:`linear-gradient(135deg,${T.teal},#2D6B6B)`,color:"#fff",marginBottom:14}}>
          <div style={{fontSize:12,opacity:0.75,marginBottom:4}}>Net Worth</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,marginBottom:4}}>₹{netWorth.toLocaleString()}</div>
          <div style={{fontSize:12,opacity:0.7}}>Savings ₹{(family?.savings||0).toLocaleString()} · Debts ₹{(family?.debts||0).toLocaleString()}</div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {overviewCards.map(c=>(
            <div key={c.id} onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{cursor:"pointer"}}>
              <Card style={{marginBottom:0,border:expanded===c.id?`2px solid ${c.color}`:`2px solid transparent`,transition:"border 0.15s"}}>
                <div style={{fontSize:20,marginBottom:4}}>{c.icon}</div>
                <div style={{fontWeight:800,fontSize:16,color:c.color}}>{c.value}</div>
                <div style={{fontSize:11,color:T.muted}}>{c.label}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:4}}>{expanded===c.id?"▲ tap to close":"▼ tap for details"}</div>
              </Card>
              {expanded===c.id&&(
                <div style={{background:c.color+"12",border:`1px solid ${c.color}30`,borderRadius:"0 0 12px 12px",padding:"10px 14px",marginTop:-4}}>
                  {c.detail.split("\n").map((line,i)=>(
                    <div key={i} style={{fontSize:12,color:T.dark,lineHeight:1.8}}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {totalGoalTarget>0&&<Card><div style={{fontWeight:700,color:T.dark,marginBottom:8}}>Goals Progress</div><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontSize:12,color:T.muted}}>Total saved towards goals</div><div style={{fontSize:12,fontWeight:700,color:T.brown}}>₹{totalGoalSaved.toLocaleString()} / ₹{totalGoalTarget.toLocaleString()}</div></div><Bar value={totalGoalSaved} max={totalGoalTarget} color={T.green}/></Card>}
        <Card style={{background:T.warm,border:`1px solid ${T.border}`}}><div style={{fontSize:13,color:T.brown,lineHeight:1.8}}>💡 <strong>Tip:</strong> {savingsRate<20?"Try to increase your savings rate to at least 20% of income.":savingsRate<30?"Great savings rate! Consider investing the surplus in SIP/mutual funds.":"Excellent! You're saving well. Review your investment allocation."}</div></Card>
      </>}

      {tab==="goals"&&<>
        {goals.loading&&<Spinner/>}
        {goals.data.map(g=>(<Card key={g.id}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:26}}>{g.emoji}</span><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:T.dark}}>{g.title}</div><div style={{fontSize:12,color:T.muted}}>Target: ₹{Number(g.target).toLocaleString()}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:g.color,fontSize:15}}>₹{Number(g.saved).toLocaleString()}</div><div style={{fontSize:11,color:T.muted}}>{Math.round(g.saved/g.target*100)}%</div></div></div><Bar value={Number(g.saved)} max={Number(g.target)} color={g.color}/><button onClick={()=>goals.remove(g.id)} style={{marginTop:8,fontSize:11,color:T.muted,background:"none",border:"none",cursor:"pointer"}}>Remove</button></Card>))}
        {!goals.loading&&goals.data.length===0&&<Card style={{textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>🎯</div><div style={{fontWeight:700,color:T.dark,marginBottom:4}}>No goals yet</div><div style={{fontSize:12,color:T.muted}}>Add a wealth goal to start your journey</div></Card>}
        {showGoal?(<Card><div style={{fontWeight:700,color:T.dark,marginBottom:12}}>Add Goal</div>
          <div style={{marginBottom:10}}><label style={lbl}>Category</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{goalCategories.map(c=><button key={c.v} onClick={()=>setGf(f=>({...f,category:c.v}))} style={{padding:"6px 10px",borderRadius:8,border:`2px solid ${gf.category===c.v?T.brown:T.border}`,background:gf.category===c.v?T.warm:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>{c.l}</button>)}</div></div>
          <div style={{marginBottom:10}}><label style={lbl}>Goal Name</label><input style={inp} value={gf.title} onChange={e=>setGf(f=>({...f,title:e.target.value}))} placeholder="e.g. Pranava's College Fund"/></div>
          <div style={{marginBottom:10}}><label style={lbl}>Icon</label><div style={{display:"flex",gap:6}}>{["🎓","✈️","💍","🛡️","🏠","🚗","🎯","💰","🏖️","📈"].map(e=><button key={e} onClick={()=>setGf(f=>({...f,emoji:e}))} style={{width:36,height:36,borderRadius:8,border:`2px solid ${gf.emoji===e?T.brown:T.border}`,background:gf.emoji===e?T.warm:"#fff",fontSize:18,cursor:"pointer"}}>{e}</button>)}</div></div>
          <div style={{marginBottom:10}}><label style={lbl}>Target (₹)</label><input style={inp} type="number" value={gf.target} onChange={e=>setGf(f=>({...f,target:e.target.value}))}/></div>
          <div style={{marginBottom:14}}><label style={lbl}>Already Saved (₹)</label><input style={inp} type="number" value={gf.saved} onChange={e=>setGf(f=>({...f,saved:e.target.value}))}/></div>
          <div style={{marginBottom:14}}><label style={lbl}>Color</label><div style={{display:"flex",gap:8}}>{colors.map(c=><button key={c} onClick={()=>setGf(f=>({...f,color:c}))} style={{width:28,height:28,borderRadius:"50%",background:c,border:`3px solid ${gf.color===c?T.dark:"transparent"}`,cursor:"pointer"}}/>)}</div></div>
          <div style={{display:"flex",gap:8}}><button onClick={()=>setShowGoal(false)} style={{flex:1,padding:12,borderRadius:12,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontWeight:700}}>Cancel</button><button onClick={async()=>{if(gf.title&&gf.target){await goals.add({title:gf.title,emoji:gf.emoji,target:Number(gf.target),saved:Number(gf.saved||0),color:gf.color,category:gf.category});await onPts(20);setGf({title:"",emoji:"🎯",target:"",saved:"",color:T.blue,category:"savings"});setShowGoal(false);}}} style={{flex:2,padding:12,borderRadius:12,border:"none",background:T.brown,color:"#fff",fontWeight:700,cursor:"pointer"}}>Save +20pts</button></div>
        </Card>):<button onClick={()=>setShowGoal(true)} style={{width:"100%",padding:14,borderRadius:14,border:`2px dashed ${T.brown}`,background:"transparent",color:T.brown,fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Goal</button>}
      </>}

      {tab==="score"&&<FreedomScoreScreen family={family}/>}

      {tab==="networth"&&<>
        <Card style={{background:`linear-gradient(135deg,${T.teal},#2D6B6B)`,color:"#fff"}}>
          <div style={{fontSize:12,opacity:0.75,marginBottom:4}}>Estimated Net Worth</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,marginBottom:8}}>₹{netWorth.toLocaleString()}</div>
          <div style={{fontSize:12,opacity:0.7}}>{netWorth>=0?"You're in the positive 👍":"Focus on reducing debt first"}</div>
        </Card>
        <Sec>Breakdown</Sec>
        {[{label:"Savings & Investments",value:family?.savings||0,color:T.green,icon:"💰"},{label:"Life Insurance Cover",value:family?.insurance||0,color:T.blue,icon:"🛡️"},{label:"Debts & Loans",value:-(family?.debts||0),color:T.rose,icon:"📉"}].map(item=>(<Card key={item.label} style={{padding:"14px 16px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:24}}>{item.icon}</span><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:T.dark}}>{item.label}</div></div><div style={{fontWeight:800,fontSize:15,color:item.value>=0?item.color:T.rose}}>{item.value<0?"-":""}₹{Math.abs(item.value).toLocaleString()}</div></div></Card>))}
        <Card style={{background:T.warm}}><div style={{fontSize:13,color:T.brown,lineHeight:1.8}}>💡 Update your financial details in Profile → Edit to keep this accurate.</div></Card>
      </>}
    </div>
  );
}

export default function App() {
  const [user,setUser]=useState(null);
  const [authLoading,setAL]=useState(true);
  const [recoveryToken,setRecoveryToken]=useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [family,setFamily]=useState(null);
  const [members,setMembers]=useState([]);
  const [tab,setTab]=useState("home");
  const [showMore,setShowMore]=useState(false);
  const [selectedMember,setSelectedMember]=useState(null);
const [showHeader,setShowHeader]=useState(false);

  const [theme,setTheme]=useState(()=>localStorage.getItem("fn_theme")||"earthy");
  const [bgmOn,setBgmOn]=useState(()=>localStorage.getItem("fn_bgm_pref")==="always");
  const [bgmPref,setBgmPref]=useState(()=>localStorage.getItem("fn_bgm_pref")||"manual");
  const [bgmTrack,setBgmTrack]=useState(()=>localStorage.getItem("fn_bgm_track")||"forest");
  const [bgmFile,setBgmFile]=useState(null);
  const [bgmPauseOnHide,setBgmPauseOnHide]=useState(()=>localStorage.getItem("fn_bgm_pause_hide")!=="false");
  const [showMusicPanel,setShowMusicPanel]=useState(false);
  const bgmRef=useRef(null);
  const bgmWasPlayingRef=useRef(false);

  // Pause/resume when app is minimised
  useEffect(()=>{
    const onVis=()=>{
      if(!bgmRef.current)return;
      if(document.hidden){
        bgmWasPlayingRef.current=!bgmRef.current.paused;
        if(bgmPauseOnHide&&!bgmRef.current.paused){bgmRef.current.pause();}
      } else {
        if(bgmPauseOnHide&&bgmWasPlayingRef.current){bgmRef.current.play().catch(()=>{});}
      }
    };
    document.addEventListener("visibilitychange",onVis);
    return()=>document.removeEventListener("visibilitychange",onVis);
  },[bgmPauseOnHide]);
  const getBgm=()=>{
    if(!bgmRef.current){
      bgmRef.current=new Audio();
      bgmRef.current.loop=true;
      bgmRef.current.volume=0.18;
      const track=BGM_TRACKS.find(t=>t.id===bgmTrack)||BGM_TRACKS[0];
      bgmRef.current.src=bgmFile||track.url;
    }
    return bgmRef.current;
  };
  const loadBgmSrc=(src)=>{
    const a=getBgm();
    const wasPlaying=!a.paused;
    a.src=src;
    a.load();
    if(wasPlaying)a.play().catch(()=>{});
  };
  const handleBgmTrack=(trackId)=>{
    setBgmTrack(trackId);
    localStorage.setItem("fn_bgm_track",trackId);
    setBgmFile(null);
    const track=BGM_TRACKS.find(t=>t.id===trackId)||BGM_TRACKS[0];
    loadBgmSrc(track.url);
    if(!bgmOn){getBgm().play().catch(()=>{});setBgmOn(true);}
  };
  const handleBgmFile=(e)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    if(bgmFile)URL.revokeObjectURL(bgmFile);
    const url=URL.createObjectURL(f);
    setBgmFile(url);
    loadBgmSrc(url);
    if(!bgmOn){getBgm().play().catch(()=>{});setBgmOn(true);}
  };
  const toggleBgm=()=>{
    if(bgmOn){getBgm().pause();setBgmOn(false);}
    else{getBgm().play().catch(()=>{});setBgmOn(true);}
  };
  const handleBgmPref=(pref)=>{
    setBgmPref(pref);
    localStorage.setItem("fn_bgm_pref",pref);
    if(pref==="always"){getBgm().play().catch(()=>{});setBgmOn(true);}
    if(pref==="manual"){getBgm().pause();setBgmOn(false);}
  };
  useEffect(()=>{if(bgmPref==="always"){getBgm().play().catch(()=>{});setBgmOn(true);}},[]);
  const expenses=useTable("expenses",family?.id);
  const events=useTable("events",family?.id);
  const nudges=useTable("nudges",family?.id);
  const currentTheme=THEMES.find(t=>t.id===theme)||THEMES[0];

  useEffect(()=>{
    const hash=window.location.hash;
    if(hash.includes("type=recovery")&&hash.includes("access_token=")){
      const params=new URLSearchParams(hash.replace("#",""));
      const token=params.get("access_token");
      if(token){setRecoveryToken(token);setAL(false);return;}
    }
    const seen=localStorage.getItem("fn_onboarding_seen");
    if(!seen)setShowOnboarding(true);
    if(sb.auth.restore()){
      // First try to validate existing token
      sb._req("/auth/v1/user").then(async r=>{
        if(r.data?.id){
          // Token still valid — great
          setUser({id:r.data.id, email:r.data.email||localStorage.getItem("fn_email")||""});
          setAL(false);
        } else {
          // Token expired — try to refresh it
          const refreshToken=localStorage.getItem("fn_refresh");
          if(refreshToken){
            try {
              const rr=await sb._req("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:refreshToken})});
              if(rr.data?.access_token){
                sb._token=rr.data.access_token;
                sb._userId=rr.data.user?.id;
                localStorage.setItem("fn_token",rr.data.access_token);
                localStorage.setItem("fn_uid",rr.data.user?.id);
                if(rr.data.refresh_token)localStorage.setItem("fn_refresh",rr.data.refresh_token);
                setUser({id:rr.data.user?.id, email:rr.data.user?.email||localStorage.getItem("fn_email")||""});
              } else {
                sb.auth.signOut();
              }
            } catch(e){ sb.auth.signOut(); }
          } else {
            sb.auth.signOut();
          }
          setAL(false);
        }
      }).catch(()=>{ sb.auth.signOut(); setAL(false); });
    } else {
      setAL(false);
    }
  },[]);
  
  useEffect(()=>{localStorage.setItem("fn_theme",theme);},[theme]);

  useEffect(()=>{
    if(!user?.id)return;
    // Safety timeout — never stay on splash more than 8 seconds
    const timeout=setTimeout(()=>{
      setFamily(prev=>prev||{id:null,name:"My Family",city:"",points:0,monthly_income:0,monthly_expenses:0,savings:0,debts:0,insurance:0,age:30,_noProfile:true});
    },8000);
    (async()=>{
      try {
        const {data:profile}=await sb.from("user_profiles").select("*").eq("id",user.id).single();
        if(!profile?.family_id){clearTimeout(timeout);setFamily({id:null,name:"My Family",city:"",points:0,monthly_income:0,monthly_expenses:0,savings:0,debts:0,insurance:0,age:30,_noProfile:true});return;}
        const {data:fam}=await sb.from("families").select("*").eq("id",profile.family_id).single();
        const {data:mems}=await sb.from("members").select("*").eq("family_id",profile.family_id).order("created_at",{ascending:true});
        clearTimeout(timeout);
        setFamily(Array.isArray(fam)?fam[0]:fam);
        setMembers(Array.isArray(mems)?mems:[]);
      } catch(e){ clearTimeout(timeout); setFamily({id:null,name:"My Family",city:"",points:0,monthly_income:0,monthly_expenses:0,savings:0,debts:0,insurance:0,age:30,_noProfile:true}); }
    })();
    return()=>clearTimeout(timeout);
  },[user]);

  const handlePts=useCallback(async(pts)=>{
    if(!family?.id)return;
    const np=(family.points||0)+pts;
    await sb.from("families").update({points:np}).eq("id",family.id);
    setFamily(f=>({...f,points:np}));
  },[family]);

  const handleSignOut=()=>{sb.auth.signOut();setUser(null);setFamily(null);setMembers([]);setTab("home");setShowMore(false);setSelectedMember(null);};
  const handleTabChange=(id)=>{
  setTab(id);setShowMore(false);setSelectedMember(null);
  window.history.pushState({tab:id},"","");
};
  const handleMemberClick=(m)=>setSelectedMember(m);

useEffect(()=>{
  const onBack=(e)=>{
    const state=e.state;
    if(selectedMember){setSelectedMember(null);return;}
    if(showMore){setShowMore(false);return;}
    if(state?.tab){setTab(state.tab);return;}
  };
  window.addEventListener("popstate",onBack);
  return()=>window.removeEventListener("popstate",onBack);
},[tab,showMore,selectedMember]);

  if(recoveryToken)return <ResetPasswordScreen token={recoveryToken}/>;
  if(authLoading)return <SplashScreen/>;

  if(showOnboarding)return(<OnboardingSlides onDone={()=>{localStorage.setItem("fn_onboarding_seen","1");setShowOnboarding(false);}}/>);

  if(!user)return <AuthScreen onAuth={u=>{setUser(u);localStorage.setItem("fn_email",u.email||"");}}/>;

  if(!family)return <SplashScreen/>;

  if(selectedMember)return(
    <div style={{minHeight:"100vh",background:currentTheme.bg,fontFamily:"'Lato',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:420,margin:"0 auto"}}>
        <MemberProfileScreen member={selectedMember} familyId={family?.id} expenses={expenses.data} events={events.data} onBack={()=>setSelectedMember(null)} setMembers={setMembers} currentUserName={members.find(m=>m.name.toLowerCase().includes((user?.email||"").split("@")[0].toLowerCase()))?.name||members[0]?.name||"Someone"}/>
      </div>
    </div>
  );

  const screens={
    
    home:     <HomeScreen      family={family} members={members} expenses={expenses.data} events={events.data} nudges={nudges.data} onMemberClick={handleMemberClick} onTabChange={handleTabChange} onShowWalkthrough={()=>setShowOnboarding(true)}/>,
    
    wealth:   <WealthScreen    family={family} members={members} familyId={family?.id} onPts={handlePts}/>,
    health:   <HealthScreen    familyId={family?.id} members={members} onPts={handlePts}/>,
    budget:   <MoneyScreen     family={family} members={members} familyId={family?.id} onPts={handlePts} setFamily={setFamily}/>,
    plan:     <CalendarScreen  familyId={family?.id} members={members}/>,
    chores:   <ChoresScreen    familyId={family?.id} onPts={handlePts}/>,
    errands:  <ErrandsScreen   familyId={family?.id} onPts={handlePts}/>,
    journey:  <PhotoJourneyScreen familyId={family?.id}/>,
    journal:  <JournalScreen   familyId={family?.id} members={members} userId={user?.id}/>,
    kids:     <KidsZoneScreen  familyId={family?.id} members={members} onPts={handlePts}/>,
    concierge:<ConciergeScreen family={family} members={members}/>,
    rewards:  <RewardsScreen   family={family}/>,
    settings: <SettingsScreen  onSignOut={handleSignOut} bgmOn={bgmOn} bgmPref={bgmPref} bgmTrack={bgmTrack} bgmFile={bgmFile} bgmPauseOnHide={bgmPauseOnHide} toggleBgm={toggleBgm} handleBgmPref={handleBgmPref} handleBgmTrack={handleBgmTrack} onBgmFile={handleBgmFile} onBgmPauseOnHide={(v)=>{setBgmPauseOnHide(v);localStorage.setItem("fn_bgm_pause_hide",v.toString());}}/>,
    profile:  <ProfileScreen   family={family} members={members} setMembers={setMembers} email={user?.email} onSignOut={handleSignOut} theme={theme} setTheme={setTheme}/>,
  };

  const NAV=[{id:"home",icon:"🏠",label:"Home"},{id:"health",icon:"❤️",label:"Health"},{id:"budget",icon:"💸",label:"Budget"},{id:"plan",icon:"📅",label:"Plan"},{id:"more",icon:"☰",label:"More"}];
  const MORE_NAV=[{id:"wealth",icon:"💎",label:"Money"},{id:"chores",icon:"🧹",label:"Chores"},{id:"errands",icon:"🛒",label:"Errands"},{id:"journey",icon:"📸",label:"Journey"},{id:"journal",icon:"📓",label:"Journal"},{id:"kids",icon:"🎒",label:"Kids"},{id:"bgm",icon:bgmOn?"🎵":"🔇",label:bgmOn?"Sound On":"Sound"},{id:"rewards",icon:"🏆",label:"Rewards"},{id:"concierge",icon:"🤖",label:"AI"},{id:"settings",icon:"⚙️",label:"Settings"},{id:"profile",icon:"👤",label:"Profile"}];

  return(
    <div style={{minHeight:"100vh",background:currentTheme.bg,display:"flex",justifyContent:"center",fontFamily:"'Lato',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:420,minHeight:"100vh",display:"flex",flexDirection:"column"}}>

        {/* HEADER */}
        <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,background:"rgba(253,246,236,0.97)",backdropFilter:"blur(10px)"}}>
          <div onClick={()=>setShowHeader(s=>!s)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
            <span style={{fontSize:24}}>🏡</span>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:T.dark,lineHeight:1}}>Famillion</div>
              <div style={{width:"100%",height:2,background:`linear-gradient(90deg,${T.amber},transparent)`,borderRadius:99,marginTop:3}}/>
            </div>
            <span style={{fontSize:12,color:T.muted}}>▾</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {family?.city&&<span style={{fontSize:10,color:T.muted,fontWeight:700,background:T.warm,borderRadius:99,padding:"2px 8px"}}>📍{family.city}</span>}
            <span onClick={toggleBgm} style={{background:"transparent",borderRadius:"50%",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,cursor:"pointer",border:`1.5px solid ${bgmOn?T.amber:T.border}`}}>{bgmOn?"🎵":"🔕"}</span>
            <span onClick={()=>handleTabChange("rewards")} style={{background:T.amber+"30",borderRadius:99,padding:"3px 9px",fontSize:11,fontWeight:800,color:T.brown,cursor:"pointer"}}>🏆 {family?.points||0}</span>
          </div>

          {/* POINTS MODAL */}

        </div>

       {/* HEADER DRAWER — sliding quarter-pane from left */}
        <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,height:"100vh",zIndex:300,pointerEvents:showHeader?"all":"none"}}>
          {/* Backdrop */}
          <div onClick={()=>setShowHeader(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.35)",opacity:showHeader?1:0,transition:"opacity 0.25s ease",pointerEvents:showHeader?"all":"none"}}/>
          {/* Pane */}
          <div style={{position:"absolute",top:0,left:0,width:"50%",maxWidth:210,height:"100%",background:"#FDF6EC",boxShadow:"4px 0 32px rgba(92,61,46,0.18)",display:"flex",flexDirection:"column",transform:showHeader?"translateX(0)":"translateX(-100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",willChange:"transform"}}>
            {/* Pane header */}
            <div style={{padding:"16px 14px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:20}}>🏡</span>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:T.dark}}>Famillion</div>
              </div>
              <button onClick={()=>setShowHeader(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.muted,lineHeight:1,padding:0}}>×</button>
            </div>
            {/* Nav list */}
            <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
              {[{id:"home",icon:"🏠",label:"Home"},{id:"wealth",icon:"💎",label:"Money"},{id:"health",icon:"❤️",label:"Health"},{id:"budget",icon:"💸",label:"Budget"},{id:"plan",icon:"📅",label:"Plan"},{id:"chores",icon:"🧹",label:"Chores"},{id:"errands",icon:"🛒",label:"Errands"},{id:"journey",icon:"📸",label:"Journey"},{id:"journal",icon:"📓",label:"Journal"},{id:"kids",icon:"🎒",label:"Kids"},{id:"rewards",icon:"🏆",label:"Rewards"},{id:"concierge",icon:"🤖",label:"AI Concierge"}].map(n=>(
                <button key={n.id} onClick={()=>{handleTabChange(n.id);setShowHeader(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:tab===n.id?T.brown+"14":"transparent",border:"none",cursor:"pointer",textAlign:"left",borderLeft:tab===n.id?`3px solid ${T.brown}`:"3px solid transparent",transition:"background 0.15s",boxSizing:"border-box"}}>
                  <span style={{fontSize:17,width:22,textAlign:"center",flexShrink:0}}>{n.icon}</span>
                  <span style={{fontSize:12,fontWeight:tab===n.id?700:600,color:tab===n.id?T.brown:T.dark,letterSpacing:0.1,whiteSpace:"nowrap"}}>{n.label}</span>
                </button>
              ))}
            </div>
            {/* Bottom actions */}
            <div style={{borderTop:`1px solid ${T.border}`,padding:"6px 0 20px"}}>
              {[{id:"settings",icon:"⚙️",label:"Settings"},{id:"profile",icon:"👤",label:"Profile"}].map(n=>(
                <button key={n.id} onClick={()=>{handleTabChange(n.id);setShowHeader(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",borderLeft:"3px solid transparent",boxSizing:"border-box"}}>
                  <span style={{fontSize:17,width:22,textAlign:"center",flexShrink:0}}>{n.icon}</span>
                  <span style={{fontSize:12,fontWeight:600,color:T.dark,whiteSpace:"nowrap"}}>{n.label}</span>
                </button>
              ))}
              <button onClick={()=>{handleSignOut();setShowHeader(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",borderLeft:"3px solid transparent",boxSizing:"border-box"}}>
                <span style={{fontSize:17,width:22,textAlign:"center",flexShrink:0}}>🚪</span>
                <span style={{fontSize:12,fontWeight:600,color:T.rose,whiteSpace:"nowrap"}}>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",paddingTop:4,paddingBottom:86}}>{screens[tab]||screens["home"]}</div>

        {/* FLOATING AI BUTTON */}
        {tab!=="concierge"&&(
          <button onClick={()=>handleTabChange("concierge")} style={{position:"fixed",bottom:82,right:"calc(50% - 195px)",zIndex:150,width:46,height:46,borderRadius:"50%",background:`linear-gradient(135deg,${T.lav},${T.blue})`,border:"none",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}>🤖</button>
        )}

        {/* MORE DRAWER */}
        {showMore&&(
          <div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(253,246,236,0.98)",backdropFilter:"blur(16px)",borderTop:`1px solid ${T.border}`,padding:"12px 16px",boxShadow:"0 -8px 32px rgba(0,0,0,0.1)",zIndex:100}}>
            {showMusicPanel&&(
              <div style={{marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.dark}}>🎵 Music</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,color:T.muted}}>{bgmOn?"Playing":"Off"}</span>
                    <div onClick={toggleBgm} style={{width:40,height:24,borderRadius:99,background:bgmOn?T.brown:T.border,cursor:"pointer",position:"relative",flexShrink:0}}>
                      <div style={{position:"absolute",top:2,left:bgmOn?18:2,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
                    </div>
                    <button onClick={()=>setShowMusicPanel(false)} style={{background:"none",border:"none",color:T.muted,fontSize:16,cursor:"pointer",padding:0}}>×</button>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                  {BGM_TRACKS.map(t=>(
                    <div key={t.id} onClick={()=>handleBgmTrack(t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,border:`1.5px solid ${bgmTrack===t.id&&!bgmFile?T.brown:T.border}`,background:bgmTrack===t.id&&!bgmFile?T.warm:"#fff",cursor:"pointer"}}>
                      <span style={{fontSize:16}}>{t.label.split(" ")[0]}</span>
                      <span style={{fontSize:12,fontWeight:bgmTrack===t.id&&!bgmFile?700:400,color:bgmTrack===t.id&&!bgmFile?T.dark:T.muted,flex:1}}>{t.label.slice(t.label.indexOf(" ")+1)}</span>
                      {bgmTrack===t.id&&!bgmFile&&<span style={{fontSize:11,color:T.brown,fontWeight:700}}>✓</span>}
                    </div>
                  ))}
                </div>
                <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,border:`1.5px solid ${bgmFile?T.brown:T.border}`,background:bgmFile?T.warm:"#fff",cursor:"pointer"}}>
                  <span style={{fontSize:16}}>📁</span>
                  <span style={{fontSize:12,fontWeight:bgmFile?700:400,color:bgmFile?T.dark:T.muted,flex:1}}>{bgmFile?"Custom track loaded":"Choose from phone"}</span>
                  {bgmFile&&<span style={{fontSize:11,color:T.brown,fontWeight:700}}>✓</span>}
                  <input type="file" accept="audio/*" style={{display:"none"}} onChange={handleBgmFile}/>
                </label>
                <div onClick={()=>{const v=!bgmPauseOnHide;setBgmPauseOnHide(v);localStorage.setItem("fn_bgm_pause_hide",v.toString());}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8,padding:"8px 12px",borderRadius:10,background:T.warm,cursor:"pointer"}}>
                  <span style={{fontSize:12,color:T.dark,fontWeight:600}}>⏸️ Pause when minimised</span>
                  <div style={{width:36,height:20,borderRadius:99,background:bgmPauseOnHide?T.brown:T.border,position:"relative",flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:bgmPauseOnHide?16:2,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {MORE_NAV.map(n=>(<button key={n.id} onClick={()=>n.id==="bgm"?(setShowMusicPanel(s=>!s)):handleTabChange(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:n.id==="bgm"?showMusicPanel?T.amber+"40":bgmOn?T.amber+"25":"transparent":tab===n.id?T.brown+"18":"transparent",border:"none",cursor:"pointer",padding:"10px 4px",borderRadius:12}}><span style={{fontSize:22}}>{n.icon}</span><span style={{fontSize:9,fontWeight:800,color:n.id==="bgm"?bgmOn?T.brown:T.muted:tab===n.id?T.brown:T.muted,letterSpacing:0.3}}>{n.label}</span></button>))}
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(253,246,236,0.97)",backdropFilter:"blur(12px)",borderTop:`1px solid ${T.border}`,boxShadow:"0 -4px 20px rgba(92,61,46,0.08)",zIndex:200}}>
          <div style={{display:"flex",padding:"8px 4px 16px"}}>
            {NAV.map(n=>{
              const isMore=n.id==="more";
              const isActive=isMore?showMore:tab===n.id;
              return(<button key={n.id} onClick={()=>{if(isMore){setShowMore(s=>!s);}else{handleTabChange(n.id);}}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:isActive?T.brown+"18":"transparent",border:"none",cursor:"pointer",padding:"4px 2px",borderRadius:10,transition:"all 0.15s"}}><span style={{fontSize:18}}>{n.icon}</span><span style={{fontSize:9,fontWeight:800,color:isActive?T.brown:T.muted,letterSpacing:0.3}}>{n.label}</span></button>);
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
