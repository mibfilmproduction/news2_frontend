import { sportsApi } from '@/lib/api-client';

// Define the Sport interface
export interface Sport {
  _id: string;
  id: string;
  name: string;
  slug: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

// Define the League interface
export interface League {
  _id: string;
  id: string;
  name: string;
  slug: string;
  shortName?: string;
  logo?: string;
  sport: string;
  isActive: boolean;
}

// Define the Team interface
export interface Team {
  _id: string;
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  sport: string;
  league?: string;
  country?: string;
  isActive: boolean;
}

// Define the Match interface
export interface Match {
  _id: string;
  id: string;
  sport: string | Sport;
  league: string | League;
  homeTeam: string | Team;
  awayTeam: string | Team;
  startTime: string;
  venue?: {
    name: string;
    city: string;
  };
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';
  scores?: {
    home: { value: number };
    away: { value: number };
  };
  winner?: string | null;
}

// Cache for sports data
let sportsCache: { data: Sport[] | null; timestamp: number } = { data: null, timestamp: 0 };

export const getAllSports = async (params?: { active?: boolean }): Promise<Sport[]> => {
  try {
    const now = Date.now();
    const cacheValidTime = 5 * 60 * 1000; // 5 minutes

    if (sportsCache.data && sportsCache.timestamp > now - cacheValidTime) {
      return sportsCache.data;
    }

    const response = await sportsApi.getSports(params);

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch sports');
    }

    const sports = Array.isArray(response.data) ? response.data : response.data.data || [];

    sportsCache = { data: sports, timestamp: now };
    return sports;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
};

export const getSportBySlug = async (slug: string): Promise<Sport | null> => {
  try {
    // First try to get from cache
    const sports = await getAllSports();
    return sports.find(s => s.slug === slug) || null;
  } catch (error) {
    console.error(`Error fetching sport ${slug}:`, error);
    throw error;
  }
};

export const getSportLeagues = async (sportId: string): Promise<League[]> => {
  try {
    const response = await sportsApi.getLeagues({ sport: sportId });
    if (!response.success || !response.data) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error(`Error fetching leagues for sport ${sportId}:`, error);
    throw error;
  }
};

export const getLiveMatches = async (sportId?: string): Promise<Match[]> => {
  try {
    const response = await sportsApi.getMatches({ sport: sportId, status: 'live' });
    if (!response.success || !response.data) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error(`Error fetching live matches:`, error);
    throw error;
  }
};

export const getUpcomingMatches = async (sportId?: string, limit = 10): Promise<Match[]> => {
  try {
    const response = await sportsApi.getMatches({ sport: sportId, status: 'scheduled', limit });
    if (!response.success || !response.data) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error(`Error fetching upcoming matches:`, error);
    throw error;
  }
};

export const getRecentResults = async (sportId?: string, limit = 10): Promise<Match[]> => {
  try {
    const response = await sportsApi.getMatches({ sport: sportId, status: 'completed', limit });
    if (!response.success || !response.data) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error(`Error fetching recent results:`, error);
    throw error;
  }
};

export const getFeaturedMatches = async (sportId?: string): Promise<Match[]> => {
  try {
    const response = await sportsApi.getMatches({ sport: sportId, featured: true, limit: 5 });
    if (!response.success || !response.data) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error('Error fetching featured matches:', error);
    throw error;
  }
};

export const getMatchDetails = async (matchId: string): Promise<Match | null> => {
  try {
    const response = await sportsApi.getMatch(matchId);
    if (!response.success || !response.data) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.error(`Error fetching match details for ${matchId}:`, error);
    throw error;
  }
};

// Admin functions
export const createSport = async (sportData: Omit<Sport, '_id' | 'id'>): Promise<Sport> => {
  const response = await sportsApi.createSport(sportData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to create sport');
  }
  return response.data;
};

export const updateSport = async (id: string, sportData: Partial<Sport>): Promise<Sport> => {
  const response = await sportsApi.updateSport(id, sportData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to update sport');
  }
  return response.data;
};

export const deleteSport = async (id: string): Promise<void> => {
  const response = await sportsApi.deleteSport(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete sport');
  }
};

export const createLeague = async (leagueData: Omit<League, '_id' | 'id'>): Promise<League> => {
  const response = await sportsApi.createLeague(leagueData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to create league');
  }
  return response.data;
};

export const updateLeague = async (id: string, leagueData: Partial<League>): Promise<League> => {
  const response = await sportsApi.updateLeague(id, leagueData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to update league');
  }
  return response.data;
};

export const deleteLeague = async (id: string): Promise<void> => {
  const response = await sportsApi.deleteLeague(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete league');
  }
};

export const createTeam = async (teamData: Omit<Team, '_id' | 'id'>): Promise<Team> => {
  const response = await sportsApi.createTeam(teamData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to create team');
  }
  return response.data;
};

export const updateTeam = async (id: string, teamData: Partial<Team>): Promise<Team> => {
  const response = await sportsApi.updateTeam(id, teamData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to update team');
  }
  return response.data;
};

export const deleteTeam = async (id: string): Promise<void> => {
  const response = await sportsApi.deleteTeam(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete team');
  }
};

export const createMatch = async (matchData: Omit<Match, '_id' | 'id'>): Promise<Match> => {
  const response = await sportsApi.createMatch(matchData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to create match');
  }
  return response.data;
};

export const updateMatch = async (id: string, matchData: Partial<Match>): Promise<Match> => {
  const response = await sportsApi.updateMatch(id, matchData);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to update match');
  }
  return response.data;
};

export const deleteMatch = async (id: string): Promise<void> => {
  const response = await sportsApi.deleteMatch(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete match');
  }
};

// External Cricket API calls (unchanged, keep using axios)
const CRICKET_API_URL = 'https://api.cricapi.com/v1';
const CRICKET_API_KEY = import.meta.env.VITE_CRICKET_API_KEY || '';

let axiosInstance: any = null;
async function getAxios() {
  if (!axiosInstance) {
    const axiosModule = await import('axios');
    axiosInstance = axiosModule.default;
  }
  return axiosInstance;
}

export const getCurrentMatches = async () => {
  try {
    const axios = await getAxios();
    const response = await axios.get(`${CRICKET_API_URL}/currentMatches`, {
      params: { apikey: CRICKET_API_KEY, offset: 0 }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching current matches from external API:', error);
    throw error;
  }
};

export const getMatchScorecard = async (matchId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/match_scorecard`, {
      params: { apikey: CRICKET_API_KEY, id: matchId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching scorecard for match ${matchId}:`, error);
    throw error;
  }
};

export const getMatchInfo = async (matchId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/match_info`, {
      params: { apikey: CRICKET_API_KEY, id: matchId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching match info for ${matchId}:`, error);
    throw error;
  }
};

export const getPlayerStats = async (playerId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/players_info`, {
      params: { apikey: CRICKET_API_KEY, id: playerId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching player stats for ${playerId}:`, error);
    throw error;
  }
};

export const getSeriesList = async () => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/series_list`, {
      params: { apikey: CRICKET_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching series list:', error);
    throw error;
  }
};

export const getSeriesInfo = async (seriesId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/series_info`, {
      params: { apikey: CRICKET_API_KEY, id: seriesId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching series info for ${seriesId}:`, error);
    throw error;
  }
};

export const getSeriesMatches = async (seriesId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/series_matches`, {
      params: { apikey: CRICKET_API_KEY, id: seriesId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching series matches for ${seriesId}:`, error);
    throw error;
  }
};

export const getSeriesStats = async (seriesId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/series_stats`, {
      params: { apikey: CRICKET_API_KEY, id: seriesId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching series stats for ${seriesId}:`, error);
    throw error;
  }
};

export const getPlayerList = async () => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/players`, {
      params: { apikey: CRICKET_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching player list:', error);
    throw error;
  }
};

export const searchPlayers = async (name: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/players`, {
      params: { apikey: CRICKET_API_KEY, search: name }
    });
    return response.data;
  } catch (error) {
    console.error(`Error searching players with name ${name}:`, error);
    throw error;
  }
};

export const getTeamList = async () => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/countries`, {
      params: { apikey: CRICKET_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching team list:', error);
    throw error;
  }
};

export const getTeamInfo = async (teamId: string) => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/countries_info`, {
      params: { apikey: CRICKET_API_KEY, id: teamId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching team info for ${teamId}:`, error);
    throw error;
  }
};

export const getCricketNews = async () => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/news_list`, {
      params: { apikey: CRICKET_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cricket news:', error);
    throw error;
  }
};

export const formatCricketScore = (inningsScore: any) => {
  if (!inningsScore) return '';
  return `${inningsScore.runs || 0}/${inningsScore.wickets || 0} (${inningsScore.overs || 0} ov)`;
};

export const getCricketMatchStatus = (match: any) => {
  if (!match) return '';
  
  if (match.matchEnded) {
    return match.status || 'Completed';
  } else if (match.matchStarted) {
    return 'In Progress';
  } else {
    return 'Upcoming';
  }
};

// Map of country codes to their official flag URLs
export const COUNTRY_FLAGS: Record<string, string> = {
  IND: 'https://flagcdn.com/w160/in.png',
  AUS: 'https://flagcdn.com/w160/au.png',
  ENG: 'https://flagcdn.com/w160/gb-eng.png',
  NZ: 'https://flagcdn.com/w160/nz.png',
  SA: 'https://flagcdn.com/w160/za.png',
  PAK: 'https://flagcdn.com/w160/pk.png',
  WI: 'https://flagcdn.com/w160/bb.png',
  SL: 'https://flagcdn.com/w160/lk.png',
  BAN: 'https://flagcdn.com/w160/bd.png',
  AFG: 'https://flagcdn.com/w160/af.png',
  IRE: 'https://flagcdn.com/w160/ie.png',
  ZIM: 'https://flagcdn.com/w160/zw.png',
  SCO: 'https://flagcdn.com/w160/gb-sct.png',
  UAE: 'https://flagcdn.com/w160/ae.png',
  NED: 'https://flagcdn.com/w160/nl.png',
  NEP: 'https://flagcdn.com/w160/np.png',
  DEFAULT: 'https://flagcdn.com/w160/xx.png'
};

// Sample data for development/testing
export const SAMPLE_SPORTS = [
  { _id: '1', name: 'Cricket', slug: 'cricket', icon: 'https://placehold.co/30/png?text=🏏', active: true, displayOrder: 1 },
  { _id: '2', name: 'Football', slug: 'football', icon: 'https://placehold.co/30/png?text=⚽', active: true, displayOrder: 2 },
  { _id: '3', name: 'Tennis', slug: 'tennis', icon: 'https://placehold.co/30/png?text=🎾', active: true, displayOrder: 3 },
  { _id: '4', name: 'Basketball', slug: 'basketball', icon: 'https://placehold.co/30/png?text=🏀', active: true, displayOrder: 4 },
];

export const SAMPLE_FEATURED_MATCHES = [
  {
    _id: '101',
    sport: { _id: '1', name: 'Cricket', slug: 'cricket', icon: 'https://placehold.co/30/png?text=🏏' },
    league: { name: 'ICC World Cup 2025', shortName: 'WC', logo: 'https://placehold.co/40/png?text=WC' },
    homeTeam: { name: 'India', shortName: 'IND', logo: 'https://placehold.co/40/png?text=IND' },
    awayTeam: { name: 'Australia', shortName: 'AUS', logo: 'https://placehold.co/40/png?text=AUS' },
    startTime: new Date().toISOString(),
    venue: { name: 'Wankhede Stadium', city: 'Mumbai' },
    status: 'live',
    scores: { home: { value: 256 }, away: { value: 180 } }
  },
  {
    _id: '102',
    sport: { _id: '1', name: 'Cricket', slug: 'cricket', icon: 'https://placehold.co/30/png?text=🏏' },
    league: { name: 'IPL 2025', shortName: 'IPL', logo: 'https://placehold.co/40/png?text=IPL' },
    homeTeam: { name: 'Mumbai Indians', shortName: 'MI', logo: 'https://placehold.co/40/png?text=MI' },
    awayTeam: { name: 'Chennai Super Kings', shortName: 'CSK', logo: 'https://placehold.co/40/png?text=CSK' },
    startTime: new Date(Date.now() + 86400000).toISOString(),
    venue: { name: 'Wankhede Stadium', city: 'Mumbai' },
    status: 'scheduled',
    scores: { home: { value: 0 }, away: { value: 0 } }
  },
  {
    _id: '103',
    sport: { _id: '2', name: 'Football', slug: 'football', icon: 'https://placehold.co/30/png?text=⚽' },
    league: { name: 'Premier League', shortName: 'EPL', logo: 'https://placehold.co/40/png?text=EPL' },
    homeTeam: { name: 'Manchester United', shortName: 'MUN', logo: 'https://placehold.co/40/png?text=MUN' },
    awayTeam: { name: 'Liverpool', shortName: 'LIV', logo: 'https://placehold.co/40/png?text=LIV' },
    startTime: new Date(Date.now() - 86400000).toISOString(),
    venue: { name: 'Old Trafford', city: 'Manchester' },
    status: 'completed',
    scores: { home: { value: 2 }, away: { value: 2 } },
    winner: null
  }
];

export const SAMPLE_LIVE_MATCHES = [
  {
    id: '201',
    matchType: 'T20',
    status: 'Match in progress',
    venue: 'Eden Gardens, Kolkata',
    date: new Date().toISOString(),
    teamInfo: [
      { name: 'India', shortname: 'IND', img: 'https://placehold.co/40/png?text=IND' },
      { name: 'England', shortname: 'ENG', img: 'https://placehold.co/40/png?text=ENG' }
    ],
    score: [
      { r: 185, w: 6, o: 20.0, inning: 'India Innings' },
      { r: 125, w: 4, o: 15.2, inning: 'England Innings' }
    ],
    series_name: 'India vs England T20 Series 2025'
  }
];

export const SAMPLE_MATCH_INFO = {
  id: '201',
  name: 'India vs England',
  matchType: 'T20',
  status: 'Match in progress',
  venue: 'Eden Gardens, Kolkata',
  date: new Date().toISOString(),
  teamInfo: [
    { name: 'India', shortname: 'IND', img: 'https://placehold.co/40/png?text=IND' },
    { name: 'England', shortname: 'ENG', img: 'https://placehold.co/40/png?text=ENG' }
  ],
  score: [
    { r: 185, w: 6, o: 20.0, inning: 'India Innings' },
    { r: 125, w: 4, o: 15.2, inning: 'England Innings' }
  ],
  series_name: 'India vs England T20 Series 2025',
  tossResult: 'India won the toss and elected to bat',
  matchStarted: true,
  matchEnded: false
};

export const SAMPLE_SCORECARD = {
  scorecard: [
    {
      inning: 'India Innings',
      runs: 185,
      wickets: 6,
      overs: 20.0,
      runrate: 9.25,
      extras: { total: 12, byes: 2, legbyes: 4, wides: 5, noballs: 1 },
      batting: [
        { batsman: 'Rohit Sharma', dismissal: 'c Stokes b Archer', r: 45, b: 32, '4s': 5, '6s': 2, sr: 140.62 },
        { batsman: 'KL Rahul', dismissal: 'b Anderson', r: 35, b: 25, '4s': 4, '6s': 1, sr: 140.00 },
        { batsman: 'Virat Kohli', dismissal: 'not out', r: 65, b: 40, '4s': 7, '6s': 3, sr: 162.50 }
      ],
      bowling: [
        { bowler: 'Jofra Archer', o: 4.0, m: 0, r: 38, w: 2, eco: 9.50 },
        { bowler: 'James Anderson', o: 4.0, m: 0, r: 32, w: 1, eco: 8.00 },
        { bowler: 'Ben Stokes', o: 4.0, m: 0, r: 45, w: 1, eco: 11.25 }
      ],
      fow: [
        { score: 75, wicketNum: 1, batsman: 'KL Rahul', overs: 9.3 },
        { score: 110, wicketNum: 2, batsman: 'Rohit Sharma', overs: 13.2 }
      ]
    },
    {
      inning: 'England Innings',
      runs: 125,
      wickets: 4,
      overs: 15.2,
      runrate: 8.15,
      extras: { total: 8, byes: 1, legbyes: 2, wides: 4, noballs: 1 },
      batting: [
        { batsman: 'Jos Buttler', dismissal: 'b Bumrah', r: 32, b: 25, '4s': 3, '6s': 1, sr: 128.00 },
        { batsman: 'Jason Roy', dismissal: 'run out', r: 18, b: 15, '4s': 2, '6s': 0, sr: 120.00 },
        { batsman: 'Dawid Malan', dismissal: 'not out', r: 55, b: 40, '4s': 6, '6s': 2, sr: 137.50 }
      ],
      bowling: [
        { bowler: 'Jasprit Bumrah', o: 4.0, m: 0, r: 22, w: 2, eco: 5.50 },
        { bowler: 'Bhuvneshwar Kumar', o: 3.2, m: 0, r: 35, w: 0, eco: 10.50 },
        { bowler: 'Yuzvendra Chahal', o: 4.0, m: 0, r: 42, w: 1, eco: 10.50 }
      ],
      fow: [
        { score: 28, wicketNum: 1, batsman: 'Jason Roy', overs: 4.1 },
        { score: 70, wicketNum: 2, batsman: 'Jos Buttler', overs: 8.3 }
      ]
    }
  ]
};