import axios from 'axios';

// Base URLs for APIs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CRICKET_API_URL = 'https://api.cricapi.com/v1';
const CRICKET_API_KEY = import.meta.env.VITE_CRICKET_API_KEY || ''; // Configure via .env

// Map of country codes to their official flag URLs
export const COUNTRY_FLAGS: Record<string, string> = {
  // Test playing nations
  IND: 'https://flagcdn.com/w160/in.png', // India
  AUS: 'https://flagcdn.com/w160/au.png', // Australia
  ENG: 'https://flagcdn.com/w160/gb-eng.png', // England
  NZ: 'https://flagcdn.com/w160/nz.png',  // New Zealand
  SA: 'https://flagcdn.com/w160/za.png',   // South Africa
  PAK: 'https://flagcdn.com/w160/pk.png',  // Pakistan
  WI: 'https://flagcdn.com/w160/bb.png',   // West Indies (using Barbados flag)
  SL: 'https://flagcdn.com/w160/lk.png',   // Sri Lanka
  BAN: 'https://flagcdn.com/w160/bd.png',  // Bangladesh
  AFG: 'https://flagcdn.com/w160/af.png',  // Afghanistan
  
  // Other ODI nations
  IRE: 'https://flagcdn.com/w160/ie.png',  // Ireland
  ZIM: 'https://flagcdn.com/w160/zw.png',  // Zimbabwe
  SCO: 'https://flagcdn.com/w160/gb-sct.png', // Scotland
  UAE: 'https://flagcdn.com/w160/ae.png',  // United Arab Emirates
  NED: 'https://flagcdn.com/w160/nl.png',  // Netherlands
  NEP: 'https://flagcdn.com/w160/np.png',  // Nepal
  
  // Popular T20 franchise leagues
  // IPL teams
  MI: 'https://flagcdn.com/w160/in.png',   // Mumbai Indians
  CSK: 'https://flagcdn.com/w160/in.png',  // Chennai Super Kings
  RCB: 'https://flagcdn.com/w160/in.png',  // Royal Challengers Bangalore
  KKR: 'https://flagcdn.com/w160/in.png',  // Kolkata Knight Riders
  
  // Football nations
  ESP: 'https://flagcdn.com/w160/es.png',  // Spain
  BRA: 'https://flagcdn.com/w160/br.png',  // Brazil
  ARG: 'https://flagcdn.com/w160/ar.png',  // Argentina
  GER: 'https://flagcdn.com/w160/de.png',  // Germany
  FRA: 'https://flagcdn.com/w160/fr.png',  // France
  ITA: 'https://flagcdn.com/w160/it.png',  // Italy
  POR: 'https://flagcdn.com/w160/pt.png',  // Portugal
  BEL: 'https://flagcdn.com/w160/be.png',  // Belgium
  
  // Default flag for unknown codes
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

// Internal API Services
export const getAllSports = async () => {
  try {
    const response = await axios.get(`${API_URL}/sports`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
};

export const getSportBySlug = async (slug: string) => {
  try {
    const response = await axios.get(`${API_URL}/sports/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sport ${slug}:`, error);
    throw error;
  }
};

export const getSportLeagues = async (sportId: string) => {
  try {
    const response = await axios.get(`${API_URL}/sports/${sportId}/leagues`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching leagues for sport ${sportId}:`, error);
    throw error;
  }
};

export const getLiveMatches = async (sportId: string) => {
  try {
    const response = await axios.get(`${API_URL}/sports/${sportId}/live-matches`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching live matches for sport ${sportId}:`, error);
    throw error;
  }
};

export const getUpcomingMatches = async (sportId: string, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/sports/${sportId}/upcoming-matches?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching upcoming matches for sport ${sportId}:`, error);
    throw error;
  }
};

export const getRecentResults = async (sportId: string, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/sports/${sportId}/recent-results?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recent results for sport ${sportId}:`, error);
    throw error;
  }
};

export const getFeaturedMatches = async (sportId?: string) => {
  try {
    const url = sportId 
      ? `${API_URL}/sports/featured-matches?sportId=${sportId}`
      : `${API_URL}/sports/featured-matches`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching featured matches:', error);
    throw error;
  }
};

export const getMatchDetails = async (matchId: string) => {
  try {
    const response = await axios.get(`${API_URL}/matches/${matchId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching match details for ${matchId}:`, error);
    throw error;
  }
};

// External Cricket API calls
export const getCurrentMatches = async () => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/currentMatches`, {
      params: {
        apikey: CRICKET_API_KEY,
        offset: 0
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: matchId
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: matchId
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: playerId
      }
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
      params: {
        apikey: CRICKET_API_KEY
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: seriesId
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: seriesId
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: seriesId
      }
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
      params: {
        apikey: CRICKET_API_KEY
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        search: name
      }
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
      params: {
        apikey: CRICKET_API_KEY
      }
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
      params: {
        apikey: CRICKET_API_KEY,
        id: teamId
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching team info for ${teamId}:`, error);
    throw error;
  }
};

// Cricket News API call
export const getCricketNews = async () => {
  try {
    const response = await axios.get(`${CRICKET_API_URL}/news_list`, {
      params: {
        apikey: CRICKET_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cricket news:', error);
    throw error;
  }
};

// Utilities for handling cricket data
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
