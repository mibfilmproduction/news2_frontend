import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { 
  getAllSports, 
  getFeaturedMatches, 
  getCurrentMatches
} from '../services/sportsService';
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
import { formatDistanceToNow, format } from 'date-fns';

const Sports = () => {
  const [sports, setSports] = useState<any[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("featured");
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
            
            // Set cricket as default active sport if available
            const cricket = apiSportsData.find((sport) => sport.slug === 'cricket');
            if (cricket) {
              setActiveSport(cricket._id);
            } else if (apiSportsData.length > 0) {
              setActiveSport(apiSportsData[0]._id);
            }
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
            {sport.icon && (
              <img src={sport.icon} alt={sport.name} className="w-5 h-5" />
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
            {featuredMatches.length > 0 ? (
              featuredMatches.map(match => (
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
            ) : (
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
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No live matches currently in progress</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Upcoming Matches Tab */}
        <TabsContent value="upcoming">
          <div className="flex justify-center items-center py-10">
            <Button 
              onClick={() => navigate(`/sports/cricket`)}
              className="px-6 py-2 bg-primary text-white"
            >
              View Upcoming Matches
            </Button>
          </div>
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results">
          <div className="flex justify-center items-center py-10">
            <Button 
              onClick={() => navigate(`/sports/cricket`)}
              className="px-6 py-2 bg-primary text-white"
            >
              View Recent Results
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Cricket News Section */}
      <section className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Cricket News</h2>
          <Button variant="outline" onClick={() => navigate('/category/cricket')}>
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/category/cricket`)}>
              <div className="aspect-video bg-muted">
                <img 
                  src={`https://placehold.co/600x340/png?text=Cricket+News+${item}`} 
                  alt="Cricket News" 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-bold text-lg mb-2">IPL 2025: Teams announce retained players ahead of mega auction</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  Several star players have been released as teams prepare for the upcoming mega auction.
                </p>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 60 * item), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Points Table Section */}
      <section className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Points Table</h2>
          <Button variant="outline" onClick={() => navigate('/sports/cricket')}>
            View All
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>ICC Men's Cricket World Cup 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Team</th>
                    <th className="p-2">P</th>
                    <th className="p-2">W</th>
                    <th className="p-2">L</th>
                    <th className="p-2">NR</th>
                    <th className="p-2">Pts</th>
                    <th className="p-2">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {['India', 'Australia', 'England', 'New Zealand', 'South Africa'].map((team, index) => (
                    <tr key={team} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-2 font-medium">{team}</td>
                      <td className="p-2 text-center">{10 - index}</td>
                      <td className="p-2 text-center">{8 - index}</td>
                      <td className="p-2 text-center">{index}</td>
                      <td className="p-2 text-center">0</td>
                      <td className="p-2 text-center font-bold">{16 - (index * 2)}</td>
                      <td className="p-2 text-center">{(1.5 - (index * 0.3)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Teams Section */}
      <section className="mt-10 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Popular Teams</h2>
          <Button variant="outline" onClick={() => navigate('/sports/cricket')}>
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand'].map((team) => (
            <Card key={team} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/sports/cricket`)}>
              <div className="p-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                  <img 
                    src={`https://placehold.co/200/png?text=${team.charAt(0)}`} 
                    alt={team} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h3 className="font-semibold text-center">{team}</h3>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Sports;
