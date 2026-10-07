import { Link, useLocation } from "react-router-dom";
import { Home, Clapperboard, Radio, Film, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "./LanguageSwitcher";
import { openMobileSideMenu } from "./MobileSideMenu";

export default function BottomTabBar(){
const loc=useLocation();
const {language}=useLanguage();
const hi=language==="hindi";
const act=(t:string)=>t==="/"?loc.pathname==="/":loc.pathname.startsWith(t);
const tabs=[
{to:"/",hi:"होम",en:"Home",Icon:Home},
{to:"/videos",hi:"वीडियो",en:"Video",Icon:Clapperboard},
{to:"/live-tv",hi:"लाइव टीवी",en:"Live TV",Icon:Radio,live:true},
{to:"/reels",hi:"न्यूज़ रील",en:"Reels",Icon:Film},
];
return(
<nav className="fixed bottom-0 left-0 right-0 z-40 bg-primary md:hidden">
<div className="grid grid-cols-5 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
{tabs.map(t=>{const a=act(t.to);return(
<Link key={t.to} to={t.to} className={cn("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",a?"text-primary":"text-gray-600")}>
{a&&<span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"/>}
<span className="relative">{t.live
?<span className="flex h-6 items-center gap-1 rounded bg-red-600 px-1.5 text-[9px] font-bold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"/>LIVE</span>
:<t.Icon className="h-6 w-6" strokeWidth={a?2.4:1.8}/>}</span>
{hi?t.hi:t.en}</Link>);})}
<button onClick={openMobileSideMenu} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-600">
<LayoutGrid className="h-6 w-6" strokeWidth={1.8}/>{hi?"मेन्यू":"Menu"}</button>
</div>
<div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] min-h-[6px] bg-primary" />
</nav>);}
