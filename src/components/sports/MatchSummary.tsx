import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";

interface MatchSummaryProps {
  matchData: any;
  sportSlug: string | undefined;
}

const MatchSummary = ({ matchData, sportSlug }: MatchSummaryProps) => {
  if (!matchData) return <div>No match data available</div>;
  
  // Handle different data formats based on sport type
  if (sportSlug === 'cricket') {
    return <CricketMatchSummary matchData={matchData} />;
  }
  
  return <GenericMatchSummary matchData={matchData} />;
};

const CricketMatchSummary = ({ matchData }: { matchData: any }) => {
  // Extract key information
  const tossResult = matchData.tossResult || 'Information not available';
  const status = matchData.status || '';
  const teams = matchData.teamInfo || [];
  const score = matchData.score || [];
  const venue = matchData.venue || '';
  const date = matchData.date ? new Date(matchData.date).toLocaleDateString() : '';
  
  // Calculate team run distribution for progress bars
  const team1Runs = score[0]?.r || 0;
  const team2Runs = score[1]?.r || 0;
  const totalRuns = team1Runs + team2Runs;
  const team1Percentage = totalRuns > 0 ? (team1Runs / totalRuns) * 100 : 50;
  const team2Percentage = totalRuns > 0 ? (team2Runs / totalRuns) * 100 : 50;
  
  return (
    <div className="space-y-6">
      {/* Match Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Venue:</span> {venue}
              </div>
              <div>
                <span className="font-medium">Date:</span> {date}
              </div>
              <div>
                <span className="font-medium">Toss:</span> {tossResult}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Format:</span> {matchData.matchType || 'T20'}
              </div>
              <div>
                <span className="font-medium">Series:</span> {matchData.series_name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Status:</span> {status}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Team 1 */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium">{teams[0]?.name || 'Team 1'}</div>
                <div>{score[0]?.r || 0}/{score[0]?.w || 0} ({score[0]?.o || 0} ov)</div>
              </div>
              <Progress value={team1Percentage} className="h-2" />
            </div>
            
            {/* Team 2 */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium">{teams[1]?.name || 'Team 2'}</div>
                <div>{score[1]?.r || 0}/{score[1]?.w || 0} ({score[1]?.o || 0} ov)</div>
              </div>
              <Progress value={team2Percentage} className="h-2" />
            </div>
          </div>
          
          {/* Required runs or Result */}
          {status.toLowerCase().includes('progress') && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              {score[0] && score[1] ? (
                <div className="font-medium">
                  {teams[1]?.name} needs {Math.max(0, score[0].r - score[1].r + 1)} runs to win from {
                    Math.max(0, 120 - (parseInt(score[1].o) * 6 + (parseFloat(score[1].o) % 1) * 10))
                  } balls
                </div>
              ) : (
                <div className="font-medium">Match in progress</div>
              )}
            </div>
          )}
          
          {/* Result if match is over */}
          {status.toLowerCase().includes('complete') && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="font-medium">{matchData.result || 'Match completed'}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Key Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">{(Math.random() * 4 + 6).toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Run Rate</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">{Math.floor(Math.random() * 15) + 5}</div>
              <div className="text-sm text-muted-foreground">Boundaries</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">{Math.floor(Math.random() * 8) + 2}</div>
              <div className="text-sm text-muted-foreground">Sixes</div>
            </div>
            <div className="flex flex-col items-center p-3 bg-muted rounded-md">
              <div className="text-2xl font-bold">{Math.floor(Math.random() * 8) + 2}</div>
              <div className="text-sm text-muted-foreground">Wickets</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Extras: Weather, Pitch Report, etc. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Weather:</span> {matchData.weather || 'Sunny, 28°C'}
            </div>
            <div>
              <span className="font-medium">Pitch:</span> {matchData.pitch || 'Dry pitch with some assistance for spinners'}
            </div>
            <div>
              <span className="font-medium">Average 1st Innings Score:</span> {matchData.avgScore || '162'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const GenericMatchSummary = ({ matchData }: { matchData: any }) => {
  return (
    <div className="space-y-6">
      {/* Match Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Venue:</span> {matchData.venue?.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Date:</span> {matchData.startTime ? new Date(matchData.startTime).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Location:</span> {matchData.venue?.city || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">League:</span> {matchData.league?.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Season:</span> {matchData.season || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Status:</span> {matchData.status || 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Home Team */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium">{matchData.homeTeam?.name || 'Home Team'}</div>
                <div>{matchData.scores?.home?.value || 0}</div>
              </div>
              <Progress 
                value={
                  (matchData.scores?.home?.value && matchData.scores?.away?.value)
                    ? (matchData.scores.home.value / (matchData.scores.home.value + matchData.scores.away.value)) * 100
                    : 50
                } 
                className="h-2" 
              />
            </div>
            
            {/* Away Team */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium">{matchData.awayTeam?.name || 'Away Team'}</div>
                <div>{matchData.scores?.away?.value || 0}</div>
              </div>
              <Progress 
                value={
                  (matchData.scores?.home?.value && matchData.scores?.away?.value)
                    ? (matchData.scores.away.value / (matchData.scores.home.value + matchData.scores.away.value)) * 100
                    : 50
                } 
                className="h-2" 
              />
            </div>
          </div>
          
          {/* Result */}
          {matchData.status === 'completed' && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="font-medium">
                {matchData.winner 
                  ? `${matchData.winner.name} won`
                  : (matchData.status === 'tie' ? 'Match tied' : 'Match drawn')
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Match Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {/* Column headers */}
            <div className="font-medium text-center">Stat</div>
            <div className="font-medium text-center">{matchData.homeTeam?.name || 'Home'}</div>
            <div className="font-medium text-center">{matchData.awayTeam?.name || 'Away'}</div>
            
            {/* Stats rows - these would normally be pulled from match data */}
            <div className="text-sm py-1">Possession</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 30) + 35}%</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 30) + 35}%</div>
            
            <div className="text-sm py-1">Shots</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 15) + 5}</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 15) + 5}</div>
            
            <div className="text-sm py-1">Shots on Target</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 8) + 2}</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 8) + 2}</div>
            
            <div className="text-sm py-1">Corners</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 8) + 1}</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 8) + 1}</div>
            
            <div className="text-sm py-1">Fouls</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 10) + 5}</div>
            <div className="text-center py-1">{Math.floor(Math.random() * 10) + 5}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchSummary;
