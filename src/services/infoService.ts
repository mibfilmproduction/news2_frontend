import { api } from '@/lib/api-client';

export interface InfoWeather {
  city: string; temp: number | null; feelsLike: number | null;
  humidity: number | null; windKmh: number | null; code: number | null;
  max: number | null; min: number | null; precipProb: number | null; updatedAt: string | null;
  hourly?: Array<{ t: string; v: number | null }>;
}
export interface MarketQuote {
  label: string; price: number | null; prevClose: number | null; change: number | null; pct: number | null;
  spark?: number[];
}
export interface InfoData {
  weather: InfoWeather | null;
  market: { nifty: MarketQuote | null; sensex: MarketQuote | null; bankNifty: MarketQuote | null } | null;
  metals: { usdInr: number | null; gold10g: number | null; silverKg: number | null } | null;
  fetchedAt: string;
}

export interface LiveCricket {
  title: string; status: string; league: string;
  home: string; away: string; homeShort: string; awayShort: string;
  homeScore: string; awayScore: string; note: string;
}

export const weatherLabel = (code: number | null | undefined): string => {
  if (code === null || code === undefined) return '—';
  if (code === 0) return 'Saaf aasmaan';
  if (code <= 3) return code === 1 ? 'Halki dhund' : code === 2 ? 'Aanshik badal' : 'Badal chhaye';
  if (code <= 48) return 'Kohra / Dhund';
  if (code <= 67) return 'Halki barish';
  if (code <= 77) return 'Barish / Ole';
  if (code <= 82) return 'Musladhar barish';
  if (code <= 86) return 'Barf-bari';
  if (code >= 95) return 'Aandhi-toofan';
  return 'Badal';
};

export async function getInfoData(): Promise<InfoData | null> {
  try {
    const res = await api.get<InfoData>('/info', {}, { requireAuth: false });
    if (res.success && res.data) return res.data;
    return null;
  } catch {
    return null;
  }
}

const fmtInnings = (inn: any): string => {
  if (!inn) return '';
  const r = inn.runs ?? inn.value ?? 0;
  const w = inn.wickets ?? 0;
  const o = inn.overs ?? 0;
  if (!r && !w && !o) return '';
  return `${r}/${w} (${o} ov)`;
};

export async function getLiveCricket(): Promise<LiveCricket | null> {
  try {
    const res = await api.get<any>('/matches', { status: 'live', limit: 1 }, { requireAuth: false });
    const list = (res as any)?.matches || (res as any)?.data?.matches || (res as any)?.data || [];
    const m = Array.isArray(list) ? list[0] : null;
    if (!m) return null;
    const short = (t: any, fb: string) => t?.shortName || fb;
    const innings = m?.cricketData?.innings || [];
    const homeIn = innings[0] || m?.scores?.home;
    const awayIn = innings[1] || m?.scores?.away;
    return {
      title: m?.matchType || m?.league?.name || 'Live Match',
      status: m?.status || 'live',
      league: m?.league?.name || m?.league?.shortName || '',
      home: m?.homeTeam?.name || 'Home',
      away: m?.awayTeam?.name || 'Away',
      homeShort: short(m?.homeTeam, 'HOME').slice(0, 3).toUpperCase(),
      awayShort: short(m?.awayTeam, 'AWAY').slice(0, 3).toUpperCase(),
      homeScore: fmtInnings(homeIn),
      awayScore: fmtInnings(awayIn),
      note: m?.venue?.city ? `${m.venue.city}` : '',
    };
  } catch {
    return null;
  }
}
