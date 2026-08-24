import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { 
  getMatchDetails, 
  getMatchScorecard, 
  getMatchInfo, 
  SAMPLE_MATCH_INFO,
  SAMPLE_SCORECARD,
  COUNTRY_FLAGS
} from '../services/sportsService';
import { Spinner } from '../components/Spinner';
import ErrorDisplay from '../components/shared/ErrorDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import MatchScorecard from '../components/sports/MatchScorecard';
import MatchCommentary from '../components/sports/MatchCommentary';
import MatchSummary from '../components/sports/MatchSummary';
import MatchSquads from '../components/sports/MatchSquads';
import MatchStats from '../components/sports/MatchStats';
import { format } from 'date-fns';

// Type definitions for cricket API data
interface Team {
  name: string;
  shortname?: string;
  img?: string;
  logo?: string;
}

interface Score {
  r?: number;
  w?: number;
  o?: number;
  inning?: string;
  value?: number;
}

interface CricketMatchInfo {
  id: string;
  name: string;
  matchType?: string;
  status: string;
  venue: string;
  date: string;
  teamInfo: Team[];
  score: Score[];
  series_name?: string;
  tossResult?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
  scorecard?: any;
}

interface InternalMatch {
  _id: string;
  homeTeam: Team;
  awayTeam: Team;
  venue?: {
    name: string;
    city?: string;
  };
  startTime: string;
  status: string;
  scores?: {
    home: Score;
    away: Score;
  };
  winner?: Team | null;
  league?: {
    name: string;
    shortName?: string;
    logo?: string;
  };
}

type MatchData = CricketMatchInfo | InternalMatch;

// Type guards
function isCricketMatch(match: MatchData): match is CricketMatchInfo {
  return 'teamInfo' in match && 'score' in match;
}

function isInternalMatch(match: MatchData): match is InternalMatch {
  return 'homeTeam' in match && 'awayTeam' in match;
}

// Helper function to get country flag URL based on team shortname/code
function getTeamFlag(team: any): string {
  if (!team) return COUNTRY_FLAGS.DEFAULT;
  
  // Try to get flag based on shortname or shortcode
  const code = team.shortname || team.shortName || team.code;
  
  if (code && COUNTRY_FLAGS[code.toUpperCase()]) {
    return COUNTRY_FLAGS[code.toUpperCase()];
  }
  
  // Try some common country name patterns
  const name = team.name?.toUpperCase();
  if (name) {
    if (name.includes('INDIA') || name === 'INDIA') return COUNTRY_FLAGS.IND;
    if (name.includes('AUSTRALIA')) return COUNTRY_FLAGS.AUS;
    if (name.includes('ENGLAND')) return COUNTRY_FLAGS.ENG;
    if (name.includes('PAKISTAN')) return COUNTRY_FLAGS.PAK;
    if (name.includes('SOUTH AFRICA')) return COUNTRY_FLAGS.SA;
    if (name.includes('WEST INDIES')) return COUNTRY_FLAGS.WI;
    if (name.includes('NEW ZEALAND')) return COUNTRY_FLAGS.NZ;
    if (name.includes('SRI LANKA')) return COUNTRY_FLAGS.SL;
    if (name.includes('BANGLADESH')) return COUNTRY_FLAGS.BAN;
  }
  
  // Return either existing image, logo or placeholder
  return team.img || team.logo || `https://placehold.co/200/3b82f6/FFFFFF/png?text=${code || team.name?.charAt(0) || 'T'}`;
}

const MatchDetail = () => {
  const { matchId, sportSlug } = useParams<{ matchId: string, sportSlug: string }>();
  const navigate = useNavigate();
  
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [scorecardData, setScorecardData] = useState<any>(null);
  const [matchInfo, setMatchInfo] = useState<CricketMatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch match data differently based on source
        if (sportSlug === 'cricket') {
          try {
            // Use the external cricket API
            const [scorecardResponse, infoResponse] = await Promise.all([
              getMatchScorecard(matchId),
              getMatchInfo(matchId)
            ]);
            
            // Get the actual data or use empty objects as fallbacks
            const scorecardData = scorecardResponse?.data || SAMPLE_SCORECARD;
            const infoData = infoResponse?.data || SAMPLE_MATCH_INFO;
            
            // Ensure the data has all required CricketMatchInfo properties
            const cricketMatchData: CricketMatchInfo = {
              id: infoData.id || matchId,
              name: infoData.name || 'Cricket Match',
              matchType: infoData.matchType || 'T20',
              status: infoData.status || 'unknown',
              venue: infoData.venue || 'Unknown Venue',
              date: infoData.date || new Date().toISOString(),
              teamInfo: Array.isArray(infoData.teamInfo) ? infoData.teamInfo.map(team => ({
                ...team,
                img: team.img || `https://placehold.co/200/3b82f6/FFFFFF/png?text=${team.shortname || team.name?.charAt(0)}`
              })) : [
                { name: 'Team 1', shortname: 'IND', img: 'https://placehold.co/200/3b82f6/FFFFFF/png?text=IND' },
                { name: 'Team 2', shortname: 'AUS', img: 'https://placehold.co/200/3b82f6/FFFFFF/png?text=AUS' }
              ],
              score: Array.isArray(infoData.score) ? infoData.score : [],
              series_name: infoData.series_name || 'Cricket Series',
              tossResult: infoData.tossResult || '',
              matchStarted: !!infoData.matchStarted,
              matchEnded: !!infoData.matchEnded,
              scorecard: scorecardData
            };
            
            console.log('Cricket match data successfully processed');
            setScorecardData(scorecardData);
            setMatchInfo(infoData);
            setMatchData(cricketMatchData);
          } catch (cricketError) {
            console.error('Error with cricket API, using sample data:', cricketError);
            // Use sample data if API fails
            setMatchData({
              ...SAMPLE_MATCH_INFO,
              id: matchId,
              scorecard: SAMPLE_SCORECARD
            } as CricketMatchInfo);
            setScorecardData(SAMPLE_SCORECARD);
          }
        } else {
          try {
            // Use the internal API
            const data = await getMatchDetails(matchId);
            
            if (!data || !data._id) {
              throw new Error('Invalid match data from internal API');
            }
            
            // Ensure the data matches InternalMatch type
            const internalMatch: InternalMatch = {
              _id: data._id,
              homeTeam: data.homeTeam,
              awayTeam: data.awayTeam,
              venue: data.venue || { name: 'Unknown Venue' },
              startTime: data.startTime || new Date().toISOString(),
              status: data.status || 'unknown',
              scores: data.scores,
              winner: data.winner,
              league: data.league
            };
            
            setMatchData(internalMatch);
          } catch (internalError) {
            console.error('Error with internal API:', internalError);
            setError('Failed to load match data. Please try again later.');
          }
        }
        
      } catch (err: any) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchData();
    
    // Set up polling for live matches every 30 seconds
    const intervalId = setInterval(() => {
      if (matchData && (
          matchData.status === 'live' || 
          (isCricketMatch(matchData) && 'matchStarted' in matchData && matchData.matchStarted)
        )) {
        fetchMatchData();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [matchId, sportSlug]);
  
  const getStatusBadge = (status: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'live':
      case 'in progress':
        return <Badge className="bg-red-500 hover:bg-red-600">LIVE</Badge>;
      case 'completed':
      case 'finished':
        return <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'scheduled':
      case 'upcoming':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return <Spinner size="lg" />;
  }
  
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  if (!matchData) {
    return <ErrorDisplay message="Match not found" />;
  }
  
  let title, venue, date, teams, status;
  
  // Use type guards to safely access properties
  if (isCricketMatch(matchData)) {
    // Handle cricket match info from external API
    title = matchData.name || 'Cricket Match';
    venue = matchData.venue;
    date = matchData.date;
    teams = matchData.teamInfo;
    status = matchData.status;
  } else if (isInternalMatch(matchData)) {
    // Handle internal match data
    title = `${matchData.homeTeam.name} vs ${matchData.awayTeam.name}`;
    venue = typeof matchData.venue === 'string' ? matchData.venue : matchData.venue?.name;
    date = matchData.startTime;
    teams = [matchData.homeTeam, matchData.awayTeam];
    status = matchData.status;
  } else {
    // Fallback for unexpected data structure
    return <ErrorDisplay message="Invalid match data format" />;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <SEO
        title={`${title} - Sports`}
        description={`Live updates, scores and stats for ${title}`}
        url={`/sports/match/${id}`}
        type="article"
      />
      
      {/* Match Header */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {isCricketMatch(matchData) && matchData.series_name && (
                  <span>{matchData.series_name}</span>
                )}
                {isInternalMatch(matchData) && matchData.league?.name && (
                  <span>{matchData.league.name}</span>
                )}
                {getStatusBadge(status)}
              </div>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  {isCricketMatch(matchData) && matchData.series_name && (
                    <span className="text-sm">{matchData.series_name}</span>
                  )}
                  {isInternalMatch(matchData) && matchData.league?.name && (
                    <span className="text-sm">{matchData.league.name}</span>
                  )}
                  {getStatusBadge(status)}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {venue && <div>{venue}</div>}
              {date && <div>{format(new Date(date), 'PPP')}</div>}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-between items-center py-2">
            {/* Team 1 */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-blue-50">
                <img 
                  src={teams?.[0]?.img || teams?.[0]?.logo || `https://placehold.co/200/3b82f6/FFFFFF/png?text=${teams?.[0]?.shortname || teams?.[0]?.name?.charAt(0) || 'T'}`} 
                  alt={teams?.[0]?.name || 'Team'} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://placehold.co/200/3b82f6/FFFFFF/png?text=${teams?.[0]?.shortname || teams?.[0]?.name?.charAt(0) || 'T'}`;
                  }}
                />
              </div>
              <div>
                <div className="font-bold text-lg">{teams?.[0]?.name}</div>
                {isCricketMatch(matchData) && matchData.score?.[0] && (
                  <div className="text-lg">
                    {matchData.score[0].r}/{matchData.score[0].w} ({matchData.score[0].o})
                  </div>
                )}
                {isInternalMatch(matchData) && matchData.scores?.home && (
                  <div className="text-lg font-bold">{matchData.scores.home.value}</div>
                )}
              </div>
            </div>
            
            {/* VS */}
            <div className="mx-2 text-xl font-light">vs</div>
            
            {/* Team 2 */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-bold text-lg">{teams?.[1]?.name}</div>
                {isCricketMatch(matchData) && matchData.score?.[1] && (
                  <div className="text-lg">
                    {matchData.score[1].r}/{matchData.score[1].w} ({matchData.score[1].o})
                  </div>
                )}
                {isInternalMatch(matchData) && matchData.scores?.away && (
                  <div className="text-lg font-bold">{matchData.scores.away.value}</div>
                )}
              </div>
              <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-blue-50">
                <img 
                  src={teams?.[1]?.img || teams?.[1]?.logo || `https://placehold.co/200/3b82f6/FFFFFF/png?text=${teams?.[1]?.shortname || teams?.[1]?.name?.charAt(0) || 'T'}`} 
                  alt={teams?.[1]?.name || 'Team'} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://placehold.co/200/3b82f6/FFFFFF/png?text=${teams?.[1]?.shortname || teams?.[1]?.name?.charAt(0) || 'T'}`;
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Match Status/Result */}
          <div className="mt-3 text-center font-medium">
            {isCricketMatch(matchData) ? (
              matchData.status
            ) : isInternalMatch(matchData) ? (
              matchData.winner ? `${matchData.winner.name} won` : 
              (matchData.status === 'completed' ? 'Match drawn' : matchData.status)
            ) : (
              // Fallback message if neither type guard matches (shouldn't happen)
              'Match status unavailable'
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Match Tabs */}
      <Tabs defaultValue="summary" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="commentary">Commentary</TabsTrigger>
          <TabsTrigger value="squads">Squads</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <MatchSummary matchData={matchData} sportSlug={sportSlug} />
        </TabsContent>
        
        <TabsContent value="scorecard">
          <MatchScorecard 
            scorecardData={sportSlug === 'cricket' ? scorecardData : matchData} 
            sportSlug={sportSlug}
          />
        </TabsContent>
        
        <TabsContent value="commentary">
          <MatchCommentary matchData={matchData} sportSlug={sportSlug} />
        </TabsContent>
        
        <TabsContent value="squads">
          <MatchSquads 
            matchData={matchData} 
            sportSlug={sportSlug} 
          />
        </TabsContent>
        
        <TabsContent value="stats">
          <MatchStats matchData={matchData} sportSlug={sportSlug} />
        </TabsContent>
      </Tabs>
      
      {/* Related Matches Section */}
      <section className="mt-8 mb-10">
        <h2 className="text-xl font-bold mb-4">Related Matches</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/sports/${sportSlug}/match/${item}`)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {sportSlug === 'cricket' ? 'ICC World Cup 2025' : 'Premier League'}
                    </span>
                  </div>
                  {getStatusBadge(item === 1 ? 'live' : (item === 2 ? 'completed' : 'scheduled'))}
                </div>
                <CardTitle className="text-base">
                  {sportSlug === 'cricket' 
                    ? `${['India', 'Australia', 'England'][item-1]} vs ${['Pakistan', 'South Africa', 'New Zealand'][item-1]}`
                    : `Team A vs Team B`
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {item === 1 
                    ? 'Live Now' 
                    : (item === 2 
                      ? `${['India', 'Australia', 'England'][item-1]} won by ${Math.floor(Math.random() * 5) + 1} wickets` 
                      : `Tomorrow, ${Math.floor(Math.random() * 12) + 1}:00 PM`
                    )
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MatchDetail;
