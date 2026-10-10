import React, { useEffect, useState } from 'react';
import { CloudSun, CloudRain, CloudLightning, Droplets, Wind, TrendingUp, TrendingDown, Trophy, Coins, Fuel, RefreshCw } from 'lucide-react';
import { getInfoData, getLiveCricket, weatherLabel, type InfoData, type LiveCricket } from '@/services/infoService';
const SLIDES = [
  { id: 'weather', label: 'Mausam', short: 'Mausam' },
  { id: 'market', label: 'Share Bazar', short: 'Bazar' },
  { id: 'cricket', label: 'Cricket Live', short: 'Cricket' },
  { id: 'gold', label: 'Sona-Chandi', short: 'Sona' },
];
const inr = (n: number | null | undefined, d = 0) => (n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }));
const WIcon = ({ code, cls }: { code: number | null; cls: string }) => {
  if (code !== null && code >= 51 && code <= 82) return <CloudRain className={cls} />;
  if (code !== null && code >= 95) return <CloudLightning className={cls} />;
  return <CloudSun className={cls} />;
};
// Tiny SVG sparkline (Google weather curve / NSE chart style)
const Spark = ({ data, stroke, fill, w = 120, h = 34 }: { data: number[]; stroke: string; fill: string; w?: number; h?: number }) => {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} className="flex items-center justify-center text-[10px] text-slate-300">—</div>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / span) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={area} fill={fill} opacity={0.45} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={Number(pts[pts.length - 1].split(',')[1])} r={2.4} fill={stroke} />
    </svg>
  );
};
const TopInfoSlider: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [info, setInfo] = useState<InfoData | null>(null);
  const [live, setLive] = useState<LiveCricket | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, c] = await Promise.all([getInfoData(), getLiveCricket()]);
        if (!alive) return;
        if (d) setInfo(d);
        if (c) setLive(c);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  const vis = (i: number) => (active === i ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0');
  const w = info?.weather || null;
  const m = info?.market || null;
  const mt = info?.metals || null;
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className={`relative flex h-[140px] w-full flex-col overflow-hidden rounded-md border border-red-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:h-[150px] ${className}`}>
      {/* Red tab header — 4 boxes, active tab highlighted per slide */}
      <div className="grid grid-cols-4 gap-px bg-red-700 p-px">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`flex items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors sm:text-[11px] ${
              i === active ? 'bg-white text-red-700' : 'bg-red-700 text-red-100 hover:bg-red-600 hover:text-white'
            }`}
          >
            {i === 2 && <span className={`h-1.5 w-1.5 rounded-full ${i === active ? 'animate-pulse bg-red-600' : 'bg-white'}`} />}
            <span className="truncate">{s.short}</span>
            {loading && i === active && <RefreshCw className="h-3 w-3 animate-spin" />}
          </button>
        ))}
      </div>
      <div className="relative flex-1 bg-gradient-to-b from-white to-red-50/40">
        <div className={`absolute inset-0 transition-all duration-500 ${vis(0)}`}>
          <div className="flex h-full items-center gap-2.5 px-3">
            <div className="min-w-0 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100"><WIcon code={w?.code ?? null} cls="h-6 w-6 text-amber-600" /></div>
                <p className="text-2xl font-extrabold leading-none text-slate-900">{w?.temp !== null && w?.temp !== undefined ? Math.round(w.temp) : '—'}<span className="align-top text-xs font-bold text-slate-500">°C</span></p>
              </div>
              <p className="mt-1 max-w-[150px] truncate text-[11px] font-semibold text-slate-600">{w?.city || 'Delhi'} · {weatherLabel(w?.code)}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500"><span>Rain {w?.precipProb ?? '—'}%</span><span className="flex items-center gap-0.5"><Droplets className="h-2.5 w-2.5 text-sky-500" />{w?.humidity ?? '—'}%</span><span className="flex items-center gap-0.5"><Wind className="h-2.5 w-2.5 text-slate-400" />{w?.windKmh ?? '—'}</span></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">Next hours</p>
              <Spark data={(w?.hourly || []).map((h) => h.v).filter((v): v is number => v !== null)} stroke="#eab308" fill="#fef9c3" w={130} h={40} />
              <div className="mt-0.5 flex justify-between text-[9px] font-medium text-slate-400">
                {(w?.hourly || []).filter((_, i) => i % 4 === 0).slice(0, 3).map((h) => (<span key={h.t}>{new Date(h.t).toLocaleTimeString('en-IN', { hour: 'numeric' })}</span>))}
              </div>
            </div>
          </div>
        </div>
        <div className={`absolute inset-0 transition-all duration-500 ${vis(1)}`}>
          <div className="flex h-full items-center gap-2.5 px-3">
            <div className="min-w-0 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Nifty 50 ›</p>
              <p className="text-lg font-extrabold leading-tight text-slate-900">{m?.nifty?.price ? inr(m.nifty.price, 2) : '—'}</p>
              {m?.nifty ? (<p className={`flex items-center gap-1 text-[11px] font-bold ${(m.nifty.change ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{(m.nifty.change ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{inr(m.nifty.change, 2)} ({m.nifty.pct !== null ? `${m.nifty.pct >= 0 ? '+' : ''}${m.nifty.pct.toFixed(2)}%` : '—'})</p>) : (<p className="text-[11px] text-slate-400">Loading…</p>)}
              <p className="mt-0.5 text-[10px] text-slate-500">Sensex {m?.sensex?.price ? inr(m.sensex.price, 0) : '—'} · Bank {m?.bankNifty?.price ? inr(m.bankNifty.price, 0) : '—'}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400"><span>● Open</span><span className="text-emerald-600">● High</span><span className="text-red-500">● Low</span></div>
              <Spark data={m?.nifty?.spark || []} stroke="#16a34a" fill="#bae6fd" w={130} h={50} />
            </div>
          </div>
        </div>
        <div className={`absolute inset-0 transition-all duration-500 ${vis(2)}`}>
          <div className="flex h-full flex-col justify-center px-3 py-1.5">
            {live ? (
              <>
                <div className="flex items-center gap-1.5"><span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-px text-[10px] font-extrabold uppercase tracking-wide text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />Live</span><p className="truncate text-[11px] font-medium text-slate-500">{live.title}{live.league ? ` · ${live.league}` : ''}</p></div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50"><Trophy className="h-4 w-4 text-red-600" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-[13px] font-extrabold text-slate-900">{live.homeShort} <span className="text-red-600">{live.homeScore}</span></p><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-extrabold text-white">VS</span><p className="truncate text-[13px] font-bold text-slate-600">{live.awayShort} {live.awayScore}</p></div>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{live.home} vs {live.away}{live.note ? ` · ${live.note}` : ''}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100"><Trophy className="h-4 w-4 text-slate-400" /></div>
                <div><p className="text-xs font-bold text-slate-700">Abhi koi live match nahi</p><p className="text-[11px] text-slate-500">Admin panel → Matches me live score add karte hi yahan dikhega</p></div>
              </div>
            )}
          </div>
        </div>
        <div className={`absolute inset-0 transition-all duration-500 ${vis(3)}`}>
          <div className="grid h-full grid-cols-3 items-center gap-2 px-3">
            <div className="rounded bg-amber-50 px-2 py-1.5 text-center"><Coins className="mx-auto h-4 w-4 text-amber-600" /><p className="mt-0.5 text-[10px] font-bold uppercase text-slate-500">Gold 10g</p><p className="text-xs font-extrabold text-slate-900 sm:text-sm">{mt?.gold10g ? `₹${inr(mt.gold10g)}` : '—'}</p><p className="text-[10px] font-bold text-slate-500">24K · Live</p></div>
            <div className="rounded bg-slate-100 px-2 py-1.5 text-center"><Coins className="mx-auto h-4 w-4 text-slate-500" /><p className="mt-0.5 text-[10px] font-bold uppercase text-slate-500">Silver 1kg</p><p className="text-xs font-extrabold text-slate-900 sm:text-sm">{mt?.silverKg ? `₹${inr(mt.silverKg)}` : '—'}</p><p className="text-[10px] font-bold text-slate-500">Live rate</p></div>
            <div className="rounded bg-sky-50 px-2 py-1.5 text-center"><Fuel className="mx-auto h-4 w-4 text-sky-600" /><p className="mt-0.5 text-[10px] font-bold uppercase text-slate-500">USD/INR</p><p className="text-xs font-extrabold text-slate-900 sm:text-sm">{mt?.usdInr ? `₹${inr(mt.usdInr, 2)}` : '—'}</p><p className="text-[10px] font-bold text-slate-500">Forex live</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TopInfoSlider;
