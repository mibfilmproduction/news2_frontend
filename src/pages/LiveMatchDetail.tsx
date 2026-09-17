import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getFreeMatchDetail, FreeMatchDetail } from '../services/sportsService';
import { Spinner } from '../components/Spinner';
import ErrorDisplay from '../components/shared/ErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const fmtScore = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === '' ? null : String(v);

const LiveMatchDetail = () => {
  const { sport = 'cricket', slug = '' } = useParams<{ sport: string; slug: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<FreeMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await getFreeMatchDetail(sport, slug);
      setMatch(data);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load match detail.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sport, slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Auto-refresh live matches every 60 seconds
  useEffect(() => {
    if (match?.status !== 'live') return;
    const id = setInterval(() => fetchDetail(true), 60000);
    return () => clearInterval(id);
  }, [match?.status, fetchDetail]);

  if (loading) return <Spinner size="lg" />;
  if (error || !match) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Button variant="outline" onClick={() => navigate('/sports')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Sports
        </Button>
        <ErrorDisplay message={error || 'Match not found.'} />
      </div>
    );
  }

  const homeScore = fmtScore(match.scoreHome);
  const awayScore = fmtScore(match.scoreAway);
  const incidents = [...(match.incidents || [])].sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
  const stats = match.stats || [];
  const lineups = match.lineups || null;

  const statusBadge = match.status === 'live'
    ? <Badge className="bg-red-500 hover:bg-red-600">LIVE{match.liveMinute ? ` ${match.liveMinute}'` : ''}</Badge>
    : match.status === 'completed'
      ? <Badge className="bg-green-600 hover:bg-green-700">Full Time</Badge>
      : <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <SEO
        title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
        description={`Live score and full detail: ${match.homeTeam.name} vs ${match.awayTeam.name}, ${match.league.name}.`}
        url={`/sports/live/${sport}/${slug}`}
      />

      <Button variant="outline" onClick={() => navigate('/sports')} className="mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Sports
      </Button>

      {/* Score header */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {match.league.logo && (
                <img src={match.league.logo} alt={match.league.name} className="w-6 h-6 object-contain" />
              )}
              <span className="text-sm font-medium">{match.league.name}</span>
            </div>
            {statusBadge}
          </div>
          <CardTitle className="text-xl">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              {match.homeTeam.logo
                ? <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-16 h-16 object-contain" />
                : <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">{match.homeTeam.name.charAt(0)}</div>}
              <div className="font-semibold text-center">{match.homeTeam.name}</div>
              {homeScore !== null && <div className="text-3xl font-bold">{homeScore}</div>}
            </div>
            <div className="text-2xl font-bold text-muted-foreground px-4">-</div>
            <div className="flex flex-col items-center gap-2 flex-1">
              {match.awayTeam.logo
                ? <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-16 h-16 object-contain" />
                : <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">{match.awayTeam.name.charAt(0)}</div>}
              <div className="font-semibold text-center">{match.awayTeam.name}</div>
              {awayScore !== null && <div className="text-3xl font-bold">{awayScore}</div>}
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground space-y-1">
            {match.statusText && <div>{match.statusText}</div>}
            {match.startTime && <div>{format(new Date(match.startTime), 'MMM d, yyyy h:mm a')}</div>}
            {match.venue && <div>{match.venue}</div>}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Match Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{stat.home}{stat.suffix || ''}</span>
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="font-medium">{stat.away}{stat.suffix || ''}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <div className="bg-primary" style={{ width: `${stat.home_pct ?? 50}%` }} />
                  <div className="bg-secondary flex-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {incidents.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.map((inc: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm border-b last:border-0 pb-2">
                  <span className="font-bold text-primary w-10 shrink-0">{inc.time ?? ''}{inc.time !== undefined && inc.time !== null ? "'" : ''}</span>
                  <div className="flex-1">
                    <span className="font-medium">{inc.type || 'Event'}</span>
                    {inc.player && <span className="text-muted-foreground"> — {inc.player}</span>}
                    {(inc.home_score !== undefined || inc.away_score !== undefined) && (
                      <span className="ml-2 font-bold">({inc.home_score} - {inc.away_score})</span>
                    )}
                  </div>
                  <Badge variant="outline">{inc.side === 'home' ? match.homeTeam.shortName : match.awayTeam.shortName}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lineups */}
      {lineups && (lineups.home_xi || lineups.away_xi) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Lineups{lineups.home_formation || lineups.away_formation ? ` (${lineups.home_formation || ''} vs ${lineups.away_formation || ''})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: match.homeTeam.name, xi: lineups.home_xi || [], subs: lineups.home_subs || [] },
                { title: match.awayTeam.name, xi: lineups.away_xi || [], subs: lineups.away_subs || [] },
              ].map((side, si) => (
                <div key={si}>
                  <h4 className="font-semibold mb-2">{side.title}</h4>
                  <ul className="space-y-1 text-sm">
                    {side.xi.map((p: any, pi: number) => (
                      <li key={pi} className="flex gap-2">
                        <span className="text-muted-foreground w-8">{p.number ?? ''}</span>
                        <span>{p.name}{p.captain ? ' (C)' : ''}</span>
                        <span className="text-muted-foreground ml-auto">{p.position || ''}</span>
                      </li>
                    ))}
                  </ul>
                  {side.subs.length > 0 && (
                    <>
                      <h5 className="font-medium mt-3 mb-1 text-sm text-muted-foreground">Substitutes</h5>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {side.subs.map((p: any, pi: number) => (
                          <li key={pi} className="flex gap-2">
                            <span className="w-8">{p.number ?? ''}</span>
                            <span>{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Live scores & data by{' '}
        <a href="https://sportscore.com/" target="_blank" rel="noopener sponsored" className="underline hover:text-primary">
          SportScore
        </a>
      </p>
    </div>
  );
};

export default LiveMatchDetail;
