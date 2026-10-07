import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, ChevronDown, Home, Zap, MapPin, Clapperboard, Trophy, Sparkles, Briefcase, BookOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "./LanguageSwitcher";
import { getCategories, CategoryType } from "@/services/categoryService";
import CitySelector from "./CitySelector";
import logo from "@/assets/mibnews-logo.png";

export const OPEN_MOBILE_MENU_EVENT = "mib-open-mobile-menu";
export const openMobileSideMenu = () => window.dispatchEvent(new CustomEvent(OPEN_MOBILE_MENU_EVENT));

const sectionIcon = (k: string) => k==="bharat"?MapPin:k==="entertainment"?Clapperboard:k==="sports"?Trophy:k==="lifestyle"?Sparkles:k==="business"?Briefcase:k==="dharma"?BookOpen:Zap;

export default function MobileSideMenu(){
const [open,setOpen]=useState(false);
const [cats,setCats]=useState<CategoryType[]>([]);
const [sec,setSec]=useState<string|null>("bharat");
const [q,setQ]=useState("");
const loc=useLocation();const nav=useNavigate();
const {language}=useLanguage();
const hi=language==="hindi";
useEffect(()=>{const h=()=>setOpen(true);window.addEventListener(OPEN_MOBILE_MENU_EVENT,h);return()=>window.removeEventListener(OPEN_MOBILE_MENU_EVENT,h);},[]);
useEffect(()=>{setOpen(false);},[loc.pathname]);
useEffect(()=>{if(!open)return;const p=document.body.style.overflow;document.body.style.overflow="hidden";const k=(e:KeyboardEvent)=>e.key==="Escape"&&setOpen(false);window.addEventListener("keydown",k);return()=>{document.body.style.overflow=p;window.removeEventListener("keydown",k);};},[open]);
useEffect(()=>{if(!open)return;let a=true;getCategories({active:true,language}).then(c=>a&&setCats(c||[])).catch(()=>a&&setCats([]));return()=>{a=false;};},[open,language]);
const isActive=useCallback((t:string)=>t==="/"?loc.pathname==="/":loc.pathname.startsWith(t),[loc.pathname]);
const cl=(c:CategoryType)=>`/category/${c.slug||c._id}`;
const qq=q.trim().toLowerCase();
const pick=(keys:string[],n:number)=>{const h=cats.filter(c=>keys.some(k=>c.name.toLowerCase().includes(k)||(c.slug||"").toLowerCase().includes(k)));const r=cats.filter(c=>!h.includes(c));return[...h,...r].slice(0,n).map(c=>({h:c.name,e:c.name,to:cl(c)}));};
const tops=[{h:"होम",e:"Home",to:"/"},{h:"लाइव टीवी",e:"Live TV",to:"/live-tv",live:true},{h:"वर्ल्ड",e:"World",to:"/world"},{h:"वेब स्टोरी",e:"Web Story",to:"/short-posts"}];
const secs=[
{key:"bharat",h:"भारत",e:"India",links:[{h:"नेशनल",e:"National",to:"/national"},{h:"ताज़ा खबर",e:"Latest",to:"/latest"},{h:"ब्रेकिंग न्यूज़",e:"Breaking",to:"/breaking"},...pick(["bharat","india","national","politic","delhi","uttar","bihar"],4)]},
{key:"entertainment",h:"मनोरंजन",e:"Entertainment",links:[{h:"मनोरंजन",e:"Entertainment",to:"/entertainment"},{h:"वीडियो",e:"Videos",to:"/videos"},{h:"रील्स",e:"Reels",to:"/reels"},{h:"शॉर्ट पोस्ट",e:"Short Posts",to:"/short-posts"},...pick(["entertain","manoranjan","movie","film","music"],3)]},
{key:"dharma",h:"धर्म",e:"Religion",links:pick(["dharm","relig","spirit","astro","bhakti","mandir"],6)},
{key:"sports",h:"खेल",e:"Sports",links:[{h:"खेल",e:"Sports",to:"/sports"},...pick(["sport","khel","cricket","football"],5)]},
{key:"lifestyle",h:"लाइफस्टाइल",e:"Lifestyle",links:pick(["life","health","food","fashion","travel","women","education","tech"],6)},
{key:"business",h:"बिज़नेस",e:"Business",links:pick(["business","money","market","econom","finance"],6)},
];
const goS=()=>{setOpen(false);nav(q.trim()?`/search?q=${encodeURIComponent(q.trim())}`:"/search");};
const hits=qq?cats.filter(c=>c.name.toLowerCase().includes(qq)):[];
return(<div className="md:hidden" aria-hidden={!open}>
<div onClick={()=>setOpen(false)} className={cn("fixed inset-0 z-[60] bg-black/55 transition-opacity duration-300",open?"opacity-100":"pointer-events-none opacity-0")}/>
<aside role="dialog" aria-modal="true" aria-label={hi?"मेन्यू":"Menu"} style={{height:"100dvh"}} className={cn("fixed right-0 top-0 z-[61] flex h-full w-[84vw] max-w-[320px] flex-col overflow-hidden rounded-l-2xl bg-[#243A51] text-white shadow-2xl transition-transform duration-300 ease-out",open?"translate-x-0":"translate-x-full")}>
<div className="shrink-0 bg-[#1D3046] px-4 pb-3 pt-3">
<div className="flex items-center justify-between">
<span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-white/80"><span className="uppercase">{hi?"संस्करण":"Edition"}</span><span className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-white">IN<ChevronDown className="h-3 w-3 text-white/70"/></span></span>
<button onClick={()=>setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95"><X className="h-5 w-5"/></button>
</div>
<Link to="/" onClick={()=>setOpen(false)} className="mt-2 inline-flex"><span className="rounded-lg bg-white px-2.5 py-1.5"><img src={logo} alt="Mibnews" className="h-7 w-auto"/></span></Link>
<form onSubmit={(e)=>{e.preventDefault();goS();}} className="relative mt-3">
<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"/>
<input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={hi?"खबर खोजें...":"Search news..."} className="w-full rounded-full border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm font-medium text-white placeholder:text-white/60 focus:border-yellow-300/60 focus:outline-none"/>
</form>
</div>
<nav className="flex-1 overflow-y-auto px-2 py-2">
{tops.map(l=>(<Link key={l.to} to={l.to} onClick={()=>setOpen(false)} className={cn("flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold",isActive(l.to)?"bg-white/15 text-yellow-300":"text-white hover:bg-white/10")}><span className="flex items-center gap-2.5">{l.to==="/"&&<Home className="h-4 w-4 text-white/80"/>}{hi?l.h:l.e}</span>{l.live&&<span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"/>LIVE</span>}</Link>))}
<div className="mx-3 my-2 h-px bg-white/15"/>
{secs.map(s=>{const Icon=sectionIcon(s.key);const ex=sec===s.key;if(s.links.length===0)return null;return(<div key={s.key}>
<button onClick={()=>setSec(ex?null:s.key)} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold",ex?"bg-white/15 text-yellow-300":"text-white hover:bg-white/10")}>
<span className="flex items-center gap-2.5"><Icon className="h-4 w-4 text-white/80"/>{hi?s.h:s.e}</span>
<ChevronDown className={cn("h-4 w-4 text-white/70 transition-transform",ex&&"rotate-180")}/></button>
<div className={cn("grid transition-all",ex?"grid-rows-[1fr] opacity-100":"grid-rows-[0fr] opacity-0")}><div className="min-h-0 overflow-hidden"><div className="ml-6 space-y-0.5 border-l border-white/20 py-1 pl-3 pr-2">
{s.links.map(l=>(<Link key={l.to+l.h} to={l.to} onClick={()=>setOpen(false)} className={cn("block rounded-md px-2 py-2 text-sm font-medium",isActive(l.to)?"bg-white/15 font-semibold text-yellow-300":"text-white/90 hover:bg-white/10 hover:text-white")}>{hi?l.h:l.e}</Link>))}
</div></div></div></div>);})}
{hits.length>0&&(<div className="mt-2 rounded-lg bg-white/10 p-2">{hits.slice(0,8).map(c=>(<Link key={c._id} to={cl(c)} onClick={()=>setOpen(false)} className="block rounded-md px-2 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white">{c.name}</Link>))}</div>)}
<div className="px-1 py-3"><CitySelector className="w-full !border-white/20 !bg-white/10 !text-white hover:!border-yellow-300/60" onOpenChange={(v)=>{if(v) setOpen(false);}}/></div>
</nav>
<div className="shrink-0 border-t border-white/15 bg-[#1D3046] px-4 py-3 text-[11px] text-white/70"><div className="flex items-center justify-between"><span>© {new Date().getFullYear()} Mibnews</span><Link to="/contact" onClick={()=>setOpen(false)} className="font-semibold text-white hover:text-yellow-300">{hi?"संपर्क करें":"Contact"}</Link></div></div>
</aside></div>);}
