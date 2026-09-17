import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  getAllSports,
  getFeaturedMatches,
  getCurrentMatches,
  getFreeSportsDigest,
  getStandings,
  getPopularTeams,
  FreeSportsDigest,
  FreeDigestMatch,
  StandingRow,
  Team,
} from '../services/sportsService';
import { newsApi, categoryApi } from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import { Spinner } from '../components/Spinner';
import ErrorDisplay from '../components/shared/ErrorDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Trophy } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Sport icon is either a hosted image URL or a plain name like "trophy".
// Render an image only for real URLs, otherwise a Trophy glyph.
const isImageUrl = (value?: string) =>
  !!value && (/^(https?:\/\/|data:|blob:|\/\/)/.test(value) || value.startsWith('/'));

const Sports = () => {
  const [sports, setSports] = useState<any[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [freeDigest, setFreeDigest] = useState<FreeSportsDigest>({
    generatedAt: '',
    counts: { live: 0, upcoming: 0, results: 0 },
    featured: [],
    live: [],
    upcoming: [],
    results: [],
  });
  const [sportsNews, setSportsNews] = useState<any[]>([]);
  const [sportsNewsSlug, setSportsNewsSlug] = useState<string>('');
  const [standings, setStandings] = useState<{ league: string; rows: StandingRow[] }>({ league: '', rows: [] });
  const [popularTeams, setPopularTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("featured");
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const navigate = useNavigate();
  const { sportSlug } = useParams<{ sportSlug: string }>();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        try {
          // Fetch all the sports from the API
          const apiSportsData = await getAllSports();
          
          // Verify we received an array
          if (Array.isArray(apiSportsData)) {
            setSports(apiSportsData);
            // Default = All sports (null) so every tab fills with data.
            // A sport in the URL (/sports/football) still pre-selects it.
            const urlSport = sportSlug
              ? apiSportsData.find((sport) => sport.slug === sportSlug)
              : undefined;
            setActiveSport(urlSport ? urlSport._id : null);
          } else throw new Error('Invalid sports response');
        } catch (apiErr) {
          console.error(apiErr);
          throw new Error('Unable to load sports from the server');
        }
        
        // Fetch featured matches
        try {
          const featuredData = await getFeaturedMatches();
          if (Array.isArray(featuredData)) {
            setFeaturedMatches(featuredData);
          } else throw new Error('Invalid featured matches response');
        } catch (apiErr) {
          console.error(apiErr);
          throw new Error('Unable to load featured matches');
        }
        
        // Fetch free aggregated matches (no API key needed, never throws)
        try {
          const digest = await getFreeSportsDigest();
          setFreeDigest(digest);
        } catch (apiErr) {
          console.error('Free sports digest failed', apiErr);
        }

        // Real sports news from our own articles (sports category)
        try {
          const catsRes: any = await categoryApi.getCategories({ limit: 50 });
          const cats = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data?.data || [];
          const sportsCat = cats.find((c: any) => ['sports', 'sports-entertainment', 'cricket'].includes(c.slug))
            || cats.find((c: any) => /sport/i.test(c.name || ''));
          if (sportsCat) {
            setSportsNewsSlug(sportsCat.slug);
            const newsRes: any = await newsApi.getArticles({ category: sportsCat._id, limit: 3 });
            const arr = Array.isArray(newsRes.data) ? newsRes.data : newsRes.data?.data || [];
            setSportsNews(arr.slice(0, 3));
          }
        } catch (apiErr) {
          console.error('Sports news failed', apiErr);
          setSportsNews([]);
        }

        // Real league standings (free, no key)
        try {
          setStandings(await getStandings('bl1'));
        } catch (apiErr) {
          console.error('Standings failed', apiErr);
        }

        // Real teams from our database (admin-managed)
        try {
          setPopularTeams(await getPopularTeams(6));
        } catch (apiErr) {
          console.error('Teams failed', apiErr);
        }

        // Fetch live cricket matches
        try {
          const liveData = await getCurrentMatches();
          if (liveData && Array.isArray(liveData.data)) {
            setLiveMatches(liveData.data);
          } else setLiveMatches([]);
        } catch (apiErr) {
          console.error('Live matches API request failed', apiErr);
          setLiveMatches([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching sports data:', err);
        setError('Failed to load sports data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up polling for live data every 30 seconds
    const intervalId = setInterval(() => {
      if (activeTab === 'live') {
        fetchLiveMatches();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Keep the highlighted sport in sync when navigating between
  // /sports/cricket, /sports/football, ... (same component, no remount).
  useEffect(() => {
    if (sportSlug && sports.length > 0) {
      const found = sports.find((s) => s.slug === sportSlug);
      if (found) setActiveSport(found._id);
    }
  }, [sportSlug, sports]);
  
  const fetchLiveMatches = async () => {
    try {
      const liveData = await getCurrentMatches();
      setLiveMatches(liveData.data || []);
    } catch (err) {
      console.error('Error refreshing live matches:', err);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
      case 'In Progress':
        return <Badge className="bg-red-500 hover:bg-red-600">LIVE</Badge>;
      case 'completed':
      case 'Completed':
        return <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };
  
  const getMatchScore = (match: any) => {
    if (match.data?.score && Array.isArray(match.data.score)) {
      return match.data.score.map((score: any, index: number) => (
        <div key={index} className="text-sm">
          <span className="font-bold">{score.inning.split('Inning')[0]}</span>: {score.r}/{score.w} ({score.o} ov)
        </div>
      ));
    } else if (match.scores) {
      return (
        <>
          <div className="text-sm">
            <span className="font-bold">{match.homeTeam.name}:</span> {match.scores.home.value}
          </div>
          <div className="text-sm">
            <span className="font-bold">{match.awayTeam.name}:</span> {match.scores.away.value}
          </div>
        </>
      );
    }
    return null;
  };

  // Currently selected sport slug (from the sport buttons / URL)
  const selectedSportSlug = sports.find((s) => s._id === activeSport)?.slug || null;

  // Free API items use 'soccer' while our DB sport is 'football' — map them.
  const freeItemMatchesSport = (item: FreeDigestMatch) => {
    if (!selectedSportSlug) return true;
    if (item.sport === selectedSportSlug) return true;
    if (selectedSportSlug === 'football' && item.sport === 'soccer') return true;
    if (selectedSportSlug === 'soccer' && item.sport === 'football') return true;
    return false;
  };

  const freeFeatured = freeDigest.featured.filter(freeItemMatchesSport);
  const freeLive = freeDigest.live.filter(freeItemMatchesSport);
  const freeUpcoming = freeDigest.upcoming.filter(freeItemMatchesSport);
  const freeResults = freeDigest.results.filter(freeItemMatchesSport);

  const FreeMatchCard = ({ match }: { match: FreeDigestMatch }) => {
    const fmtScore = (v: number | string | null | undefined) =>
      v === null || v === undefined || v === '' ? null : String(v);
    const homeScore = fmtScore(match.scoreHome);
    const awayScore = fmtScore(match.scoreAway);
    const hasScore = homeScore !== null || awayScore !== null;
    const canOpen = Boolean(match.detailSport && match.detailSlug);
    return (
      <Card
        className={`overflow-hidden border hover:shadow-lg transition-shadow ${canOpen ? 'cursor-pointer' : ''}`}
        onClick={canOpen ? () => navigate(`/sports/live/${match.detailSport}/${match.detailSlug}`) : undefined}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {match.league.logo ? (
                <img src={match.league.logo} alt={match.league.name} className="w-6 h-6 object-contain" />
              ) : null}
              <span className="text-sm font-medium">{match.league.name}</span>
            </div>
            {getStatusBadge(match.status)}
          </div>
          <CardTitle className="text-base">{match.homeTeam.name} vs {match.awayTeam.name}</CardTitle>
          {match.venue ? <CardDescription>{match.venue}</CardDescription> : null}
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {match.homeTeam.logo ? (
                <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
                  {match.homeTeam.shortName || match.homeTeam.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-semibold">{match.homeTeam.shortName || match.homeTeam.name}</div>
                {homeScore !== null && <div className="text-lg font-bold">{homeScore}</div>}
              </div>
            </div>
            <div className="mx-2 text-xl">vs</div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold">{match.awayTeam.shortName || match.awayTeam.name}</div>
                {awayScore !== null && <div className="text-lg font-bold">{awayScore}</div>}
              </div>
              {match.awayTeam.logo ? (
                <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
                  {match.awayTeam.shortName || match.awayTeam.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground pt-0">
          {match.status === 'live' ? (
            <span className="text-red-500 font-medium">LIVE NOW{match.statusText ? ` • ${match.statusText}` : ''}</span>
          ) : match.status === 'completed' ? (
            <span>{hasScore ? `Full time: ${homeScore ?? '-'} - ${awayScore ?? '-'}` : 'Completed'}</span>
          ) : (
            <span>{formatMatchTime(match.startTime)}</span>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  if (isLoading) {
    return <Spinner size="lg" />;
  }
  
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <SEO
        title="Sports"
        description="Get the latest sports news, live scores, and match updates on cricket, football, kabaddi and more on Mibnews."
        url="/sports"
        keywords={['sports news', 'cricket news', 'live scores', 'football', 'kabaddi', 'mibnews']}
      />
      
      <h1 className="text-3xl font-bold mb-6">Sports Central</h1>
      
      {/* Sports Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={activeSport === null ? "default" : "outline"}
          onClick={() => {
            setActiveSport(null);
            navigate('/sports');
          }}
          className="flex items-center gap-2"
        >
          All Sports
        </Button>
        {sports.map((sport) => (
          <Button
            key={sport._id}
            variant={activeSport === sport._id ? "default" : "outline"}
            onClick={() => {
              setActiveSport(sport._id);
              navigate(`/sports/${sport.slug}`);
            }}
            className="flex items-center gap-2"
          >
            {isImageUrl(sport.icon) ? (
              <img src={sport.icon} alt={sport.name} className="w-5 h-5 object-contain" />
            ) : (
              <Trophy size={18} className="text-primary" />
            )}
            {sport.name}
          </Button>
        ))}
      </div>
      
      {/* Tabs for Featured, Live, Upcoming, and Results */}
      <Tabs defaultValue="featured" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="live">Live Matches</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        {/* Featured Matches Tab */}
        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredMatches.map(match => (
                <Card key={match._id} className="overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/sports/${match.sport.slug}/match/${match._id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <img 
                          src={match.league.logo || "/placeholder-league.png"} 
                          alt={match.league.name} 
                          className="w-6 h-6" 
                        />
                        <span className="text-sm font-medium">{match.league.name}</span>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                    <CardTitle className="text-base">{match.homeTeam.name} vs {match.awayTeam.name}</CardTitle>
                    <CardDescription>
                      {match.venue?.name && `${match.venue.name}, `}
                      {match.venue?.city && match.venue.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img 
                          src={match.homeTeam.logo || "/placeholder-team.png"} 
                          alt={match.homeTeam.name} 
                          className="w-10 h-10" 
                        />
                        <div>
                          <div className="font-semibold">{match.homeTeam.shortName || match.homeTeam.name}</div>
                          {match.scores?.home && (
                            <div className="text-lg font-bold">{match.scores.home.value}</div>
                          )}
                        </div>
                      </div>
                      <div className="mx-2 text-xl">vs</div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">{match.awayTeam.shortName || match.awayTeam.name}</div>
                          {match.scores?.away && (
                            <div className="text-lg font-bold">{match.scores.away.value}</div>
                          )}
                        </div>
                        <img 
                          src={match.awayTeam.logo || "/placeholder-team.png"} 
                          alt={match.awayTeam.name} 
                          className="w-10 h-10" 
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground pt-0">
                    {match.status === 'live' ? (
                      <span className="text-red-500 font-medium">LIVE NOW</span>
                    ) : match.status === 'completed' ? (
                      <span>
                        {match.winner ? `${match.winner.name} won` : 'Match drawn'}
                      </span>
                    ) : (
                      <span>
                        {formatMatchTime(match.startTime)}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              ))
            }
            {freeFeatured.slice(0, 6).map(match => (
              <FreeMatchCard key={match.id} match={match} />
            ))}
            {featuredMatches.length === 0 && freeFeatured.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No featured matches available</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Live Matches Tab */}
        <TabsContent value="live">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMatches.length > 0 ? (
              liveMatches.map((match: any) => (
                <Card key={match.id} className="overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/sports/cricket/match/${match.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{match.series_name}</span>
                      </div>
                      {getStatusBadge(match.matchStarted ? 'In Progress' : 'scheduled')}
                    </div>
                    <CardTitle className="text-base">{match.teamInfo?.[0]?.name} vs {match.teamInfo?.[1]?.name}</CardTitle>
                    <CardDescription>
                      {match.venue}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img 
                          src={match.teamInfo?.[0]?.img || "/placeholder-team.png"} 
                          alt={match.teamInfo?.[0]?.name} 
                          className="w-10 h-10" 
                        />
                        <div>
                          <div className="font-semibold">{match.teamInfo?.[0]?.shortname || match.teamInfo?.[0]?.name}</div>
                        </div>
                      </div>
                      <div className="mx-2 text-xl">vs</div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">{match.teamInfo?.[1]?.shortname || match.teamInfo?.[1]?.name}</div>
                        </div>
                        <img 
                          src={match.teamInfo?.[1]?.img || "/placeholder-team.png"} 
                          alt={match.teamInfo?.[1]?.name} 
                          className="w-10 h-10" 
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      {getMatchScore(match)}
                    </div>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground pt-0">
                    {match.status}
                  </CardFooter>
                </Card>
              ))
            ) : null}
            {freeLive.map(match => (
              <FreeMatchCard key={match.id} match={match} />
            ))}
            {liveMatches.length === 0 && freeLive.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No live matches currently in progress</p>
                {freeUpcoming.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Next up: {freeUpcoming[0].homeTeam.name} vs {freeUpcoming[0].awayTeam.name} — {formatMatchTime(freeUpcoming[0].startTime)}
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Upcoming Matches Tab */}
        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeUpcoming.map(match => (
              <FreeMatchCard key={match.id} match={match} />
            ))}
            {freeUpcoming.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No upcoming matches found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeResults.map(match => (
              <FreeMatchCard key={match.id} match={match} />
            ))}
            {freeResults.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No recent results found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground mt-2">
        Live scores & fixtures by{' '}
        <a href="https://sportscore.com/" target="_blank" rel="noopener sponsored" className="underline hover:text-primary">
          SportScore
        </a>
      </p>
      
      {/* Sports News Section (real articles, hidden when empty) */}
      {sportsNews.length > 0 && (
      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sports News</h2>
          <Button variant="outline" onClick={() => navigate(`/category/${sportsNewsSlug || 'sports'}`)}>
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sportsNews.map((item) => (
            <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/article/${item.slug}`)}>
              <div className="aspect-video bg-muted">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                  {item.summary || ''}
                </p>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      )}
      
      {/* Points Table Section (real standings, hidden when empty) */}
      {standings.rows.length > 0 && (
      <section className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Points Table</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{standings.league || 'League Standings'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Team</th>
                    <th className="p-2">P</th>
                    <th className="p-2">W</th>
                    <th className="p-2">D</th>
                    <th className="p-2">L</th>
                    <th className="p-2">GD</th>
                    <th className="p-2">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.rows.slice(0, 10).map((team) => (
                    <tr key={`${team.position}-${team.team}`} className={team.position % 2 === 1 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 text-muted-foreground">{team.position}</td>
                      <td className="p-2 font-medium">
                        <span className="flex items-center gap-2">
                          {team.logo && <img src={team.logo} alt={team.team} className="w-5 h-5 object-contain" />}
                          {team.team}
                        </span>
                      </td>
                      <td className="p-2 text-center">{team.played}</td>
                      <td className="p-2 text-center">{team.won}</td>
                      <td className="p-2 text-center">{team.drawn}</td>
                      <td className="p-2 text-center">{team.lost}</td>
                      <td className="p-2 text-center">{team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}</td>
                      <td className="p-2 text-center font-bold">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
      )}
      
      {/* Teams Section (real DB teams, hidden when empty) */}
      {popularTeams.length > 0 && (
      <section className="mt-10 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Popular Teams</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularTeams.map((team) => (
            <Card key={team._id} className="overflow-hidden">
              <div className="p-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 overflow-hidden">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  ) : (
                    <span className="font-bold text-xl">
                      {(team.shortName || team.name || 'T').charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-center text-sm">{team.name}</h3>
                {team.country && (
                  <p className="text-xs text-muted-foreground">{team.country}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
      )}
    </div>
  );
};

export default Sports;
